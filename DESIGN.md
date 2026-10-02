# DESIGN.md - TripBanyuwangi CRM & Database Reservasi 2026

## Identity & Purpose
- **Product**: Sistem Manajemen Reservasi, Operasional & Rekonsiliasi Penjualan TripBanyuwangi 2026.
- **Audience**: Tim Sales, Operasional, Keuangan, dan Manajemen TripBanyuwangi.
- **Tone**: Profesional, terstruktur, presisi finansial, bersih, efisien, dan nyaman untuk jam kerja panjang.

## Dials (Antislop Part 3)
- **ENERGY: 1 (Calm)**: Tidak ada elemen berkedip, tidak ada radial glow/blur mengambang, tidak ada gradien ungu-biru neon. Desain terasa seperti perangkat lunak akuntansi/ERP modern berstandar profesional.
- **RHYTHM: 2 (Structured)**: Layout teratur berbasis collapsible sidebar, grid kartu metrik, dan tabel reservasi berdensitas informasi optimal.
- **MOTION: 1 (Subtle)**: Transisi cepat dan efisien (150ms) untuk hover dan perpindahan modal/tab tanpa animasi memantul (*bouncy*) yang lambat.

## Color System
- **Theme**: Mendukung Light Mode (default) dan Dark Mode dengan toggle aktif yang berfungsi penuh (memenuhi R-21 & R-34).
- **Brand Accent**: Terracotta Orange khas TripBanyuwangi (`#e05e26` / `#f27230`) dipadukan dengan Amber (`#f59e0b`).
- **Light Theme**:
  - Background Utama: `#f8fafc` (Slate 50)
  - Card & Container: `#ffffff` dengan border `#e2e8f0` (Slate 200)
  - Text Utama: `#0f172a` (Slate 900) - Rasio kontras 15:1
  - Text Sekunder: `#64748b` (Slate 500)
- **Dark Theme**:
  - Background Utama: `#090d16` (Deep Charcoal Navy)
  - Card & Container: `#0f172a` dengan border `#1e293b`
  - Text Utama: `#f8fafc` (Slate 50)
  - Text Sekunder: `#94a3b8` (Slate 400)

## Layout & Architecture (TripBanyuwangi CRM Standard)
- **Left Collapsible Sidebar**: Logo Compass TripBanyuwangi, navigasi tab terpadu (Dashboard, Database Reservasi, Piutang Aktif, HPP Manager, Jadwal Operasional), Theme Toggle (Sun/Moon), dan User Profile.
- **Top Header Bar**: Breadcrumb navigasi, filter cepat, tombol Auto-Sync status trip, dan tombol utama + Reservasi Baru.
- **Typography**: System font stack modern (`Plus Jakarta Sans`, `Inter`, `system-ui`) dengan angka finansial `tabular-nums`.

## Anti-Slop Constraints Checklist
- [x] Tanpa em dash (`—`). Menggunakan koma, titik dua, atau kurung.
- [x] Tanpa ikon generic AI (Sparkle, Magic, Robot); gunakan ikon bisnis nyata (Compass, Database, BookOpen, HandCoins, Scale, Users).
- [x] Tanpa efek glassmorphism berlebihan; layout bersih dan tajam.
- [x] Kontras teks minimum 4.5:1 memenuhi WCAG AA.
- [x] Komponen interaktif memiliki fokus outline yang jelas untuk aksesibilitas keyboard (Tab, Enter, Escape).
- [x] Tidak ada data fiktif; seluruhnya dari 530+ baris data riil spreadsheet Google Sheets.
