import React, { useState } from 'react';
import { MonthlyRecap } from '../types/finance';
import { formatIDR, formatCompactIDR } from '../utils/finance';
import { BarChart2, PieChart } from 'lucide-react';

interface ChartsViewProps {
  currentRecap: MonthlyRecap;
  historicalRecaps: MonthlyRecap[];
}

export const ChartsView: React.FC<ChartsViewProps> = ({
  currentRecap,
  historicalRecaps,
}) => {
  const [activeTab, setActiveTab] = useState<'trend' | 'categories'>('trend');
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5">
      {/* Header with 2 sleek tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Grafik Keuangan Anda
          </h3>
          <p className="text-[11px] text-slate-500">
            {activeTab === 'trend'
              ? 'Perbandingan uang masuk & uang keluar 6 bulan terakhir'
              : `Pengeluaran bulan ${currentRecap.monthName} paling banyak ke mana?`}
          </p>
        </div>

        <div className="inline-flex bg-slate-100 p-0.5 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('trend')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'trend'
                ? 'bg-[#024a77] text-white shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Tren Bulanan</span>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-[#024a77] text-white shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Kategori Belanja</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: TREN BULANAN */}
      {activeTab === 'trend' && (
        <div className="pt-4 space-y-4">
          <div className="flex items-center justify-end gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
              Uang Masuk
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" />
              Uang Keluar
            </span>
          </div>

          <div className="h-56 w-full">
            <div className="h-full flex items-end justify-around gap-2 sm:gap-6 border-b border-slate-100 px-2 sm:px-6 relative">
              {historicalRecaps.map((recap, idx) => {
                const incHeight = (recap.totalIncome / maxVal) * 100;
                const expHeight = (recap.totalExpense / maxVal) * 100;
                const isHovered = hoveredIdx === idx;

                return (
                  <div
                    key={recap.month}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    {isHovered && (
                      <div className="absolute -top-16 z-20 bg-slate-900 text-white text-[11px] rounded-lg py-1 px-2.5 shadow-md whitespace-nowrap pointer-events-none">
                        <div className="text-emerald-300 font-mono">
                          Masuk: +{formatIDR(recap.totalIncome)}
                        </div>
                        <div className="text-rose-300 font-mono">
                          Keluar: -{formatIDR(recap.totalExpense)}
                        </div>
                      </div>
                    )}

                    <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-full pb-1">
                      <div
                        className="w-full max-w-[24px] bg-emerald-500 rounded-t-xs transition-all hover:opacity-85"
                        style={{ height: `${Math.max(incHeight, 4)}%` }}
                      />
                      <div
                        className="w-full max-w-[24px] bg-rose-500 rounded-t-xs transition-all hover:opacity-85"
                        style={{ height: `${Math.max(expHeight, 4)}%` }}
                      />
                    </div>

                    <span className="mt-2 text-[11px] font-medium text-slate-500 truncate w-full text-center">
                      {recap.monthName.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: KATEGORI BELANJA */}
      {activeTab === 'categories' && (
        <div className="pt-4 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-44 h-44">
              <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                {donutSegments.length === 0 ? (
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#F1F5F9" strokeWidth="24" />
                ) : (
                  donutSegments.map((seg, idx) => (
                    <path
                      key={seg.category}
                      d={createArc(seg.startAngle, seg.endAngle, 60, 84)}
                      fill={seg.color}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    >
                      <title>{`${seg.category}: ${formatIDR(seg.amount)} (${seg.percentage}%)`}</title>
                    </path>
                  ))
                )}
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[10px] text-slate-400 font-medium">Total Keluar</span>
                <span className="text-xs font-bold font-mono text-slate-800 tabular-nums">
                  {formatCompactIDR(currentRecap.totalExpense)}
                </span>
              </div>
            </div>
          </div>

          <div className="md:col-span-7 space-y-2.5">
            {currentRecap.expenseCategories.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                Belum ada pengeluaran yang dicatat di bulan ini.
              </div>
            ) : (
              currentRecap.expenseCategories.slice(0, 5).map((cat, idx) => (
                <div
                  key={cat.category}
                  className={`p-2 rounded-lg transition-colors ${
                    hoveredIdx === idx ? 'bg-slate-50' : ''
                  }`}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-semibold text-slate-800 truncate">{cat.category}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-slate-900 font-bold tabular-nums">
                        {formatIDR(cat.amount)}
                      </span>
                      <span className="font-mono text-slate-400 text-[11px] tabular-nums min-w-[28px] text-right">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
