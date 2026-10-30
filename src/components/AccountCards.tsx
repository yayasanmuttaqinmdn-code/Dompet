import React from 'react';
import { Wallet, Building2, Smartphone, ArrowRightLeft, CreditCard, Plus } from 'lucide-react';
import { Account } from '../types/finance';
import { formatIDR } from '../utils/finance';

interface AccountCardsProps {
  accounts: Account[];
  balances: Record<string, number>;
  onOpenTransfer: () => void;
  onOpenManageAccounts: () => void;
}

export const AccountCards: React.FC<AccountCardsProps> = ({
  accounts,
  balances,
  onOpenTransfer,
  onOpenManageAccounts,
}) => {
  // Compute totals
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

  return (
    <div className="space-y-4">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-sans">
            Dompet & Sumber Rekening
          </h2>
          <p className="text-xs text-slate-500">
            Pantau saldo uang tunai (kas), rekening perbankan, dan dompet digital Anda
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTransfer}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>Tarik Tunai / Transfer</span>
          </button>
          <button
            onClick={onOpenManageAccounts}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Kelola Akun</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Saldo (Grand Total) */}
        <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 shadow-xs relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-xs font-medium text-slate-400">Total Kekayaan Likuid</span>
            <div className="text-2xl font-bold font-mono tracking-tight mt-1 tabular-nums">
              {formatIDR(grandTotal)}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
              <span>{accounts.length} Akun Terdaftar</span>
              <span className="text-emerald-400 font-medium">Aktif</span>
            </div>
          </div>
        </div>

        {/* Uang Kas (Tunai) */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Uang Kas (Tunai)</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 tracking-tight mt-1 tabular-nums">
            {formatIDR(totalCash)}
          </div>
          <div className="mt-3 text-xs text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span>Uang fisik di dompet & brankas</span>
            <span className="font-mono tabular-nums">
              {grandTotal > 0 ? Math.round((totalCash / grandTotal) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Rekening Bank */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Rekening Bank</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 tracking-tight mt-1 tabular-nums">
            {formatIDR(totalBank)}
          </div>
          <div className="mt-3 text-xs text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span>Saldo tabungan bank</span>
            <span className="font-mono tabular-nums">
              {grandTotal > 0 ? Math.round((totalBank / grandTotal) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* E-Wallet */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-cyan-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">E-Wallet & Dompet Digital</span>
            <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 tracking-tight mt-1 tabular-nums">
            {formatIDR(totalEwallet)}
          </div>
          <div className="mt-3 text-xs text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span>GoPay, OVO, ShopeePay</span>
            <span className="font-mono tabular-nums">
              {grandTotal > 0 ? Math.round((totalEwallet / grandTotal) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Detailed List of Individual Accounts */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Rincian Setiap Akun
          </span>
          <span className="text-xs text-slate-500">Terupdate otomatis</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          {accounts.map((acc) => {
            const bal = balances[acc.id] || 0;
            return (
              <div key={acc.id} className="p-3.5 hover:bg-slate-50/70 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: acc.color }}
                  />
                  <span className="text-xs font-semibold text-slate-800 truncate" title={acc.name}>
                    {acc.name}
                  </span>
                </div>
                <div className="text-sm font-bold font-mono text-slate-900 tabular-nums">
                  {formatIDR(bal)}
                </div>
                {acc.accountNumber && (
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">
                    No: {acc.accountNumber}
                  </div>
                )}
                {!acc.accountNumber && (
                  <div className="text-[11px] text-slate-400 mt-0.5 capitalize">
                    Tipe: {acc.type === 'cash' ? 'Uang Tunai' : acc.type === 'bank' ? 'Rekening Bank' : 'Dompet Digital'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
