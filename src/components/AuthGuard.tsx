'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Compass, Loader2, AlertCircle } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  const isConfigured = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);

  useEffect(() => {
    if (!loading && isConfigured && (!user || !profile)) {
      router.replace('/login');
    }
  }, [user, profile, loading, router, isConfigured]);

  // Tampilan saat Firebase env belum diatur sama sekali di .env.local
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6 shadow-sm text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-lg text-foreground">
              Konfigurasi Firebase Diperlukan
            </h2>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Environment variables Firebase belum terisi di <code>.env.local</code>. Silakan tambahkan kredensial Firebase Console untuk mengaktifkan sistem login.
            </p>
          </div>
          <div className="text-left bg-muted/60 p-3 rounded-xl font-mono text-[11px] text-muted-foreground space-y-1">
            <div>NEXT_PUBLIC_FIREBASE_API_KEY=...</div>
            <div>NEXT_PUBLIC_FIREBASE_PROJECT_ID=...</div>
          </div>
        </div>
      </div>
    );
  }

  // Tampilan loading verifikasi sesi
  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] flex flex-col items-center justify-center p-6 select-none">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 animate-pulse">
            <Compass size={32} />
          </div>
          <div className="flex flex-col items-center gap-1.5 mt-2">
            <span className="font-heading font-black text-xl text-foreground tracking-tight">
              Reservasi TripBwi
            </span>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Loader2 size={14} className="animate-spin text-primary" />
              <span>Memverifikasi otentikasi...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
