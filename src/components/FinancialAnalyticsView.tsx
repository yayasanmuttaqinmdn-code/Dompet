import React, { useState } from 'react';
import { MonthlyRecap } from '../types/finance';
import { formatIDR, formatCompactIDR } from '../utils/finance';
import {
  BarChart2,
  PieChart,
  TrendingUp,
  TrendingDown,
  Percent,
  Calendar,
  Wallet,
  Building2,
  Sparkles,
} from 'lucide-react';

interface FinancialAnalyticsViewProps {
  currentRecap: MonthlyRecap;
  historicalRecaps: MonthlyRecap[];
  previousRecap?: MonthlyRecap;
}

export const FinancialAnalyticsView: React.FC<FinancialAnalyticsViewProps> = ({
  currentRecap,
  historicalRecaps,
  previousRecap,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'all' | 'trend' | 'categories'>('all');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Maximum value for bar scaling
  const maxVal = Math.max(
    ...historicalRecaps.map((r) => Math.max(r.totalIncome, r.totalExpense)),
    1000000
  );

  // Donut chart calculations
  const totalExpense = currentRecap.totalExpense || 1;
  let cumAngle = 0;
  const donutSegments = currentRecap.expenseCategories.map((cat) => {
    const angle = (cat.amount / totalExpense) * 360;
    const startAngle = cumAngle;
    cumAngle += angle;
    return {
      ...cat,
      startAngle,
      endAngle: cumAngle,
    };
  });

  const createArc = (startAngle: number, endAngle: number, innerR: number, outerR: number) => {
    const span = Math.min(endAngle - startAngle, 359.99);
    const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;
    const sRad = rad(startAngle);
    const eRad = rad(startAngle + span);

    const x1 = 100 + outerR * Math.cos(sRad);
    const y1 = 100 + outerR * Math.sin(sRad);
    const x2 = 100 + outerR * Math.cos(eRad);
    const y2 = 100 + outerR * Math.sin(eRad);

    const x3 = 100 + innerR * Math.cos(eRad);
    const y3 = 100 + innerR * Math.sin(eRad);
    const x4 = 100 + innerR * Math.cos(sRad);
    const y4 = 100 + innerR * Math.sin(sRad);

    const largeArc = span > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  };

  // Biggest category
  const biggestCategory = currentRecap.expenseCategories[0];

  // Month-over-month comparison
  let expenseDiffPercent = 0;
  if (previousRecap && previousRecap.totalExpense > 0) {
    expenseDiffPercent = Math.round(
      ((currentRecap.totalExpense - previousRecap.totalExpense) / previousRecap.totalExpense) * 100
    );
  }

  return (
    <div className="space-y-6">
      {/* =========================================================================
          1. HEADER MENU GRAFIK
          ========================================================================= */}
      <div className="rounded-3xl bg-[#0a2236] p-5 sm:p-6 text-white border border-[#143d5c] shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fbb016] text-slate-950 text-xs font-black tracking-wide">
              <BarChart2 className="w-3.5 h-3.5" />
              <span>GRAFIK & ANALISIS KEUANGAN</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Visualisasi Pola Keuangan
            </h1>
            <p className="text-xs text-sky-200/80">
              Analisis perbandingan tren pemasukan, pengeluaran, dan porsi pos belanja bulan {currentRecap.monthName}
            </p>
          </div>

          {/* Quick Filter buttons */}
          <div className="inline-flex bg-[#132f45] p-1 rounded-xl self-start sm:self-center border border-[#1e496a]">
            <button
              onClick={() => setActiveChartTab('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeChartTab === 'all'
                  ? 'bg-[#fbb016] text-slate-950 shadow-xs'
                  : 'text-sky-200 hover:text-white'
              }`}
            >
              Semua Grafik
            </button>
            <button
              onClick={() => setActiveChartTab('trend')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeChartTab === 'trend'
                  ? 'bg-[#fbb016] text-slate-950 shadow-xs'
                  : 'text-sky-200 hover:text-white'
              }`}
            >
              Tren 6 Bulan
            </button>
            <button
              onClick={() => setActiveChartTab('categories')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeChartTab === 'categories'
                  ? 'bg-[#fbb016] text-slate-950 shadow-xs'
                  : 'text-sky-200 hover:text-white'
              }`}
            >
              Kategori Belanja
            </button>
          </div>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-[#143d5c]">
          <div className="p-3 rounded-xl bg-[#132f45] border border-[#1e496a]">
            <span className="text-[11px] text-sky-300 font-semibold block">Tingkat Tabungan</span>
            <div className="text-lg font-black font-mono text-emerald-400 mt-0.5 tabular-nums">
              {currentRecap.savingsRate}%
            </div>
            <span className="text-[10px] text-sky-300/70">
              {currentRecap.netCashflow >= 0 ? 'Surplus tersimpan' : 'Defisit bulan ini'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#132f45] border border-[#1e496a]">
            <span className="text-[11px] text-sky-300 font-semibold block">Pos Belanja Terbesar</span>
            <div className="text-lg font-black text-white mt-0.5 truncate">
              {biggestCategory ? biggestCategory.category : '-'}
            </div>
            <span className="text-[10px] text-amber-300 font-mono">
              {biggestCategory ? `${formatIDR(biggestCategory.amount)} (${biggestCategory.percentage}%)` : 'Belum ada data'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#132f45] border border-[#1e496a]">
            <span className="text-[11px] text-sky-300 font-semibold block">Perubahan dari Bulan Lalu</span>
            <div
              className={`text-lg font-black font-mono mt-0.5 tabular-nums ${
                expenseDiffPercent <= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {expenseDiffPercent > 0 ? `+${expenseDiffPercent}%` : `${expenseDiffPercent}%`}
            </div>
            <span className="text-[10px] text-sky-300/70">
              {expenseDiffPercent <= 0 ? 'Pengeluaran menurun' : 'Pengeluaran meningkat'}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. GRAFIK TREN BULANAN (BAR CHART)
          ========================================================================= */}
      {(activeChartTab === 'all' || activeChartTab === 'trend') && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#024a77]" />
                <span>Tren Pemasukan vs Pengeluaran (6 Bulan Terakhir)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Arahkan kursor atau sentuh diagram untuk melihat rincian angka tiap bulan
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" />
                Uang Masuk
              </span>
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <span className="w-3 h-3 rounded-xs bg-rose-500 inline-block" />
                Uang Keluar
              </span>
            </div>
          </div>

          {/* Bar Chart Area */}
          <div className="h-64 w-full pt-4">
            <div className="h-full flex items-end justify-around gap-2 sm:gap-6 border-b border-slate-200 px-2 sm:px-6 relative">
              {historicalRecaps.map((recap, idx) => {
                const incHeight = (recap.totalIncome / maxVal) * 100;
                const expHeight = (recap.totalExpense / maxVal) * 100;
                const isHovered = hoveredIdx === idx;
                const isSelected = recap.month === currentRecap.month;

                return (
                  <div
                    key={recap.month}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    {isHovered && (
                      <div className="absolute -top-16 z-20 bg-slate-950 text-white text-[11px] rounded-xl py-1.5 px-3 shadow-xl whitespace-nowrap pointer-events-none border border-slate-800">
                        <div className="font-bold text-sky-200 border-b border-slate-800 pb-0.5 mb-0.5">
                          {recap.monthName}
                        </div>
                        <div className="text-emerald-400 font-mono">
                          Masuk: +{formatIDR(recap.totalIncome)}
                        </div>
                        <div className="text-rose-400 font-mono">
                          Keluar: -{formatIDR(recap.totalExpense)}
                        </div>
                      </div>
                    )}

                    <div className="w-full flex items-end justify-center gap-1.5 sm:gap-2.5 h-full pb-1">
                      <div
                        className="w-full max-w-[28px] bg-emerald-500 rounded-t-sm transition-all hover:opacity-85 shadow-2xs"
                        style={{ height: `${Math.max(incHeight, 4)}%` }}
                      />
                      <div
                        className="w-full max-w-[28px] bg-rose-500 rounded-t-sm transition-all hover:opacity-85 shadow-2xs"
                        style={{ height: `${Math.max(expHeight, 4)}%` }}
                      />
                    </div>

                    <div
                      className={`mt-2 text-[11px] truncate w-full text-center py-0.5 rounded ${
                        isSelected
                          ? 'font-black text-[#024a77] bg-sky-50'
                          : 'font-medium text-slate-500'
                      }`}
                    >
                      {recap.monthName.split(' ')[0]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          3. DIAGRAM KATEGORI BELANJA (DONUT CHART & BREAKDOWN)
          ========================================================================= */}
      {(activeChartTab === 'all' || activeChartTab === 'categories') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Donut Chart Card */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 flex flex-col items-center justify-between space-y-4">
            <div className="w-full text-left border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#024a77]" />
                <span>Distribusi Kategori Belanja</span>
              </h3>
              <p className="text-xs text-slate-500">
                Porsi pengeluaran bulan {currentRecap.monthName}
              </p>
            </div>

            <div className="relative w-52 h-52 my-auto">
              <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                {donutSegments.length === 0 ? (
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#F1F5F9" strokeWidth="26" />
                ) : (
                  donutSegments.map((seg, idx) => (
                    <path
                      key={seg.category}
                      d={createArc(seg.startAngle, seg.endAngle, 58, 86)}
                      fill={seg.color}
                      className="cursor-pointer hover:opacity-85 transition-opacity"
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    >
                      <title>{`${seg.category}: ${formatIDR(seg.amount)} (${seg.percentage}%)`}</title>
                    </path>
                  ))
                )}
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Total Keluar
                </span>
                <span className="text-sm font-black font-mono text-slate-900 tabular-nums">
                  {formatCompactIDR(currentRecap.totalExpense)}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  {currentRecap.expenseCount} Transaksi
                </span>
              </div>
            </div>

            {/* Sub-distribution: Dompet vs Bank */}
            <div className="w-full bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Metode Pembayaran:</span>
                <span className="text-[11px] font-mono text-slate-500">
                  Total {formatIDR(currentRecap.totalExpense)}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full"
                  style={{ width: `${Math.round((currentRecap.cashExpense / totalExpense) * 100)}%` }}
                />
                <div
                  className="bg-[#024a77] h-full"
                  style={{ width: `${Math.round(((currentRecap.bankExpense + currentRecap.ewalletExpense) / totalExpense) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Kas Tunai: {formatCompactIDR(currentRecap.cashExpense)}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#024a77]" />
                  Bank / E-Wallet: {formatCompactIDR(currentRecap.bankExpense + currentRecap.ewalletExpense)}
                </span>
              </div>
            </div>
          </div>

          {/* Category Table Breakdown */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Rincian Pos Belanja
              </h3>
              <p className="text-xs text-slate-500">
                Daftar kategori pengeluaran diurutkan dari yang paling banyak
              </p>
            </div>

            {currentRecap.expenseCategories.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">
                Belum ada pengeluaran yang dicatat di bulan ini.
              </div>
            ) : (
              <div className="space-y-3">
                {currentRecap.expenseCategories.map((cat, idx) => (
                  <div
                    key={cat.category}
                    className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-bold text-slate-800">{cat.category}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({cat.count}x transaksi)
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-slate-900 font-bold tabular-nums">
                          {formatIDR(cat.amount)}
                        </span>
                        <span className="font-mono font-bold text-slate-500 text-xs tabular-nums min-w-[32px] text-right">
                          {cat.percentage}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
