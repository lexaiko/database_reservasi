import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TripBanyuwangi - Executive Space & Database Reservasi 2026',
  description:
    'Sistem Manajemen Reservasi Wisata, Rekonsiliasi Penjualan & HPP Operasional',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased min-h-screen bg-slate-100/80 text-slate-900 selection:bg-orange-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
