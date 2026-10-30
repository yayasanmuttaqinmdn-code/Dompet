/**
 * =========================================================================================
 * SKRIP GOOGLE APPS SCRIPT UNTUK DATABASE DUA ARAH DOMPETKU
 * Mendukung tambah, edit, dan hapus dari aplikasi maupun langsung dari spreadsheet!
 * =========================================================================================
 * 
 * CARA MEMASANG / MEMPERBARUI:
 * 1. Buka Google Sheet Anda: https://sheets.google.com
 * 2. Klik menu: "Ekstensi" (Extensions) -> "Apps Script"
 * 3. Hapus semua kode yang ada, lalu TEMPELKAN (PASTE) seluruh kode ini.
 * 4. Klik ikon Disket (Simpan).
 * 5. Klik tombol biru "Deploy" di kanan atas -> pilih "Kelola Deployment" (Manage deployments).
 * 6. Klik ikon PENSIL (Ubah), lalu:
 *    - Versi: pilih "Versi Baru" (New Version)
 *    - Yang memiliki akses (Who has access): pilih "Siapa saja" (Anyone)  <-- WAJIB!
 * 7. Klik "Deploy", salin URL Web App yang berakhiran "/exec" dan simpan di DompetKu!
 * =========================================================================================
 */

var SHEET_TRANSAKSI = "Transaksi";
var SHEET_AKUN = "Akun";
var SHEET_ANGGARAN = "Anggaran";

/**
 * Menangani permintaan HTTP GET (Tes Koneksi & Ambil Data Dua Arah)
 */
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "ping";

    // Tes Koneksi
    if (action === "ping") {
      return createJsonResponse({
        status: "success",
        message: "Koneksi Google Sheets DompetKu Aktif & Berhasil Terhubung!",
        timestamp: new Date().toISOString()
      });
    }

    // Ambil seluruh data dari Google Sheets (Jika baris dihapus di Sheets, aplikasi akan menyesuaikan)
    if (action === "getData") {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var txSheet = getOrCreateSheet(ss, SHEET_TRANSAKSI);
      var accSheet = getOrCreateSheet(ss, SHEET_AKUN);

      var transactions = readSheetTransactions(txSheet);
      var accounts = readSheetAccounts(accSheet);

      return createJsonResponse({
        status: "success",
        data: {
          transactions: transactions,
          accounts: accounts
        }
      });
    }

    return createJsonResponse({
      status: "error",
      message: "Aksi GET tidak dikenali: " + action
    });

  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.toString()
    });
  }
}

/**
 * Menangani permintaan HTTP POST (Simpan, Sinkronisasi Penuh, Tambah/Hapus Transaksi)
 */
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

    // 0. Tes Koneksi (PING via POST)
    if (action === "ping") {
      return createJsonResponse({
        status: "success",
        message: "Koneksi Google Sheets DompetKu Aktif & Berhasil Terhubung!",
        timestamp: new Date().toISOString()
      });
    }

    // 1. AMBIL DATA TERBARU DARI SPREADSHEET (Tarik Data)
    if (action === "getData") {
      var txSheet = getOrCreateSheet(ss, SHEET_TRANSAKSI);
      var accSheet = getOrCreateSheet(ss, SHEET_AKUN);

      var transactions = readSheetTransactions(txSheet);
      var accounts = readSheetAccounts(accSheet);

      return createJsonResponse({
        status: "success",
        data: {
          transactions: transactions,
          accounts: accounts
        }
      });
    }

    // 2. SINKRONISASI SEMUA DATA (Kirim Lengkap dari Aplikasi ke Sheets)
    if (action === "syncAll") {
      var txList = payload.transactions || [];
      var accList = payload.accounts || [];
      var bgList = payload.budgets || [];

      // Simpan Lembar Transaksi
      var txSheet = getOrCreateSheet(ss, SHEET_TRANSAKSI);
      txSheet.clear();
      var txHeaders = ["ID", "Tanggal", "Waktu", "Tipe", "Jumlah", "Kategori", "Akun Asal", "Akun Tujuan", "Deskripsi", "Catatan"];
      txSheet.appendRow(txHeaders);
      formatHeaderRow(txSheet, txHeaders.length, "#024a77");

      if (txList.length > 0) {
        var txRows = txList.map(function(t) {
          return [
            t.id || "",
            t.date || "",
            t.time || "",
            t.type || "",
            t.amount || 0,
            t.category || "",
            t.accountId || "",
            t.toAccountId || "",
            t.description || "",
            t.notes || ""
          ];
        });
        txSheet.getRange(2, 1, txRows.length, txHeaders.length).setValues(txRows);
        txSheet.getRange(2, 5, txRows.length, 1).setNumberFormat('"Rp"#,##0');
      }

      // Simpan Lembar Akun
      var accSheet = getOrCreateSheet(ss, SHEET_AKUN);
      accSheet.clear();
      var accHeaders = ["ID Akun", "Nama Akun", "Tipe", "Nomor Rekening", "Saldo Awal", "Warna"];
      accSheet.appendRow(accHeaders);
      formatHeaderRow(accSheet, accHeaders.length, "#035b91");

      if (accList.length > 0) {
        var accRows = accList.map(function(a) {
          return [
            a.id || "",
            a.name || "",
            a.type || "",
            a.accountNumber || "-",
            a.initialBalance || 0,
            a.color || ""
          ];
        });
        accSheet.getRange(2, 1, accRows.length, accHeaders.length).setValues(accRows);
        accSheet.getRange(2, 5, accRows.length, 1).setNumberFormat('"Rp"#,##0');
      }

      // Simpan Lembar Anggaran
      var bgSheet = getOrCreateSheet(ss, SHEET_ANGGARAN);
      bgSheet.clear();
      var bgHeaders = ["ID Anggaran", "Bulan", "Kategori", "Batas Anggaran"];
      bgSheet.appendRow(bgHeaders);
      formatHeaderRow(bgSheet, bgHeaders.length, "#fbb016", "#000000");

      if (bgList.length > 0) {
        var bgRows = bgList.map(function(b) {
          return [
            b.id || "",
            b.month || "",
            b.category || "",
            b.monthlyLimit || 0
          ];
        });
        bgSheet.getRange(2, 1, bgRows.length, bgHeaders.length).setValues(bgRows);
        bgSheet.getRange(2, 4, bgRows.length, 1).setNumberFormat('"Rp"#,##0');
      }

      return createJsonResponse({
        status: "success",
        message: "Berhasil menyinkronkan " + txList.length + " transaksi ke Google Sheets!"
      });
    }

    // 3. TAMBAH ATAU PERBARUI 1 TRANSAKSI
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
          existingRow = r + 1; // 1-indexed
          break;
        }
      }

      var rowData = [
        t.id || "",
        t.date || "",
        t.time || "",
        t.type || "",
        t.amount || 0,
        t.category || "",
        t.accountId || "",
        t.toAccountId || "",
        t.description || "",
        t.notes || ""
      ];

      if (existingRow > 1) {
        // Perbarui baris yang ada
        txSheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
        txSheet.getRange(existingRow, 5).setNumberFormat('"Rp"#,##0');
        return createJsonResponse({
          status: "success",
          message: "Transaksi berhasil diperbarui di Google Sheets!"
        });
      } else {
        // Tambahkan baris baru di bawah
        txSheet.appendRow(rowData);
        var lastRow = txSheet.getLastRow();
        txSheet.getRange(lastRow, 5).setNumberFormat('"Rp"#,##0');
        return createJsonResponse({
          status: "success",
          message: "Transaksi baru berhasil ditambahkan ke Google Sheets!"
        });
      }
    }

    // 4. HAPUS TRANSAKSI DARI SPREADSHEET (Dipicu saat dihapus dari aplikasi)
    if (action === "deleteTransaction") {
      var idToDelete = payload.id;
      var txSheet = getOrCreateSheet(ss, SHEET_TRANSAKSI);
      var values = txSheet.getDataRange().getValues();
      var foundRow = -1;

      for (var r = 1; r < values.length; r++) {
        if (values[r][0] == idToDelete) {
          foundRow = r + 1; // 1-indexed
          break;
        }
      }

      if (foundRow > 1) {
        txSheet.deleteRow(foundRow);
        return createJsonResponse({
          status: "success",
          message: "Transaksi berhasil dihapus dari Google Sheets."
        });
      }

      return createJsonResponse({
        status: "success",
        message: "ID transaksi tidak ditemukan di spreadsheet (mungkin sudah dihapus)."
      });
    }

    return createJsonResponse({
      status: "error",
      message: "Aksi tidak dikenali: " + action
    });

  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.toString()
    });
  }
}

