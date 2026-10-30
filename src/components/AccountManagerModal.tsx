import React, { useState } from 'react';
import { X, Plus, Wallet, Building2, Smartphone, Trash2, Edit2, AlertTriangle } from 'lucide-react';
import { Account, AccountType } from '../types/finance';
import { formatIDR } from '../utils/finance';

interface AccountManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  balances: Record<string, number>;
  onAddAccount: (account: Account) => void;
  onUpdateAccount?: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
}

export const AccountManagerModal: React.FC<AccountManagerModalProps> = ({
  isOpen,
  onClose,
  accounts,
  balances,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accToDelete, setAccToDelete] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [initialBalanceStr, setInitialBalanceStr] = useState('');
  const [color, setColor] = useState('#2563EB');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleStartEdit = (acc: Account) => {
    setEditingAccount(acc);
    setName(acc.name);
    setType(acc.type);
    setAccountNumber(acc.accountNumber || '');
    setInitialBalanceStr(acc.initialBalance.toString());
    setColor(acc.color || '#2563EB');
    setIsAdding(true);
    setError('');
  };

  const handleStartAdd = () => {
    setEditingAccount(null);
    setName('');
    setType('bank');
    setAccountNumber('');
    setInitialBalanceStr('');
    setColor('#2563EB');
    setIsAdding(true);
    setError('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama akun atau rekening wajib diisi.');
      return;
    }
    const initBal = parseFloat(initialBalanceStr || '0');

    if (editingAccount && onUpdateAccount) {
      onUpdateAccount({
        ...editingAccount,
        name: name.trim(),
        type,
        accountNumber: accountNumber.trim() || undefined,
        initialBalance: isNaN(initBal) ? 0 : initBal,
        color,
        icon: type === 'cash' ? 'Wallet' : type === 'bank' ? 'Building2' : 'Smartphone',
      });
    } else {
      onAddAccount({
        id: `acc_${Date.now()}`,
        name: name.trim(),
        type,
        accountNumber: accountNumber.trim() || undefined,
        initialBalance: isNaN(initBal) ? 0 : initBal,
        color,
        icon: type === 'cash' ? 'Wallet' : type === 'bank' ? 'Building2' : 'Smartphone',
      });
    }

    setName('');
    setAccountNumber('');
    setInitialBalanceStr('');
    setIsAdding(false);
    setEditingAccount(null);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Kelola Akun & Sumber Dana</h3>
            <p className="text-xs text-slate-500">Atur rekening bank, uang kas tunai, dan dompet digital</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {/* List of current accounts */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-600 block">Daftar Akun Aktif</span>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {accounts.map((acc) => {
                const bal = balances[acc.id] || 0;
                return (
                  <div key={acc.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: acc.color }}
                      >
                        {acc.type === 'cash' ? (
                          <Wallet className="w-4 h-4" />
                        ) : acc.type === 'bank' ? (
                          <Building2 className="w-4 h-4" />
                        ) : (
                          <Smartphone className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{acc.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {acc.type === 'cash'
                            ? 'Kas Tunai'
                            : acc.type === 'bank'
                            ? `Rekening Bank ${acc.accountNumber ? `(${acc.accountNumber})` : ''}`
                            : 'Dompet Digital'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-xs font-bold font-mono text-slate-900 tabular-nums">
                          {formatIDR(bal)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Awal: {formatIDR(acc.initialBalance)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(acc)}
                          aria-label={`Ubah ${acc.name}`}
                          title="Ubah rincian akun"
                          className="p-1.5 text-slate-500 hover:text-[#024a77] hover:bg-slate-100 transition-colors rounded-lg cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {accounts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setAccToDelete(acc)}
                            aria-label={`Hapus ${acc.name}`}
                            title="Hapus akun ini"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Account Delete Confirmation Banner */}
          {accToDelete && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2.5">
              <div className="flex items-start gap-2.5 text-rose-800">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold">Hapus akun "{accToDelete.name}"?</p>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Akun ini akan dihapus dari daftar. Transaksi yang ada tetap aman.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAccToDelete(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteAccount(accToDelete.id);
                    setAccToDelete(null);
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Hapus Akun</span>
                </button>
              </div>
            </div>
          )}

          {/* Add / Edit Account Section */}
          {!isAdding ? (
            <button
              onClick={handleStartAdd}
              className="w-full py-2.5 px-4 text-xs font-semibold text-[#024a77] bg-sky-50 hover:bg-sky-100 border border-sky-200 border-dashed rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Rekening / Dompet Baru</span>
            </button>
          ) : (
            <form onSubmit={handleSave} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-900 block">
                {editingAccount ? `Ubah Rincian: ${editingAccount.name}` : 'Form Akun / Rekening Baru'}
              </span>
              {error && <div className="text-xs text-rose-600">{error}</div>}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nama Akun / Bank
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Bank BRI, Bank Jago, Dompet Kas Cadangan"
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Tipe Sumber Dana
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AccountType)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2"
                  >
                    <option value="bank">Rekening Bank</option>
                    <option value="cash">Uang Kas (Tunai)</option>
                    <option value="ewallet">E-Wallet (Digital)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Warna Label
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
                    />
                    <span className="text-xs font-mono text-slate-600">{color}</span>
                  </div>
                </div>
              </div>

              {type === 'bank' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Nomor Rekening (Opsional)
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Contoh: 002-1928-831"
                    className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg p-2"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Saldo Awal (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={initialBalanceStr}
                  onChange={(e) => setInitialBalanceStr(e.target.value)}
                  placeholder="0"
                  className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingAccount(null);
                  }}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-[#fbb016] hover:bg-[#f59e0b] active:bg-[#d97706] rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  {editingAccount ? 'Simpan Perubahan' : 'Simpan Akun'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
