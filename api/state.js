const CLOUD_SYNC_OBJECT_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a19e72a5ff14ac';
const LOCKED_PRIMARY_SHEETS_URL =
  'https://script.google.com/macros/s/AKfycbwOx_f2K6knBpth1X1GHjgh1ewn6eUl3OS2Gm7cl8R_VwcdvChBp7z7jIl8wFwMeGOypg/exec';

const DEFAULT_STATE = {
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
  transactions: [
    {
      id: 'tx_1793402565306_bzaw2',
      date: '2026-10-30',
      time: '06:22',
      type: 'expense',
      amount: 100000,
      category: 'Makanan & Minuman',
      accountId: 'acc_cash',
      description: 'jajan',
    },
    {
      id: 'tx_1793402513161_wem6x',
      date: '2026-10-30',
      time: '06:21',
      type: 'income',
      amount: 1000000,
      category: 'Gaji Pokok',
      accountId: 'acc_cash',
      description: '-',
    },
  ],
  budgets: [],
  deletedIds: [],
  lastResetAt: 0,
  updatedAt: 1793659717006,
};

let memoryState = null;
let lastCloudFetch = 0;

function normalizeAccounts(rawAccounts) {
  if (!Array.isArray(rawAccounts) || rawAccounts.length === 0) {
    return DEFAULT_STATE.accounts;
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

async function readCloudState() {
  if (memoryState && Date.now() - lastCloudFetch < 10000) {
    return memoryState;
  }
  try {
    const res = await fetch(CLOUD_SYNC_OBJECT_URL);
    if (res.ok) {
      const obj = await res.json();
      const rawJson = obj?.data?.stateJson;
      if (rawJson && typeof rawJson === 'string') {
        const parsed = JSON.parse(rawJson);
        if (parsed && typeof parsed === 'object') {
          memoryState = {
            sheetsUrl: parsed.sheetsUrl || LOCKED_PRIMARY_SHEETS_URL,
            sheetsUrlUpdatedAt: typeof parsed.sheetsUrlUpdatedAt === 'number' ? parsed.sheetsUrlUpdatedAt : 0,
            accounts: normalizeAccounts(parsed.accounts),
            transactions: Array.isArray(parsed.transactions) ? parsed.transactions : DEFAULT_STATE.transactions,
            budgets: Array.isArray(parsed.budgets) ? parsed.budgets : [],
            deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [],
            lastResetAt: typeof parsed.lastResetAt === 'number' ? parsed.lastResetAt : 0,
            updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : DEFAULT_STATE.updatedAt,
          };
          lastCloudFetch = Date.now();
          return memoryState;
        }
      }
    }
  } catch {
    // fallback to memory or default
  }
  return memoryState || DEFAULT_STATE;
}

async function writeCloudState(nextState) {
  memoryState = nextState;
  lastCloudFetch = Date.now();
  try {
    await fetch(CLOUD_SYNC_OBJECT_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'dompetku_fahmi',
        data: {
          stateJson: JSON.stringify(nextState),
          updatedAt: nextState.updatedAt,
        },
      }),
    });
  } catch {
    // ignore
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const state = await readCloudState();
    return res.status(200).json({ ok: true, state });
  }

  if (req.method === 'POST') {
    try {
      const current = await readCloudState();
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const forceEmpty = body.forceEmpty === true;

      const incomingTxs = Array.isArray(body.transactions) ? body.transactions : null;
      let nextTransactions = current.transactions;
      if (incomingTxs !== null && (incomingTxs.length > 0 || forceEmpty)) {
        nextTransactions = incomingTxs;
      }

      const deletedSet = new Set(Array.isArray(current.deletedIds) ? current.deletedIds : []);
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
      const now = Date.now();
      const nextUrlUpdatedAt = urlChanged
        ? (typeof body.sheetsUrlUpdatedAt === 'number' ? body.sheetsUrlUpdatedAt : now)
        : (current.sheetsUrlUpdatedAt || 0);

      const nextState = {
        sheetsUrl: nextSheetsUrl,
        sheetsUrlUpdatedAt: nextUrlUpdatedAt,
        accounts: Array.isArray(body.accounts) ? normalizeAccounts(body.accounts) : current.accounts,
        transactions: nextTransactions,
        budgets: Array.isArray(body.budgets) ? body.budgets : current.budgets,
        deletedIds: Array.from(deletedSet),
        lastResetAt: forceEmpty ? now : (current.lastResetAt || 0),
        updatedAt: now,
      };

      await writeCloudState(nextState);
      return res.status(200).json({ ok: true, state: nextState });
    } catch (err) {
      return res.status(400).json({ ok: false, error: err?.message || 'Invalid payload' });
    }
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
