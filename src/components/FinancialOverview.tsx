import React from 'react';
import { Wallet, Building2, TrendingUp, TrendingDown, Layers, ChevronRight } from 'lucide-react';
import { Account, MonthlyRecap } from '../types/finance';
import { formatIDR, formatCompactIDR } from '../utils/finance';

interface FinancialOverviewProps {
  accounts: Account[];
  balances: Record<string, number>;
  recap: MonthlyRecap;
  previousRecap?: MonthlyRecap;
  onOpenManageAccounts: () => void;
  onOpenTransfer: () => void;
  onViewAllTransactions?: () => void;
}

export const FinancialOverview: React.FC<FinancialOverviewProps> = ({
  accounts,
  balances,
  recap,
  previousRecap,
  onOpenManageAccounts,
  onOpenTransfer,
  onViewAllTransactions,
}) => {
  const [activeFilterTab, setActiveFilterTab] = React.useState<'all' | 'cash' | 'bank' | 'recap'>('all');

  let totalCash = 0;
  let totalBank = 0;
  let totalEwallet = 0;
  let grandTotal = 0;

  for (const acc of accounts) {
    const bal = balances[acc.id] || 0;
    grandTotal += bal;
    if (acc.type === 'cash') totalCash += bal;
    else if (acc.type === 'bank') totalBank += bal;
    else if (acc.type === 'ewallet') totalEwallet += bal;
  }

  // Delta comparisons
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

  const isSurplus = recap.netCashflow >= 0;

  return (
    <div className="space-y-5">
      {/* =========================================================================
          BANNER 1: HERO OCEAN BLUE BANNER (Persis Banner Atas pada Foto)
          ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#024a77] via-[#035b91] to-[#046ca8] p-5 sm:p-7 text-white shadow-lg border border-[#066ba6]/40">
        {/* Subtle geometric wave watermarks matching the photo */}
        <div className="absolute right-0 top-0 bottom-0 w-80 opacity-15 pointer-events-none overflow-hidden">
          <svg viewBox="0 0 400 400" className="w-full h-full text-white fill-current">
            <circle cx="350" cy="80" r="140" fill="none" stroke="currentColor" strokeWidth="30" />
            <circle cx="380" cy="220" r="160" fill="none" stroke="currentColor" strokeWidth="40" />
            <circle cx="300" cy="350" r="100" fill="none" stroke="currentColor" strokeWidth="24" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2.5">
            {/* Tag badge in golden amber matching reference */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-bold tracking-wide">
              <span>🛡️</span>
              <span>MANAJEMEN KEUANGAN PRIBADI</span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#024a77] font-black text-xl shadow-md shrink-0">
                DK
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
                  POSISI KEUANGAN DOMPETKU
                </h1>
                <p className="text-xs sm:text-sm text-sky-100 font-normal">
                  Pencatatan Keuangan Terpadu Uang Kas Dompet & Rekening Bank.
                </p>
              </div>
            </div>
          </div>

          {/* Sync badge on the right like photo */}
          <div className="self-start md:self-center flex items-center gap-2">
            <button
              onClick={onOpenManageAccounts}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xs text-white text-xs font-semibold border border-white/20 shadow-xs transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{accounts.length} Akun Terhubung</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BANNER 2: DARK NAVY "SOROTAN UTAMA" CARD (Persis Desain Foto)
          ========================================================================= */}
      <div className="rounded-3xl bg-[#0a2236] p-5 sm:p-7 text-white border border-[#143d5c] shadow-xl space-y-5">
        {/* Top bar with SOROTAN UTAMA tag */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#143d5c] pb-4">
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1 rounded-full bg-[#fbb016] text-slate-950 text-xs font-black tracking-wide inline-flex items-center gap-1.5 shadow-xs">
              <span>⚡</span>
              <span>SOROTAN UTAMA</span>
            </span>
            <span className="text-xs text-sky-200/80 hidden sm:inline">
              Pilih tab atau pantau rincian keuangan Anda bulan {recap.monthName}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-sky-200/80">
            <span className="font-mono tabular-nums font-semibold">Bulan: {recap.monthName}</span>
          </div>
        </div>

        {/* Big headline row like "67 Aset Terpadu" in photo */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-sky-300 uppercase tracking-wider">
              <span>🌐</span>
              <span>TOTAL SEMUA KEKAYAAN SIAP PAKAI</span>
            </div>
            <div className="flex flex-wrap items-baseline gap-3 mt-1">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white tabular-nums">
                {formatIDR(grandTotal)}
              </span>
              <span className="px-3 py-1 rounded-full bg-[#132f45] border border-[#1d4666] text-xs font-semibold text-sky-200">
                Kas: {formatCompactIDR(totalCash)} · Bank: {formatCompactIDR(totalBank + totalEwallet)}
              </span>
            </div>
          </div>

          {/* Golden Amber CTA button like "Buka Semua Data ↗" */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenTransfer}
              className="px-4 py-2 rounded-xl bg-[#132f45] hover:bg-[#1a3e5c] border border-[#1e496a] text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Tarik / Pindah
            </button>
            <button
              onClick={onViewAllTransactions || onOpenManageAccounts}
              className="px-5 py-2.5 rounded-xl bg-[#fbb016] hover:bg-[#f59e0b] active:bg-[#d97706] text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-950/30 transition-all cursor-pointer"
            >
              <span>Daftar Transaksi</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* 4 Sleek Dark Sub-cards matching the 4 cards in the reference photo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Uang Dompet (Cash) */}
          <div className="rounded-2xl bg-[#132f45] border border-[#1e496a] p-4 text-white hover:border-sky-400/40 transition-colors">
            <div className="flex items-center justify-between text-xs text-sky-200 mb-1">
              <span className="font-semibold flex items-center gap-1.5">
                <span>💵</span>
                <span>Uang Dompet (Cash)</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                {grandTotal > 0 ? Math.round((totalCash / grandTotal) * 100) : 0}%
              </span>
            </div>
            <div className="text-xl font-black font-mono tracking-tight text-white mt-1 tabular-nums">
              {formatIDR(totalCash)}
            </div>
            <p className="text-[11px] text-sky-300/70 mt-1">
              Uang tunai di tangan / laci
            </p>
          </div>

          {/* Card 2: Uang di Bank / ATM */}
          <div className="rounded-2xl bg-[#132f45] border border-[#1e496a] p-4 text-white hover:border-sky-400/40 transition-colors">
            <div className="flex items-center justify-between text-xs text-sky-200 mb-1">
              <span className="font-semibold flex items-center gap-1.5">
                <span>🏦</span>
                <span>Uang Bank / ATM</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-sky-300 font-mono">
                {grandTotal > 0 ? Math.round(((totalBank + totalEwallet) / grandTotal) * 100) : 0}%
              </span>
            </div>
            <div className="text-xl font-black font-mono tracking-tight text-white mt-1 tabular-nums">
              {formatIDR(totalBank + totalEwallet)}
            </div>
            <p className="text-[11px] text-sky-300/70 mt-1">
              Saldo rekening & dompet digital
            </p>
          </div>

          {/* Card 3: Pemasukan Bulan Ini */}
          <div className="rounded-2xl bg-[#132f45] border border-[#1e496a] p-4 text-white hover:border-emerald-400/40 transition-colors">
            <div className="flex items-center justify-between text-xs text-sky-200 mb-1">
              <span className="font-semibold flex items-center gap-1.5">
                <span>📈</span>
                <span>Masuk Bulan Ini</span>
              </span>
              {previousRecap && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  {incomeDiffPercent >= 0 ? `+${incomeDiffPercent}%` : `${incomeDiffPercent}%`}
                </span>
              )}
            </div>
            <div className="text-xl font-black font-mono tracking-tight text-emerald-400 mt-1 tabular-nums">
              {formatIDR(recap.totalIncome)}
            </div>
            <p className="text-[11px] text-emerald-300/80 mt-1">
              {recap.incomeCount} kali pemasukan tercatat
            </p>
          </div>

          {/* Card 4: Pengeluaran Bulan Ini */}
          <div className="rounded-2xl bg-[#132f45] border border-[#1e496a] p-4 text-white hover:border-amber-400/40 transition-colors">
            <div className="flex items-center justify-between text-xs text-sky-200 mb-1">
              <span className="font-semibold flex items-center gap-1.5">
                <span>📉</span>
                <span>Keluar Bulan Ini</span>
              </span>
              {previousRecap && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
                  {expenseDiffPercent <= 0 ? `${expenseDiffPercent}%` : `+${expenseDiffPercent}%`}
                </span>
              )}
            </div>
            <div className="text-xl font-black font-mono tracking-tight text-[#fbb016] mt-1 tabular-nums">
              {formatIDR(recap.totalExpense)}
            </div>
            <p className="text-[11px] text-amber-200/80 mt-1">
              {recap.expenseCount} kali pengeluaran tercatat
            </p>
          </div>
        </div>

        {/* Bottom Filter Pills matching photo's "Semua Data", "Tanah & Lahan", etc. */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2 border-t border-[#143d5c]">
          <button
            onClick={() => setActiveFilterTab('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilterTab === 'all'
                ? 'bg-[#fbb016] text-slate-950 shadow-md shadow-amber-950/20'
                : 'bg-[#132f45] text-sky-100 hover:bg-[#1a3e5c]'
            }`}
          >
            <span>🌐</span>
            <span>Semua Data</span>
          </button>
          <button
            onClick={() => setActiveFilterTab('cash')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilterTab === 'cash'
                ? 'bg-[#fbb016] text-slate-950 shadow-md'
                : 'bg-[#132f45] text-sky-100 hover:bg-[#1a3e5c]'
            }`}
          >
            <span>💵</span>
            <span>Uang Kas Tunai</span>
          </button>
          <button
            onClick={() => setActiveFilterTab('bank')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilterTab === 'bank'
                ? 'bg-[#fbb016] text-slate-950 shadow-md'
                : 'bg-[#132f45] text-sky-100 hover:bg-[#1a3e5c]'
            }`}
          >
            <span>🏦</span>
            <span>Bank & E-Wallet</span>
          </button>
          <button
            onClick={() => setActiveFilterTab('recap')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilterTab === 'recap'
                ? 'bg-[#fbb016] text-slate-950 shadow-md'
                : 'bg-[#132f45] text-sky-100 hover:bg-[#1a3e5c]'
            }`}
          >
            <span>🛡️</span>
            <span>Sisa Uang ({recap.savingsRate}%)</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: SUMMARY DETAILS & PROGRESS (Surplus / Defisit + Cara Belanja)
          ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-[#0a2236] uppercase tracking-wide">
              Rekap Tabungan Bulan {recap.monthName}
            </h3>
            <p className="text-xs text-slate-500">
              Evaluasi selisih pemasukan dan pengeluaran bulan berjalan
            </p>
          </div>
          <div className="inline-flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                isSurplus
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {isSurplus ? '✨ Surplus (Berhemat)' : '⚠️ Defisit (Overbudget)'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Masuk
            </span>
            <div className="text-lg font-black font-mono text-emerald-600 mt-1 tabular-nums">
              {formatIDR(recap.totalIncome)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Kas: {formatCompactIDR(recap.cashIncome)} · Bank: {formatCompactIDR(recap.bankIncome + recap.ewalletIncome)}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Keluar
            </span>
            <div className="text-lg font-black font-mono text-rose-600 mt-1 tabular-nums">
              {formatIDR(recap.totalExpense)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Kas: {formatCompactIDR(recap.cashExpense)} · Bank: {formatCompactIDR(recap.bankExpense + recap.ewalletExpense)}
            </span>
          </div>

          <div
            className={`p-3.5 rounded-2xl border ${
              isSurplus
                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                : 'bg-rose-50/50 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {isSurplus ? 'Sisa Uang (Tersimpan)' : 'Kekurangan Uang'}
              </span>
              <span className="text-xs font-mono font-bold">
                {recap.savingsRate}%
              </span>
            </div>
            <div
              className={`text-lg font-black font-mono mt-1 tabular-nums ${
                isSurplus ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {formatIDR(recap.netCashflow)}
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Sisa Kas: {formatCompactIDR(recap.cashNet)} · Sisa Bank: {formatCompactIDR(recap.bankNet + recap.ewalletNet)}
            </span>
          </div>
        </div>

        {/* Expense distribution bar */}
        {recap.totalExpense > 0 && (
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
            <span className="text-slate-500 font-semibold shrink-0 text-xs">
              Distribusi Belanja:
            </span>
            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${Math.round((recap.cashExpense / recap.totalExpense) * 100)}%` }}
                title={`Kas Tunai: ${formatIDR(recap.cashExpense)}`}
              />
              <div
                className="bg-[#024a77] h-full transition-all"
                style={{ width: `${Math.round(((recap.bankExpense + recap.ewalletExpense) / recap.totalExpense) * 100)}%` }}
                title={`Rekening Bank: ${formatIDR(recap.bankExpense + recap.ewalletExpense)}`}
              />
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600 shrink-0 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Dompet Tunai {Math.round((recap.cashExpense / recap.totalExpense) * 100)}%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#024a77] inline-block" />
                Bank / ATM {Math.round(((recap.bankExpense + recap.ewalletExpense) / recap.totalExpense) * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

