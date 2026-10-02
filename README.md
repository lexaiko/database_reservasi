# 🌟 TripBanyuwangi - Executive CRM & Database Reservasi 2026

Aplikasi Web Executive CRM & Manajemen Database Reservasi Wisata TripBanyuwangi berbasis **Next.js 15 (App Router)** yang terintegrasi langsung dengan **Google Sheets API v4**.

Migrasi resmi dari Google Apps Script (GAS) untuk menghilangkan bug timeout, performa lambat, dan duplikasi data, dengan kecepatan akses sub-detik dan siap deploy ke **Vercel**.

---

## 🚀 Fitur Utama Sesuai Notulensi Klien

### 1. Form Input Reservasi Baru (Kolom A s/d N, R, S, T, X, Y, Z, AC)
- **Informasi Dasar Tamu (Kolom A - E)**: Kode Reservasi, Nama Tamu, WhatsApp, Instagram, TikTok.
- **Detail Perjalanan & Destinasi (Kolom F - N)**: Start Trip, Finish Trip, Durasi Trip (hari), Pax, Paket Trip, Checklist Destinasi Day 1 - Day 4.
- **Operasional Kosong di Awal**: Kolom O (MEPO), P (HOTEL), Q (CREW), V (Link Review), W (Link Foto) tidak perlu diisi saat awal masuk reservasi (bisa dilengkapi kemudian melalui modal detail/edit).
- **Tracking PIC & Leads (Kolom S & T)**: PIC Handling (Dela, Alvin, Holiday), Sumber Akuisisi (Instagram, Website, TikTok, dll.).
- **Keuangan & Pembayaran (Kolom X, Y, Z, AC)**: Nilai Order, Jumlah DP, Tanggal DP. Input uang otomatis diformat dengan titik pemisah ribuan (`2.000.000`).

### 2. Otomasi Transisi Status Trip (Kolom U)
- **Default Saat Masuk**: Otomatis bernilai `"On Schedule (Not Ready)"`.
- **Hari H (Start Trip)**: Otomatis berubah menjadi `"On Going"`.
- **Finish Trip Selesai**: Otomatis berubah menjadi `"Finish (On Review)"` jika link review belum diisi.
- **Link Review Terisi (Kolom V)**: Begitu link Google Review diisi, status otomatis beralih menjadi `"Finish (Review)"`.
- **Tombol Auto-Sync**: Sinkronisasi massal seluruh status trip ke spreadsheet hanya dengan 1 kali klik di navbar.

### 3. Otomasi Status Pembayaran (Kolom AC) & Peringatan HPP
- **Status Awal**: Otomatis bernilai `"DP 1"` jika DP < Nilai Order.
- **Lunas**: Jika DP == Nilai Order (atau pelunasan tercapai), status otomatis beralih menjadi `"Lunas"`.
- **Notifikasi Cek HPP**: Jika terdapat kelebihan bayar atau penyesuaian nominal order di kemudian hari, sistem menampilkan badge peringatan kuning di tabel dan banner: *"⚠️ Pembayaran/Order melebihi nominal sebelumnya - Silakan update HPP!"*.

### 4. Pengakuan Penjualan & Filter Berdasarkan Finish Trip
- Dalam akuntansi tour & travel, pendapatan **diakui pada saat kepulangan tamu (Finish Trip)**.
- Filter Dashboard & Tabel memungkinkan pemilihan bulan Finish Trip (Januari s/d Desember 2026), dengan kalkulasi instan untuk:
  - **Omset Penjualan (Revenue)**
  - **Jumlah Trip Diakui**
  - **Total Pax Tamu**
  - **Gross Profit & Gross Margin (%)**
  - **Outstanding Piutang (Belum Lunas)**

### 5. HPP Manager Terintegrasi (Tab 'RincianHPP' & 'KategoriHPP')
- Input rincian pengeluaran per trip (Tiket, Sewa Jeep, Penginapan, Kapal, Fee Crew, Sewa Hiace, dll.).
- Dropdown vendor otomatis dari master `KategoriHPP`, dengan opsi input manual untuk mendaftarkan vendor baru secara otomatis.
- Kalkulasi total HPP dan margin secara real-time.
- Menyimpan ke tab `RincianHPP` sekaligus memperbarui Kolom AE (HPP) dan Kolom AC (Status Payment) di tab `Database Reservasi`.

---

## 🛠️ Panduan Menjalankan Secara Lokal

1. **Pastikan Node.js (v18+) terinstall**:
   ```bash
   node -v
   ```

2. **File Kredensial**:
   File `service-account.json` dan `.env.local` sudah terpasang di root direktori project.

3. **Jalankan Development Server**:
   ```bash
   npm run dev
   ```
   Buka browser di `http://localhost:3000` (atau port yang aktif).

4. **Build untuk Produksi**:
   ```bash
   npm run build
   npm run start
   ```

---

## ☁️ Panduan Deploy ke Vercel

1. Hubungkan repository GitHub ini ke **Vercel**.
2. Masuk ke tab **Settings** -> **Environment Variables** di dashboard project Vercel.
3. Tambahkan 2 environment variable berikut:

   | Key | Value | Keterangan |
   | :--- | :--- | :--- |
   | `GOOGLE_SHEETS_SPREADSHEET_ID` | `your_spreadsheet_id_here` | ID Spreadsheet Google |
   | `GOOGLE_SERVICE_ACCOUNT_KEY` | *(Salin seluruh isi JSON dari `.env.local`)* | Kredensial Service Account Google Cloud IAM |

4. Klik **Deploy**. Aplikasi akan otomatis online di Vercel dengan performa tinggi dan proteksi serverless.
