# Rencana Desain Antarmuka Simpel & Tata Letak Responsif DompetKu

Aplikasi keuangan pribadi DompetKu akan diperbarui dengan bahasa sehari-hari yang ramah (bebas istilah perbankan/akuntansi rumit) serta tata letak navigasi modern: **menu samping kiri (sidebar) di laptop** dan **menu navigasi bawah (bottom bar) di HP** untuk kenyamanan penggunaan satu tangan.

> [!IMPORTANT]
> **Keputusan Desain & Rekomendasi:**
> - **Gaya Bahasa**: Diubah menjadi bahasa sehari-hari yang santai untuk penggunaan pribadi (misal: "Total Uang Saya", "Uang Dompet (Cash)", "Uang di Bank", "Sisa Uang Bulan Ini").
> - **Menu Laptop**: Sidebar tetap di sebelah kiri dengan ikon dan teks yang jelas, memberi ruang lapang bagi konten data di sebelah kanan.
> - **Menu HP**: Bottom navigation bar di bagian bawah layar yang mudah dijangkau jempol, lengkap dengan tombol `+` cepat di bagian tengah.

---

## 1. Konsep & Pengalaman Pengguna

### A. Penyederhanaan Bahasa (Personal & Santai)
Istilah teknis diganti dengan bahasa sehari-hari:
- `Total Kekayaan Likuid` → **Total Uang Saya**
- `Uang Kas (Tunai)` → **Uang Dompet (Cash)**
- `Rekening Bank & Digital` → **Uang di Rekening / Bank**
- `Tabungan Bersih (Surplus / Defisit)` → **Sisa Uang Bulan Ini**
- `Buku Catatan Transaksi` → **Riwayat Pengeluaran & Pemasukan**
- `Grafik Visualisasi Keuangan` → **Grafik Pengeluaran & Tren**
- `Tarik Tunai / Transfer Antar Akun` → **Tarik / Pindah Uang**
- `Sumber Dana / Akun` → **Pakai Uang Mana?**
- `Keterangan Transaksi` → **Buat beli apa / dari mana?**

### B. Alur Tampilan Laptop vs HP
```
┌─────────────────────────────────────────────────────────────┐
│ MODE LAPTOP (Desktop View)                                  │
├──────────────┬──────────────────────────────────────────────┤
│ SIDEBAR KIRI │ KONTEN UTAMA (Kanan)                         │
│              │                                              │
│ [DK] DompetKu│ [Pilihan Bulan: Oktober 2026]                │
│              │                                              │
│ • Ringkasan  │ [ Total Uang Saya | Uang Dompet | Di Bank ] │
│ • Transaksi  │                                              │
│ • Grafik     │ [ Ringkasan Bulan Ini (Masuk, Keluar, Sisa)] │
│              │                                              │
│ [+ Catat]    │ [ Grafik Tren & Kategori ]                   │
│ [⇄ Pindah]   │                                              │
│              │ [ Transaksi Terbaru ]                        │
└──────────────┴──────────────────────────────────────────────┘

┌──────────────────────────────────────┐
│ MODE HP (Mobile View)                │
├──────────────────────────────────────┤
│ [DK DompetKu]   [Oktober 2026 ▾]     │
├──────────────────────────────────────┤
│ [ Total Uang Saya ]                  │
│ [ Dompet Cash  |  Di Bank ]          │
│                                      │
│ [ Pemasukan | Pengeluaran | Sisa ]   │
│                                      │
│ [ Grafik Pengeluaran ]               │
│                                      │
│ [ Riwayat Transaksi Terbaru ]        │
│                                      │
├──────────────────────────────────────┤
│ [Ringkasan] [Transaksi] (+) [Grafik] │ <- Bottom Bar (Bawah)
└──────────────────────────────────────┘
```

---

## 2. Rincian Perubahan Komponen

### 1. Komponen Navigasi Baru (`src/components/Navigation.tsx`)
- Menggantikan `Header.tsx` lama.
- **Desktop Sidebar**:
  - Posisi `fixed left-0 top-0 h-screen w-60 bg-white border-r border-slate-200`.
  - Profil/Logo DompetKu di atas.
  - Menu vertikal: *Ringkasan*, *Riwayat Transaksi*, *Grafik & Laporan*.
  - Tombol aksi utama: `+ Catat Uang` dan `Pindah Uang`.
  - Di footer sidebar: status penyimpanan lokal dan tombol muat ulang sampel.
- **Mobile Bottom Navigation**:
  - Posisi `fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 z-40`.
  - Tombol navigasi dengan ikon jempol-mudah:
    1. *Ringkasan* (Ikon Home/Dompet)
    2. *Transaksi* (Ikon List)
    3. *Catat Baru* (Tombol bulat menonjol di tengah)
    4. *Grafik* (Ikon Chart)
    5. *Pindah* (Ikon Transfer)
- **Mobile Top Bar**:
  - Header ringkas di bagian atas HP yang hanya menampilkan nama aplikasi dan tombol ganti bulan.

### 2. Penyesuaian Komponen Ringkasan (`src/components/FinancialOverview.tsx`)
- Teks diperbarui ke kosakata personal ("Total Uang Saya", "Uang Dompet", "Uang di Bank", "Sisa Uang").
- Penataan rapi dan ramah mata tanpa istilah rumit.

### 3. Penyesuaian Riwayat Transaksi (`src/components/TransactionList.tsx`)
- Label kolom dan filter disederhanakan ("Semua", "Uang Dompet", "Bank", "Pemasukan", "Pengeluaran").
- Penyesuaian margin bawah agar konten tidak tertutup oleh bottom navigation bar di HP (`pb-20 md:pb-6`).

### 4. Penyesuaian Grafik (`src/components/ChartsView.tsx`)
- Judul grafik menjadi "Grafik Keuangan Anda".
- Pilihan tab yang jelas: "Tren Bulanan" dan "Pembagian Pengeluaran".

### 5. Penyesuaian Modal Input (`src/components/TransactionModal.tsx` & `TransferModal.tsx`)
- Bahasa formulir lebih santai: "Catat Uang Keluar / Masuk", "Berapa jumlahnya?", "Dari mana uangnya?", "Untuk apa?".

---

## 3. Langkah Verifikasi (Ultra Mode)
1. **Pemeriksaan Logika & Unit Test**: Pastikan semua kalkulasi saldo dan rekapan bulanan tetap 100% lulus melalui `node --test`.
2. **Pemeriksaan Kompilasi**: Jalankan `compile_applet` dan `lint_applet`.
3. **Verifikasi Browser Nyata (Playwright)**:
   - Tampilan Desktop (1440x900): Pastikan sidebar kiri tampil kokoh, rapi, dan konten kanan memiliki margin offset yang pas.
   - Tampilan Mobile (390x844): Pastikan menu samping hilang dan digantikan oleh bilah menu bawah yang menempel di layar HP, dengan tombol tengah berfungsi membuka modal pencatatan.
   - Uji penambahan transaksi dan perpindahan tab di kedua mode.
