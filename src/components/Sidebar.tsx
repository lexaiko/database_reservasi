'use client';

import React from 'react';
import {
  Compass,
  LayoutDashboard,
  Database,
  Receipt,
  CalendarDays,
  Camera,
  Sun,
  Moon,
  Menu,
  ChevronLeft,
  ChevronRight,
  Shield,
  FileSpreadsheet,
  LogOut,
  Sliders,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export type NavTab = 'dashboard' | 'reservasi' | 'hpp' | 'operasional' | 'leads-review' | 'settings';

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
  const { profile, logout } = useAuth();
  const isSuperadmin = profile?.role === 'superadmin';

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
      id: 'leads-review' as NavTab,
      label: 'Input Source & Review',
      shortLabel: 'Source & Review',
      icon: Camera,
    },
    {
      id: 'hpp' as NavTab,
      label: 'Update HPP',
      shortLabel: 'Update HPP',
      icon: Receipt,
    },
    {
      id: 'operasional' as NavTab,
      label: 'Jadwal & Hari H',
      shortLabel: 'Jadwal',
      icon: CalendarDays,
    },
    ...(isSuperadmin
      ? [
          {
            id: 'settings' as NavTab,
            label: 'Pengaturan & Admin',
            shortLabel: 'Pengaturan',
            icon: Sliders,
          },
        ]
      : []),
  ];
  const userName = profile?.name || 'Admin Workspace';
  const roleType = profile?.role || 'admin';
  const assignedPic = profile?.assignedPic || '';
  const userRoleBadge =
    roleType === 'superadmin'
      ? 'SUPERADMIN'
      : roleType === 'intern'
      ? `INTERN • ${assignedPic || 'MAGANG'}`
      : `PIC • ${assignedPic || 'ADMIN'}`;
  const userInitials = profile?.name
    ? profile.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'TB';

  return (
    <aside
      className={`h-full flex flex-col justify-between py-5 bg-card border-r border-border text-foreground transition-all duration-200 shrink-0 select-none overflow-x-hidden ${
        isCollapsed ? 'w-20 px-2' : 'w-64 px-4'
      }`}
    >
      <div>
        {/* Brand Header Logo */}
        <div className="flex items-center justify-between px-2 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-bold shadow-md shadow-orange-500/20 shrink-0">
              <Compass size={22} />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col text-left min-w-0">
                <span className="font-heading font-extrabold text-lg leading-none tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500 dark:from-orange-400 dark:to-amber-400">
                  Reservasi TripBwi
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
                  <div className="absolute right-3 h-1.5 w-1.5 rounded-full bg-primary-foreground/60" />
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
            <div className="flex items-center gap-2.5 min-w-0 text-left flex-1">
              <div
                className={`h-8 w-8 rounded-xl font-black text-xs uppercase flex items-center justify-center shrink-0 border ${
                  roleType === 'superadmin'
                    ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20'
                    : roleType === 'intern'
                    ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20'
                    : 'bg-primary/10 text-primary border-primary/20'
                }`}
              >
                {userInitials}
              </div>
              {!isCollapsed && (
                <div className="flex flex-col text-left min-w-0 flex-1">
                  <span className="text-[11px] font-black text-foreground leading-tight truncate">
                    {userName}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`text-[8.5px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded truncate max-w-[140px] ${
                        roleType === 'superadmin'
                          ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300'
                          : roleType === 'intern'
                          ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                      }`}
                      title={userRoleBadge}
                    >
                      {userRoleBadge}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Logout button */}
            <button
              type="button"
              onClick={() => logout()}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
              title="Keluar dari akun"
            >
              <LogOut size={16} />
            </button>
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
