import React, { useState } from 'react';
import { Target, AlertTriangle, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { Budget, MonthlyRecap } from '../types/finance';
import { DEFAULT_EXPENSE_CATEGORIES, formatIDR } from '../utils/finance';

interface BudgetManagerProps {
  budgets: Budget[];
  currentRecap: MonthlyRecap;
  selectedMonth: string;
  onSaveBudget: (budget: Budget) => void;
  onDeleteBudget: (id: string) => void;
}

export const BudgetManager: React.FC<BudgetManagerProps> = ({
  budgets,
  currentRecap,
  selectedMonth,
  onSaveBudget,
  onDeleteBudget,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [category, setCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0].name);
  const [limitStr, setLimitStr] = useState('');

  // Filter budgets for the current month or fallback
  const monthBudgets = budgets.filter((b) => b.month === selectedMonth);

  // Map category to spent amount from recap
  const categorySpentMap: Record<string, number> = {};
  for (const cat of currentRecap.expenseCategories) {
    categorySpentMap[cat.category] = cat.amount;
  }

  // Calculate totals
  const totalBudgeted = monthBudgets.reduce((acc, b) => acc + b.monthlyLimit, 0);
  const totalSpentInBudgetedCategories = monthBudgets.reduce(
    (acc, b) => acc + (categorySpentMap[b.category] || 0),
    0
  );

  const handleAddBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(limitStr);
    if (isNaN(limit) || limit <= 0) return;

    onSaveBudget({
      id: `budget_${Date.now()}`,
      category,
      monthlyLimit: limit,
      month: selectedMonth,
    });

    setIsAdding(false);
    setLimitStr('');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-sans">
            Target & Anggaran Bulanan
          </h2>
          <p className="text-xs text-slate-500">
            Kendalikan pengeluaran agar tidak melebihi batas batas rencana keuangan Anda
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-[#fbb016] hover:bg-[#f59e0b] active:bg-[#d97706] rounded-xl shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Atur Anggaran Kategori</span>
        </button>
      </div>

      {/* Overview Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div>
          <span className="text-xs text-slate-500 block">Total Rencana Anggaran</span>
          <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
            {formatIDR(totalBudgeted)}
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-500 block">Realisasi Pengeluaran</span>
          <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
            {formatIDR(totalSpentInBudgetedCategories)}
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-500 block">Sisa Kuota Anggaran</span>
          <span
            className={`text-lg font-bold font-mono tabular-nums ${
              totalBudgeted - totalSpentInBudgetedCategories >= 0
                ? 'text-emerald-600'
                : 'text-rose-600'
            }`}
          >
            {formatIDR(totalBudgeted - totalSpentInBudgetedCategories)}
          </span>
        </div>
      </div>

      {/* Add Form */}
      {isAdding && (
        <form onSubmit={handleAddBudget} className="p-4 bg-sky-50/50 border border-sky-200 rounded-xl space-y-3">
          <span className="text-xs font-bold text-[#024a77] block">
            Tambah Batas Anggaran Kategori ({currentRecap.monthName})
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
              >
                {DEFAULT_EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Batas Pengeluaran Maksimal (Rp)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={limitStr}
                onChange={(e) => setLimitStr(e.target.value)}
                placeholder="Contoh: 1500000"
                className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#024a77] hover:bg-[#035b91] rounded-lg cursor-pointer"
            >
              Simpan Anggaran
            </button>
          </div>
        </form>
      )}

      {/* Budget List */}
      <div className="space-y-4">
        {monthBudgets.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Belum ada batas anggaran untuk bulan ini. Klik &quot;Atur Anggaran Kategori&quot; untuk memulai.
          </div>
        ) : (
          monthBudgets.map((budget) => {
            const spent = categorySpentMap[budget.category] || 0;
            const percentage = Math.round((spent / budget.monthlyLimit) * 100);
            const isExceeded = spent > budget.monthlyLimit;
            const isWarning = percentage >= 80 && !isExceeded;

            return (
              <div
                key={budget.id}
                className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors bg-white shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{budget.category}</span>
                    {isExceeded ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                        <AlertTriangle className="w-3 h-3" /> Melebihi Batas
                      </span>
                    ) : isWarning ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        <AlertTriangle className="w-3 h-3" /> Waspada ({percentage}%)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        <CheckCircle className="w-3 h-3" /> Aman
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono tabular-nums text-slate-600">
                      Terpakai <span className="font-bold text-slate-900">{formatIDR(spent)}</span> /{' '}
                      {formatIDR(budget.monthlyLimit)}
                    </span>
                    <button
                      onClick={() => onDeleteBudget(budget.id)}
                      aria-label="Hapus Anggaran"
                      className="text-slate-400 hover:text-rose-600 p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isExceeded
                        ? 'bg-rose-500'
                        : isWarning
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
