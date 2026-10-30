import React, { useState } from 'react';
import {
  Search,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Trash2,
  Edit2,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import { Account, Transaction } from '../types/finance';
import { formatIDR, exportTransactionsToCSV } from '../utils/finance';

interface TransactionListProps {
  transactions: Transaction[];
  accounts: Account[];
  selectedMonth: string;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenAddModal: () => void;
  isCompactView?: boolean;
  isSheetsConnected?: boolean;
  onOpenGoogleSheets?: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  accounts,
  selectedMonth,
  onEditTransaction,
  onDeleteTransaction,
  onOpenAddModal,
  isCompactView = false,
  isSheetsConnected = false,
  onOpenGoogleSheets,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [filterAccountType, setFilterAccountType] = useState<'all' | 'cash' | 'bank' | 'ewallet'>('all');
  const [filterMonthScope, setFilterMonthScope] = useState<'month' | 'all'>('month');
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  const accountMap = new Map<string, Account>();
  for (const acc of accounts) {
    accountMap.set(acc.id, acc);
  }

  const filtered = transactions.filter((tx) => {
    if (filterMonthScope === 'month' && !tx.date.startsWith(selectedMonth)) {
      return false;
    }
    if (filterType !== 'all' && tx.type !== filterType) {
      return false;
    }
    if (filterAccountType !== 'all') {
      const srcAcc = accountMap.get(tx.accountId);
      const toAcc = tx.toAccountId ? accountMap.get(tx.toAccountId) : undefined;
      const matchSrc = srcAcc?.type === filterAccountType;
      const matchTo = toAcc?.type === filterAccountType;
      if (!matchSrc && !matchTo) return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchDesc = tx.description.toLowerCase().includes(q);
      const matchCat = tx.category.toLowerCase().includes(q);
      const matchNotes = (tx.notes || '').toLowerCase().includes(q);
      if (!matchDesc && !matchCat && !matchNotes) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const d = b.date.localeCompare(a.date);
    if (d !== 0) return d;
    return (b.time || '').localeCompare(a.time || '');
  });

  const displayedList = isCompactView ? sorted.slice(0, 7) : sorted;

  const handleExportCSV = () => {
    const csv = exportTransactionsToCSV(sorted, accounts);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaksi_${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Control bar */}
      <div className="p-4 border-b border-slate-100 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi apa saja..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {!isCompactView && isSheetsConnected && onOpenGoogleSheets && (
              <button
                onClick={onOpenGoogleSheets}
                title="Tarik data atau sinkronkan dengan Google Sheets"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#024a77] bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#024a77]" />
                <span>Sinkron Sheets</span>
              </button>
            )}
            {!isCompactView && (
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Simpan ke Excel (CSV)</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
          {/* Account Source filter */}
          <div className="inline-flex bg-slate-100 p-0.5 rounded-lg">
            <button
              onClick={() => setFilterAccountType('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filterAccountType === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Uang
            </button>
            <button
              onClick={() => setFilterAccountType('cash')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filterAccountType === 'cash'
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dompet Cash
            </button>
            <button
              onClick={() => setFilterAccountType('bank')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filterAccountType === 'bank'
                  ? 'bg-white text-blue-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Uang di Bank
            </button>
          </div>

          {/* Type filter */}
          <div className="inline-flex bg-slate-100 p-0.5 rounded-lg">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filterType === 'expense'
                  ? 'bg-white text-rose-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Keluar
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filterType === 'income'
                  ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => setFilterType('transfer')}
              className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filterType === 'transfer'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pindah Uang
            </button>
          </div>

          {!isCompactView && (
            <div className="inline-flex bg-slate-100 p-0.5 rounded-lg ml-auto">
              <button
                onClick={() => setFilterMonthScope('month')}
                className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  filterMonthScope === 'month'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bulan Ini
              </button>
              <button
                onClick={() => setFilterMonthScope('all')}
                className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  filterMonthScope === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Bulan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content: Empty state or List */}
      {displayedList.length === 0 ? (
        <div className="py-10 text-center">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-600 font-medium">Belum ada catatan yang sesuai.</p>
          <button
            onClick={onOpenAddModal}
            className="mt-3 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-[#fbb016] hover:bg-[#f59e0b] rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            + Catat Sekarang
          </button>
        </div>
      ) : (
        <>
          {/* 1. MOBILE VIEW (Card-based, mudah dijangkau jempol di layar HP) */}
          <div className="block md:hidden divide-y divide-slate-100">
            {displayedList.map((tx) => {
              const srcAcc = accountMap.get(tx.accountId);
              const toAcc = tx.toAccountId ? accountMap.get(tx.toAccountId) : undefined;

              return (
                <div
                  key={tx.id}
                  className="p-3.5 space-y-2.5 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          tx.type === 'income'
                            ? 'bg-emerald-50 text-emerald-600'
                            : tx.type === 'expense'
                            ? 'bg-rose-50 text-rose-600'
                            : 'bg-blue-50 text-blue-600'
                        }`}
                      >
                        {tx.type === 'income' ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : tx.type === 'expense' ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowRightLeft className="w-4 h-4" />
                        )}
                      </span>
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">
                          {tx.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {tx.date} {tx.time ? `· ${tx.time}` : ''}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-bold font-mono tabular-nums ${
                        tx.type === 'income'
                          ? 'text-emerald-600'
                          : tx.type === 'expense'
                          ? 'text-rose-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                      {formatIDR(tx.amount)}
                    </span>
                  </div>

                  <div className="text-xs font-medium text-slate-800">
                    {tx.description}
                  </div>
                  {tx.notes && (
                    <div className="text-[11px] text-slate-400 italic">
                      {tx.notes}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-100/80">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {srcAcc?.name || 'Kas'}
                      {tx.type === 'transfer' && toAcc && ` → ${toAcc.name}`}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#024a77] bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[#024a77]" />
                        <span>Ubah</span>
                      </button>
                      <button
                        onClick={() => setTxToDelete(tx)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. DESKTOP VIEW (Tabel Rapi & Lengkap untuk Laptop) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Tanggal</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3">Untuk Apa?</th>
                  <th className="py-2.5 px-3">Pakai Uang</th>
                  <th className="py-2.5 px-4 text-right">Jumlah</th>
                  <th className="py-2.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedList.map((tx) => {
                  const srcAcc = accountMap.get(tx.accountId);
                  const toAcc = tx.toAccountId ? accountMap.get(tx.toAccountId) : undefined;

                  return (
                    <tr
                      key={tx.id}
                      onClick={() => onEditTransaction(tx)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      title="Klik untuk melihat / mengubah rincian transaksi ini"
                    >
                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        {tx.date}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                              tx.type === 'income'
                                ? 'bg-emerald-50 text-emerald-600'
                                : tx.type === 'expense'
                                ? 'bg-rose-50 text-rose-600'
                                : 'bg-blue-50 text-blue-600'
                            }`}
                          >
                            {tx.type === 'income' ? (
                              <ArrowDownLeft className="w-3 h-3" />
                            ) : tx.type === 'expense' ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : (
                              <ArrowRightLeft className="w-3 h-3" />
                            )}
                          </span>
                          <span className="font-semibold text-slate-800">{tx.category}</span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-medium text-slate-800 truncate" title={tx.description}>
                          {tx.description}
                        </div>
                        {tx.notes && (
                          <div className="text-[10px] text-slate-400 truncate" title={tx.notes}>
                            {tx.notes}
                          </div>
                        )}
                      </td>

                      {/* Source Account */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="text-slate-600 text-[11px] font-medium">
                          {srcAcc?.name || 'Kas'}
                          {tx.type === 'transfer' && toAcc && ` → ${toAcc.name}`}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 whitespace-nowrap text-right font-mono font-bold tabular-nums">
                        <span
                          className={
                            tx.type === 'income'
                              ? 'text-emerald-600'
                              : tx.type === 'expense'
                              ? 'text-rose-600'
                              : 'text-blue-600'
                          }
                        >
                          {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                          {formatIDR(tx.amount)}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onEditTransaction(tx)}
                            aria-label={`Ubah ${tx.description}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                            title="Ubah rincian transaksi"
                          >
                            <Edit2 className="w-3 h-3 text-slate-500" />
                            <span>Ubah</span>
                          </button>
                          <button
                            onClick={() => setTxToDelete(tx)}
                            aria-label={`Hapus ${tx.description}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                            title="Hapus transaksi ini"
                          >
                            <Trash2 className="w-3 h-3 text-rose-500" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Footer count */}
      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-400">
        <span>Menampilkan {displayedList.length} dari {sorted.length} catatan</span>
        <span>Rupiah (IDR)</span>
      </div>

      {/* =========================================================================
          CUSTOM DELETE CONFIRMATION MODAL (Tanpa window.confirm yang sering terblokir)
          ========================================================================= */}
      {txToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl overflow-hidden p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Hapus Catatan Transaksi?</h4>
                <p className="text-xs text-slate-500">Saldo dompet dan rekening akan disesuaikan kembali.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
              <div className="font-bold text-slate-900">{txToDelete.description}</div>
              <div className="flex items-center justify-between text-slate-500 font-mono text-[11px]">
                <span>{txToDelete.date} {txToDelete.time ? `(${txToDelete.time})` : ''}</span>
                <span
                  className={`font-bold ${
                    txToDelete.type === 'income'
                      ? 'text-emerald-600'
                      : txToDelete.type === 'expense'
                      ? 'text-rose-600'
                      : 'text-blue-600'
                  }`}
                >
                  {txToDelete.type === 'income' ? '+' : txToDelete.type === 'expense' ? '-' : ''}
                  {formatIDR(txToDelete.amount)}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Kategori: <span className="font-medium text-slate-700">{txToDelete.category}</span>
              </div>
            </div>

            {isSheetsConnected && (
              <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Baris pada Google Sheets juga otomatis akan terhapus.</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setTxToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTransaction(txToDelete.id);
                  setTxToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
