import { Account, Budget, Transaction } from '../types/finance';

const KEYS = {
  WEBAPP_URL: 'dompetku_sheets_webapp_url',
  AUTO_SYNC: 'dompetku_sheets_auto_sync_v2',
  LAST_SYNC: 'dompetku_sheets_last_sync',
  PENDING_PUSH: 'dompetku_sheets_pending_push',
  LAST_SYNCED_COUNT: 'dompetku_sheets_last_tx_count',
};

export function hasPendingPush(): boolean {
  try {
    return localStorage.getItem(KEYS.PENDING_PUSH) === 'true';
  } catch {
    return false;
  }
}

export function setPendingPush(pending: boolean): void {
  try {
    localStorage.setItem(KEYS.PENDING_PUSH, pending ? 'true' : 'false');
  } catch {
    // ignore
  }
}

export function getLastSyncedTxCount(): number {
  try {
    return parseInt(localStorage.getItem(KEYS.LAST_SYNCED_COUNT) || '0', 10) || 0;
  } catch {
    return 0;
  }
}

export function setLastSyncedTxCount(count: number): void {
  try {
    localStorage.setItem(KEYS.LAST_SYNCED_COUNT, String(count));
  } catch {
    // ignore
  }
}

/**
 * Normalisasi dan perbaikan otomatis URL Google Apps Script
 */
export function normalizeSheetsUrl(rawUrl: string): {
  url: string;
  autoFixed: boolean;
  fixNote?: string;
  error?: string;
} {
  let url = rawUrl.trim().replace(/^["']|["']$/g, '').replace(/[:;\s]+$/, '');
  if (!url) {
    return { url: '', autoFixed: false, error: 'URL Google Apps Script tidak boleh kosong.' };
  }

  let autoFixed = false;
  let fixNote = '';

  // 1. Jika pengguna menyalin URL dari halaman editor browser (.../edit)
  if (url.includes('/edit')) {
    url = url.replace(/\/edit.*$/, '/exec');
    autoFixed = true;
    fixNote = 'URL otomatis diperbaiki dari /edit menjadi /exec.';
  }

  // 2. Jika pengguna menyalin URL developer (.../dev)
  if (url.includes('/dev')) {
    url = url.replace(/\/dev.*$/, '/exec');
    autoFixed = true;
    fixNote = 'URL otomatis diperbaiki dari /dev menjadi /exec.';
  }

  // 3. Jika URL belum berakhiran /exec
  if (url.startsWith('https://script.google.com/macros/s/')) {
    if (url.includes('?')) {
      const [base, query] = url.split('?');
      if (!base.endsWith('/exec')) {
        url = `${base.replace(/\/+$/, '')}/exec?${query}`;
        autoFixed = true;
        fixNote = 'Ditambahkan akhiran /exec pada URL.';
      }
    } else if (!url.endsWith('/exec')) {
      url = `${url.replace(/\/+$/, '')}/exec`;
      autoFixed = true;
      fixNote = 'Ditambahkan akhiran /exec pada URL.';
    }
  } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
    // Jika user hanya menempelkan ID script
    if (url.startsWith('AKfyc')) {
      url = `https://script.google.com/macros/s/${url.replace(/\/+$/, '')}/exec`;
      autoFixed = true;
      fixNote = 'Format URL lengkap Google Apps Script dibuatkan secara otomatis.';
    }
  }

  return { url, autoFixed, fixNote };
}

export function getSavedSheetsUrl(): string {
  try {
    return localStorage.getItem(KEYS.WEBAPP_URL) || '';
  } catch {
    return '';
  }
}

export function saveSheetsUrl(url: string): string {
  try {
    const { url: cleanUrl } = normalizeSheetsUrl(url);
    localStorage.setItem(KEYS.WEBAPP_URL, cleanUrl);
    // Aktifkan sinkronisasi otomatis secara default saat URL disimpan
    if (localStorage.getItem(KEYS.AUTO_SYNC) === null) {
      localStorage.setItem(KEYS.AUTO_SYNC, 'true');
    }
    return cleanUrl;
  } catch (err) {
    console.error('Failed to save Google Sheets URL:', err);
    return url;
  }
}

export function isAutoSyncEnabled(): boolean {
  try {
    const val = localStorage.getItem(KEYS.AUTO_SYNC);
    // Default aktif (true) kecuali pengguna sengaja mematikan ('false')
    return val !== 'false';
  } catch {
    return true;
  }
}

export function setAutoSyncEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(KEYS.AUTO_SYNC, enabled ? 'true' : 'false');
  } catch (err) {
    console.error('Failed to save auto-sync status:', err);
  }
}

