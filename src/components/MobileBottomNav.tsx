'use client';

import React from 'react';
import { NavTab } from './Sidebar';
import { LayoutDashboard, Database, Receipt, CalendarClock } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  unpaidCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  unpaidCount = 0,
}) => {
  const tabs = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'reservasi' as NavTab,
      label: 'Reservasi',
      icon: Database,
    },
    {
      id: 'hpp' as NavTab,
      label: 'HPP Tamu',
      icon: Receipt,
      badge: unpaidCount > 0 ? unpaidCount : undefined,
    },
    {
      id: 'operasional' as NavTab,
      label: 'Jadwal',
      icon: CalendarClock,
    },
  ];

  return (
    <nav
      aria-label="Navigasi Utama Mobile"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card/95 backdrop-blur-md border-t border-border px-2 py-1.5 shadow-lg safe-area-pb"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 cursor-pointer relative min-h-[48px] select-none active:scale-95 ${
                isActive
                  ? 'text-primary font-extrabold'
                  : 'text-muted-foreground hover:text-foreground font-semibold'
              }`}
            >
              <div className="relative">
                <Icon size={20} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-orange-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-[70px]">
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
