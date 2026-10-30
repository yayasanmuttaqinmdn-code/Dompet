import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Trash2, AlertTriangle } from 'lucide-react';
import { Account, Transaction, TransactionType } from '../types/finance';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  formatIDR,
} from '../utils/finance';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id'>, id?: string) => void;
  onDelete?: (id: string) => void;
  editingTransaction?: Transaction | null;
  accounts: Account[];
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingTransaction,
  accounts,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [category, setCategory] = useState<string>('Makanan & Minuman');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setShowDeleteConfirm(false);
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmountStr(editingTransaction.amount.toString());
      setAccountId(editingTransaction.accountId);
      setToAccountId(editingTransaction.toAccountId || '');
      setCategory(editingTransaction.category);
      setDescription(editingTransaction.description);
      setDate(editingTransaction.date);
      setTime(editingTransaction.time || '');
      setNotes(editingTransaction.notes || '');
    } else {
      // Default new transaction values
      const now = new Date();
      setType('expense');
      setAmountStr('');
      setAccountId(accounts[0]?.id || '');
      setToAccountId(accounts[1]?.id || accounts[0]?.id || '');
      setCategory('Makanan & Minuman');
      setDescription('');
      setDate(now.toISOString().slice(0, 10));
      const hours = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      setTime(`${hours}:${mins}`);
      setNotes('');
    }
    setErrorMessage('');
  }, [editingTransaction, isOpen, accounts]);

  // Adjust default category when type changes
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'expense') {
      setCategory(DEFAULT_EXPENSE_CATEGORIES[0].name);
    } else if (newType === 'income') {
      setCategory(DEFAULT_INCOME_CATEGORIES[0].name);
    } else if (newType === 'transfer') {
      setCategory('Transfer Antar Akun');
    }
  };

  const handleQuickAmount = (val: number) => {
    const current = parseFloat(amountStr || '0') || 0;
    setAmountStr((current + val).toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amountStr);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Masukkan jumlah nominal yang valid dan lebih dari 0.');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('Keterangan transaksi wajib diisi.');
      return;
    }

    if (!accountId) {
      setErrorMessage('Pilih akun atau dompet sumber transaksi.');
      return;
    }

    if (type === 'transfer') {
      if (!toAccountId) {
        setErrorMessage('Pilih akun tujuan untuk transfer.');
        return;
      }
      if (accountId === toAccountId) {
        setErrorMessage('Akun tujuan tidak boleh sama dengan akun sumber.');
        return;
      }
    }

    onSave(
      {
        date,
        time,
        type,
        amount: parsedAmount,
        accountId,
        toAccountId: type === 'transfer' ? toAccountId : undefined,
        category,
        description: description.trim(),
        notes: notes.trim(),
      },
      editingTransaction?.id
    );

    onClose();
  };

  if (!isOpen) return null;

  const currentAmountNum = parseFloat(amountStr) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            {editingTransaction ? 'Ubah Catatan Uang' : 'Catat Uang Keluar / Masuk'}
          </h3>
          <button
            onClick={onClose}
            aria-label="Tutup Modal"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
              {errorMessage}
            </div>
          )}

          {/* Type Selector (Tipe Transaksi) */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                type === 'expense'
                  ? 'bg-white text-rose-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-rose-500" />
              <span>Pengeluaran</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
              <span>Pemasukan</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('transfer')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                type === 'transfer'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4 text-blue-500" />
              <span>Pindah Uang</span>
            </button>
          </div>

          {/* Amount Input (Nominal Rupiah) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Berapa Jumlahnya? (Rp) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold font-mono text-slate-400">
                Rp
              </span>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="Contoh: 12500 atau angka berapapun"
                className="w-full text-lg font-bold font-mono text-slate-900 pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {currentAmountNum > 0 && (
              <div className="text-[11px] font-mono text-slate-500 mt-1">
                Terbaca: {formatIDR(currentAmountNum)}
              </div>
            )}

            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[20000, 50000, 100000, 500000, 1000000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                >
                  +{formatIDR(val).replace('Rp ', '')}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmountStr('')}
                className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-rose-600 rounded-md transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Accounts: Source & Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {type === 'transfer' ? 'Dari Mana (Keluar)?' : 'Pakai Uang Mana?'} <span className="text-rose-500">*</span>
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>


            {type === 'transfer' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ke Akun (Tujuan) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Category */}
          {type !== 'transfer' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {type === 'expense' ? (
                  <>
                    {DEFAULT_EXPENSE_CATEGORIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    {category && !DEFAULT_EXPENSE_CATEGORIES.some((c) => c.name === category) && (
                      <option value={category}>{category}</option>
                    )}
                  </>
                ) : (
                  <>
                    {DEFAULT_INCOME_CATEGORIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    {category && !DEFAULT_INCOME_CATEGORIES.some((c) => c.name === category) && (
                      <option value={category}>{category}</option>
                    )}
                  </>
                )}
              </select>
            </div>
          )}

          {/* Description (Keterangan) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Untuk Keperluan Apa? <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                type === 'expense'
                  ? 'Contoh: Makan Siang, Bensin Motor, Belanja Sayur...'
                  : type === 'income'
                  ? 'Contoh: Gaji Bulanan, Bonus Jualan, Uang Masuk...'
                  : 'Contoh: Tarik Tunai ATM BCA ke Dompet Cash'
              }
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jam (Opsional)
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Notes (Catatan Tambahan) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Kecil (Opsional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan bila ada..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* In-Modal Delete Confirmation */}
          {showDeleteConfirm && editingTransaction && onDelete && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2.5">
              <div className="flex items-start gap-2 text-rose-800">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold">Hapus catatan ini secara permanen?</p>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Saldo akun akan disesuaikan otomatis kembali.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(editingTransaction.id);
                    onClose();
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Hapus Sekarang</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <div>
              {editingTransaction && onDelete && !showDeleteConfirm && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-rose-200"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Hapus Transaksi</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-slate-950 bg-[#fbb016] hover:bg-[#f59e0b] active:bg-[#d97706] rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {editingTransaction ? 'Simpan Perubahan' : 'Simpan Catatan'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

