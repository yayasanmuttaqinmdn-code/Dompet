import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE_PATH = path.resolve(__dirname, 'src/config/serverDatabase.json');
const DEFAULT_URL_FILE_PATH = path.resolve(__dirname, 'src/config/defaultSheetsUrl.ts');
const LOCKED_PRIMARY_SHEETS_URL =
  'https://script.google.com/macros/s/AKfycbwOx_f2K6knBpth1X1GHjgh1ewn6eUl3OS2Gm7cl8R_VwcdvChBp7z7jIl8wFwMeGOypg/exec';
const CLOUD_SYNC_OBJECT_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a19e72a5ff14ac';

export interface ServerDatabaseState {
  sheetsUrl: string;
  sheetsUrlUpdatedAt?: number;
  accounts: any[];
  transactions: any[];
  budgets: any[];
  deletedIds?: string[];
  lastResetAt?: number;
  updatedAt: number;
}

const DEFAULT_DB_STATE: ServerDatabaseState = {
  sheetsUrl: LOCKED_PRIMARY_SHEETS_URL,
  sheetsUrlUpdatedAt: 0,
  accounts: [
    {
      id: 'acc_cash',
      name: 'Dompet Tunai',
      type: 'cash',
      initialBalance: 0,
      color: '#10B981',
      icon: 'Wallet',
    },
    {
      id: 'acc_bca',
      name: 'Rekening',
      type: 'bank',
      accountNumber: '-',
      initialBalance: 0,
      color: '#2563EB',
      icon: 'Building2',
    },
  ],
  transactions: [],
  budgets: [],
  deletedIds: [],
  lastResetAt: 0,
  updatedAt: 0,
};

let lastCloudPullTime = 0;

function normalizeServerAccounts(rawAccounts: any[]): any[] {
  if (!Array.isArray(rawAccounts) || rawAccounts.length === 0) {
    return DEFAULT_DB_STATE.accounts;
  }
  let cashBal = 0;
  let bankBal = 0;
  for (const a of rawAccounts) {
    const id = String(a?.id || '').toLowerCase();
    const name = String(a?.name || '').toLowerCase();
    const type = String(a?.type || '').toLowerCase();
    const bal = typeof a?.initialBalance === 'number' ? a.initialBalance : Number(a?.initialBalance) || 0;
    if (id === 'acc_cash' || type === 'cash' || name.includes('tunai') || name.includes('dompet') || name.includes('kas')) {
      cashBal += bal;
    } else {
      bankBal += bal;
    }
  }
  return [
    {
      id: 'acc_cash',
      name: 'Dompet Tunai',
      type: 'cash',
      initialBalance: cashBal,
      color: '#10B981',
      icon: 'Wallet',
    },
    {
      id: 'acc_bca',
      name: 'Rekening',
      type: 'bank',
      accountNumber: '-',
      initialBalance: bankBal,
      color: '#2563EB',
      icon: 'Building2',
    },
  ];
}

function readServerDb(): ServerDatabaseState {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        sheetsUrl:
          typeof parsed.sheetsUrl === 'string' && parsed.sheetsUrl.trim()
            ? parsed.sheetsUrl.trim()
            : LOCKED_PRIMARY_SHEETS_URL,
        sheetsUrlUpdatedAt: typeof parsed.sheetsUrlUpdatedAt === 'number' ? parsed.sheetsUrlUpdatedAt : 0,
        accounts: normalizeServerAccounts(parsed.accounts),
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
        budgets: Array.isArray(parsed.budgets) ? parsed.budgets : [],
        deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [],
        lastResetAt: typeof parsed.lastResetAt === 'number' ? parsed.lastResetAt : 0,
        updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
      };
    }
  } catch (err) {
    console.error('Failed to read serverDatabase.json:', err);
  }
  return { ...DEFAULT_DB_STATE };
}

function writeServerDbLocal(nextState: ServerDatabaseState): void {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(nextState, null, 2) + '\n', 'utf-8');
    if (nextState.sheetsUrl && nextState.sheetsUrl.startsWith('https://script.google.com/')) {
      const urlTsContent = `// Konfigurasi Spreadsheet Utama Permanen (Otomatis aktif di semua perangkat HP & Laptop)\n// Nilai ini akan terisi otomatis saat Anda menyimpan URL di aplikasi atau dapat diisi langsung di sini.\nexport const DEFAULT_SHEETS_WEBAPP_URL = ${JSON.stringify(nextState.sheetsUrl.trim())};\n`;
      const currentTs = fs.existsSync(DEFAULT_URL_FILE_PATH)
        ? fs.readFileSync(DEFAULT_URL_FILE_PATH, 'utf-8')
        : '';
      if (currentTs !== urlTsContent) {
        fs.writeFileSync(DEFAULT_URL_FILE_PATH, urlTsContent, 'utf-8');
      }
    }
  } catch (err) {
    console.error('Failed to write serverDatabase.json:', err);
  }
}

async function pushToCloudSync(state: ServerDatabaseState): Promise<void> {
  try {
    await fetch(CLOUD_SYNC_OBJECT_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'dompetku_fahmi',
        data: {
          stateJson: JSON.stringify(state),
          updatedAt: state.updatedAt,
        },
      }),
    });
  } catch {
    // ignore network errors
  }
}

