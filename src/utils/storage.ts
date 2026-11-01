import { Account, Budget, Transaction } from '../types/finance';

const STORAGE_KEYS = {
  ACCOUNTS: 'dompetku_accounts_v2',
  TRANSACTIONS: 'dompetku_transactions_v2',
  BUDGETS: 'dompetku_budgets_v2',
};

export const INITIAL_ACCOUNTS: Account[] = [
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
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const SAMPLE_ACCOUNTS: Account[] = [
  {
    id: 'acc_cash',
    name: 'Dompet Tunai',
    type: 'cash',
    initialBalance: 750000,
    color: '#10B981',
    icon: 'Wallet',
  },
  {
    id: 'acc_bca',
    name: 'Rekening',
    type: 'bank',
    accountNumber: '-',
    initialBalance: 18050000,
    color: '#2563EB',
    icon: 'Building2',
  },
];

export const SAMPLE_TRANSACTIONS: Transaction[] = [
  // October 2026 Transactions
  {
    id: 'tx_10_01',
    date: '2026-10-01',
    time: '08:30',
    type: 'income',
    amount: 9500000,
    accountId: 'acc_bca',
    category: 'Gaji Pokok',
    description: 'Gaji Pokok PT Maju Sejahtera',
    notes: 'Transfer payroll bulanan',
  },
  {
    id: 'tx_10_02',
    date: '2026-10-01',
    time: '11:00',
    type: 'transfer',
    amount: 1000000,
    accountId: 'acc_bca',
    toAccountId: 'acc_cash',
    category: 'Transfer',
    description: 'Tarik Tunai ATM untuk Dompet Tunai',
  },
  {
    id: 'tx_10_03',
    date: '2026-10-02',
    time: '12:30',
    type: 'expense',
    amount: 45000,
    accountId: 'acc_cash',
    category: 'Makanan & Minuman',
    description: 'Makan Siang Nasi Padang & Es Teh',
    notes: 'Bayar uang tunai',
  },
  {
    id: 'tx_10_04',
    date: '2026-10-03',
    time: '16:15',
    type: 'expense',
    amount: 50000,
    accountId: 'acc_cash',
    category: 'Transportasi & Bensin',
    description: 'Isi Bensin Pertalite Motor',
    notes: 'SPBU Shell / Pertamina (Tunai)',
  },
  {
    id: 'tx_10_05',
    date: '2026-10-04',
    time: '19:45',
    type: 'expense',
    amount: 680000,
    accountId: 'acc_bca',
    category: 'Belanja Kebutuhan',
    description: 'Belanja Bulanan Superindo',
    notes: 'Bahan makanan dapur & sabun',
  },
  {
    id: 'tx_10_06',
    date: '2026-10-05',
    time: '09:00',
    type: 'expense',
    amount: 350000,
    accountId: 'acc_bca',
    category: 'Tagihan & Utilitas',
    description: 'Token Listrik PLN & Air PAM',
    notes: 'M-Banking',
  },
  {
    id: 'tx_10_07',
    date: '2026-10-06',
    time: '14:20',
    type: 'income',
    amount: 1850000,
    accountId: 'acc_bca',
    category: 'Bisnis & Penjualan',
    description: 'Pembayaran Desain Web Klien',
    notes: 'Side job transfer rekening',
  },
  {
    id: 'tx_10_08',
    date: '2026-10-07',
    time: '13:00',
    type: 'expense',
    amount: 38000,
    accountId: 'acc_cash',
    category: 'Makanan & Minuman',
    description: 'Makan Siang Soto Ayam',
    notes: 'Uang pas kas',
  },
  {
    id: 'tx_10_09',
    date: '2026-10-08',
    time: '20:10',
    type: 'expense',
    amount: 320000,
    accountId: 'acc_bca',
    category: 'Tagihan & Utilitas',
    description: 'Langganan Internet Wifi Rumah',
    notes: 'Indihome / Biznet auto-debit',
  },
  {
    id: 'tx_10_10',
    date: '2026-10-10',
    time: '12:00',
    type: 'expense',
    amount: 100000,
    accountId: 'acc_cash',
    category: 'Sedekah, Zakat & Donasi',
    description: 'Infaq & Sedekah Jumat Masjid',
    notes: 'Tunai kotak amal',
  },
  {
    id: 'tx_10_11',
    date: '2026-10-11',
    time: '15:30',
    type: 'expense',
    amount: 75000,
    accountId: 'acc_bca',
    category: 'Makanan & Minuman',
    description: 'Pesan Kopi & Camilan Sore',
    notes: 'QRIS Rekening',
  },
  {
    id: 'tx_10_13',
    date: '2026-10-13',
    time: '17:40',
    type: 'expense',
    amount: 125000,
    accountId: 'acc_cash',
    category: 'Kesehatan & Medis',
    description: 'Beli Vitamin C & Obat Flu di Apotek',
    notes: 'Tunai Kas',
  },
  {
    id: 'tx_10_14',
    date: '2026-10-14',
    time: '18:30',
    type: 'expense',
    amount: 150000,
    accountId: 'acc_bca',
    category: 'Hiburan & Liburan',
    description: 'Nonton Bioskop Weekend 2 Tiket',
  },
  {
    id: 'tx_10_15',
    date: '2026-10-15',
    time: '14:00',
    type: 'income',
    amount: 350000,
    accountId: 'acc_bca',
    category: 'Investasi & Bunga',
    description: 'Dividen Reksa Dana & Bunga Tabungan',
  },

  // September 2026 Transactions (for monthly comparison)
  {
    id: 'tx_09_01',
    date: '2026-09-01',
    time: '08:30',
    type: 'income',
    amount: 9500000,
    accountId: 'acc_bca',
    category: 'Gaji Pokok',
    description: 'Gaji Pokok PT Maju Sejahtera',
  },
  {
    id: 'tx_09_02',
    date: '2026-09-02',
    time: '10:00',
    type: 'transfer',
    amount: 1200000,
    accountId: 'acc_bca',
    toAccountId: 'acc_cash',
    category: 'Transfer',
    description: 'Tarik Tunai Kas Bulanan',
  },
  {
    id: 'tx_09_03',
    date: '2026-09-05',
    time: '11:15',
    type: 'expense',
    amount: 720000,
    accountId: 'acc_bca',
    category: 'Belanja Kebutuhan',
    description: 'Belanja Dapur Bulanan',
  },
  {
    id: 'tx_09_04',
    date: '2026-09-10',
    time: '14:00',
    type: 'expense',
    amount: 450000,
    accountId: 'acc_cash',
    category: 'Makanan & Minuman',
    description: 'Makan & Jajan Kas Minggu 1-2',
  },
  {
    id: 'tx_09_05',
    date: '2026-09-15',
    time: '09:30',
    type: 'expense',
    amount: 350000,
    accountId: 'acc_bca',
    category: 'Tagihan & Utilitas',
    description: 'Listrik & Air PLN',
  },
  {
    id: 'tx_09_06',
    date: '2026-09-20',
    time: '16:00',
    type: 'expense',
    amount: 280000,
    accountId: 'acc_cash',
    category: 'Transportasi & Bensin',
    description: 'Bensin & Servis Motor Rutin',
  },
  {
    id: 'tx_09_07',
    date: '2026-09-25',
    time: '15:00',
    type: 'income',
    amount: 1200000,
    accountId: 'acc_bca',
    category: 'Bisnis & Penjualan',
    description: 'Freelance Konsultasi',
  },
  {
    id: 'tx_09_08',
    date: '2026-09-28',
    time: '19:00',
    type: 'expense',
    amount: 180000,
    accountId: 'acc_cash',
    category: 'Makanan & Minuman',
    description: 'Makan Keluarga Akhir Pekan',
  },
];

export const INITIAL_BUDGETS: Budget[] = [];

export const SAMPLE_BUDGETS: Budget[] = [
  { id: 'b_1', category: 'Makanan & Minuman', monthlyLimit: 1500000, month: '2026-10' },
  { id: 'b_2', category: 'Belanja Kebutuhan', monthlyLimit: 1200000, month: '2026-10' },
  { id: 'b_3', category: 'Transportasi & Bensin', monthlyLimit: 600000, month: '2026-10' },
  { id: 'b_4', category: 'Tagihan & Utilitas', monthlyLimit: 1000000, month: '2026-10' },
  { id: 'b_5', category: 'Hiburan & Liburan', monthlyLimit: 500000, month: '2026-10' },
];

export function zeroOutAllData(): { accounts: Account[]; transactions: Transaction[]; budgets: Budget[] } {
  const zeroAccounts = INITIAL_ACCOUNTS.map((a) => ({ ...a, initialBalance: 0 }));
  try {
    localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.BUDGETS);
    localStorage.removeItem('dompetku_accounts_v1');
    localStorage.removeItem('dompetku_transactions_v1');
    localStorage.removeItem('dompetku_budgets_v1');
  } catch (e) {
    // ignore
  }
  saveStoredAccounts(zeroAccounts);
  saveStoredTransactions([]);
  saveStoredBudgets([]);
  return {
    accounts: zeroAccounts,
    transactions: [],
    budgets: [],
  };
}

