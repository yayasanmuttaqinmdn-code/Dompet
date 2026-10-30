import type { Account, MonthlyRecap, Transaction, CategorySummary } from '../types/finance.ts';

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Makanan & Minuman', color: '#EF4444', icon: 'Utensils' },
  { name: 'Belanja Kebutuhan', color: '#F97316', icon: 'ShoppingCart' },
  { name: 'Transportasi & Bensin', color: '#F59E0B', icon: 'Car' },
  { name: 'Tagihan & Utilitas', color: '#10B981', icon: 'Receipt' },
  { name: 'Tempat Tinggal / Sewa', color: '#06B6D4', icon: 'Home' },
  { name: 'Kesehatan & Medis', color: '#3B82F6', icon: 'HeartPulse' },
  { name: 'Pendidikan', color: '#6366F1', icon: 'GraduationCap' },
  { name: 'Hiburan & Liburan', color: '#8B5CF6', icon: 'Film' },
  { name: 'Sedekah, Zakat & Donasi', color: '#EC4899', icon: 'HandHeart' },
  { name: 'Cicilan & Hutang', color: '#64748B', icon: 'CreditCard' },
  { name: 'Lain-lain', color: '#94A3B8', icon: 'MoreHorizontal' },
];

export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Gaji Pokok', color: '#10B981', icon: 'Briefcase' },
  { name: 'Bisnis & Penjualan', color: '#059669', icon: 'Store' },
  { name: 'Bonus & Tunjangan', color: '#34D399', icon: 'Award' },
  { name: 'Investasi & Bunga', color: '#0284C7', icon: 'TrendingUp' },
  { name: 'Hadiah / Pemberian', color: '#8B5CF6', icon: 'Gift' },
  { name: 'Pemasukan Lainnya', color: '#64748B', icon: 'Coins' },
];

export const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Format numeric value to Indonesian Rupiah (IDR) currency format.
 * Example: 1500000 -> "Rp 1.500.000"
 */
