import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Link2,
  ArrowDownToLine,
  Trash2,
} from 'lucide-react';
import { Account, Budget, Transaction } from '../types/finance';
import {
  getSavedSheetsUrl,
  saveSheetsUrl,
  isAutoSyncEnabled,
  setAutoSyncEnabled,
  testGoogleSheetsConnection,
  syncAllToGoogleSheets,
  fetchDataFromGoogleSheets,
  getLastSyncTime,
  saveCentralServerState,
} from '../utils/googleSheetsSync';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  accounts: Account[];
  budgets: Budget[];
  onSyncSuccess?: () => void;
  onUpdateFromSheets?: (transactions: Transaction[], accounts?: Account[], budgets?: Budget[]) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  transactions,
  accounts,
  budgets,
  onSyncSuccess,
  onUpdateFromSheets,
}) => {
  const [activeTab, setActiveTab] = useState<'script' | 'connect'>('connect');
  const [url, setUrl] = useState('');
  const [autoSync, setAutoSync] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isDeviceLinkCopied, setIsDeviceLinkCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [pullResult, setPullResult] = useState<{ success: boolean; message: string } | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [fixNotification, setFixNotification] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const saved = getSavedSheetsUrl();
      setUrl(saved);
      setAutoSync(isAutoSyncEnabled());
      setLastSync(getLastSyncTime());
      setTestResult(null);
      setSyncResult(null);
      setPullResult(null);
      setFixNotification(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Kode lengkap skrip Google Apps Script untuk disalin pengguna
  const googleAppsScriptCode = `/**
 * =========================================================================================
 * SKRIP GOOGLE APPS SCRIPT DATABASE DUA ARAH OTOMATIS DOMPETKU
 * Mendukung TAMBAH, UBAH, dan HAPUS dari aplikasi maupun langsung dari spreadsheet!
 * (Transaksi, Akun Dompet Tunai & Rekening, serta Anggaran terhubung penuh)
 * =========================================================================================
 */
var SHEET_TRANSAKSI = "Transaksi";
var SHEET_AKUN = "Akun";
var SHEET_ANGGARAN = "Anggaran";

/**
 * Trigger otomatis saat pengguna mengetik baris baru langsung di Google Spreadsheet
 */
function onEdit(e) {
  try {
    if (!e || !e.range) return;
    var sheet = e.range.getSheet();
    var row = e.range.getRow();
    if (row <= 1) return;

    if (sheet.getName() === SHEET_TRANSAKSI) {
      var idCell = sheet.getRange(row, 1);
      if (!idCell.getValue()) {
        idCell.setValue("tx_sheet_" + new Date().getTime() + "_" + row);
      }
      var dateCell = sheet.getRange(row, 2);
      if (!dateCell.getValue()) {
        dateCell.setValue(Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd"));
      }
    }
  } catch (err) {}
}

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "ping";

    // 1. Tes Koneksi
    if (action === "ping") {
      return createJsonResponse({
        status: "success",
        message: "Koneksi Google Sheets DompetKu Aktif & Terhubung Dua Arah!",
        timestamp: new Date().toISOString()
      });
    }

    // 2. Ambil seluruh data (Dua Arah: mendeteksi baris yang ditambah, diubah, atau dihapus di Sheets)
    if (action === "getData") {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var txSheet = getOrCreateSheet(ss, SHEET_TRANSAKSI);
      var accSheet = getOrCreateSheet(ss, SHEET_AKUN);
      var bgSheet = getOrCreateSheet(ss, SHEET_ANGGARAN);
      return createJsonResponse({
        status: "success",
        data: {
          transactions: readSheetTransactions(txSheet),
          accounts: readSheetAccounts(accSheet),
          budgets: readSheetBudgets(bgSheet)
        }
      });
    }

    return createJsonResponse({ status: "error", message: "Aksi GET tidak dikenali: " + action });
  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

function doPost(e) {
  try {
    var payload;
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else {
      payload = e.parameter || {};
    }
    var action = payload.action || "syncAll";
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 0. Tes Koneksi via POST
    if (action === "ping") {
      return createJsonResponse({
        status: "success",
        message: "Koneksi Google Sheets DompetKu Aktif & Terhubung Dua Arah!"
      });
    }

    // 1. Tarik Data Terbaru
    if (action === "getData") {
      var txSheet = getOrCreateSheet(ss, SHEET_TRANSAKSI);
      var accSheet = getOrCreateSheet(ss, SHEET_AKUN);
      var bgSheet = getOrCreateSheet(ss, SHEET_ANGGARAN);
      return createJsonResponse({
        status: "success",
        data: {
          transactions: readSheetTransactions(txSheet),
          accounts: readSheetAccounts(accSheet),
          budgets: readSheetBudgets(bgSheet)
        }
      });
    }

    // 2. Simpan / Sinkronisasi Penuh (Transaksi, Akun, Anggaran)
    if (action === "syncAll") {
      var txList = payload.transactions || [];
      var accList = payload.accounts || [];
      var bgList = payload.budgets || [];

      var txSheet = getOrCreateSheet(ss, SHEET_TRANSAKSI);
      txSheet.clear();
      var txHeaders = ["ID", "Tanggal", "Waktu", "Tipe", "Jumlah", "Kategori", "Akun Asal", "Akun Tujuan", "Deskripsi", "Catatan"];
      txSheet.appendRow(txHeaders);
      formatHeaderRow(txSheet, txHeaders.length, "#024a77");

      if (txList.length > 0) {
        var txRows = txList.map(function(t) {
          var accName = t.accountId === "acc_cash" ? "Dompet Tunai" : (t.accountId === "acc_bca" ? "Rekening" : (t.accountId || "Dompet Tunai"));
          var toAccName = t.toAccountId === "acc_cash" ? "Dompet Tunai" : (t.toAccountId === "acc_bca" ? "Rekening" : (t.toAccountId || ""));
          return [t.id||"", t.date||"", t.time||"", t.type||"", t.amount||0, t.category||"", accName, toAccName, t.description||"", t.notes||""];
        });
        txSheet.getRange(2, 1, txRows.length, txHeaders.length).setValues(txRows);
        txSheet.getRange(2, 5, txRows.length, 1).setNumberFormat('"Rp"#,##0.##');
      }

      var accSheet = getOrCreateSheet(ss, SHEET_AKUN);
      accSheet.clear();
      var accHeaders = ["ID Akun", "Nama Akun", "Tipe", "Nomor Rekening", "Saldo Awal", "Warna"];
      accSheet.appendRow(accHeaders);
      formatHeaderRow(accSheet, accHeaders.length, "#035b91");

      if (accList.length > 0) {
        var accRows = accList.map(function(a) {
          return [a.id||"", a.name||"", a.type||"", a.accountNumber||"-", a.initialBalance||0, a.color||""];
        });
        accSheet.getRange(2, 1, accRows.length, accHeaders.length).setValues(accRows);
        accSheet.getRange(2, 5, accRows.length, 1).setNumberFormat('"Rp"#,##0.##');
      }

      var bgSheet = getOrCreateSheet(ss, SHEET_ANGGARAN);
      bgSheet.clear();
      var bgHeaders = ["ID Anggaran", "Bulan", "Kategori", "Batas Bulanan"];
      bgSheet.appendRow(bgHeaders);
      formatHeaderRow(bgSheet, bgHeaders.length, "#047857");

      if (bgList.length > 0) {
        var bgRows = bgList.map(function(b) {
          return [b.id||"", b.month||"", b.category||"", b.monthlyLimit||0];
        });
        bgSheet.getRange(2, 1, bgRows.length, bgHeaders.length).setValues(bgRows);
        bgSheet.getRange(2, 4, bgRows.length, 1).setNumberFormat('"Rp"#,##0.##');
      }

      return createJsonResponse({
        status: "success",
        message: "Berhasil menyinkronkan seluruh data (" + txList.length + " transaksi, " + accList.length + " akun, " + bgList.length + " anggaran) ke Google Sheets!"
      });
    }

    // 3. Tambah / Perbarui 1 Transaksi
    if (action === "addTransaction" || action === "saveTransaction") {
      var t = payload.transaction;
      if (!t) throw new Error("Data transaksi tidak ditemukan");

      var txSheet = getOrCreateSheet(ss, SHEET_TRANSAKSI);
      if (txSheet.getLastRow() === 0) {
        var txHeaders = ["ID", "Tanggal", "Waktu", "Tipe", "Jumlah", "Kategori", "Akun Asal", "Akun Tujuan", "Deskripsi", "Catatan"];
        txSheet.appendRow(txHeaders);
        formatHeaderRow(txSheet, txHeaders.length, "#024a77");
      }

      var values = txSheet.getDataRange().getValues();
      var existingRow = -1;
      for (var r = 1; r < values.length; r++) {
        if (values[r][0] == t.id) {
          existingRow = r + 1;
          break;
        }
      }

      var accName = t.accountId === "acc_cash" ? "Dompet Tunai" : (t.accountId === "acc_bca" ? "Rekening" : (t.accountId || "Dompet Tunai"));
      var toAccName = t.toAccountId === "acc_cash" ? "Dompet Tunai" : (t.toAccountId === "acc_bca" ? "Rekening" : (t.toAccountId || ""));
      var rowData = [t.id||"", t.date||"", t.time||"", t.type||"", t.amount||0, t.category||"", accName, toAccName, t.description||"", t.notes||""];
      if (existingRow > 1) {
        txSheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
        txSheet.getRange(existingRow, 5).setNumberFormat('"Rp"#,##0.##');
      } else {
        txSheet.appendRow(rowData);
        txSheet.getRange(txSheet.getLastRow(), 5).setNumberFormat('"Rp"#,##0.##');
      }

      return createJsonResponse({ status: "success", message: "Transaksi berhasil disimpan di Google Sheets!" });
    }

    // 4. HAPUS TRANSAKSI DARI SPREADSHEET (Dipicu saat dihapus dari aplikasi)
    if (action === "deleteTransaction") {
      var idToDelete = payload.id;
      var txSheet = getOrCreateSheet(ss, SHEET_TRANSAKSI);
      var values = txSheet.getDataRange().getValues();
      var foundRow = -1;

      for (var r = 1; r < values.length; r++) {
        if (values[r][0] == idToDelete) {
          foundRow = r + 1;
          break;
        }
      }

      if (foundRow > 1) {
        txSheet.deleteRow(foundRow);
        return createJsonResponse({
          status: "success",
          message: "Baris transaksi berhasil dihapus dari Google Sheets!"
        });
      }

      return createJsonResponse({
        status: "success",
        message: "ID transaksi tidak ditemukan di sheet (mungkin sudah terhapus)."
      });
    }

    return createJsonResponse({ status: "error", message: "Aksi POST tidak dikenal: " + action });
  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

function readSheetTransactions(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  var data = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
  var result = [];
  var todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd");

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var id = String(row[0] || "").trim();
    var rawAmount = row[4];
    var amount = typeof rawAmount === "number" ? rawAmount : parseFloat(String(rawAmount || "0").replace(/[^0-9.-]+/g, "")) || 0;
    var desc = String(row[8] || "").trim();

    // Jika baris kosong sama sekali, lewati
    if (!id && amount === 0 && !desc) continue;

    // Jika pengguna menambahkan baris langsung di Spreadsheet tanpa mengisi kolom ID, buatkan ID otomatis!
    if (!id) {
      id = "tx_sheet_" + new Date().getTime() + "_" + (i + 2);
      sheet.getRange(i + 2, 1).setValue(id);
    }

    var rawDate = row[1];
    var dateStr = "";
    if (rawDate instanceof Date) {
      dateStr = Utilities.formatDate(rawDate, Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd");
    } else {
      dateStr = String(rawDate || "").split("T")[0].trim();
    }
    if (!dateStr) {
      dateStr = todayStr;
      sheet.getRange(i + 2, 2).setValue(dateStr);
    }

    result.push({
      id: id,
      date: dateStr,
      time: String(row[2] || "12:00").trim(),
      type: String(row[3] || "expense").trim().toLowerCase(),
      amount: amount,
      category: String(row[5] || "Lain-lain").trim(),
      accountId: String(row[6] || "Dompet Tunai").trim(),
      toAccountId: String(row[7] || "").trim() || undefined,
      description: desc || "Transaksi",
      notes: String(row[9] || "").trim()
    });
  }
  return result;
}

function readSheetAccounts(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  var data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  var result = [];
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var id = String(row[0] || "").trim();
    var name = String(row[1] || "").trim();
    if (!id && !name) continue;
    if (!id) {
      id = name.toLowerCase().indexOf("tunai") !== -1 ? "acc_cash" : "acc_bca";
    }
    var rawAmount = row[4];
    var initialBalance = typeof rawAmount === "number" ? rawAmount : parseFloat(String(rawAmount || "0").replace(/[^0-9.-]+/g, "")) || 0;
    result.push({
      id: id,
      name: name || (id === "acc_cash" ? "Dompet Tunai" : "Rekening"),
      type: String(row[2] || (id === "acc_cash" ? "cash" : "bank")).trim(),
      accountNumber: String(row[3] || "-").trim(),
      initialBalance: initialBalance,
      color: String(row[5] || "#024a77").trim()
    });
  }
  return result;
}

function readSheetBudgets(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  var data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  var result = [];
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var id = String(row[0] || "").trim();
    var month = String(row[1] || "").trim();
    var category = String(row[2] || "").trim();
    if (!category) continue;
    if (!id) {
      id = "b_sheet_" + (i + 2);
      sheet.getRange(i + 2, 1).setValue(id);
    }
    var rawLimit = row[3];
    var monthlyLimit = typeof rawLimit === "number" ? rawLimit : parseFloat(String(rawLimit || "0").replace(/[^0-9.-]+/g, "")) || 0;
    result.push({
      id: id,
      month: month,
      category: category,
      monthlyLimit: monthlyLimit
    });
  }
  return result;
}

function getOrCreateSheet(ss, name) {
  var s = ss.getSheetByName(name);
  if (!s) s = ss.insertSheet(name);
  return s;
}

function formatHeaderRow(sheet, colCount, bgColor, fontColor) {
  bgColor = bgColor || "#024a77";
  fontColor = fontColor || "#ffffff";
  var r = sheet.getRange(1, 1, 1, colCount);
  r.setBackground(bgColor);
  r.setFontColor(fontColor);
  r.setFontWeight("bold");
  sheet.setFrozenRows(1);
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(googleAppsScriptCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = googleAppsScriptCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleSaveAndTest = async () => {
    if (!url.trim()) {
      setTestResult({ success: false, message: 'Harap masukkan URL Google Apps Script Anda.' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    setFixNotification(null);

    const res = await testGoogleSheetsConnection(url.trim());
    if (res.normalizedUrl) {
      setUrl(res.normalizedUrl);
      saveSheetsUrl(res.normalizedUrl);
      setAutoSync(true);
      setAutoSyncEnabled(true);
      if (res.fixNote) {
        setFixNotification(res.fixNote);
      }
    }
    setIsTesting(false);
    setTestResult(res);

    if (res.success && res.normalizedUrl) {
      if (onSyncSuccess) onSyncSuccess();
      // Otomatis tarik data jika sudah ada isi di spreadsheet, atau kirim data aplikasi jika spreadsheet masih kosong
      const pullRes = await fetchDataFromGoogleSheets(res.normalizedUrl);
      if (pullRes.success && pullRes.transactions && pullRes.transactions.length > 0) {
        if (onUpdateFromSheets) {
          onUpdateFromSheets(pullRes.transactions, pullRes.accounts, pullRes.budgets);
        }
        await saveCentralServerState({
          sheetsUrl: res.normalizedUrl,
          transactions: pullRes.transactions,
          accounts: pullRes.accounts || accounts,
          budgets: pullRes.budgets || budgets,
        });
        setLastSync(new Date().toISOString());
      } else {
        await syncAllToGoogleSheets(res.normalizedUrl, {
          transactions,
          accounts,
          budgets,
        });
        await saveCentralServerState({
          sheetsUrl: res.normalizedUrl,
          transactions,
          accounts,
          budgets,
        });
        setLastSync(new Date().toISOString());
      }
    }
  };

  const handleSyncAll = async () => {
    const activeUrl = url.trim() || getSavedSheetsUrl();
    if (!activeUrl) {
      setSyncResult({ success: false, message: 'URL Google Sheets belum tersimpan.' });
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    await saveCentralServerState({
      sheetsUrl: activeUrl,
      transactions,
      accounts,
      budgets,
    });

    const res = await syncAllToGoogleSheets(activeUrl, {
      transactions,
      accounts,
      budgets,
    });

    setIsSyncing(false);
    setSyncResult(res);
    if (res.success) {
      setLastSync(new Date().toISOString());
      if (onSyncSuccess) onSyncSuccess();
    }
  };

  const handlePullFromSheets = async () => {
    const activeUrl = url.trim() || getSavedSheetsUrl();
    if (!activeUrl) {
      setPullResult({ success: false, message: 'URL Google Sheets belum tersimpan.' });
      return;
    }

    setIsPulling(true);
    setPullResult(null);

    const res = await fetchDataFromGoogleSheets(activeUrl);
    setIsPulling(false);
    setPullResult({ success: res.success, message: res.message });

    if (res.success && res.transactions) {
      if (onUpdateFromSheets) {
        onUpdateFromSheets(res.transactions, res.accounts, res.budgets);
      }
      await saveCentralServerState({
        sheetsUrl: activeUrl,
        transactions: res.transactions,
        accounts: res.accounts || accounts,
        budgets: res.budgets || budgets,
      });
      setLastSync(new Date().toISOString());
      if (onSyncSuccess) onSyncSuccess();
    }
  };

  const handleCopyDeviceLink = () => {
    const activeUrl = url.trim() || getSavedSheetsUrl();
    if (!activeUrl) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?sheets=${encodeURIComponent(activeUrl)}`;
    navigator.clipboard.writeText(shareUrl);
    setIsDeviceLinkCopied(true);
    setTimeout(() => setIsDeviceLinkCopied(false), 3000);
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    setAutoSync(enabled);
    setAutoSyncEnabled(enabled);
  };

  const isConnected = !!url.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-2xl overflow-hidden my-6">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-[#024a77] to-[#046ca8] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight flex items-center gap-2">
                <span>Database Google Sheets</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-semibold border border-emerald-400/30">
                  Apps Script Web App
                </span>
              </h3>
              <p className="text-xs text-sky-100/90 mt-0.5">
                Simpan & cadangkan seluruh catatan transaksi langsung ke Google Sheet Anda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigasi */}
        <div className="flex border-b border-slate-200 px-5 bg-slate-50/80">
          <button
            onClick={() => setActiveTab('connect')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'connect'
                ? 'border-[#024a77] text-[#024a77]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Koneksi & Sinkronisasi</span>
            {isConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'script'
                ? 'border-[#024a77] text-[#024a77]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Salin Skrip Apps Script (1 Menit)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-5">
          {/* =========================================================================
              TAB 1: KONEKSI & SINKRONISASI
              ========================================================================= */}
          {activeTab === 'connect' && (
            <div className="space-y-4">
              {/* Status Box */}
              <div
                className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
                  isConnected
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/70 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {isConnected ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="text-xs font-bold block">
                      {isConnected
                        ? 'Spreadsheet Utama Aktif Permanen (Semua Perangkat)'
                        : 'Belum Terhubung ke Google Sheets'}
                    </span>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {isConnected
                        ? 'Link spreadsheet ini telah dikunci sebagai Spreadsheet Utama. Saat Anda membuka aplikasi dari HP atau laptop lain, data langsung terhubung otomatis tanpa perlu memasukkan link lagi.'
                        : 'Salin skrip di tab sebelah, pasang di Google Sheets Anda, lalu tempelkan URL Web App di bawah ini.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('script')}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shrink-0 cursor-pointer shadow-2xs"
                >
                  Lihat Cara Pasang →
                </button>
              </div>

              {/* Input URL Web App */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  URL Spreadsheet Utama Google Apps Script (*.exec):
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#024a77] focus:border-transparent placeholder:text-slate-400"
                  />
                  <button
                    onClick={handleSaveAndTest}
                    disabled={isTesting || !url.trim()}
                    className="px-4 py-2.5 rounded-xl bg-[#024a77] hover:bg-[#035b91] disabled:opacity-50 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Mengecek...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Kunci Spreadsheet Utama</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Begitu diklik <strong>Kunci Spreadsheet Utama</strong>, link &amp; data ini otomatis disimpan ke <strong>Server Pusat</strong> dan <code>src/config/defaultSheetsUrl.ts</code> sehingga semua perangkat (HP &amp; laptop) langsung menampilkan data yang sama.
                </p>

                {isConnected && (
                  <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 flex flex-wrap items-center justify-between gap-2 mt-2">
                    <div className="text-[11px] text-slate-700">
                      <span className="font-bold text-[#024a77] block">Buka di HP / Perangkat Lain (1 Klik Sinkron):</span>
                      <span>Salin link khusus ini ke WhatsApp/HP Anda jika membuka via Vercel tanpa GitHub push ulang.</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyDeviceLink}
                      className="px-3 py-1.5 rounded-lg bg-[#024a77] hover:bg-[#035b91] text-white text-[11px] font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      {isDeviceLinkCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Link Disalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Link Perangkat Lain</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Notifikasi Perbaikan Otomatis URL */}
                {fixNotification && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{fixNotification}</span>
                  </div>
                )}
              </div>

              {/* Feedback Tes Koneksi */}
              {testResult && (
                <div className="space-y-3">
                  <div
                    className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
                      testResult.success
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-rose-50 text-rose-900 border border-rose-300'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="font-bold whitespace-pre-line leading-relaxed">
                        {testResult.message}
                      </div>

                      {/* Tombol Uji Langsung di Tab Baru jika gagal */}
                      {!testResult.success && url.trim() && (
                        <div className="pt-2 flex flex-wrap items-center gap-2">
                          <a
                            href={url.includes('?') ? `${url}&action=ping` : `${url}?action=ping`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-800 hover:bg-rose-100 text-[11px] font-bold shadow-2xs transition-colors"
                          >
                            <span>Buka URL di Tab Baru untuk Cek Langsung</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Kartu Solusi Khusus Failed to fetch */}
                  {!testResult.success && (
                    <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 text-amber-950 space-y-2.5 text-xs">
                      <div className="font-bold flex items-center gap-2 text-amber-900">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Cara Mengatasi "Failed to fetch" (3 Langkah Saja):</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-1.5 text-slate-700 text-[11px] pl-1 leading-relaxed">
                        <li>
                          Buka Google Sheet Anda, klik menu <strong>Ekstensi</strong> &gt; <strong>Apps Script</strong>.
                        </li>
                        <li>
                          Klik tombol biru <strong>Deploy</strong> di kanan atas &gt; pilih <strong>Kelola Deployment</strong> (<em>Manage deployments</em>).
                        </li>
                        <li>
                          Klik ikon <strong>Pensil (Ubah)</strong> pada deployment aktif:
                          <div className="mt-1 p-2 rounded-lg bg-white border border-amber-200 font-medium text-slate-800">
                            Ubah <strong>"Yang memiliki akses" (<em>Who has access</em>)</strong> menjadi: 
                            <span className="font-bold text-rose-700 ml-1">Siapa saja (Anyone)</span>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              *Jika disetel "Hanya saya", Google menolak koneksi web luar dan menyebabkan error "Failed to fetch".
                            </div>
                          </div>
                        </li>
                        <li>
                          Pada kolom Versi, pilih <strong>Versi Baru</strong> (<em>New version</em>), lalu klik <strong>Deploy</strong>.
                        </li>
                        <li>
                          Salin URL Web App yang baru (akhiran <code>/exec</code>) dan klik <strong>Simpan & Tes</strong> kembali di sini!
                        </li>
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {/* Opsi Sinkronisasi Otomatis */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Sinkronisasi Otomatis Real-Time
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Otomatis kirim setiap kali Anda mencatat pemasukan atau pengeluaran baru
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => handleToggleAutoSync(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Penjelasan Fitur Hapus 2 Arah */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/90 text-amber-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                  <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Dukungan Hapus Dua Arah (Aplikasi & Google Sheets):</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] leading-relaxed">
                  <div className="p-2.5 rounded-xl bg-white/90 border border-amber-200/60 space-y-1">
                    <span className="font-bold text-rose-700 block">1. Hapus dari DompetKu</span>
                    <p className="text-slate-600">
                      Cukup klik tombol Hapus pada transaksi di DompetKu, baris di Google Sheets <strong>otomatis terhapus langsung</strong> secara instan.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/90 border border-amber-200/60 space-y-1">
                    <span className="font-bold text-emerald-800 block">2. Hapus dari Spreadsheet</span>
                    <p className="text-slate-600">
                      Jika Anda menghapus baris di Google Sheets, klik tombol <strong>"Tarik Data dari Sheets"</strong> di bawah agar data di DompetKu otomatis terhapus.
                    </p>
                  </div>
                </div>
              </div>

              {/* Grid 2 Aksi Sinkronisasi: TARIK & KIRIM */}
              <div className="grid grid-cols-1 gap-3">
                {/* AKSI 1: TARIK DATA DARI SPREADSHEET (PULL) */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-white border border-emerald-200 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tarik Data dari Google Sheets (Perbarui Aplikasi)</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Ambil data dari Google Sheets ke DompetKu. Baris yang telah Anda hapus di spreadsheet akan otomatis terhapus dari aplikasi.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      onClick={handlePullFromSheets}
                      disabled={isPulling || !url.trim()}
                      className="px-4 py-2.5 rounded-xl bg-[#024a77] hover:bg-[#035b91] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                    >
                      {isPulling ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Menarik Data dari Sheets...</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownToLine className="w-4 h-4" />
                          <span>Tarik Data dari Google Sheets</span>
                        </>
                      )}
                    </button>

                    <a
                      href="https://sheets.google.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-[#024a77] hover:underline flex items-center gap-1"
                    >
                      <span>Buka Google Sheets</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Feedback Tarik Data */}
                  {pullResult && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        pullResult.success
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {pullResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                      )}
                      <span>{pullResult.message}</span>
                    </div>
                  )}
                </div>

                {/* AKSI 2: KIRIM SEMUA DATA KE SPREADSHEET (PUSH) */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-white border border-sky-200 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Kirim Semua Catatan Saat Ini ke Google Sheets</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Mencadangkan seluruh {transactions.length} transaksi, {accounts.length} akun, dan anggaran yang ada saat ini.
                      </p>
                    </div>
                    {lastSync && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        Terakhir: {new Date(lastSync).toLocaleTimeString('id-ID')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={handleSyncAll}
                      disabled={isSyncing || !url.trim()}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                    >
                      {isSyncing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Mengirim ke Google Sheets...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Kirim Semua Data Sekarang</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Feedback Kirim Data */}
                  {syncResult && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        syncResult.success
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {syncResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                      )}
                      <span>{syncResult.message}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 2: SALIN SKRIP & PANDUAN CEPAT
              ========================================================================= */}
          {activeTab === 'script' && (
            <div className="space-y-4">
              {/* Langkah Pemasangan */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-[#024a77]" />
                  <span>Panduan Pemasangan Skrip (1 Menit Selesai):</span>
                </span>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 leading-relaxed">
                  <li>
                    Buka spreadsheet baru di:{' '}
                    <a
                      href="https://sheets.new"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#024a77] font-bold underline inline-flex items-center gap-1"
                    >
                      <span>https://sheets.new</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>
                    Di menu atas Google Sheets, klik menu <strong>Ekstensi</strong> (<em>Extensions</em>) &gt; <strong>Apps Script</strong>.
                  </li>
                  <li>
                    Hapus semua tulisan di editor kode, lalu klik tombol kuning <strong>"Salin Seluruh Skrip"</strong> di bawah ini dan <strong>Paste (Tempel)</strong> ke editor.
                  </li>
                  <li>
                    Di pojok kanan atas, klik tombol biru <strong>Deploy</strong> &gt; pilih <strong>Deployment baru</strong> (<em>New deployment</em>).
                  </li>
                  <li>
                    Pilih tipe <strong>Aplikasi Web</strong> (<em>Web app</em>). Atur:
                    <ul className="list-disc list-inside pl-4 pt-1 font-semibold text-slate-800">
                      <li>Jalankan sebagai: <em>Saya (Email Google Anda)</em></li>
                      <li>Yang memiliki akses: <strong>Siapa saja (Anyone)</strong> <span className="text-rose-600 font-bold">*Wajib agar Vercel & DompetKu bisa terhubung</span></li>
                    </ul>
                  </li>
                  <li>
                    Klik <strong>Deploy</strong>, izinkan akses akun Google Anda, lalu salin <strong>URL Aplikasi Web</strong> (akhiran <code>/exec</code>) dan masukkan ke tab "Koneksi".
                  </li>
                </ol>
              </div>

              {/* Code Box & Copy Button */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Skrip Google Apps Script (Code.gs):
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                      isCopied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#fbb016] hover:bg-[#f59e0b] text-slate-950'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Berhasil Disalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Seluruh Skrip</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative rounded-2xl bg-slate-900 border border-slate-800 p-3.5 text-slate-200 font-mono text-[11px] leading-relaxed max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre">{googleAppsScriptCode}</pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Data tetap aman tersimpan di perangkat lokal Anda setiap saat.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