export function getLastSyncTime(): string | null {
  try {
    return localStorage.getItem(KEYS.LAST_SYNC);
  } catch {
    return null;
  }
}

export function setLastSyncTime(): void {
  try {
    localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
  } catch (err) {
    console.error('Failed to save last sync time:', err);
  }
}

/**
 * Normalisasi baris transaksi yang ditarik dari Google Sheets
 * (Mendukung input manual langsung dari spreadsheet seperti menulis "Dompet Tunai", "Rekening", "Pengeluaran", "Pemasukan")
 */
function normalizeSheetTransactions(rawList: any[]): Transaction[] {
  if (!Array.isArray(rawList)) return [];
  const today = new Date().toISOString().slice(0, 10);

  const mapAccountRef = (rawAcc: any): string => {
    const s = String(rawAcc || '').trim();
    if (!s) return 'acc_cash';
    const lower = s.toLowerCase();
    if (s === 'acc_cash' || lower.includes('tunai') || lower.includes('dompet') || lower.includes('kas') || lower.includes('cash')) {
      return 'acc_cash';
    }
    if (s === 'acc_bca' || lower.includes('rekening') || lower.includes('bank') || lower.includes('bca') || lower.includes('mandiri') || lower.includes('bri') || lower.includes('bni')) {
      return 'acc_bca';
    }
    return s;
  };

  const mapTxType = (rawType: any): 'income' | 'expense' | 'transfer' => {
    const lower = String(rawType || '').trim().toLowerCase();
    if (lower === 'income' || lower.includes('pemasukan') || lower.includes('masuk') || lower === '+') {
      return 'income';
    }
    if (lower === 'transfer' || lower.includes('pindah') || lower.includes('mutasi')) {
      return 'transfer';
    }
    return 'expense';
  };

  return rawList
    .map((item, idx) => {
      const rawAmount = item.amount;
      const amount =
        typeof rawAmount === 'number'
          ? rawAmount
          : parseFloat(String(rawAmount || '0').replace(/[^0-9.-]+/g, '')) || 0;

      const desc = String(item.description || '').trim();
      const id = String(item.id || '').trim() || `tx_sheet_${item.date || today}_${idx}`;

      // Abaikan baris kosong tanpa nominal dan tanpa deskripsi
      if (amount === 0 && !desc && !item.id) {
        return null;
      }

      let dateStr = String(item.date || '').trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          dateStr = parsed.toISOString().slice(0, 10);
        } else {
          dateStr = today;
        }
      }

      const type = mapTxType(item.type);
      const accountId = mapAccountRef(item.accountId);
      const toAccountId = item.toAccountId ? mapAccountRef(item.toAccountId) : undefined;

      return {
        id,
        date: dateStr,
        time: String(item.time || '12:00').trim(),
        type,
        amount: Math.abs(amount),
        category: String(item.category || (type === 'income' ? 'Pemasukan Lainnya' : type === 'transfer' ? 'Transfer' : 'Lain-lain')).trim(),
        accountId,
        toAccountId: type === 'transfer' ? (toAccountId || (accountId === 'acc_bca' ? 'acc_cash' : 'acc_bca')) : undefined,
        description: desc || (type === 'income' ? 'Pemasukan' : type === 'transfer' ? 'Transfer Saldo' : 'Pengeluaran'),
        notes: String(item.notes || '').trim() || undefined,
      } as Transaction;
    })
    .filter((t): t is Transaction => t !== null);
}

