import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE_PATH = path.resolve(__dirname, 'src/config/serverDatabase.json');
const DEFAULT_URL_FILE_PATH = path.resolve(__dirname, 'src/config/defaultSheetsUrl.ts');

interface ServerDatabaseState {
  sheetsUrl: string;
  accounts: any[];
  transactions: any[];
  budgets: any[];
  updatedAt: number;
}

const DEFAULT_DB_STATE: ServerDatabaseState = {
  sheetsUrl: '',
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
  updatedAt: 0,
};

function readServerDb(): ServerDatabaseState {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        sheetsUrl: typeof parsed.sheetsUrl === 'string' ? parsed.sheetsUrl : '',
        accounts: Array.isArray(parsed.accounts) && parsed.accounts.length > 0 ? parsed.accounts : DEFAULT_DB_STATE.accounts,
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
        budgets: Array.isArray(parsed.budgets) ? parsed.budgets : [],
        updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
      };
    }
  } catch (err) {
    console.error('Failed to read serverDatabase.json:', err);
  }
  return { ...DEFAULT_DB_STATE };
}

function writeServerDb(nextState: ServerDatabaseState): void {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(nextState, null, 2) + '\n', 'utf-8');
    if (nextState.sheetsUrl && nextState.sheetsUrl.startsWith('https://script.google.com/')) {
      const urlTsContent = `// Konfigurasi Spreadsheet Utama Permanen (Otomatis aktif di semua perangkat HP & Laptop)\nexport const DEFAULT_SHEETS_WEBAPP_URL = ${JSON.stringify(nextState.sheetsUrl.trim())};\n`;
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  // 1. Endpoint GET /api/state: Mengambil seluruh data terpusat agar semua perangkat (HP & Laptop) memiliki data yang 100% sama
  app.get('/api/state', (_req, res) => {
    const state = readServerDb();
    res.json({ ok: true, state });
  });

  // 2. Endpoint POST /api/state: Menyimpan perubahan dari perangkat manapun ke server pusat
  app.post('/api/state', (req, res) => {
    try {
      const current = readServerDb();
      const body = req.body || {};
      const nextState: ServerDatabaseState = {
        sheetsUrl:
          typeof body.sheetsUrl === 'string' && body.sheetsUrl.trim()
            ? body.sheetsUrl.trim()
            : current.sheetsUrl,
        accounts:
          Array.isArray(body.accounts) && body.accounts.length > 0
            ? body.accounts
            : current.accounts,
        transactions: Array.isArray(body.transactions)
          ? body.transactions
          : current.transactions,
        budgets: Array.isArray(body.budgets) ? body.budgets : current.budgets,
        updatedAt: Date.now(),
      };
      writeServerDb(nextState);
      res.json({ ok: true, state: nextState });
    } catch (err: any) {
      res.status(400).json({ ok: false, error: err?.message || 'Invalid payload' });
    }
  });

  // 3. Endpoint POST /api/set-default-sheets-url: Mengunci link Google Sheets Utama untuk semua perangkat
  app.post('/api/set-default-sheets-url', (req, res) => {
    try {
      const { url } = req.body || {};
      if (url && typeof url === 'string' && url.startsWith('https://script.google.com/')) {
        const current = readServerDb();
        const nextState: ServerDatabaseState = {
          ...current,
          sheetsUrl: url.trim(),
          updatedAt: Date.now(),
        };
        writeServerDb(nextState);
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