export function formatIDR(amount: number): string {
  if (!Number.isFinite(amount)) return 'Rp 0';
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const hasDecimals = Math.abs(absAmount - Math.round(absAmount)) > 0.001;

  if (hasDecimals) {
    const [intPart, decPart] = absAmount.toFixed(2).split('.');
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const cleanDec = decPart.replace(/0+$/, '');
    return `${isNegative ? '-Rp ' : 'Rp '}${formattedInt}${cleanDec ? `,${cleanDec}` : ''}`;
  }

  const formatted = Math.round(absAmount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${isNegative ? '-Rp ' : 'Rp '}${formatted}`;
}

/**
 * Format compact IDR for charts and small badges.
 * Example: 1500000 -> "Rp 1,5 Jt"
 */
export function formatCompactIDR(amount: number): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  let str = '';
  if (abs >= 1_000_000_000) {
    str = (abs / 1_000_000_000).toFixed(1).replace('.', ',') + ' M';
  } else if (abs >= 1_000_000) {
    str = (abs / 1_000_000).toFixed(1).replace('.', ',') + ' Jt';
  } else if (abs >= 1_000) {
    str = (abs / 1_000).toFixed(0) + ' Rb';
  } else {
    str = abs.toString();
  }
  return `${isNegative ? '-Rp ' : 'Rp '}${str}`;
}

/**
 * Get human readable Indonesian month name from YYYY-MM
 * Example: "2026-10" -> "Oktober 2026"
 */
export function formatMonthName(yearMonth: string): string {
  const [yearStr, monthStr] = yearMonth.split('-');
  const monthIdx = parseInt(monthStr, 10) - 1;
  const monthName = INDONESIAN_MONTHS[monthIdx] || monthStr;
  return `${monthName} ${yearStr}`;
}

/**
 * Format YYYY-MM-DD to Indonesian date format.
 * Example: "2026-10-25" -> "25 Oktober 2026"
 */
export function formatDateIndonesian(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [yearStr, monthStr, dayStr] = parts;
  const monthIdx = parseInt(monthStr, 10) - 1;
  const monthName = INDONESIAN_MONTHS[monthIdx] || monthStr;
  return `${parseInt(dayStr, 10)} ${monthName} ${yearStr}`;
}

/**
 * Calculate dynamic account balances considering initial balances, income, expense, and transfers.
 */
export function calculateAccountBalances(
  accounts: Account[],
  transactions: Transaction[]
): Record<string, number> {
  const balances: Record<string, number> = {};

  // Initialize with initial balance
  for (const acc of accounts) {
    balances[acc.id] = acc.initialBalance || 0;
  }

  const fallbackBankId = accounts.find((a) => a.type === 'bank')?.id || 'acc_bca';
  const resolveAccId = (id?: string) => {
    if (!id) return undefined;
    if (balances[id] !== undefined) return id;
    if (id === 'acc_cash') return accounts.find((a) => a.type === 'cash')?.id || id;
    return fallbackBankId;
  };

  // Apply transactions chronologically or additively
  for (const tx of transactions) {
    const srcId = resolveAccId(tx.accountId);
    const dstId = resolveAccId(tx.toAccountId);

    if (tx.type === 'income') {
      if (srcId && balances[srcId] !== undefined) {
        balances[srcId] += tx.amount;
      }
    } else if (tx.type === 'expense') {
      if (srcId && balances[srcId] !== undefined) {
        balances[srcId] -= tx.amount;
      }
    } else if (tx.type === 'transfer') {
      if (srcId && balances[srcId] !== undefined) {
        balances[srcId] -= tx.amount; // Source
      }
      if (dstId && balances[dstId] !== undefined) {
        balances[dstId] += tx.amount; // Destination
      }
    }
  }

  return balances;
}

/**
 * Aggregate balances into Cash, Bank, and E-Wallet totals
 */
export function calculateTotalBalance(
  accounts: Account[],
  balances: Record<string, number>
) {
  let total = 0;
  let cash = 0;
  let bank = 0;
  let ewallet = 0;

  for (const acc of accounts) {
    const bal = balances[acc.id] || 0;
    total += bal;
    if (acc.type === 'cash') {
      cash += bal;
    } else if (acc.type === 'bank') {
      bank += bal;
    } else if (acc.type === 'ewallet') {
      ewallet += bal;
    }
  }

  return { total, cash, bank, ewallet };
}

/**
 * Helper to get days in month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Calculate Monthly Recap for a specific month (YYYY-MM)
 */
export function calculateMonthlyRecap(
  targetMonth: string,
  transactions: Transaction[],
  accounts: Account[]
): MonthlyRecap {
  const [yearStr, monthStr] = targetMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysCount = getDaysInMonth(year, month);

  const accountMap = new Map<string, Account>();
  for (const acc of accounts) {
    accountMap.set(acc.id, acc);
  }

  // Filter transactions for this month
  const monthTxs = transactions.filter((tx) => tx.date.startsWith(targetMonth));

  let totalIncome = 0;
  let totalExpense = 0;
  let cashIncome = 0;
  let cashExpense = 0;
  let bankIncome = 0;
  let bankExpense = 0;
  let ewalletIncome = 0;
  let ewalletExpense = 0;
  let cashTransferNet = 0;
  let bankTransferNet = 0;
  let ewalletTransferNet = 0;

  let incomeCount = 0;
  let expenseCount = 0;
  let transferCount = 0;

  const expenseCategoryMap: Record<string, { amount: number; count: number }> = {};
  const incomeCategoryMap: Record<string, { amount: number; count: number }> = {};

  // Daily map initialization
  const dailyMap: Record<number, { income: number; expense: number }> = {};
  for (let i = 1; i <= daysCount; i++) {
    dailyMap[i] = { income: 0, expense: 0 };
  }

  for (const tx of monthTxs) {
    const day = parseInt(tx.date.split('-')[2], 10);
    const acc = accountMap.get(tx.accountId);
    const accType = acc?.type || 'cash';

    if (tx.type === 'income') {
      totalIncome += tx.amount;
      incomeCount++;
      if (accType === 'cash') cashIncome += tx.amount;
      else if (accType === 'bank') bankIncome += tx.amount;
      else if (accType === 'ewallet') ewalletIncome += tx.amount;

      if (!incomeCategoryMap[tx.category]) {
        incomeCategoryMap[tx.category] = { amount: 0, count: 0 };
      }
      incomeCategoryMap[tx.category].amount += tx.amount;
      incomeCategoryMap[tx.category].count += 1;

      if (dailyMap[day]) {
        dailyMap[day].income += tx.amount;
      }
    } else if (tx.type === 'expense') {
      totalExpense += tx.amount;
      expenseCount++;
      if (accType === 'cash') cashExpense += tx.amount;
      else if (accType === 'bank') bankExpense += tx.amount;
      else if (accType === 'ewallet') ewalletExpense += tx.amount;

      if (!expenseCategoryMap[tx.category]) {
        expenseCategoryMap[tx.category] = { amount: 0, count: 0 };
      }
      expenseCategoryMap[tx.category].amount += tx.amount;
      expenseCategoryMap[tx.category].count += 1;

      if (dailyMap[day]) {
        dailyMap[day].expense += tx.amount;
      }
    } else if (tx.type === 'transfer') {
      transferCount++;
      const toAcc = tx.toAccountId ? accountMap.get(tx.toAccountId) : undefined;
      const toType = toAcc?.type;

      // Track transfer impact per account type
      if (accType === 'cash') cashTransferNet -= tx.amount;
      else if (accType === 'bank') bankTransferNet -= tx.amount;
      else if (accType === 'ewallet') ewalletTransferNet -= tx.amount;

      if (toType === 'cash') cashTransferNet += tx.amount;
      else if (toType === 'bank') bankTransferNet += tx.amount;
      else if (toType === 'ewallet') ewalletTransferNet += tx.amount;
    }
  }

  const netCashflow = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netCashflow / totalIncome) * 100)) : 0;

  // Build sorted category summaries
  const categoryColorMap = new Map<string, string>();
  DEFAULT_EXPENSE_CATEGORIES.forEach((c) => categoryColorMap.set(c.name, c.color));
  DEFAULT_INCOME_CATEGORIES.forEach((c) => categoryColorMap.set(c.name, c.color));

  const fallbackColors = ['#0284C7', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#64748B'];

  const expenseCategories: CategorySummary[] = Object.entries(expenseCategoryMap)
    .map(([cat, data], idx) => ({
      category: cat,
      amount: data.amount,
      percentage: totalExpense > 0 ? Math.round((data.amount / totalExpense) * 100) : 0,
      count: data.count,
      color: categoryColorMap.get(cat) || fallbackColors[idx % fallbackColors.length],
    }))
    .sort((a, b) => b.amount - a.amount);

  const incomeCategories: CategorySummary[] = Object.entries(incomeCategoryMap)
    .map(([cat, data], idx) => ({
      category: cat,
      amount: data.amount,
      percentage: totalIncome > 0 ? Math.round((data.amount / totalIncome) * 100) : 0,
      count: data.count,
      color: categoryColorMap.get(cat) || fallbackColors[idx % fallbackColors.length],
    }))
    .sort((a, b) => b.amount - a.amount);

  const dailyData = [];
  for (let d = 1; d <= daysCount; d++) {
    const inc = dailyMap[d]?.income || 0;
    const exp = dailyMap[d]?.expense || 0;
    const dayPadded = d.toString().padStart(2, '0');
    dailyData.push({
      day: d,
      date: `${targetMonth}-${dayPadded}`,
      income: inc,
      expense: exp,
      net: inc - exp,
    });
  }

  return {
    month: targetMonth,
    monthName: formatMonthName(targetMonth),
    totalIncome,
    totalExpense,
    netCashflow,
    savingsRate,
    cashIncome,
    cashExpense,
    cashNet: cashIncome - cashExpense + cashTransferNet,
    bankIncome,
    bankExpense,
    bankNet: bankIncome - bankExpense + bankTransferNet,
    ewalletIncome,
    ewalletExpense,
    ewalletNet: ewalletIncome - ewalletExpense + ewalletTransferNet,
    cashTransferNet,
    bankTransferNet,
    ewalletTransferNet,
    incomeCount,
    expenseCount,
    transferCount,
    expenseCategories,
    incomeCategories,
    dailyData,
  };
}

/**
 * Get distinct list of months present in transactions sorted in descending order (latest first)
 */
export function getAvailableMonths(transactions: Transaction[]): string[] {
  const set = new Set<string>();
  const currentMonth = new Date().toISOString().slice(0, 7);
  set.add(currentMonth);

  for (const tx of transactions) {
    if (tx.date && tx.date.length >= 7) {
      set.add(tx.date.slice(0, 7));
    }
  }

  return Array.from(set).sort((a, b) => b.localeCompare(a));
}

/**
 * Export transactions to standard CSV string with Indonesian currency and account names
 */
export function exportTransactionsToCSV(
  transactions: Transaction[],
  accounts: Account[]
): string {
  const accountMap = new Map<string, string>();
  for (const acc of accounts) {
    accountMap.set(acc.id, acc.name);
  }

  const header = ['Tanggal', 'Waktu', 'Tipe', 'Kategori', 'Keterangan', 'Akun Sumber', 'Akun Tujuan', 'Jumlah (Rp)', 'Catatan'];
  const rows = transactions.map((tx) => [
    tx.date,
    tx.time || '',
    tx.type === 'income' ? 'Pemasukan' : tx.type === 'expense' ? 'Pengeluaran' : 'Transfer',
    `"${(tx.category || '').replace(/"/g, '""')}"`,
    `"${(tx.description || '').replace(/"/g, '""')}"`,
    `"${(accountMap.get(tx.accountId) || tx.accountId).replace(/"/g, '""')}"`,
    tx.toAccountId ? `"${(accountMap.get(tx.toAccountId) || tx.toAccountId).replace(/"/g, '""')}"` : '',
    tx.amount.toString(),
    `"${(tx.notes || '').replace(/"/g, '""')}"`,
  ]);

  return [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
