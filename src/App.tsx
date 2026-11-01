import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Account, Budget, Transaction } from './types/finance';
import {
  calculateAccountBalances,
  calculateMonthlyRecap,
  getAvailableMonths,
} from './utils/finance';
import {
  getStoredAccounts,
  saveStoredAccounts,
  getStoredTransactions,
  saveStoredTransactions,
  getStoredBudgets,
  saveStoredBudgets,
  zeroOutAllData,
  SAMPLE_ACCOUNTS,
  SAMPLE_TRANSACTIONS,
  SAMPLE_BUDGETS,
} from './utils/storage';
import { Navigation, NavTab, ViewMode } from './components/Navigation';
import { MoneySummaryView } from './components/MoneySummaryView';
import { FinancialAnalyticsView } from './components/FinancialAnalyticsView';
import { TransactionList } from './components/TransactionList';
import { BudgetManager } from './components/BudgetManager';
import { TransactionModal } from './components/TransactionModal';
import { TransferModal } from './components/TransferModal';
import { AccountManagerModal } from './components/AccountManagerModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import {
  getSavedSheetsUrl,
  setLocalSheetsUrlOnly,
  isAutoSyncEnabled,
  removeTransactionFromSheets,
  syncAllToGoogleSheets,
  fetchDataFromGoogleSheets,
  hasPendingPush,
  setPendingPush,
  getLastSyncedTxCount,
  setLastSyncedTxCount,
  fetchCentralServerState,
  saveCentralServerState,
} from './utils/googleSheetsSync';
import { RotateCcw, ShieldCheck, Menu, Wifi, CheckCircle2, FileSpreadsheet, Laptop, Smartphone, RefreshCw } from 'lucide-react';

