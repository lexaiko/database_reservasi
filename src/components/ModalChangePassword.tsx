'use client';

import React, { useState, useEffect } from 'react';
import { Key, X, Eye, EyeOff, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { changeCurrentUserPassword } from '@/lib/firebaseAuthHelper';
import { useAuth } from '@/context/AuthContext';

interface ModalChangePasswordProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

export default function ModalChangePassword({
  isOpen,
  onClose,
  onSuccessToast,
}: ModalChangePasswordProps) {
  const { user, profile } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [requireCurrentPass, setRequireCurrentPass] = useState(false);

  const handleResetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
    setRequireCurrentPass(false);
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) {
      setError('Password baru minimal harus 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok dengan password baru.');
      return;
    }

    if (requireCurrentPass && !currentPassword.trim()) {
      setError('Silakan masukkan password saat ini untuk melanjutkan.');
      return;
    }

    setIsSubmitting(true);
    try {
      await changeCurrentUserPassword(newPassword, currentPassword.trim() || undefined);
      const msg = 'Password akun Anda berhasil diperbarui!';
      setSuccess(msg);
      if (onSuccessToast) onSuccessToast(msg);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: any) {
      if (err.message && err.message.includes('masukkan password Anda saat ini')) {
        setRequireCurrentPass(true);
        setError(err.message);
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Password saat ini yang Anda masukkan salah.');
      } else {
        setError(err.message || 'Gagal mengubah password.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) handleClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none"
    >
      <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Key size={18} />
            </div>
            <div>
              <h3 className="font-heading font-black text-base text-foreground">
                Ganti Password Akun
              </h3>
              <p className="text-xs text-muted-foreground truncate max-w-[260px]">
                {user?.email || profile?.email || 'Akun Pengguna'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Feedback Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2 animate-fade-in">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password Saat Ini (jika dibutuhkan atau diminta) */}
          {(requireCurrentPass || currentPassword.length > 0) && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Password Saat Ini</span>
                <span className="text-[10px] text-rose-500 font-bold">*Wajib untuk verifikasi</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required={requireCurrentPass}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Masukkan password akun Anda saat ini..."
                  className="w-full pl-3.5 pr-10 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* Password Baru */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">Password Baru</label>
              <span className="text-[10px] text-muted-foreground">Min. 6 Karakter</span>
            </div>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Masukkan password baru..."
                className="w-full pl-3.5 pr-10 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Konfirmasi Password Baru */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Konfirmasi Password Baru</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru..."
                className="w-full pl-3.5 pr-10 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>


          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-border">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:opacity-90 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Perbarui Password</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
