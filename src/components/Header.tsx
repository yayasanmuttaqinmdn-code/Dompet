import React from 'react';
import { Plus, ArrowRightLeft } from 'lucide-react';
import { formatMonthName } from '../utils/finance';

interface HeaderProps {
  activeTab: 'dashboard' | 'transactions' | 'reports';
  onSelectTab: (tab: 'dashboard' | 'transactions' | 'reports') => void;
  selectedMonth: string;
  availableMonths: string[];
  onChangeMonth: (month: string) => void;
  onOpenAddModal: () => void;
  onOpenTransferModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  selectedMonth,
  availableMonths,
  onChangeMonth,
  onOpenAddModal,
  onOpenTransferModal,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Wordmark Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-xs">
              DK
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 font-sans block leading-none">
                DompetKu
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                Keuangan Pribadi
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'dashboard'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Ringkasan
            </button>
            <button
              onClick={() => onSelectTab('transactions')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'transactions'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Buku Transaksi
            </button>
            <button
              onClick={() => onSelectTab('reports')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'reports'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Laporan & Analisis
            </button>
          </nav>

          {/* Zone 3: Actions & Month Selector */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Month Dropdown */}
            <select
              value={selectedMonth}
              onChange={(e) => onChangeMonth(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer hidden sm:block"
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

            {/* Quick Transfer Button */}
            <button
              onClick={onOpenTransferModal}
              title="Tarik Tunai / Transfer Antar Akun"
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Tarik / Transfer</span>
            </button>

            {/* Primary Action Button */}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-black rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Transaksi</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-between py-2 border-t border-slate-100 gap-1 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
                activeTab === 'dashboard' ? 'bg-slate-900 text-white' : 'text-slate-600'
              }`}
            >
              Ringkasan
            </button>
            <button
              onClick={() => onSelectTab('transactions')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
                activeTab === 'transactions' ? 'bg-slate-900 text-white' : 'text-slate-600'
              }`}
            >
              Transaksi
            </button>
            <button
              onClick={() => onSelectTab('reports')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
                activeTab === 'reports' ? 'bg-slate-900 text-white' : 'text-slate-600'
              }`}
            >
              Laporan
            </button>
          </div>

          <select
            value={selectedMonth}
            onChange={(e) => onChangeMonth(e.target.value)}
            className="text-[11px] font-medium text-slate-700 bg-slate-100 border-none rounded px-2 py-1"
          >
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {formatMonthName(m)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};