export default function App() {
  const [accounts, setAccounts] = useState<Account[]>(() => getStoredAccounts());
  const [transactions, setTransactions] = useState<Transaction[]>(() => getStoredTransactions());
  const [budgets, setBudgets] = useState<Budget[]>(() => getStoredBudgets());

  // 3 distinct views: summary (simpel), charts (grafik visual), transactions (daftar transaksi)
  const [activeTab, setActiveTab] = useState<NavTab>('summary');

  const defaultMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }, []);
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isManageAccountsOpen, setIsManageAccountsOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);
  const [isSheetsConnected, setIsSheetsConnected] = useState<boolean>(() => !!getSavedSheetsUrl());
  const [isAutoSyncingBg, setIsAutoSyncingBg] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Track timestamp of last local change & latest state refs so background polling never overwrites local edits
  const lastLocalChangeRef = useRef<number>(0);
  const lastServerUpdatedAtRef = useRef<number>(0);
  const hasAutoSelectedMonthRef = useRef<boolean>(false);
  const isModalOpenRef = useRef<boolean>(isGoogleSheetsModalOpen);
  const transactionsRef = useRef<Transaction[]>(transactions);
  const accountsRef = useRef<Account[]>(accounts);
  const budgetsRef = useRef<Budget[]>(budgets);

  useEffect(() => {
    isModalOpenRef.current = isGoogleSheetsModalOpen;
  }, [isGoogleSheetsModalOpen]);

  useEffect(() => {
    transactionsRef.current = transactions;
    // Jika bulan saat ini (mis. 2026-11) belum ada transaksi tetapi ada transaksi di bulan sebelumnya (mis. 2026-10),
    // otomatis tampilkan bulan terakhir yang memiliki transaksi saat pertama kali dimuat
    if (!hasAutoSelectedMonthRef.current && transactions.length > 0) {
      hasAutoSelectedMonthRef.current = true;
      const hasCurrentMonth = transactions.some((t) => t.date.startsWith(selectedMonth));
      if (!hasCurrentMonth) {
        const sortedMonths = Array.from(new Set(transactions.map((t) => t.date.slice(0, 7)))).sort().reverse();
        if (sortedMonths.length > 0) {
          setSelectedMonth(sortedMonths[0]);
        }
      }
    }
  }, [transactions, selectedMonth]);

  useEffect(() => {
    accountsRef.current = accounts;
  }, [accounts]);

  useEffect(() => {
    budgetsRef.current = budgets;
  }, [budgets]);

  // Sidebar collapsible state for desktop (persisted in localStorage)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('dompetku_sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('dompetku_sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // Mode tampilan: 'auto' (otomatis sesuai ukuran layar), 'laptop' (tampilan laptop), 'mobile' (tampilan HP)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('dompetku_view_mode');
    return (saved === 'laptop' || saved === 'mobile' || saved === 'auto') ? (saved as ViewMode) : 'auto';
  });

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('dompetku_view_mode', mode);
  };

  useEffect(() => {
    setIsSheetsConnected(!!getSavedSheetsUrl());
  }, [isGoogleSheetsModalOpen]);

  // Sync with LocalStorage
  useEffect(() => {
    saveStoredAccounts(accounts);
  }, [accounts]);

  useEffect(() => {
    saveStoredTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveStoredBudgets(budgets);
  }, [budgets]);

  // Helper untuk kirim seluruh state ke Server Pusat (/api/state) & Google Sheets di latar belakang
  const pushFullStateToSheets = useCallback(
    async (nextTx: Transaction[], nextAcc: Account[], nextBg: Budget[]) => {
      lastLocalChangeRef.current = Date.now();
      const sheetsUrl = getSavedSheetsUrl();
      setIsAutoSyncingBg(true);
      try {
        // 1. Selalu simpan ke Server Pusat (/api/state) agar semua perangkat langsung memiliki data yang sama
        const savedServer = await saveCentralServerState({
          sheetsUrl: sheetsUrl || undefined,
          transactions: nextTx,
          accounts: nextAcc,
          budgets: nextBg,
          forceEmpty: nextTx.length === 0,
        });
        if (savedServer && savedServer.updatedAt) {
          lastServerUpdatedAtRef.current = savedServer.updatedAt;
        }

        // 2. Jika terhubung ke Google Sheets, sinkronkan penuh ke Google Sheets
        if (sheetsUrl && isAutoSyncEnabled()) {
          setPendingPush(true);
          await syncAllToGoogleSheets(sheetsUrl, {
            transactions: nextTx,
            accounts: nextAcc,
            budgets: nextBg,
          });
        }
      } finally {
        setIsAutoSyncingBg(false);
      }
    },
    []
  );

  // Sinkronisasi data saat ditarik dari Server Pusat / Google Sheets (Pull manual maupun otomatis)
  const handleUpdateFromSheets = useCallback(
    (newTransactions: Transaction[], newAccounts?: Account[], newBudgets?: Budget[]) => {
      setLastSyncedTxCount(newTransactions.length);
      setTransactions((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(newTransactions)) return prev;
        saveStoredTransactions(newTransactions);
        return newTransactions;
      });
      if (newAccounts && newAccounts.length > 0) {
        setAccounts((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(newAccounts)) return prev;
          saveStoredAccounts(newAccounts);
          return newAccounts;
        });
      }
      if (newBudgets) {
        setBudgets((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(newBudgets)) return prev;
          saveStoredBudgets(newBudgets);
          return newBudgets;
        });
      }
    },
    []
  );

  // Sinkronisasi Dua Arah Otomatis Antar Perangkat (Server Pusat /api/state + Google Sheets)
  const pullFromSheetsQuietly = useCallback(async () => {
    // Jangan jalankan saat pengguna sedang membuka modal pengaturan Google Sheets atau baru saja mengubah data
    if (isModalOpenRef.current) return;
    if (Date.now() - lastLocalChangeRef.current < 5000) return;

    setIsAutoSyncingBg(true);
    try {
      // TAHAP 1: Cek Server Pusat (/api/state) agar semua perangkat (HP/Laptop) otomatis menggunakan 1 Spreadsheet Utama & data yang sama
      const serverState = await fetchCentralServerState();
      let activeSheetsUrl = getSavedSheetsUrl();

      if (serverState) {
        // Pastikan URL Spreadsheet Utama dari Server Pusat selalu disamakan ke perangkat ini tanpa memicu timpa balik
        if (serverState.sheetsUrl && serverState.sheetsUrl !== activeSheetsUrl) {
          setLocalSheetsUrlOnly(serverState.sheetsUrl);
          activeSheetsUrl = serverState.sheetsUrl;
          setIsSheetsConnected(true);
        } else if (activeSheetsUrl) {
          setIsSheetsConnected(true);
        }

        const serverTxs = serverState.transactions || [];
        const localTxs = transactionsRef.current;

        // Jika Server Pusat belum punya transaksi tetapi perangkat ini punya transaksi, unggah ke Server Pusat & Google Sheets!
        if (serverState.updatedAt === 0 && localTxs.length > 0) {
          const uploaded = await saveCentralServerState({
            sheetsUrl: activeSheetsUrl || undefined,
            transactions: localTxs,
            accounts: accountsRef.current,
            budgets: budgetsRef.current,
          });
          if (uploaded?.updatedAt) {
            lastServerUpdatedAtRef.current = uploaded.updatedAt;
          }
          if (activeSheetsUrl && isAutoSyncEnabled()) {
            await syncAllToGoogleSheets(activeSheetsUrl, {
              transactions: localTxs,
              accounts: accountsRef.current,
              budgets: budgetsRef.current,
            });
          }
        } else if (
          serverState.updatedAt > 0 &&
          serverState.updatedAt > lastServerUpdatedAtRef.current &&
          Date.now() - lastLocalChangeRef.current >= 5000
        ) {
          lastServerUpdatedAtRef.current = serverState.updatedAt;
          handleUpdateFromSheets(serverTxs, serverState.accounts, serverState.budgets);
        }
      }

      // TAHAP 2: Sinkronisasi dengan Google Sheets
      if (!activeSheetsUrl || !isAutoSyncEnabled()) return;

      if (hasPendingPush()) {
        await syncAllToGoogleSheets(activeSheetsUrl, {
          transactions: transactionsRef.current,
          accounts: accountsRef.current,
          budgets: budgetsRef.current,
        });
        setIsSheetsConnected(true);
        return;
      }

      const res = await fetchDataFromGoogleSheets(activeSheetsUrl);
      if (res.success && Date.now() - lastLocalChangeRef.current >= 5000) {
        const sheetTxs = res.transactions || [];
        const localTxs = transactionsRef.current;

        if (sheetTxs.length === 0 && localTxs.length > 0 && getLastSyncedTxCount() === 0) {
          await syncAllToGoogleSheets(activeSheetsUrl, {
            transactions: localTxs,
            accounts: accountsRef.current,
            budgets: budgetsRef.current,
          });
        } else if (sheetTxs.length > 0 || localTxs.length === 0) {
          const changed = JSON.stringify(localTxs) !== JSON.stringify(sheetTxs);
          handleUpdateFromSheets(sheetTxs, res.accounts, res.budgets);
          if (changed && sheetTxs.length > 0) {
            const saved = await saveCentralServerState({
              sheetsUrl: activeSheetsUrl,
              transactions: sheetTxs,
              accounts: res.accounts || accountsRef.current,
              budgets: res.budgets || budgetsRef.current,
            });
            if (saved?.updatedAt) {
              lastServerUpdatedAtRef.current = saved.updatedAt;
            }
          }
        }
        setIsSheetsConnected(true);
      } else if (!res.success && transactionsRef.current.length > 0 && getLastSyncedTxCount() !== transactionsRef.current.length) {
        await syncAllToGoogleSheets(activeSheetsUrl, {
          transactions: transactionsRef.current,
          accounts: accountsRef.current,
          budgets: budgetsRef.current,
        });
      }
    } catch {
      // silent background check
    } finally {
      setIsAutoSyncingBg(false);
    }
  }, [handleUpdateFromSheets]);

  useEffect(() => {
    pullFromSheetsQuietly();

    const handleFocus = () => {
      pullFromSheetsQuietly();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        pullFromSheetsQuietly();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    const intervalId = window.setInterval(() => {
      pullFromSheetsQuietly();
    }, 4000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearInterval(intervalId);
    };
  }, [pullFromSheetsQuietly]);

  // Derived state
  const balances = useMemo(() => {
    return calculateAccountBalances(accounts, transactions);
  }, [accounts, transactions]);

  const availableMonths = useMemo(() => {
    return getAvailableMonths(transactions);
  }, [transactions]);

  const currentRecap = useMemo(() => {
    return calculateMonthlyRecap(selectedMonth, transactions, accounts);
  }, [selectedMonth, transactions, accounts]);

  const previousRecap = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const prevMonthStr = `${prevDate.getFullYear()}-${(prevDate.getMonth() + 1).toString().padStart(2, '0')}`;
    return calculateMonthlyRecap(prevMonthStr, transactions, accounts);
  }, [selectedMonth, transactions, accounts]);

  const historicalRecaps = useMemo(() => {
    const [currentYear, currentMonthNum] = selectedMonth.split('-').map(Number);
    const recaps = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonthNum - 1 - i, 1);
      const mStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      recaps.push(calculateMonthlyRecap(mStr, transactions, accounts));
    }
    return recaps;
  }, [selectedMonth, transactions, accounts]);

  const currentMonthTransactions = useMemo(() => {
    return transactions
      .filter((t) => t.date.startsWith(selectedMonth))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedMonth]);

  // Handlers
  const handleSaveTransaction = (txData: Omit<Transaction, 'id'>, id?: string) => {
    lastLocalChangeRef.current = Date.now();
    let savedTx: Transaction;
    let nextTransactions: Transaction[];
    if (id) {
      savedTx = { ...txData, id };
      nextTransactions = transactions.map((t) => (t.id === id ? savedTx : t));
    } else {
      savedTx = {
        ...txData,
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      };
      nextTransactions = [savedTx, ...transactions];
    }
    setTransactions(nextTransactions);
    saveStoredTransactions(nextTransactions);
    setEditingTransaction(null);

    // Otomatis sinkronkan seluruh daftar transaksi ke Google Sheets via syncAll (kompatibel 100% dengan skrip yang sudah dipasang)
    pushFullStateToSheets(nextTransactions, accounts, budgets);
  };

  const handleDeleteTransaction = (id: string) => {
    lastLocalChangeRef.current = Date.now();
    const nextTransactions = transactions.filter((t) => t.id !== id);
    setTransactions(nextTransactions);
    saveStoredTransactions(nextTransactions);

    // Otomatis perbarui Google Sheets (baik via syncAll maupun deleteTransaction)
    const sheetsUrl = getSavedSheetsUrl();
    if (sheetsUrl && isAutoSyncEnabled()) {
      removeTransactionFromSheets(sheetsUrl, id);
      pushFullStateToSheets(nextTransactions, accounts, budgets);
    }
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsAddModalOpen(true);
  };

  const handleAddAccount = (acc: Account) => {
    const nextAcc = [...accounts, acc];
    setAccounts(nextAcc);
    pushFullStateToSheets(transactions, nextAcc, budgets);
  };

  const handleUpdateAccount = (acc: Account) => {
    const nextAcc = accounts.map((a) => (a.id === acc.id ? acc : a));
    setAccounts(nextAcc);
    pushFullStateToSheets(transactions, nextAcc, budgets);
  };

  const handleDeleteAccount = (id: string) => {
    const nextAcc = accounts.filter((a) => a.id !== id);
    setAccounts(nextAcc);
    pushFullStateToSheets(transactions, nextAcc, budgets);
  };

  const handleSaveBudget = (budget: Budget) => {
    const existing = budgets.findIndex(
      (b) => b.category === budget.category && b.month === budget.month
    );
    let nextBudgets: Budget[];
    if (existing >= 0) {
      nextBudgets = [...budgets];
      nextBudgets[existing] = budget;
    } else {
      nextBudgets = [...budgets, budget];
    }
    setBudgets(nextBudgets);
    pushFullStateToSheets(transactions, accounts, nextBudgets);
  };

  const handleDeleteBudget = (id: string) => {
    const nextBudgets = budgets.filter((b) => b.id !== id);
    setBudgets(nextBudgets);
    pushFullStateToSheets(transactions, accounts, nextBudgets);
  };

  const handleResetDemoData = () => {
    setIsResetModalOpen(true);
  };

  const handleRestoreSample = () => {
    setAccounts(SAMPLE_ACCOUNTS);
    setTransactions(SAMPLE_TRANSACTIONS);
    setBudgets(SAMPLE_BUDGETS);
    saveStoredAccounts(SAMPLE_ACCOUNTS);
    saveStoredTransactions(SAMPLE_TRANSACTIONS);
    saveStoredBudgets(SAMPLE_BUDGETS);
    setIsResetModalOpen(false);
    pushFullStateToSheets(SAMPLE_TRANSACTIONS, SAMPLE_ACCOUNTS, SAMPLE_BUDGETS);
  };

  const handleZeroOutAll = () => {
    const { accounts: zeroAcc } = zeroOutAllData();
    setAccounts(zeroAcc);
    setTransactions([]);
    setBudgets([]);
    setIsResetModalOpen(false);
    pushFullStateToSheets([], zeroAcc, []);
  };

  const handleClearAllTransactions = () => {
    setTransactions([]);
    setIsResetModalOpen(false);
    pushFullStateToSheets([], accounts, budgets);
  };

  return (
    <div className="min-h-screen bg-[#edf2f7] font-sans flex flex-col">
      {/* 
        Responsive Navigation:
        - Mode Laptop: Sidebar vertikal di sebelah kiri (Deep Ocean Blue)
        - Mode HP: Top bar ramping & Bottom navigation bar di bawah
      */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        selectedMonth={selectedMonth}
        availableMonths={availableMonths}
        onChangeMonth={setSelectedMonth}
        onOpenAddModal={() => {
          setEditingTransaction(null);
          setIsAddModalOpen(true);
        }}
        onOpenTransferModal={() => setIsTransferModalOpen(true)}
        onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)}
        isSheetsConnected={isSheetsConnected}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        viewMode={viewMode}
        onChangeViewMode={handleViewModeChange}
      />

      {/* Main Container: Offset by sidebar on desktop (md:pl-64 or md:pl-20) */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          viewMode === 'laptop'
            ? (isSidebarCollapsed ? 'pl-20' : 'pl-64')
            : viewMode === 'mobile'
            ? 'pl-0'
            : (isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64')
        }`}
      >
        {/* =========================================================================
            DESKTOP TOP HEADER (Persis Tampilan Atas pada Foto Referensi)
            ========================================================================= */}
        <header
          className={`${
            viewMode === 'laptop'
              ? 'flex'
              : viewMode === 'mobile'
              ? 'hidden'
              : 'hidden md:flex'
          } h-16 bg-white border-b border-slate-200/90 px-6 items-center justify-between sticky top-0 z-20 shadow-2xs`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              title={isSidebarCollapsed ? 'Buka Menu Samping' : 'Tutup Menu Samping'}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div>
                <h2 className="text-xs font-black text-slate-900 tracking-wider uppercase font-sans">
                  {activeTab === 'summary'
                    ? 'RINGKASAN UANG'
                    : activeTab === 'charts'
                    ? 'GRAFIK & ANALISIS'
                    : 'DAFTAR TRANSAKSI'}
                </h2>
                <p className="text-[10px] font-bold text-sky-700 tracking-wider uppercase">
                  {activeTab === 'summary'
                    ? 'POSISI SALDO & REKAP KEUANGAN SIMPEL'
                    : activeTab === 'charts'
                    ? 'TREN 6 BULAN & DIAGRAM POS BELANJA'
                    : 'CATATAN LENGKAP PENGELUARAN & PEMASUKAN'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Controls & Status Pills */}
          <div className="flex items-center gap-2.5">
            {/* Mode Tampilan Switcher (Laptop / HP / Auto) */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleViewModeChange('auto')}
                title="Otomatis menyesuaikan layar (Laptop / HP)"
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px] ${
                  viewMode === 'auto'
                    ? 'bg-white text-[#024a77] shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Auto
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('laptop')}
                title="Tampilan Khusus Laptop (Sidebar & Layout Lebar)"
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] ${
                  viewMode === 'laptop'
                    ? 'bg-white text-[#024a77] shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Laptop className="w-3.5 h-3.5 text-[#024a77]" />
                <span>Laptop</span>
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('mobile')}
                title="Tampilan Khusus HP (Menu Bawah & Layout Ringkas)"
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] ${
                  viewMode === 'mobile'
                    ? 'bg-white text-[#024a77] shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-[#024a77]" />
                <span>HP</span>
              </button>
            </div>

            {/* Google Sheets Status Pill */}
            <button
              onClick={() => setIsGoogleSheetsModalOpen(true)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs ${
                isSheetsConnected
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isAutoSyncingBg ? (
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
              ) : (
                <FileSpreadsheet className={`w-3.5 h-3.5 ${isSheetsConnected ? 'text-emerald-600' : 'text-slate-500'}`} />
              )}
              <span>
                {isAutoSyncingBg
                  ? 'Menyinkronkan...'
                  : isSheetsConnected
                  ? 'Sheets Sinkron Otomatis'
                  : 'Google Sheets'}
              </span>
            </button>

            {/* Online Status Pill */}
            <div className="px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-[11px] font-semibold flex items-center gap-1.5">
              <Wifi className="w-3 h-3 text-sky-600" />
              <span>Online</span>
            </div>

            {/* Tersimpan Status Pill */}
            <div className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Tersimpan</span>
            </div>
          </div>
        </header>

        <main
          className={`flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 ${
            viewMode === 'laptop'
              ? 'pt-6 pb-8'
              : viewMode === 'mobile'
              ? 'pt-16 pb-28'
              : 'pt-16 pb-28 md:pt-6 md:pb-8'
          } space-y-6`}
        >
          {/* TAB 1: RINGKASAN UANG (SIMPEL & JELAS) */}
          {activeTab === 'summary' && (
            <MoneySummaryView
              accounts={accounts}
              balances={balances}
              recap={currentRecap}
              previousRecap={previousRecap}
              recentTransactions={currentMonthTransactions}
              onOpenManageAccounts={() => setIsManageAccountsOpen(true)}
              onOpenTransfer={() => setIsTransferModalOpen(true)}
              onOpenAddModal={() => {
                setEditingTransaction(null);
                setIsAddModalOpen(true);
              }}
              onNavigateToCharts={() => setActiveTab('charts')}
              onNavigateToTransactions={() => setActiveTab('transactions')}
              onEditTransaction={handleEditTransaction}
            />
          )}

          {/* TAB 2: GRAFIK & ANALISIS KEUANGAN */}
          {activeTab === 'charts' && (
            <div className="space-y-6">
              <FinancialAnalyticsView
                currentRecap={currentRecap}
                historicalRecaps={historicalRecaps}
                previousRecap={previousRecap}
              />

              {/* Target & Pengingat Anggaran */}
              <BudgetManager
                budgets={budgets}
                currentRecap={currentRecap}
                selectedMonth={selectedMonth}
                onSaveBudget={handleSaveBudget}
                onDeleteBudget={handleDeleteBudget}
              />
            </div>
          )}

          {/* TAB 3: DAFTAR TRANSAKSI LENGKAP */}
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Daftar Semua Transaksi
                  </h2>
                  <p className="text-xs text-slate-500">
                    Semua riwayat pengeluaran, pemasukan, dan pindah uang bulan {currentRecap.monthName}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingTransaction(null);
                    setIsAddModalOpen(true);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-[#fbb016] hover:bg-[#f59e0b] active:bg-[#d97706] rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  + Catat Transaksi
                </button>
              </div>

              <TransactionList
                transactions={transactions}
                accounts={accounts}
                selectedMonth={selectedMonth}
                onEditTransaction={handleEditTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onOpenAddModal={() => {
                  setEditingTransaction(null);
                  setIsAddModalOpen(true);
                }}
                isCompactView={false}
                isSheetsConnected={isSheetsConnected}
                onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)}
              />
            </div>
          )}
        </main>

        {/* Footer for Laptop view */}
        <footer
          className={`${
            viewMode === 'mobile' ? 'hidden' : viewMode === 'laptop' ? 'block' : 'hidden md:block'
          } border-t border-slate-200/80 bg-white py-3.5 mt-auto`}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#024a77]" />
              <span>Semua data tersimpan aman di browser laptop/HP Anda</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetDemoData}
                className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors text-[11px] cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Muat Ulang Sampel</span>
              </button>
              <span>·</span>
              <span className="text-[11px] font-bold text-[#024a77]">DompetKu</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
        editingTransaction={editingTransaction}
        accounts={accounts}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSave={handleSaveTransaction}
        accounts={accounts}
      />

      <AccountManagerModal
        isOpen={isManageAccountsOpen}
        onClose={() => setIsManageAccountsOpen(false)}
        accounts={accounts}
        balances={balances}
        onAddAccount={handleAddAccount}
        onUpdateAccount={handleUpdateAccount}
        onDeleteAccount={handleDeleteAccount}
      />

      {/* Reset & Clear Data Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Kelola & Bersihkan Data</h4>
                <p className="text-xs text-slate-500">Pilih tindakan pemulihan atau penghapusan data:</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleZeroOutAll}
                className="w-full text-left p-3 rounded-xl border border-emerald-300 hover:border-emerald-500 bg-emerald-50/60 hover:bg-emerald-50 transition-colors cursor-pointer group"
              >
                <div className="text-xs font-bold text-emerald-800">
                  Nol-kan Semua Data (Saldo & Transaksi Rp 0)
                </div>
                <div className="text-[11px] text-emerald-700/90 mt-0.5">
                  Setel saldo kas dan rekening ke Rp 0, serta hapus semua riwayat transaksi untuk mulai dari nol.
                </div>
              </button>

              <button
                type="button"
                onClick={handleRestoreSample}
                className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-[#024a77] hover:bg-sky-50/50 transition-colors cursor-pointer group"
              >
                <div className="text-xs font-bold text-slate-900 group-hover:text-[#024a77]">
                  Muat Ulang Data Sampel (Demo)
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Kembalikan data sampel awal transaksi, rekening, dan anggaran.
                </div>
              </button>

              <button
                type="button"
                onClick={handleClearAllTransactions}
                className="w-full text-left p-3 rounded-xl border border-rose-200 hover:border-rose-400 hover:bg-rose-50/50 transition-colors cursor-pointer group"
              >
                <div className="text-xs font-bold text-rose-700">
                  Kosongkan Semua Transaksi
                </div>
                <div className="text-[11px] text-rose-500 mt-0.5">
                  Hapus seluruh catatan transaksi saja tanpa mengubah saldo awal rekening.
                </div>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sinkronisasi & Skrip Google Sheets */}
      <GoogleSheetsModal
        isOpen={isGoogleSheetsModalOpen}
        onClose={() => setIsGoogleSheetsModalOpen(false)}
        transactions={transactions}
        accounts={accounts}
        budgets={budgets}
        onSyncSuccess={() => setIsSheetsConnected(true)}
        onUpdateFromSheets={handleUpdateFromSheets}
      />
    </div>
  );
}
