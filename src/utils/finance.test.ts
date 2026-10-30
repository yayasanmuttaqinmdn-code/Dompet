import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatIDR,
  formatCompactIDR,
  calculateAccountBalances,
  calculateTotalBalance,
  calculateMonthlyRecap,
  exportTransactionsToCSV,
} from './finance.ts';
import type { Account, Transaction } from '../types/finance.ts';

test('formatIDR formats currency correctly in Rupiah', () => {
  assert.equal(formatIDR(1500000), 'Rp 1.500.000');
  assert.equal(formatIDR(0), 'Rp 0');
  assert.equal(formatIDR(-50000), '-Rp 50.000');
  assert.equal(formatIDR(25000), 'Rp 25.000');
});

test('formatCompactIDR formats numbers into friendly compact suffixes', () => {
  assert.equal(formatCompactIDR(1500000), 'Rp 1,5 Jt');
  assert.equal(formatCompactIDR(2000000000), 'Rp 2,0 M');
  assert.equal(formatCompactIDR(50000), 'Rp 50 Rb');
});

test('calculateAccountBalances correctly calculates balances with income, expense, and transfer', () => {
  const accounts: Account[] = [
    { id: 'acc_cash', name: 'Dompet Tunai', type: 'cash', initialBalance: 500000, color: '#10B981' },
    { id: 'acc_bca', name: 'BCA Rekening', type: 'bank', initialBalance: 3000000, color: '#3B82F6' },
  ];

  const transactions: Transaction[] = [
    // Income to bank: +5.000.000
    { id: '1', date: '2026-10-01', type: 'income', amount: 5000000, accountId: 'acc_bca', category: 'Gaji Pokok', description: 'Gaji Bulanan' },
    // Expense from cash: -100.000
    { id: '2', date: '2026-10-02', type: 'expense', amount: 100000, accountId: 'acc_cash', category: 'Makanan & Minuman', description: 'Makan Siang' },
    // Transfer from bank to cash (tarik tunai): 500.000
    { id: '3', date: '2026-10-03', type: 'transfer', amount: 500000, accountId: 'acc_bca', toAccountId: 'acc_cash', category: 'Transfer', description: 'Tarik Tunai ATM' },
  ];

  const balances = calculateAccountBalances(accounts, transactions);

  // Cash: 500.000 - 100.000 + 500.000 = 900.000
  assert.equal(balances['acc_cash'], 900000);
  // BCA: 3.000.000 + 5.000.000 - 500.000 = 7.500.000
  assert.equal(balances['acc_bca'], 7500000);

  const totals = calculateTotalBalance(accounts, balances);
  assert.equal(totals.total, 8400000);
  assert.equal(totals.cash, 900000);
  assert.equal(totals.bank, 7500000);
});

test('calculateMonthlyRecap generates accurate recap for target month', () => {
  const accounts: Account[] = [
    { id: 'acc_cash', name: 'Dompet Tunai', type: 'cash', initialBalance: 100000, color: '#10B981' },
    { id: 'acc_bank', name: 'BCA Rekening', type: 'bank', initialBalance: 1000000, color: '#3B82F6' },
  ];

  const transactions: Transaction[] = [
    // October
    { id: '1', date: '2026-10-01', type: 'income', amount: 4000000, accountId: 'acc_bank', category: 'Gaji Pokok', description: 'Gaji' },
    { id: '2', date: '2026-10-02', type: 'expense', amount: 50000, accountId: 'acc_cash', category: 'Makanan & Minuman', description: 'Makan' },
    { id: '3', date: '2026-10-05', type: 'expense', amount: 450000, accountId: 'acc_bank', category: 'Tagihan & Utilitas', description: 'Listrik' },
    // September (should NOT be included in October recap)
    { id: '4', date: '2026-09-28', type: 'expense', amount: 200000, accountId: 'acc_cash', category: 'Makanan & Minuman', description: 'Makan lalu' },
  ];

  const recap = calculateMonthlyRecap('2026-10', transactions, accounts);

  assert.equal(recap.totalIncome, 4000000);
  assert.equal(recap.totalExpense, 500000);
  assert.equal(recap.netCashflow, 3500000);
  assert.equal(recap.savingsRate, 88); // (3.5M / 4M) * 100 = 87.5 => 88%

  // Check category breakdown
  assert.equal(recap.expenseCategories.length, 2);
  const foodCat = recap.expenseCategories.find((c) => c.category === 'Makanan & Minuman');
  assert.ok(foodCat);
  assert.equal(foodCat.amount, 50000);

  const billCat = recap.expenseCategories.find((c) => c.category === 'Tagihan & Utilitas');
  assert.ok(billCat);
  assert.equal(billCat.amount, 450000);
});

test('exportTransactionsToCSV exports valid CSV rows', () => {
  const accounts: Account[] = [
    { id: 'acc_1', name: 'Dompet Tunai', type: 'cash', initialBalance: 0, color: '#10B981' },
  ];
  const transactions: Transaction[] = [
    { id: '1', date: '2026-10-15', time: '14:30', type: 'expense', amount: 25000, accountId: 'acc_1', category: 'Makanan & Minuman', description: 'Kopi Susu' },
  ];

  const csv = exportTransactionsToCSV(transactions, accounts);
  assert.ok(csv.includes('Tanggal,Waktu,Tipe,Kategori,Keterangan,Akun Sumber,Akun Tujuan,Jumlah (Rp),Catatan'));
  assert.ok(csv.includes('2026-10-15'));
  assert.ok(csv.includes('Pengeluaran'));
  assert.ok(csv.includes('Kopi Susu'));
  assert.ok(csv.includes('25000'));
});