/**
 * Normalisasi akun yang ditarik dari Google Sheets agar tetap sinkron dengan Dompet Tunai & Rekening
 */
function normalizeSheetAccounts(rawAccounts: any[]): Account[] | undefined {
  if (!Array.isArray(rawAccounts) || rawAccounts.length === 0) return undefined;

  let cashBalance = 0;
  let bankBalance = 0;

  for (const a of rawAccounts) {
    const id = String(a.id || '').trim().toLowerCase();
    const name = String(a.name || '').trim().toLowerCase();
    const type = String(a.type || '').trim().toLowerCase();
    const bal =
      typeof a.initialBalance === 'number'
        ? a.initialBalance
        : parseFloat(String(a.initialBalance || '0').replace(/[^0-9.-]+/g, '')) || 0;

    if (id === 'acc_cash' || type === 'cash' || name.includes('tunai') || name.includes('dompet') || name.includes('kas')) {
      cashBalance += bal;
    } else {
      bankBalance += bal;
    }
  }

  return [
    {
      id: 'acc_cash',
      name: 'Dompet Tunai',
      type: 'cash',
      initialBalance: cashBalance,
      color: '#10B981',
      icon: 'Wallet',
    },
    {
      id: 'acc_bca',
      name: 'Rekening',
      type: 'bank',
      accountNumber: '-',
      initialBalance: bankBalance,
      color: '#2563EB',
      icon: 'Building2',
    },
  ];
}

/**
 * Tes koneksi ke URL Google Apps Script Web App
 * Mencoba GET ping terlebih dahulu, jika gagal mencoba POST ping dengan text/plain
 */
export async function testGoogleSheetsConnection(rawUrl: string): Promise<{
  success: boolean;
  message: string;
  normalizedUrl: string;
  fixNote?: string;
}> {
  const { url: cleanUrl, autoFixed, fixNote, error } = normalizeSheetsUrl(rawUrl);

  if (error || !cleanUrl) {
    return {
      success: false,
      message: error || 'URL Google Apps Script tidak valid.',
      normalizedUrl: cleanUrl,
    };
  }

  // Percobaan 1: Menggunakan GET request (?action=ping)
  try {
    const target = cleanUrl.includes('?')
      ? `${cleanUrl}&action=ping`
      : `${cleanUrl}?action=ping`;

    const res = await fetch(target, {
      method: 'GET',
      redirect: 'follow',
    });

    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        return {
          success: true,
          message: data.message || 'Koneksi ke Google Sheets berhasil terhubung!',
          normalizedUrl: cleanUrl,
          fixNote: autoFixed ? fixNote : undefined,
        };
      }
    }
  } catch (e1) {
    console.warn('GET ping ke Google Apps Script gagal, mencoba metode POST...', e1);
  }

  // Percobaan 2: Menggunakan POST request dengan text/plain (bebas preflight OPTIONS CORS)
  try {
    const res2 = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'ping' }),
      redirect: 'follow',
    });

    if (res2.ok) {
      const data2 = await res2.json();
      if (data2.status === 'success') {
        return {
          success: true,
          message: data2.message || 'Koneksi ke Google Sheets berhasil terhubung!',
          normalizedUrl: cleanUrl,
          fixNote: autoFixed ? fixNote : undefined,
        };
      }
    }
  } catch (e2) {
    console.warn('POST ping ke Google Apps Script juga gagal:', e2);
  }

  const diagnosticMsg =
    'Gagal terkoneksi (Failed to fetch). Penyebab umum:\n' +
    '1. "Who has access" (Siapa yang memiliki akses) BELUM disetel ke "Anyone" (Siapa saja) saat Deploy Web App.\n' +
    '2. URL belum berakhiran "/exec" atau masih merupakan link editor (/edit).\n' +
    '3. Belum klik "Beri Akses / Izinkan" pada akun Google saat Deploy.';

  return {
    success: false,
    message: diagnosticMsg,
    normalizedUrl: cleanUrl,
    fixNote: autoFixed ? fixNote : undefined,
  };
}