async function pullFromCloudSyncIfNewer(localState: ServerDatabaseState): Promise<ServerDatabaseState> {
  if (Date.now() - lastCloudPullTime < 12000) {
    return localState;
  }
  lastCloudPullTime = Date.now();
  try {
    const res = await fetch(CLOUD_SYNC_OBJECT_URL);
    if (!res.ok) return localState;
    const obj = await res.json();
    const rawJson = obj?.data?.stateJson;
    if (!rawJson || typeof rawJson !== 'string') return localState;
    const cloudState = JSON.parse(rawJson) as ServerDatabaseState;
    if (!cloudState || typeof cloudState !== 'object') return localState;

    const cloudUpdated = typeof cloudState.updatedAt === 'number' ? cloudState.updatedAt : 0;
    const localUpdated = typeof localState.updatedAt === 'number' ? localState.updatedAt : 0;
    const cloudUrlUpdated = typeof cloudState.sheetsUrlUpdatedAt === 'number' ? cloudState.sheetsUrlUpdatedAt : 0;
    const localUrlUpdated = typeof localState.sheetsUrlUpdatedAt === 'number' ? localState.sheetsUrlUpdatedAt : 0;

    let changed = false;
    const merged: ServerDatabaseState = { ...localState };

    if (cloudUrlUpdated > localUrlUpdated && cloudState.sheetsUrl) {
      merged.sheetsUrl = cloudState.sheetsUrl;
      merged.sheetsUrlUpdatedAt = cloudUrlUpdated;
      changed = true;
    }

    if (cloudUpdated > localUpdated) {
      merged.accounts = normalizeServerAccounts(cloudState.accounts);
      merged.transactions = Array.isArray(cloudState.transactions) ? cloudState.transactions : merged.transactions;
      merged.budgets = Array.isArray(cloudState.budgets) ? cloudState.budgets : merged.budgets;
      merged.deletedIds = Array.isArray(cloudState.deletedIds) ? cloudState.deletedIds : merged.deletedIds;
      merged.lastResetAt = typeof cloudState.lastResetAt === 'number' ? cloudState.lastResetAt : merged.lastResetAt;
      merged.updatedAt = cloudUpdated;
      if (cloudState.sheetsUrl && (!merged.sheetsUrl || cloudUrlUpdated >= localUrlUpdated)) {
        merged.sheetsUrl = cloudState.sheetsUrl;
        merged.sheetsUrlUpdatedAt = Math.max(localUrlUpdated, cloudUrlUpdated);
      }
      changed = true;
    }

    if (changed) {
      writeServerDbLocal(merged);
    }
    return merged;
  } catch {
    return localState;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    next();
  });

  // 1. Endpoint GET /api/state: Mengambil seluruh data terpusat (lokal + cloud sync)
  app.get('/api/state', async (_req, res) => {
    const localState = readServerDb();
    const state = await pullFromCloudSyncIfNewer(localState);
    res.json({ ok: true, state });
  });

  // 2. Endpoint POST /api/state: Menyimpan perubahan dari perangkat manapun ke server pusat & cloud sync
  app.post('/api/state', async (req, res) => {
    try {
      const current = readServerDb();
      const body = req.body || {};
      const forceEmpty = body.forceEmpty === true;

      const incomingTxs = Array.isArray(body.transactions) ? body.transactions : null;
      let nextTransactions = current.transactions;

      if (incomingTxs !== null) {
        if (incomingTxs.length > 0 || forceEmpty) {
          nextTransactions = incomingTxs;
        }
      }

      const deletedSet = new Set<string>(Array.isArray(current.deletedIds) ? current.deletedIds : []);
      if (Array.isArray(body.deletedIds)) {
        for (const id of body.deletedIds) {
          if (typeof id === 'string') deletedSet.add(id);
        }
      }
      if (typeof body.deletedId === 'string' && body.deletedId) {
        deletedSet.add(body.deletedId);
      }

      const nextSheetsUrl =
        typeof body.sheetsUrl === 'string' && body.sheetsUrl.trim().startsWith('https://script.google.com/')
          ? body.sheetsUrl.trim()
          : current.sheetsUrl || LOCKED_PRIMARY_SHEETS_URL;

      const urlChanged = nextSheetsUrl !== current.sheetsUrl || typeof body.sheetsUrlUpdatedAt === 'number';
      const nextUrlUpdatedAt = urlChanged
        ? (typeof body.sheetsUrlUpdatedAt === 'number' ? body.sheetsUrlUpdatedAt : Date.now())
        : (current.sheetsUrlUpdatedAt || 0);

      const now = Date.now();
      const nextState: ServerDatabaseState = {
        sheetsUrl: nextSheetsUrl,
        sheetsUrlUpdatedAt: nextUrlUpdatedAt,
        accounts: Array.isArray(body.accounts)
          ? normalizeServerAccounts(body.accounts)
          : current.accounts,
        transactions: nextTransactions,
        budgets: Array.isArray(body.budgets) ? body.budgets : current.budgets,
        deletedIds: Array.from(deletedSet),
        lastResetAt: forceEmpty ? now : (current.lastResetAt || 0),
        updatedAt: now,
      };
      writeServerDbLocal(nextState);
      pushToCloudSync(nextState);
      res.json({ ok: true, state: nextState });
    } catch (err: any) {
      res.status(400).json({ ok: false, error: err?.message || 'Invalid payload' });
    }
  });

  // 3. Endpoint POST /api/set-default-sheets-url: Mengunci link Google Sheets Utama untuk semua perangkat
  app.post('/api/set-default-sheets-url', async (req, res) => {
    try {
      const { url } = req.body || {};
      if (url && typeof url === 'string' && url.startsWith('https://script.google.com/')) {
        const current = readServerDb();
        const now = Date.now();
        const nextState: ServerDatabaseState = {
          ...current,
          sheetsUrl: url.trim(),
          sheetsUrlUpdatedAt: now,
          updatedAt: now,
        };
        writeServerDbLocal(nextState);
        pushToCloudSync(nextState);
      }
      res.json({ ok: true });
    } catch {
      res.status(400).json({ ok: false });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server DompetKu berjalan di http://0.0.0.0:${PORT}`);
  });
}

startServer();
