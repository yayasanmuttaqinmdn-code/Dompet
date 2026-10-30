import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatMonthName } from '../utils/finance';

interface MonthlySelectorProps {
  selectedMonth: string; // YYYY-MM
  availableMonths: string[];
  onChangeMonth: (month: string) => void;
}

export const MonthlySelector: React.FC<MonthlySelectorProps> = ({
  selectedMonth,
  availableMonths,
  onChangeMonth,
}) => {
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Navigate to previous month
  const handlePrev = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m - 2, 1);
    const prev = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    onChangeMonth(prev);
  };

  // Navigate to next month
  const handleNext = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m, 1);
    const next = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    onChangeMonth(next);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
          <Calendar className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            aria-label="Bulan Sebelumnya"
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-base font-semibold text-slate-900 min-w-[140px] text-center font-sans">
            {formatMonthName(selectedMonth)}
          </span>

          <button
            onClick={handleNext}
            aria-label="Bulan Berikutnya"
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={selectedMonth}
          onChange={(e) => onChangeMonth(e.target.value)}
          className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
        >
          {availableMonths.map((m) => (
            <option key={m} value={m}>
              {formatMonthName(m)}
            </option>
          ))}
          {!availableMonths.includes(selectedMonth) && (
            <option value={selectedMonth}>{formatMonthName(selectedMonth)}</option>
          )}
        </select>

        {selectedMonth !== currentMonth && (
          <button
            onClick={() => onChangeMonth(currentMonth)}
            className="text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            Ke Bulan Ini
          </button>
        )}
      </div>
    </div>
  );
};