/**
 * Mengirim seluruh data transaksi, akun, dan anggaran ke Google Sheets (Sinkronisasi Penuh)
 * Menggunakan action 'syncAll' yang kompatibel dengan semua versi skrip Google Apps Script.
 */
export async function syncAllToGoogleSheets(
  rawUrl: string,
  data: {
    transactions: Transaction[];
    accounts: Account[];
    budgets: Budget[];
  }
): Promise<{ success: boolean; message: string }> {
  const { url: cleanUrl } = normalizeSheetsUrl(rawUrl);
  if (!cleanUrl) {
    return { success: false, message: 'URL Google Sheets belum diatur.' };
  }

  // Format transaksi agar kolom Tipe dan Akun di Spreadsheet tampil rapi & mudah dibaca
  const formattedTransactions = data.transactions.map((t) => ({
    ...t,
    type:
      t.type === 'income'
        ? 'Pemasukan'
        : t.type === 'transfer'
        ? 'Transfer'
        : 'Pengeluaran',
    accountId:
      t.accountId === 'acc_cash'
        ? 'Dompet Tunai'
        : t.accountId === 'acc_bca'
        ? 'Rekening'
        : t.accountId,
    toAccountId:
      t.toAccountId === 'acc_cash'
        ? 'Dompet Tunai'
        : t.toAccountId === 'acc_bca'
        ? 'Rekening'
        : t.toAccountId || '',
  }));

  const payloadStr = JSON.stringify({
    action: 'syncAll',
    transactions: formattedTransactions,
    accounts: data.accounts,
    budgets: data.budgets,
  });

  try {
    const res = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: payloadStr,
      redirect: 'follow',
    });

    const result = await res.json();
    if (result.status === 'success') {
      setLastSyncTime();
      setPendingPush(false);
      setLastSyncedTxCount(data.transactions.length);
      return {
        success: true,
        message: result.message || `Berhasil menyinkronkan ${data.transactions.length} transaksi ke Google Sheets!`,
      };
    } else {
      return {
        success: false,
        message: result.message || 'Gagal menyimpan ke Google Sheets.',
      };
    }
  } catch (err: any) {
    // Fallback mode no-cors jika browser memblokir redirect response dari script.googleusercontent.com
    try {
      await fetch(cleanUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: payloadStr,
      });
      setLastSyncTime();
      setPendingPush(false);
      setLastSyncedTxCount(data.transactions.length);
      return {
        success: true,
        message: `Data (${data.transactions.length} transaksi) berhasil dikirim ke Google Sheets!`,
      };
    } catch {
      return {
        success: false,
        message:
          'Gagal mengirim data. Pastikan pengaturan "Who has access" pada Web App adalah "Anyone" (Siapa saja).',
      };
    }
  }
}

/**
 * Mengirim atau memperbarui 1 transaksi langsung ke Google Sheets secara real-time
 */
export async function saveTransactionToSheets(
  rawUrl: string,
  tx: Transaction
): Promise<{ success: boolean; message: string }> {
  const { url: cleanUrl } = normalizeSheetsUrl(rawUrl);
  if (!cleanUrl) return { success: false, message: 'URL belum diatur' };

  const formattedTx = {
    ...tx,
    type:
      tx.type === 'income'
        ? 'Pemasukan'
        : tx.type === 'transfer'
        ? 'Transfer'
        : 'Pengeluaran',
    accountId:
      tx.accountId === 'acc_cash'
        ? 'Dompet Tunai'
        : tx.accountId === 'acc_bca'
        ? 'Rekening'
        : tx.accountId,
    toAccountId:
      tx.toAccountId === 'acc_cash'
        ? 'Dompet Tunai'
        : tx.toAccountId === 'acc_bca'
        ? 'Rekening'
        : tx.toAccountId || '',
  };

  try {
    const res = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'addTransaction',
        transaction: formattedTx,
      }),
      redirect: 'follow',
    });
    const data = await res.json();
    if (data.status === 'success') {
      setLastSyncTime();
    }
    return { success: data.status === 'success', message: data.message || 'OK' };
  } catch (e: any) {
    console.warn('Gagal simpan ke Google Sheets (transaksi tetap aman di lokal):', e);
    return { success: false, message: e?.message || 'Gagal tersambung' };
  }
}

