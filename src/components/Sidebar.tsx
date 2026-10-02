'use client';

import React from 'react';
import {
  Compass,
  LayoutDashboard,
  Database,
  HandCoins,
  BookOpen,
  Receipt,
  CalendarDays,
  Sun,
  Moon,
  Menu,
  ChevronLeft,
  ChevronRight,
  Shield,
  FileSpreadsheet,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'reservasi' | 'hpp' | 'operasional';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  unpaidCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  theme,
  onToggleTheme,
  isCollapsed,
  onToggleCollapse,
}) => {
  const menuItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard Eksekutif',
      shortLabel: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'reservasi' as NavTab,
      label: 'Database Reservasi',
      shortLabel: 'Reservasi',
      icon: Database,
    },
    {
      id: 'hpp' as NavTab,
      label: 'HPP & Status Tamu',
      shortLabel: 'HPP',
      icon: Receipt,
    },
    {
      id: 'operasional' as NavTab,
      label: 'Jadwal & Hari H',
      shortLabel: 'Jadwal',
      icon: CalendarDays,
    },
  ];

  return (
    <aside
      className={`h-full flex flex-col justify-between py-5 bg-card border-r border-border text-foreground transition-all duration-200 shrink-0 select-none overflow-x-hidden ${
        isCollapsed ? 'w-20 px-2' : 'w-64 px-4'
      }`}
    >
      <div>
        {/* Brand Header Logo - Matched 1:1 with TripBwi CRM */}
        <div className="flex items-center justify-between px-2 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-bold shadow-md shadow-orange-500/20 shrink-0">
              <Compass size={22} />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col text-left min-w-0">
                <span className="font-heading font-extrabold text-lg leading-none tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500 dark:from-orange-400 dark:to-amber-400">
                  TripBwi CRM
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mt-1 font-sans">
                  Reservasi Core
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-3 py-3 rounded-xl font-medium text-sm transition-all duration-150 relative cursor-pointer ${
                  isCollapsed ? 'px-2 justify-center' : 'px-3.5'
                } ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                title={item.label}
              >
                <Icon size={18} className="shrink-0" />
                {!isCollapsed && (
                  <div className="flex items-center justify-between w-full">
                    <span className="truncate">{item.label}</span>
                  </div>
                )}
                {isActive && !isCollapsed && (
                  <div className="absolute right-3 h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                )}
                {isActive && isCollapsed && (
                  <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Actions */}
      <div className="flex flex-col gap-3 border-t border-border pt-4">
        {/* User profile card */}
        <div className="px-1">
          <div
            className={`flex items-center justify-between gap-2 p-1.5 rounded-2xl border border-border/60 bg-muted/40 hover:bg-muted/70 transition-all ${
              isCollapsed ? 'flex-col py-2' : ''
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer flex-1">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-black text-xs uppercase flex items-center justify-center shrink-0 border border-primary/20 relative">
                TB
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-[11px] font-black text-foreground leading-tight truncate">
                    Admin Workspace
                  </span>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider mt-0.5 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Shield size={10} />
                    Super Admin
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Theme and Collapse Buttons */}
        <div
          className={`flex items-center px-1 border-t border-border/40 pt-3 ${
            isCollapsed ? 'flex-col gap-2 justify-center' : 'justify-between'
          }`}
        >
          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className={`flex items-center gap-2.5 p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150 cursor-pointer ${
              isCollapsed ? 'justify-center w-full' : ''
            }`}
            title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          >
            {theme === 'dark' ? (
              <Sun size={18} className="text-amber-400 shrink-0" />
            ) : (
              <Moon size={18} className="text-muted-foreground shrink-0" />
            )}
            {!isCollapsed && (
              <span className="text-xs font-semibold select-none">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </span>
            )}
          </button>

          {/* Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150 cursor-pointer hidden md:flex"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
    </aside>
  );
};