export function normalizeToTwoAccounts(accounts: Account[]): Account[] {
  const cashAcc = accounts.find((a) => a.type === 'cash' || a.id === 'acc_cash');
  const bankAccounts = accounts.filter((a) => a.type !== 'cash' && a.id !== 'acc_cash');
  const bankInitialBalance = bankAccounts.reduce((sum, a) => sum + (a.initialBalance || 0), 0);

  return [
    {
      id: 'acc_cash',
      name: 'Dompet Tunai',
      type: 'cash',
      initialBalance: cashAcc?.initialBalance || 0,
      color: '#10B981',
      icon: 'Wallet',
    },
    {
      id: 'acc_bca',
      name: 'Rekening',
      type: 'bank',
      accountNumber: bankAccounts[0]?.accountNumber || '-',
      initialBalance: bankInitialBalance,
      color: '#2563EB',
      icon: 'Building2',
    },
  ];
}

export function getStoredAccounts(): Account[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    if (raw) {
      const parsed: Account[] = JSON.parse(raw);
      const isCleanTwoAccounts =
        parsed.length === 2 &&
        parsed[0]?.id === 'acc_cash' &&
        parsed[0]?.name === 'Dompet Tunai' &&
        parsed[1]?.id === 'acc_bca' &&
        parsed[1]?.name === 'Rekening';

      if (!isCleanTwoAccounts) {
        const cleaned = normalizeToTwoAccounts(parsed);
        saveStoredAccounts(cleaned);
        return cleaned;
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to read accounts from localStorage', e);
  }
  saveStoredAccounts(INITIAL_ACCOUNTS);
  return INITIAL_ACCOUNTS;
}

export function saveStoredAccounts(accounts: Account[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save accounts to localStorage', e);
  }
}

export function getStoredTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read transactions from localStorage', e);
  }
  saveStoredTransactions(INITIAL_TRANSACTIONS);
  return INITIAL_TRANSACTIONS;
}

export function saveStoredTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (e) {
    console.error('Failed to save transactions to localStorage', e);
  }
}

export function getStoredBudgets(): Budget[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read budgets from localStorage', e);
  }
  saveStoredBudgets(INITIAL_BUDGETS);
  return INITIAL_BUDGETS;
}

export function saveStoredBudgets(budgets: Budget[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
  } catch (e) {
    console.error('Failed to save budgets to localStorage', e);
  }
}
