'use client';

import React from 'react';
import { Plus, RefreshCw, Menu, Layers, Key } from 'lucide-react';
import { NavTab } from './Sidebar';

interface HeaderBarProps {
  activeTab: NavTab;
  onOpenNewModal: () => void;
  onSyncStatuses: () => void;
  isSyncing: boolean;
  onToggleMobileSidebar: () => void;
  onOpenChangePassword?: () => void;
}

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string; tag: string }> = {
  dashboard: {
    title: 'Dashboard Eksekutif',
    subtitle: 'Ringkasan metrik penjualan, omset, dan gross profit diakui finish trip',
    tag: 'ANALYTICS',
  },
  reservasi: {
    title: 'Database Reservasi 2026',
    subtitle: 'Katalog terpusat pesanan tamu, jadwal trip, status operasional & pembayaran',
    tag: 'DATABASE',
  },
  hpp: {
    title: 'Update HPP',
    subtitle: 'Pusat manajemen update status pembayaran, rincian biaya vendor, dan laporan resmi HPP',
    tag: 'UPDATE HPP',
  },
  operasional: {
    title: 'Jadwal & Hari H',
    subtitle: 'Manajemen kesiapan armada, driver, hotel, crew, dan follow-up review tamu',
    tag: 'DISPATCH',
  },
  'leads-review': {
    title: 'Input Source & Review',
    subtitle: 'Katalog update sumber closing leads, link ulasan review, dan link dokumentasi foto trip',
    tag: 'SOURCE & REVIEW',
  },
  settings: {
    title: 'Pengaturan & Akses Admin',
    subtitle: 'Konfigurasi integrasi Google Sheets dan manajemen whitelist akun pengguna',
    tag: 'SUPERADMIN',
  },
};

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeTab,
  onOpenNewModal,
  onSyncStatuses,
  isSyncing,
  onToggleMobileSidebar,
  onOpenChangePassword,
}) => {
  const currentTabInfo = TAB_TITLES[activeTab] || TAB_TITLES.dashboard;

  return (
    <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border transition-colors">
      <div className="px-3.5 sm:px-6 md:px-8 h-15 sm:h-20 flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onToggleMobileSidebar}
            className="p-1.5 -ml-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted md:hidden transition-all shrink-0 cursor-pointer"
            title="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col min-w-0">
            <h1 className="font-heading font-black text-sm sm:text-xl lg:text-2xl tracking-tight text-foreground truncate">
              {currentTabInfo.title}
            </h1>
            <p className="text-xs text-muted-foreground font-semibold truncate hidden sm:block">
              {currentTabInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {onOpenChangePassword && (
            <button
              onClick={onOpenChangePassword}
              title="Ganti Password Akun Saya"
              className="inline-flex items-center justify-center gap-1.5 w-9 sm:w-auto h-9 px-0 sm:px-3 text-xs font-bold rounded-xl text-foreground bg-muted/40 hover:bg-muted border border-border/80 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
            >
              <Key className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Ganti Password</span>
            </button>
          )}

          <button
            onClick={onSyncStatuses}
            disabled={isSyncing}
            title="Sinkronisasi status trip hari H & finish trip ke Google Sheets"
            className="inline-flex items-center justify-center gap-1.5 w-9 sm:w-auto h-9 px-0 sm:px-3 text-xs font-bold rounded-xl text-foreground bg-muted/40 hover:bg-muted border border-border/80 transition-all disabled:opacity-60 cursor-pointer shadow-2xs active:scale-95 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Sinkronisasi...' : 'Auto-Sync'}</span>
          </button>

          <button
            onClick={onOpenNewModal}
            title="Tambah Reservasi Baru"
            className="inline-flex items-center justify-center gap-1 sm:gap-1.5 h-9 px-2.5 sm:px-4 text-xs font-bold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Reservasi Baru</span>
            <span className="sm:hidden text-xs font-bold">Baru</span>
          </button>
        </div>
      </div>
    </header>
  );
};