/**
 * Helper: Ambil atau buat sheet jika belum ada
 */
function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

/**
 * Helper: Beri gaya header yang rapi dan profesional
 */
function formatHeaderRow(sheet, colCount, bgColor, textColor) {
  var headerRange = sheet.getRange(1, 1, 1, colCount);
  headerRange.setBackground(bgColor || "#024a77");
  headerRange.setFontColor(textColor || "#ffffff");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
}

/**
 * Helper: Membaca transaksi dari spreadsheet secara cerdas (mendukung format Date dan angka)
 */
function readSheetTransactions(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  var results = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var id = String(row[0] || "").trim();
    if (!id) continue; // Lewati baris kosong atau yang terhapus

    var dateVal = row[1];
    var dateStr = "";
    if (dateVal instanceof Date) {
      dateStr = Utilities.formatDate(dateVal, Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd");
    } else {
      dateStr = String(dateVal || "").trim();
    }

    var timeVal = row[2];
    var timeStr = "";
    if (timeVal instanceof Date) {
      timeStr = Utilities.formatDate(timeVal, Session.getScriptTimeZone() || "GMT+7", "HH:mm");
    } else {
      timeStr = String(timeVal || "").trim();
    }

    var amountVal = row[4];
    var numAmount = 0;
    if (typeof amountVal === "number") {
      numAmount = amountVal;
    } else {
      numAmount = parseFloat(String(amountVal).replace(/[^0-9.-]/g, "")) || 0;
    }

    results.push({
      id: id,
      date: dateStr,
      time: timeStr,
      type: String(row[3] || "expense").trim(),
      amount: numAmount,
      category: String(row[5] || "Lainnya").trim(),
      accountId: String(row[6] || "").trim(),
      toAccountId: String(row[7] || "").trim(),
      description: String(row[8] || "").trim(),
      notes: String(row[9] || "").trim()
    });
  }

  return results;
}

/**
 * Helper: Membaca daftar akun dari spreadsheet
 */
function readSheetAccounts(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  var results = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var id = String(row[0] || "").trim();
    if (!id) continue;

    var initBal = row[4];
    var numBal = typeof initBal === "number" ? initBal : (parseFloat(String(initBal).replace(/[^0-9.-]/g, "")) || 0);

    results.push({
      id: id,
      name: String(row[1] || "").trim(),
      type: String(row[2] || "bank").trim(),
      accountNumber: String(row[3] || "").trim(),
      initialBalance: numBal,
      color: String(row[5] || "#024a77").trim()
    });
  }

  return results;
}

/**
 * Helper: Mengembalikan response JSON dengan header CORS yang tepat
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
