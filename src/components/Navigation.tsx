import {
  LayoutDashboard,
  ReceiptText,
  PieChart,
  BarChart3,
  ArrowRightLeft,
  Plus,
  ShieldCheck,
  Calendar,
  PanelLeftClose,
  PanelLeftOpen,
  Wallet,
  FileSpreadsheet,
  Laptop,
  Smartphone,
} from 'lucide-react';
import { formatMonthName } from '../utils/finance';

export type NavTab = 'summary' | 'charts' | 'transactions';
export type ViewMode = 'auto' | 'laptop' | 'mobile';

interface NavigationProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  selectedMonth: string;
  availableMonths: string[];
  onChangeMonth: (month: string) => void;
  onOpenAddModal: () => void;
  onOpenTransferModal: () => void;
  onOpenGoogleSheets: () => void;
  isSheetsConnected?: boolean;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  viewMode?: ViewMode;
  onChangeViewMode?: (mode: ViewMode) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  selectedMonth,
  availableMonths,
  onChangeMonth,
  onOpenAddModal,
  onOpenTransferModal,
  onOpenGoogleSheets,
  isSheetsConnected = false,
  isSidebarCollapsed,
  onToggleSidebar,
  viewMode = 'auto',
  onChangeViewMode,
}) => {
  // Hitung kelas visibilitas berdasarkan viewMode & breakpoint md: (768px standar laptop)
  const sidebarDisplayClass =
    viewMode === 'laptop'
      ? 'flex'
      : viewMode === 'mobile'
      ? 'hidden'
      : 'hidden md:flex';

  const mobileDisplayClass =
    viewMode === 'mobile'
      ? 'flex'
      : viewMode === 'laptop'
      ? 'hidden'
      : 'flex md:hidden';

  const mobileNavDisplayClass =
    viewMode === 'mobile'
      ? 'flex'
      : viewMode === 'laptop'
      ? 'hidden'
      : 'flex md:hidden';
  return (
    <>
      {/* =========================================================================
          1. LAPTOP / DESKTOP VIEW: MENU SAMPING KIRI BISA DIBUKA & DITUTUP
          ========================================================================= */}
      {/* =========================================================================
          1. LAPTOP / DESKTOP VIEW: MENU SAMPING KIRI BISA DIBUKA & DITUTUP
          ========================================================================= */}
      <aside
        className={`${sidebarDisplayClass} fixed inset-y-0 left-0 bg-[#024a77] border-r border-[#033b5e] z-30 flex-col justify-between transition-all duration-300 ease-in-out text-white ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Top: Brand & Navigation Links */}
        <div className={`space-y-5 ${isSidebarCollapsed ? 'p-3' : 'p-4'}`}>
          {/* Logo Brand */}
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'px-2 pt-1'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#024a77] font-black text-base shadow-md shrink-0">
                DK
              </div>
              {!isSidebarCollapsed && (
                <div className="overflow-hidden">
                  <span className="text-sm font-extrabold text-white tracking-wider uppercase block leading-tight font-sans truncate">
                    DompetKu
                  </span>
                  <span className="text-[10px] text-sky-200 font-semibold tracking-wider uppercase truncate block">
                    Catatan Pribadi
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Primary Action Button (+ Catat Transaksi) in Vibrant Golden Amber */}
          {isSidebarCollapsed ? (
            <button
              onClick={onOpenAddModal}
              title="Catat Transaksi Baru"
              aria-label="Catat Transaksi Baru"
              className="w-12 h-12 mx-auto rounded-xl bg-[#fbb016] hover:bg-[#f59e0b] active:bg-[#d97706] text-slate-950 flex items-center justify-center shadow-md shadow-amber-950/20 transition-all cursor-pointer font-bold"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>
          ) : (
            <button
              onClick={onOpenAddModal}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-[#fbb016] hover:bg-[#f59e0b] active:bg-[#d97706] shadow-md shadow-amber-950/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Catat Transaksi</span>
            </button>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {/* Tab 1: Ringkasan Uang (Simpel & Cepat) */}
            <button
              onClick={() => onSelectTab('summary')}
              title="Ringkasan Uang"
              className={`w-full flex items-center rounded-xl text-xs transition-colors cursor-pointer ${
                isSidebarCollapsed
                  ? 'justify-center p-3'
                  : 'gap-3 px-3.5 py-2.5'
              } ${
                activeTab === 'summary'
                  ? 'bg-[#fbb016] text-slate-950 font-bold shadow-sm'
                  : 'text-white/85 hover:text-white hover:bg-white/10 font-medium'
              }`}
            >
              <Wallet
                className={`w-4 h-4 shrink-0 ${
                  activeTab === 'summary' ? 'text-slate-950 stroke-[2.5]' : 'text-white/80'
                }`}
              />
              {!isSidebarCollapsed && <span className="truncate">Ringkasan Uang</span>}
            </button>

            {/* Tab 2: Grafik & Analisis Keuangan */}
            <button
              onClick={() => onSelectTab('charts')}
              title="Grafik & Analisis"
              className={`w-full flex items-center rounded-xl text-xs transition-colors cursor-pointer ${
                isSidebarCollapsed
                  ? 'justify-center p-3'
                  : 'gap-3 px-3.5 py-2.5'
              } ${
                activeTab === 'charts'
                  ? 'bg-[#fbb016] text-slate-950 font-bold shadow-sm'
                  : 'text-white/85 hover:text-white hover:bg-white/10 font-medium'
              }`}
            >
              <BarChart3
                className={`w-4 h-4 shrink-0 ${
                  activeTab === 'charts' ? 'text-slate-950 stroke-[2.5]' : 'text-white/80'
                }`}
              />
              {!isSidebarCollapsed && <span className="truncate">Grafik & Analisis</span>}
            </button>

            {/* Tab 3: Daftar Transaksi */}
            <button
              onClick={() => onSelectTab('transactions')}
              title="Daftar Transaksi"
              className={`w-full flex items-center rounded-xl text-xs transition-colors cursor-pointer ${
                isSidebarCollapsed
                  ? 'justify-center p-3'
                  : 'gap-3 px-3.5 py-2.5'
              } ${
                activeTab === 'transactions'
                  ? 'bg-[#fbb016] text-slate-950 font-bold shadow-sm'
                  : 'text-white/85 hover:text-white hover:bg-white/10 font-medium'
              }`}
            >
              <ReceiptText
                className={`w-4 h-4 shrink-0 ${
                  activeTab === 'transactions' ? 'text-slate-950 stroke-[2.5]' : 'text-white/80'
                }`}
              />
              {!isSidebarCollapsed && <span className="truncate">Daftar Transaksi</span>}
            </button>

            {/* Action: Tarik / Pindah Uang */}
            <button
              onClick={onOpenTransferModal}
              title="Tarik / Pindah Uang"
              className={`w-full flex items-center rounded-xl text-xs font-medium text-white/85 hover:text-white hover:bg-white/10 transition-colors cursor-pointer mt-1 ${
                isSidebarCollapsed
                  ? 'justify-center p-3'
                  : 'gap-3 px-3.5 py-2.5'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4 text-white/80 shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Tarik / Pindah Uang</span>}
            </button>

            {/* Action: Database Google Sheets */}
            <button
              onClick={onOpenGoogleSheets}
              title="Database Google Sheets"
              className={`w-full flex items-center rounded-xl text-xs font-medium text-white/85 hover:text-white hover:bg-white/10 transition-colors cursor-pointer mt-1 relative ${
                isSidebarCollapsed
                  ? 'justify-center p-3'
                  : 'gap-3 px-3.5 py-2.5'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300 shrink-0" />
              {!isSidebarCollapsed && (
                <div className="flex items-center justify-between flex-1 truncate">
                  <span className="truncate">Google Sheets</span>
                  {isSheetsConnected ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Terhubung" />
                  ) : (
                    <span className="text-[10px] text-amber-300 font-bold bg-amber-400/20 px-1.5 py-0.5 rounded shrink-0">
                      Sync
                    </span>
                  )}
                </div>
              )}
            </button>
          </nav>
        </div>

        {/* Bottom of Sidebar: Month Selector & System Info matching photo */}
        <div className={`border-t border-[#045584] space-y-3 ${isSidebarCollapsed ? 'p-2' : 'p-4'}`}>
          {!isSidebarCollapsed ? (
            <>
              <div>
                <label className="text-[10px] font-bold text-sky-200 uppercase tracking-wider block mb-1">
                  Bulan yang Dilihat
                </label>
                <div className="relative">
                  <select
                    value={selectedMonth}
                    onChange={(e) => onChangeMonth(e.target.value)}
                    className="w-full text-xs font-semibold text-white bg-[#013554] border border-[#045584] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#fbb016] cursor-pointer appearance-none pr-8"
                  >
                    {availableMonths.map((m) => (
                      <option key={m} value={m} className="bg-[#024a77] text-white">
                        {formatMonthName(m)}
                      </option>
                    ))}
                  </select>
                  <Calendar className="w-3.5 h-3.5 text-sky-200 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Status Card matching photo's "MODE ADMIN / Akses Penuh" */}
              <div className="bg-[#013554] border border-[#045584] rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-bold text-white uppercase tracking-wide">
                      Mode Pribadi
                    </span>
                  </div>
                  <span className="text-[10px] text-sky-200 block mt-0.5">
                    Data Tersimpan Lokal
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-400/20 border border-amber-400/30 px-2 py-0.5 rounded-md">
                  v2.0
                </span>
              </div>

              {/* Tampilan Switcher on Sidebar */}
              {onChangeViewMode && (
                <div className="pt-1 flex items-center justify-between text-[11px] text-sky-200">
                  <span className="text-[10px] font-bold text-sky-300 uppercase tracking-wider">Tampilan:</span>
                  <div className="flex items-center gap-1 bg-[#013554] border border-[#045584] rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => onChangeViewMode('auto')}
                      title="Otomatis"
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                        viewMode === 'auto' ? 'bg-[#fbb016] text-slate-950' : 'text-sky-200 hover:text-white'
                      }`}
                    >
                      Auto
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeViewMode('laptop')}
                      title="Mode Laptop"
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-0.5 ${
                        viewMode === 'laptop' ? 'bg-[#fbb016] text-slate-950' : 'text-sky-200 hover:text-white'
                      }`}
                    >
                      <Laptop className="w-2.5 h-2.5" />
                      <span>Laptop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeViewMode('mobile')}
                      title="Mode HP"
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-0.5 ${
                        viewMode === 'mobile' ? 'bg-[#fbb016] text-slate-950' : 'text-sky-200 hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-2.5 h-2.5" />
                      <span>HP</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              <button
                onClick={onToggleSidebar}
                title="Buka Menu Lengkap"
                className="p-2 text-sky-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* =========================================================================
          2. HP / MOBILE VIEW: HEADER ATAS RINGKAS BERWARNA DEEP OCEAN BLUE
          ========================================================================= */}
      <header className={`${mobileDisplayClass} fixed top-0 left-0 right-0 h-14 bg-[#024a77] border-b border-[#013b5e] z-30 px-4 items-center justify-between text-white shadow-md`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#024a77] font-black text-xs shadow-sm">
            DK
          </div>
          <div>
            <span className="text-sm font-black text-white tracking-wide block leading-tight font-sans">
              DOMPETKU
            </span>
            <span className="text-[9px] text-sky-200 font-semibold tracking-wider uppercase block">
              Keuangan Pribadi
            </span>
          </div>
        </div>

        {/* Actions on Mobile Header */}
        <div className="flex items-center gap-2">
          {/* Quick toggle to Laptop mode if on PC/testing */}
          {onChangeViewMode && (
            <button
              onClick={() => onChangeViewMode(viewMode === 'mobile' ? 'laptop' : 'mobile')}
              title={viewMode === 'mobile' ? 'Kembali ke Mode Laptop' : 'Lihat Mode Laptop'}
              className="px-2 py-1.5 rounded-lg bg-[#013554] hover:bg-[#03446c] border border-[#045584] text-sky-200 hover:text-white transition-colors cursor-pointer text-[10px] font-bold flex items-center gap-1 shrink-0"
            >
              <Laptop className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Laptop</span>
            </button>
          )}

          <button
            onClick={onOpenGoogleSheets}
            title="Google Sheets Database"
            className="p-1.5 rounded-lg bg-[#013554] border border-[#045584] text-emerald-300 hover:text-white transition-colors cursor-pointer relative"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {isSheetsConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5" />
            )}
          </button>

          {/* Month Selector on Mobile Header */}
          <div className="flex items-center gap-1.5 bg-[#013554] border border-[#045584] rounded-lg px-2.5 py-1 text-white">
            <Calendar className="w-3 h-3 text-sky-200" />
            <select
              value={selectedMonth}
              onChange={(e) => onChangeMonth(e.target.value)}
              className="text-xs font-semibold text-white bg-transparent border-none focus:outline-none cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m} className="bg-[#024a77] text-white">
                  {formatMonthName(m)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* =========================================================================
          3. HP / MOBILE VIEW: MENU NAVIGASI BAWAH (BOTTOM NAVIGATION BAR)
             Tetap selalu muncul dan menempel di bawah layar (Fixed & Floating)
          ========================================================================= */}
      <nav
        className={`${mobileNavDisplayClass} fixed bottom-0 left-0 right-0 z-40 bg-[#024a77] border-t border-[#013b5e] shadow-[0_-4px_25px_rgba(0,0,0,0.3)] text-white px-2 items-center justify-around select-none`}
        style={{
          paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom, 6px))',
          minHeight: 'calc(4rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Tab 1: Ringkasan Uang (Simpel) */}
        <button
          onClick={() => onSelectTab('summary')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer active:scale-95 ${
            activeTab === 'summary' ? 'text-[#fbb016] font-bold' : 'text-white/75 hover:text-white'
          }`}
        >
          <Wallet className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Ringkasan</span>
        </button>

        {/* Tab 2: Grafik & Analisis */}
        <button
          onClick={() => onSelectTab('charts')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer active:scale-95 ${
            activeTab === 'charts' ? 'text-[#fbb016] font-bold' : 'text-white/75 hover:text-white'
          }`}
        >
          <BarChart3 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Grafik</span>
        </button>

        {/* Tab Tengah: Floating + Button in Golden Amber */}
        <div className="flex flex-col items-center justify-center px-1.5 relative -top-3">
          <button
            onClick={onOpenAddModal}
            aria-label="Catat Transaksi Baru"
            className="w-12 h-12 rounded-full bg-[#fbb016] hover:bg-[#f59e0b] active:bg-[#d97706] text-slate-950 flex items-center justify-center shadow-lg shadow-black/35 transition-transform active:scale-90 cursor-pointer font-bold"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
          <span className="text-[10px] font-bold text-amber-300 mt-0.5">Catat</span>
        </div>

        {/* Tab 3: Daftar Transaksi */}
        <button
          onClick={() => onSelectTab('transactions')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer active:scale-95 ${
            activeTab === 'transactions' ? 'text-[#fbb016] font-bold' : 'text-white/75 hover:text-white'
          }`}
        >
          <ReceiptText className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Transaksi</span>
        </button>

        {/* Tab 4: Pindah Uang (Tarik ATM / Transfer) */}
        <button
          onClick={onOpenTransferModal}
          className="flex flex-col items-center justify-center flex-1 py-1 text-white/75 hover:text-white transition-colors cursor-pointer active:scale-95"
        >
          <ArrowRightLeft className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Pindah</span>
        </button>
      </nav>
    </>
  );
};
