import React from 'react';
import {
  Wallet,
  Building2,
  Smartphone,
  ArrowRightLeft,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  BarChart3,
  Layers,
  Banknote,
  Landmark,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { Account, MonthlyRecap, Transaction } from '../types/finance';
import { formatIDR, formatCompactIDR, formatDateIndonesian } from '../utils/finance';

interface MoneySummaryViewProps {
  accounts: Account[];
  balances: Record<string, number>;
  recap: MonthlyRecap;
  previousRecap?: MonthlyRecap;
  recentTransactions: Transaction[];
  onOpenManageAccounts: () => void;
  onOpenTransfer: () => void;
  onOpenAddModal: () => void;
  onNavigateToCharts: () => void;
  onNavigateToTransactions: () => void;
  onEditTransaction: (tx: Transaction) => void;
}

export const MoneySummaryView: React.FC<MoneySummaryViewProps> = ({
  accounts,
  balances,
  recap,
  recentTransactions,
  onOpenManageAccounts,
  onOpenTransfer,
  onOpenAddModal,
  onNavigateToCharts,
  onNavigateToTransactions,
  onEditTransaction,
}) => {
  // Filter accounts by type
  const cashAccounts = accounts.filter((a) => a.type === 'cash');
  const bankAccounts = accounts.filter((a) => a.type === 'bank');
  const ewalletAccounts = accounts.filter((a) => a.type === 'ewallet');

  // Aggregate grand balances
  const totalCash = cashAccounts.reduce((sum, a) => sum + (balances[a.id] || 0), 0);
  const totalBank = bankAccounts.reduce((sum, a) => sum + (balances[a.id] || 0), 0);
  const totalEwallet = ewalletAccounts.reduce((sum, a) => sum + (balances[a.id] || 0), 0);
  const grandTotal = totalCash + totalBank + totalEwallet;

  const cashPercentage = grandTotal > 0 ? Math.round((totalCash / grandTotal) * 100) : 0;
  const bankPercentage = grandTotal > 0 ? Math.round((totalBank / grandTotal) * 100) : 0;
  const ewalletPercentage = grandTotal > 0 ? Math.round((totalEwallet / grandTotal) * 100) : 0;

  const isSurplus = recap.netCashflow >= 0;

  return (
    <div className="space-y-6">
      {/* =========================================================================
          1. HERO HEADER: TOTAL SALDO SAAT INI (Simpel, Jelas, & Berwibawa)
          ========================================================================= */}
      <div className="rounded-3xl bg-gradient-to-r from-[#024a77] via-[#035b91] to-[#046ca8] p-5 sm:p-7 text-white shadow-lg border border-[#066ba6]/40 relative overflow-hidden">
        {/* Subtle geometric circles matching theme */}
        <div className="absolute right-0 top-0 bottom-0 w-80 opacity-15 pointer-events-none overflow-hidden">
          <svg viewBox="0 0 400 400" className="w-full h-full text-white fill-current">
            <circle cx="350" cy="80" r="140" fill="none" stroke="currentColor" strokeWidth="30" />
            <circle cx="380" cy="220" r="160" fill="none" stroke="currentColor" strokeWidth="40" />
            <circle cx="300" cy="350" r="100" fill="none" stroke="currentColor" strokeWidth="24" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-bold tracking-wide">
              <span>💰</span>
              <span>RINGKASAN KEUANGAN</span>
            </div>

            <div className="space-y-0.5">
              <span className="text-xs uppercase font-bold tracking-wider text-sky-200 block">
                Total Seluruh Uang Anda
              </span>
              <div className="text-3xl sm:text-4xl md:text-5xl font-black font-mono tracking-tight text-white tabular-nums">
                {formatIDR(grandTotal)}
              </div>
            </div>

            <p className="text-xs text-sky-100/90 pt-0.5 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-300 inline shrink-0" />
              <span>Gabungan saldo kas tunai fisik, rekening tabungan bank, dan dompet digital</span>
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenAddModal}
              className="px-5 py-2.5 rounded-xl bg-[#fbb016] hover:bg-[#f59e0b] active:bg-[#d97706] text-slate-950 text-xs font-black flex items-center gap-2 shadow-md shadow-amber-950/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Catat Uang</span>
            </button>
            <button
              onClick={onOpenTransfer}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Pindah Uang / Tarik Kas</span>
            </button>
            <button
              onClick={onOpenManageAccounts}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-medium transition-all cursor-pointer"
              title="Kelola Akun"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. DUA KARTU UTAMA: SALDO KAS TUNAI & SALDO REKENING DI BANK
             (Ditampilkan menonjol & terpisah sesuai permintaan pengguna)
          ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <span>Posisi Saldo: Kas Tunai vs Rekening Bank</span>
            </h2>
            <p className="text-xs text-slate-500">
              Perbedaan ketersediaan uang tunai langsung dan simpanan di bank
            </p>
          </div>
          <button
            onClick={onOpenTransfer}
            className="text-xs font-bold text-[#024a77] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Setor / Tarik Tunai</span>
          </button>
        </div>

        <div className={`grid grid-cols-1 ${ewalletAccounts.length > 0 ? 'lg:grid-cols-12' : 'md:grid-cols-2'} gap-4`}>
          {/* ================== KARTU 1: SALDO KAS TUNAI ================== */}
          <div
            className={`rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 border-2 border-emerald-300 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between ${
              ewalletAccounts.length > 0 ? 'lg:col-span-5' : ''
            }`}
          >
            {/* Background subtle watermark */}
            <div className="absolute -right-4 -bottom-4 text-emerald-200/40 pointer-events-none">
              <Banknote className="w-32 h-32" />
            </div>

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                    <Banknote className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 block">
                      Uang Fisik / Dompet
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                      Saldo Kas Tunai
                    </h3>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-mono font-bold shrink-0 border border-emerald-200">
                  {cashPercentage}% Total
                </span>
              </div>

              {/* Main Cash Amount */}
              <div className="mt-4 pt-1">
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-700 tabular-nums">
                  {formatIDR(totalCash)}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Uang tunai siap pakai di dompet, laci, atau kas kecil
                </p>
              </div>

              {/* Cash Accounts List */}
              <div className="mt-4 pt-3 border-t border-emerald-200/60 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Rincian Akun Kas:
                </div>
                {cashAccounts.length === 0 ? (
                  <div className="text-xs text-slate-400 italic">Belum ada akun kas tunai</div>
                ) : (
                  cashAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between text-xs py-1 px-2.5 rounded-xl bg-white/80 border border-emerald-100"
                    >
                      <div className="flex items-center gap-2">
                        <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-semibold text-slate-800">{acc.name}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        {formatIDR(balances[acc.id] || 0)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Monthly In/Out Mini Bar */}
            <div className="relative z-10 mt-4 pt-3 border-t border-emerald-200/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">
                Arus Kas Bulan {recap.monthName}:
              </span>
              <div className="flex items-center gap-3 font-mono font-semibold">
                <span className="text-emerald-700">+{formatCompactIDR(recap.cashIncome)}</span>
                <span className="text-slate-300">|</span>
                <span className="text-rose-600">-{formatCompactIDR(recap.cashExpense)}</span>
              </div>
            </div>
          </div>

          {/* ================== KARTU 2: SALDO REKENING DI BANK ================== */}
          <div
            className={`rounded-3xl bg-gradient-to-br from-blue-50 via-white to-sky-50/40 border-2 border-sky-300 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between ${
              ewalletAccounts.length > 0 ? 'lg:col-span-5' : ''
            }`}
          >
            {/* Background subtle watermark */}
            <div className="absolute -right-4 -bottom-4 text-sky-200/40 pointer-events-none">
              <Landmark className="w-32 h-32" />
            </div>

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#024a77] text-white flex items-center justify-center shadow-md shadow-[#024a77]/20 shrink-0">
                    <Landmark className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#024a77] block">
                      Simpanan Bank / Tabungan
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                      Saldo Rekening di Bank
                    </h3>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-sky-100 text-[#024a77] text-[11px] font-mono font-bold shrink-0 border border-sky-200">
                  {bankPercentage}% Total
                </span>
              </div>

              {/* Main Bank Amount */}
              <div className="mt-4 pt-1">
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-[#024a77] tabular-nums">
                  {formatIDR(totalBank)}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Saldo tersimpan aman di seluruh rekening bank terdaftar
                </p>
              </div>

              {/* Bank Accounts List */}
              <div className="mt-4 pt-3 border-t border-sky-200/60 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Rincian Rekening Bank:
                </div>
                {bankAccounts.length === 0 ? (
                  <div className="text-xs text-slate-400 italic">Belum ada rekening bank</div>
                ) : (
                  bankAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between text-xs py-1 px-2.5 rounded-xl bg-white/80 border border-sky-100"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Building2 className="w-3.5 h-3.5 text-[#024a77] shrink-0" />
                        <span className="font-semibold text-slate-800 truncate">{acc.name}</span>
                        {acc.accountNumber && (
                          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                            ({acc.accountNumber})
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-slate-900 shrink-0 ml-2">
                        {formatIDR(balances[acc.id] || 0)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Monthly In/Out Mini Bar */}
            <div className="relative z-10 mt-4 pt-3 border-t border-sky-200/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">
                Arus Bank Bulan {recap.monthName}:
              </span>
              <div className="flex items-center gap-3 font-mono font-semibold">
                <span className="text-emerald-700">+{formatCompactIDR(recap.bankIncome)}</span>
                <span className="text-slate-300">|</span>
                <span className="text-rose-600">-{formatCompactIDR(recap.bankExpense)}</span>
              </div>
            </div>
          </div>

          {/* ================== KARTU 3 (JIKA ADA): E-WALLET / DIGITAL ================== */}
          {ewalletAccounts.length > 0 && (
            <div className="rounded-3xl bg-slate-50 border border-slate-200 p-5 shadow-xs flex flex-col justify-between lg:col-span-2">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                    {ewalletPercentage}%
                  </span>
                </div>

                <div className="mt-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Dompet Digital
                  </span>
                  <div className="text-sm font-black text-slate-800">
                    E-Wallet
                  </div>
                  <div className="text-lg font-black font-mono text-cyan-700 mt-1 tabular-nums">
                    {formatIDR(totalEwallet)}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 space-y-1">
                  {ewalletAccounts.map((acc) => (
                    <div key={acc.id} className="text-[11px] flex justify-between">
                      <span className="text-slate-600 truncate">{acc.name}</span>
                      <span className="font-mono font-bold text-slate-900 shrink-0">
                        {formatCompactIDR(balances[acc.id] || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500">
                GoPay / OVO / Dana
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          2. KARTU REKAP BULAN BERJALAN (Simpel: Masuk, Keluar, Sisa Uang)
          ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Rekap Uang Bulan {recap.monthName}
            </h2>
            <p className="text-xs text-slate-500">
              Perputaran uang masuk dan uang keluar yang tercatat
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              isSurplus
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {isSurplus ? '✨ Uang Surplus / Hemat' : '⚠️ Uang Defisit'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* 1. Total Masuk */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-2xs hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-bold flex items-center gap-1.5 text-emerald-700 uppercase tracking-wide text-[11px]">
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Total Masuk</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {recap.incomeCount} kali
              </span>
            </div>
            <div className="text-2xl font-black font-mono tracking-tight text-emerald-600 mt-1 tabular-nums">
              +{formatIDR(recap.totalIncome)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Kas: {formatCompactIDR(recap.cashIncome)} · Bank: {formatCompactIDR(recap.bankIncome + recap.ewalletIncome)}
            </p>
          </div>

          {/* 2. Total Keluar */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-2xs hover:border-rose-300 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-bold flex items-center gap-1.5 text-rose-700 uppercase tracking-wide text-[11px]">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Total Keluar</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {recap.expenseCount} kali
              </span>
            </div>
            <div className="text-2xl font-black font-mono tracking-tight text-rose-600 mt-1 tabular-nums">
              -{formatIDR(recap.totalExpense)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Kas: {formatCompactIDR(recap.cashExpense)} · Bank: {formatCompactIDR(recap.bankExpense + recap.ewalletExpense)}
            </p>
          </div>

          {/* 3. Sisa Uang / Selisih Bersih */}
          <div
            className={`rounded-2xl border p-4 shadow-2xs transition-colors ${
              isSurplus
                ? 'bg-emerald-50/50 border-emerald-200/90'
                : 'bg-rose-50/50 border-rose-200/90'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span
                className={`font-bold uppercase tracking-wide text-[11px] ${
                  isSurplus ? 'text-emerald-800' : 'text-rose-800'
                }`}
              >
                {isSurplus ? 'Sisa Uang Tersimpan' : 'Kekurangan Uang'}
              </span>
              <span
                className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
                  isSurplus ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {recap.savingsRate}% tersimpan
              </span>
            </div>
            <div
              className={`text-2xl font-black font-mono tracking-tight mt-1 tabular-nums ${
                isSurplus ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {formatIDR(recap.netCashflow)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Sisa kas: {formatCompactIDR(recap.cashNet)} · Sisa bank: {formatCompactIDR(recap.bankNet + recap.ewalletNet)}
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. KARTU SUMBER DANA / AKUN DOMPET & BANK (Simpel & Rapi)
          ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Saldo per Akun / Dompet
            </h3>
            <p className="text-xs text-slate-500">
              Rincian uang pada tiap tempat penyimpanan
            </p>
          </div>
          <button
            onClick={onOpenManageAccounts}
            className="text-xs font-bold text-[#024a77] hover:text-[#035b91] transition-colors cursor-pointer"
          >
            Kelola Akun →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {accounts.map((acc) => {
            const bal = balances[acc.id] || 0;
            const portion = grandTotal > 0 ? Math.round((bal / grandTotal) * 100) : 0;

            return (
              <div
                key={acc.id}
                className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:border-sky-300 hover:bg-sky-50/30 transition-all flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-2xs shrink-0"
                      style={{ backgroundColor: acc.color }}
                    >
                      {acc.type === 'cash' ? (
                        <Wallet className="w-4 h-4" />
                      ) : acc.type === 'ewallet' ? (
                        <Smartphone className="w-4 h-4" />
                      ) : (
                        <Building2 className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block leading-tight">
                        {acc.name}
                      </span>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {acc.type === 'cash'
                          ? 'Uang Tunai'
                          : acc.type === 'ewallet'
                          ? 'E-Wallet'
                          : 'Rekening Bank'}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                    {portion}%
                  </span>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/50 flex items-center justify-between">
                  <span className="text-[10px] font-medium text-slate-400 uppercase">
                    Saldo Aktif
                  </span>
                  <span className="text-sm font-black font-mono text-slate-900 tabular-nums">
                    {formatIDR(bal)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          4. CATATAN TRANSAKSI TERAKHIR (Ringkas: 5 Data Terbaru)
          ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Transaksi Terakhir
            </h3>
            <p className="text-xs text-slate-500">
              5 catatan pengeluaran & pemasukan terbaru
            </p>
          </div>
          <button
            onClick={onNavigateToTransactions}
            className="text-xs font-bold text-[#024a77] hover:text-[#035b91] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Semua Transaksi</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            Belum ada transaksi di bulan ini.{' '}
            <button
              onClick={onOpenAddModal}
              className="text-[#024a77] font-bold underline cursor-pointer"
            >
              Catat transaksi sekarang
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTransactions.slice(0, 5).map((tx) => {
              const account = accounts.find((a) => a.id === tx.accountId);
              const isIncome = tx.type === 'income';
              const isTransfer = tx.type === 'transfer';

              return (
                <div
                  key={tx.id}
                  onClick={() => onEditTransaction(tx)}
                  className="py-3 px-2 flex items-center justify-between hover:bg-slate-50/80 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-emerald-50 text-emerald-600'
                          : isTransfer
                          ? 'bg-blue-50 text-[#024a77]'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : isTransfer ? (
                        <ArrowRightLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {tx.description}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-medium text-slate-600">{tx.category}</span>
                        <span>•</span>
                        <span>{account?.name || 'Akun'}</span>
                        <span>•</span>
                        <span className="text-slate-400">{formatDateIndonesian(tx.date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-xs sm:text-sm font-black font-mono tabular-nums ${
                        isIncome
                          ? 'text-emerald-600'
                          : isTransfer
                          ? 'text-[#024a77]'
                          : 'text-slate-900'
                      }`}
                    >
                      {isIncome ? '+' : isTransfer ? '' : '-'}
                      {formatIDR(tx.amount)}
                    </div>
                    <span className="text-[10px] text-slate-400">Klik untuk ubah</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          5. TEASER KE MENU GRAFIK (Clean & Non-intrusive)
          ========================================================================= */}
      <div className="rounded-2xl bg-slate-900 p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#fbb016] shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white">
              Ingin Melihat Analisis & Grafik Visual?
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Lihat grafik batang tren 6 bulan, diagram donat pos belanja, dan persentase kategori di Menu Grafik.
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToCharts}
          className="px-4 py-2 rounded-xl bg-[#fbb016] hover:bg-[#f59e0b] active:bg-[#d97706] text-slate-950 text-xs font-black flex items-center gap-1.5 self-start sm:self-center shrink-0 cursor-pointer shadow-xs transition-colors"
        >
          <span>Buka Menu Grafik</span>
          <ChevronRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