/**
 * Kompatibilitas alias untuk appendTransactionToSheets
 */
export async function appendTransactionToSheets(
  rawUrl: string,
  tx: Transaction
): Promise<void> {
  await saveTransactionToSheets(rawUrl, tx);
}

/**
 * Menghapus baris transaksi dari Google Sheets saat dihapus dari aplikasi DompetKu
 */
export async function removeTransactionFromSheets(
  rawUrl: string,
  transactionId: string
): Promise<{ success: boolean; message: string }> {
  const { url: cleanUrl } = normalizeSheetsUrl(rawUrl);
  if (!cleanUrl) return { success: false, message: 'URL belum diatur' };

  try {
    const res = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'deleteTransaction',
        id: transactionId,
      }),
      redirect: 'follow',
    });
    const data = await res.json();
    if (data.status === 'success') {
      setLastSyncTime();
    }
    return { success: data.status === 'success', message: data.message || 'Berhasil dihapus dari Google Sheets' };
  } catch (e: any) {
    console.warn('Gagal menghapus dari Google Sheets:', e);
    return { success: false, message: e?.message || 'Gagal menghapus dari Google Sheets' };
  }
}

/**
 * Mengambil (Tarik) seluruh data transaksi, akun, dan anggaran dari Google Sheets.
 * Mendukung sinkronisasi dua arah otomatis (tambah, ubah, atau hapus dari spreadsheet).
 */
export async function fetchDataFromGoogleSheets(
  rawUrl: string
): Promise<{
  success: boolean;
  message: string;
  transactions?: Transaction[];
  accounts?: Account[];
  budgets?: Budget[];
}> {
  const { url: cleanUrl } = normalizeSheetsUrl(rawUrl);
  if (!cleanUrl) {
    return { success: false, message: 'URL Google Sheets belum diatur.' };
  }

  // Percobaan 1: Menggunakan GET request (?action=getData)
  try {
    const target = cleanUrl.includes('?')
      ? `${cleanUrl}&action=getData&_t=${Date.now()}`
      : `${cleanUrl}?action=getData&_t=${Date.now()}`;

    const res = await fetch(target, {
      method: 'GET',
      redirect: 'follow',
    });

    if (res.ok) {
      const result = await res.json();
      if (result.status === 'success' && result.data) {
        setLastSyncTime();
        const normalizedTxs = normalizeSheetTransactions(result.data.transactions || []);
        const normalizedAccs = normalizeSheetAccounts(result.data.accounts || []);
        return {
          success: true,
          message: `Berhasil menyinkronkan ${normalizedTxs.length} transaksi dari Google Sheets!`,
          transactions: normalizedTxs,
          accounts: normalizedAccs,
          budgets: Array.isArray(result.data.budgets) ? result.data.budgets : undefined,
        };
      }
    }
  } catch (errGet) {
    console.warn('GET getData gagal, mencoba metode POST...', errGet);
  }

  // Percobaan 2: Menggunakan POST request (bebas CORS)
  try {
    const resPost = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'getData' }),
      redirect: 'follow',
    });

    if (resPost.ok) {
      const resultPost = await resPost.json();
      if (resultPost.status === 'success' && resultPost.data) {
        setLastSyncTime();
        const normalizedTxs = normalizeSheetTransactions(resultPost.data.transactions || []);
        const normalizedAccs = normalizeSheetAccounts(resultPost.data.accounts || []);
        return {
          success: true,
          message: `Berhasil menyinkronkan ${normalizedTxs.length} transaksi dari Google Sheets!`,
          transactions: normalizedTxs,
          accounts: normalizedAccs,
          budgets: Array.isArray(resultPost.data.budgets) ? resultPost.data.budgets : undefined,
        };
      }
    }
  } catch (errPost) {
    console.warn('POST getData juga gagal:', errPost);
  }

  return {
    success: false,
    message: 'Gagal mengambil data dari Google Sheets. Pastikan akses Web App adalah "Anyone" (Siapa saja).',
  };
}
