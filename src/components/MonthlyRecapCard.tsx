import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Wallet,
  Building2,
  CalendarDays,
  Percent,
} from 'lucide-react';
import { MonthlyRecap } from '../types/finance';
import { formatIDR, formatCompactIDR } from '../utils/finance';

interface MonthlyRecapCardProps {
  recap: MonthlyRecap;
  previousRecap?: MonthlyRecap;
}

export const MonthlyRecapCard: React.FC<MonthlyRecapCardProps> = ({
  recap,
  previousRecap,
}) => {
  const isSurplus = recap.netCashflow >= 0;

  // Comparison with previous month
  let incomeDiffPercent = 0;
  let expenseDiffPercent = 0;
  if (previousRecap) {
    if (previousRecap.totalIncome > 0) {
      incomeDiffPercent = Math.round(
        ((recap.totalIncome - previousRecap.totalIncome) / previousRecap.totalIncome) * 100
      );
    }
    if (previousRecap.totalExpense > 0) {
      expenseDiffPercent = Math.round(
        ((recap.totalExpense - previousRecap.totalExpense) / previousRecap.totalExpense) * 100
      );
    }
  }

  // Days in month for average daily expense
  const daysInMonth = recap.dailyData.length || 30;
  const avgDailyExpense = daysInMonth > 0 ? Math.round(recap.totalExpense / daysInMonth) : 0;

  return (
    <div className="space-y-4">
      {/* Header section with monthly indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-sans">
            Rekapan Keuangan: {recap.monthName}
          </h2>
          <p className="text-xs text-slate-500">
            Ringkasan menyeluruh pemasukan, pengeluaran, dan perbandingan uang kas vs rekening
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
          <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
          <span>{recap.incomeCount + recap.expenseCount} Transaksi Dicatat</span>
        </div>
      </div>

      {/* 4 Essential Monthly Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pemasukan */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Pemasukan</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 tracking-tight mt-1 tabular-nums">
            {formatIDR(recap.totalIncome)}
          </div>
          <div className="mt-3 text-xs text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span>{recap.incomeCount} kali pemasukan</span>
            {previousRecap && (
              <span
                className={`font-medium tabular-nums ${
                  incomeDiffPercent >= 0 ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                {incomeDiffPercent >= 0 ? `+${incomeDiffPercent}%` : `${incomeDiffPercent}%`} vs bln lalu
              </span>
            )}
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Pengeluaran</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-rose-600 tracking-tight mt-1 tabular-nums">
            {formatIDR(recap.totalExpense)}
          </div>
          <div className="mt-3 text-xs text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span>{recap.expenseCount} kali belanja/biaya</span>
            {previousRecap && (
              <span
                className={`font-medium tabular-nums ${
                  expenseDiffPercent <= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {expenseDiffPercent >= 0 ? `+${expenseDiffPercent}%` : `${expenseDiffPercent}%`} vs bln lalu
              </span>
            )}
          </div>
        </div>

        {/* Arus Kas Bersih (Sisa Uang) */}
        <div
          className={`rounded-xl p-4 border shadow-xs ${
            isSurplus
              ? 'bg-emerald-50/50 border-emerald-200'
              : 'bg-rose-50/50 border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">
              {isSurplus ? 'Sisa Tabungan (Surplus)' : 'Defisit Bulan Ini'}
            </span>
            <div
              className={`p-1.5 rounded-lg ${
                isSurplus ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}
            >
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-xl font-bold font-mono tracking-tight mt-1 tabular-nums ${
              isSurplus ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {formatIDR(recap.netCashflow)}
          </div>
          <div className="mt-3 text-xs text-slate-600 border-t border-slate-200/60 pt-2 flex items-center justify-between">
            <span>Rasio tabungan</span>
            <span className="font-bold font-mono tabular-nums">{recap.savingsRate}%</span>
          </div>
        </div>

        {/* Rata-rata Pengeluaran Harian */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Rata-rata Pengeluaran / Hari</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 tracking-tight mt-1 tabular-nums">
            {formatIDR(avgDailyExpense)}
          </div>
          <div className="mt-3 text-xs text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span>Dalam {daysInMonth} hari kalender</span>
            <span className="text-slate-600 font-mono">Beban harian</span>
          </div>
        </div>
      </div>

      {/* CORE SPECIFICATION: Rekapan Kas (Uang Cas) vs Rekening (Bank & E-Wallet) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kas Tunai Section */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Rekapan Uang Kas (Tunai)</h3>
                <p className="text-[11px] text-slate-500">Aktivitas dompet fisik bulan ini</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
              Kas Tunai
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="p-2.5 rounded-lg bg-slate-50">
              <span className="text-[11px] text-slate-500 block">Pemasukan Tunai</span>
              <span className="text-sm font-bold font-mono text-emerald-600 tabular-nums">
                +{formatCompactIDR(recap.cashIncome)}
              </span>
              {recap.cashTransferNet !== 0 && (
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Tarik ATM: {recap.cashTransferNet > 0 ? '+' : ''}{formatCompactIDR(recap.cashTransferNet)}
                </span>
              )}
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50">
              <span className="text-[11px] text-slate-500 block">Pengeluaran Kas</span>
              <span className="text-sm font-bold font-mono text-rose-600 tabular-nums">
                -{formatCompactIDR(recap.cashExpense)}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Perubahan Bersih Kas:</span>
            <span
              className={`font-bold font-mono tabular-nums ${
                recap.cashNet >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {recap.cashNet >= 0 ? '+' : ''}
              {formatIDR(recap.cashNet)}
            </span>
          </div>
        </div>

        {/* Rekening Bank & E-Wallet Section */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Rekapan Rekening & Digital</h3>
                <p className="text-[11px] text-slate-500">Transfer bank, payroll & debit online</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
              Bank & E-Wallet
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="p-2.5 rounded-lg bg-slate-50">
              <span className="text-[11px] text-slate-500 block">Pemasukan Rekening</span>
              <span className="text-sm font-bold font-mono text-emerald-600 tabular-nums">
                +{formatCompactIDR(recap.bankIncome + recap.ewalletIncome)}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50">
              <span className="text-[11px] text-slate-500 block">Pengeluaran Rekening</span>
              <span className="text-sm font-bold font-mono text-rose-600 tabular-nums">
                -{formatCompactIDR(recap.bankExpense + recap.ewalletExpense)}
              </span>
              {recap.bankTransferNet + recap.ewalletTransferNet !== 0 && (
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Transfer/ATM: {recap.bankTransferNet + recap.ewalletTransferNet > 0 ? '+' : ''}{formatCompactIDR(recap.bankTransferNet + recap.ewalletTransferNet)}
                </span>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Perubahan Bersih Rekening:</span>
            <span
              className={`font-bold font-mono tabular-nums ${
                recap.bankNet + recap.ewalletNet >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {recap.bankNet + recap.ewalletNet >= 0 ? '+' : ''}
              {formatIDR(recap.bankNet + recap.ewalletNet)}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
