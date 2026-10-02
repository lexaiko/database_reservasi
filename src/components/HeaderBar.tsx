'use client';

import React from 'react';
import { Plus, RefreshCw, Menu, Layers } from 'lucide-react';
import { NavTab } from './Sidebar';

interface HeaderBarProps {
  activeTab: NavTab;
  onOpenNewModal: () => void;
  onSyncStatuses: () => void;
  isSyncing: boolean;
  onToggleMobileSidebar: () => void;
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
    title: 'HPP & Status Tamu',
    subtitle: 'Pusat manajemen update status pembayaran, rincian biaya vendor, dan laporan resmi HPP',
    tag: 'STATUS & HPP',
  },
  operasional: {
    title: 'Jadwal & Hari H',
    subtitle: 'Manajemen kesiapan armada, driver, hotel, crew, dan follow-up review tamu',
    tag: 'DISPATCH',
  },
};

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeTab,
  onOpenNewModal,
  onSyncStatuses,
  isSyncing,
  onToggleMobileSidebar,
}) => {
  const currentTabInfo = TAB_TITLES[activeTab] || TAB_TITLES.dashboard;

  return (
    <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border transition-colors">
      <div className="px-4 sm:px-6 md:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted md:hidden transition-all shrink-0 cursor-pointer"
            title="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading font-black text-lg sm:text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500 dark:from-orange-400 dark:to-amber-400 truncate">
                {currentTabInfo.title}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20 shrink-0">
                {currentTabInfo.tag}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-semibold truncate hidden sm:block">
              {currentTabInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onSyncStatuses}
            disabled={isSyncing}
            title="Sinkronisasi status trip hari H & finish trip ke Google Sheets"
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-bold rounded-xl text-foreground bg-secondary hover:bg-muted border border-border/80 transition-all disabled:opacity-60 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
            <span className="hidden md:inline">{isSyncing ? 'Sinkronisasi...' : 'Auto-Sync Status'}</span>
            <span className="md:hidden">Sync</span>
          </button>

          <button
            onClick={onOpenNewModal}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-bold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Reservasi Baru</span>
          </button>
        </div>
      </div>
    </header>
  );
};
