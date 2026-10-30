import React, { useState } from 'react';
import { X, ArrowRightLeft } from 'lucide-react';
import { Account, Transaction } from '../types/finance';
import { formatIDR } from '../utils/finance';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id'>) => void;
  accounts: Account[];
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  onSave,
  accounts,
}) => {
  const [amountStr, setAmountStr] = useState<string>('');
  const [fromAccountId, setFromAccountId] = useState<string>(
    accounts.find((a) => a.type === 'bank')?.id || accounts[0]?.id || ''
  );
  const [toAccountId, setToAccountId] = useState<string>(
    accounts.find((a) => a.type === 'cash')?.id || accounts[1]?.id || ''
  );
  const [description, setDescription] = useState<string>('Tarik Tunai ATM untuk Uang Kas');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  // Preset transfer types
  const setQuickTransfer = (type: 'atm_withdraw' | 'cash_deposit') => {
    const bankAcc = accounts.find((a) => a.type === 'bank');
    const cashAcc = accounts.find((a) => a.type === 'cash');

    if (type === 'atm_withdraw' && bankAcc && cashAcc) {
      setFromAccountId(bankAcc.id);
      setToAccountId(cashAcc.id);
      setDescription(`Tarik Tunai dari ${bankAcc.name} ke ${cashAcc.name}`);
    } else if (type === 'cash_deposit' && cashAcc && bankAcc) {
      setFromAccountId(cashAcc.id);
      setToAccountId(bankAcc.id);
      setDescription(`Setor Tunai dari ${cashAcc.name} ke ${bankAcc.name}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      setError('Masukkan nominal transfer yang valid.');
      return;
    }
    if (fromAccountId === toAccountId) {
      setError('Akun asal dan akun tujuan tidak boleh sama.');
      return;
    }

    onSave({
      date,
      time: new Date().toTimeString().slice(0, 5),
      type: 'transfer',
      amount,
      accountId: fromAccountId,
      toAccountId,
      category: 'Transfer Antar Akun',
      description: description.trim() || 'Pindah Saldo',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Tarik Tunai / Pindah Dana</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
              {error}
            </div>
          )}

          {/* Quick presets */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1.5">
              Pilihan Cepat
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setQuickTransfer('atm_withdraw')}
                className="p-2.5 border border-slate-200 hover:border-emerald-500 rounded-xl text-center hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-800">Tarik Tunai</div>
                <div className="text-[10px] text-slate-500">Rekening → Dompet Tunai</div>
              </button>
              <button
                type="button"
                onClick={() => setQuickTransfer('cash_deposit')}
                className="p-2.5 border border-slate-200 hover:border-emerald-500 rounded-xl text-center hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-800">Setor Tunai</div>
                <div className="text-[10px] text-slate-500">Dompet Tunai → Rekening</div>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Berapa Yang Dipindah? (Rp) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="any"
              required
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="Contoh: 15750 atau angka berapapun"
              className="w-full text-base font-bold font-mono text-slate-900 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {amountStr && parseFloat(amountStr) > 0 && (
              <span className="text-[11px] font-mono text-slate-500 mt-1 block">
                {formatIDR(parseFloat(amountStr))}
              </span>
            )}
          </div>

          {/* From Account & To Account */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dari Mana (Keluar)?
              </label>
              <select
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Masuk Ke Mana?
              </label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Singkat
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tanggal
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-[#fbb016] hover:bg-[#f59e0b] active:bg-[#d97706] rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Pindahkan Sekarang
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
