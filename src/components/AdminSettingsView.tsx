'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, UserRole } from '@/types/auth';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import {
  FileSpreadsheet,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Plus,
  Trash2,
  Edit2,
  Save,
  Loader2,
  X,
  Info,
  Key,
  Eye,
  EyeOff,
} from 'lucide-react';
import { createNewFirebaseUser, adminChangeOtherUserPassword } from '@/lib/firebaseAuthHelper';

interface AdminSettingsViewProps {
  currentUserEmail?: string;
  onSuccessToast?: (msg: string) => void;
}

export default function AdminSettingsView({
  currentUserEmail,
  onSuccessToast,
}: AdminSettingsViewProps) {
  const [subTab, setSubTab] = useState<'sheets' | 'users'>('users');

  // State Pengaturan Sheet
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [sheetUpdatedAt, setSheetUpdatedAt] = useState('');
  const [sheetUpdatedBy, setSheetUpdatedBy] = useState('');
  const [isSavingSheet, setIsSavingSheet] = useState(false);
  const [isLoadingSheet, setIsLoadingSheet] = useState(true);

  // State Manajemen Users
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isModalUserOpen, setIsModalUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Form User Modal
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formRole, setFormRole] = useState<UserRole>('admin');
  const [formIsPic, setFormIsPic] = useState<boolean>(true);
  const [formAssignedPic, setFormAssignedPic] = useState('');
  const [formAllowedPics, setFormAllowedPics] = useState<string[]>([]);

  // State Ganti Password Pengguna Lain oleh Superadmin
  const [isModalChangePasswordOpen, setIsModalChangePasswordOpen] = useState(false);
  const [passwordTargetUser, setPasswordTargetUser] = useState<UserProfile | null>(null);
  const [targetNewPassword, setTargetNewPassword] = useState('');
  const [targetConfirmPassword, setTargetConfirmPassword] = useState('');
  const [showTargetPassword, setShowTargetPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);

  // Daftar PIC dari akun admin aktif yang berstatus PIC (isPic !== false)
  const [adminPicList, setAdminPicList] = useState<string[]>([]);

  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Feedback Notification
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    if (type === 'success' && onSuccessToast) {
      onSuccessToast(message);
    }
    setTimeout(() => setAlert(null), 5000);
  };

  // Fetch Pengaturan Sheet
  const fetchSheetSettings = useCallback(async () => {
    setIsLoadingSheet(true);
    try {
      if (db) {
        const snap = await getDoc(doc(db, 'settings', 'sheets'));
        if (snap.exists()) {
          const d = snap.data();
          if (d.spreadsheetId) setSpreadsheetId(d.spreadsheetId);
          if (d.updatedAt) setSheetUpdatedAt(d.updatedAt);
          if (d.updatedBy) setSheetUpdatedBy(d.updatedBy);
          setIsLoadingSheet(false);
          return;
        }
      }
      const res = await fetch('/api/admin/settings');
      const json = await res.json();
      if (json.ok && json.data) {
        setSpreadsheetId(json.data.spreadsheetId || '');
        setSheetUpdatedAt(json.data.updatedAt || '');
        setSheetUpdatedBy(json.data.updatedBy || '');
      }
    } catch (e: any) {
      console.warn('Notice loading sheet settings:', e);
    } finally {
      setIsLoadingSheet(false);
    }
  }, []);

  // Fetch Users: langsung dari Firestore (client SDK punya auth token superadmin)
  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      if (!db) throw new Error('Firestore belum terinisialisasi.');
      const snap = await getDocs(collection(db, 'users'));
      const list: UserProfile[] = [];
      const picNames: string[] = [];

      snap.forEach((d) => {
        const data = d.data();
        const role = (data.role === 'superadmin'
          ? 'superadmin'
          : data.role === 'intern'
          ? 'intern'
          : 'admin') as UserRole;
        const isPic = data.isPic !== undefined ? Boolean(data.isPic) : true;
        const assignedPic = data.assignedPic || '';
        const name = data.name || '';

        list.push({
          uid: d.id,
          email: data.email || '',
          name,
          role,
          status: data.status === 'inactive' ? 'inactive' : 'active',
          isPic,
          assignedPic,
          allowedPics: Array.isArray(data.allowedPics) ? data.allowedPics : [],
          accountPassword: data.accountPassword || '',
          passwordUpdatedAt: data.passwordUpdatedAt || '',
          createdAt: data.createdAt,
        });

        // Hanya akun admin berstatus PIC (isPic !== false) dan aktif yang masuk ke list PIC sistem
        if (role === 'admin' && data.status !== 'inactive' && isPic) {
          const pName = (assignedPic || name).trim();
          if (pName) picNames.push(pName);
        }
      });

      setUsers(list);
      setAdminPicList(Array.from(new Set<string>(picNames)).sort());
    } catch (e: any) {
      console.error('Failed to load users:', e);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchSheetSettings();
    fetchUsers();
  }, [fetchSheetSettings, fetchUsers]);

  // Listener tombol Escape untuk menutup dialog modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isModalChangePasswordOpen) {
          setIsModalChangePasswordOpen(false);
        } else if (isModalUserOpen) {
          setIsModalUserOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalChangePasswordOpen, isModalUserOpen]);

  // Handle Simpan Sheet Settings
  const handleSaveSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spreadsheetId.trim()) {
      showAlert('error', 'Google Spreadsheet ID wajib diisi.');
      return;
    }

    setIsSavingSheet(true);
    try {
      const nowIso = new Date().toISOString();
      const byUser = currentUserEmail || 'Super Admin';

      if (db) {
        await setDoc(
          doc(db, 'settings', 'sheets'),
          {
            spreadsheetId: spreadsheetId.trim(),
            updatedAt: nowIso,
            updatedBy: byUser,
          },
          { merge: true }
        );
      }

      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId: spreadsheetId.trim(),
          updatedBy: byUser,
        }),
      }).catch(() => {});

      showAlert('success', 'Konfigurasi Google Sheets berhasil disimpan ke Firestore.');
      setSheetUpdatedAt(nowIso);
      setSheetUpdatedBy(byUser);
    } catch (e: any) {
      showAlert('error', e.message || 'Terjadi kesalahan saat menyimpan.');
    } finally {
      setIsSavingSheet(false);
    }
  };

  // Open User Modal
  const openAddUser = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setShowFormPassword(false);
    setFormRole('admin');
    setFormIsPic(true);
    setFormAssignedPic('');
    setFormAllowedPics([]);
    setFormStatus('active');
    setFormError(null);
    setIsModalUserOpen(true);
  };

  const openEditUser = (u: UserProfile) => {
    setEditingUser(u);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormPassword('');
    setShowFormPassword(false);
    setFormRole(u.role);
    setFormIsPic(u.isPic !== false);
    setFormAssignedPic(u.assignedPic || u.name || '');
    setFormAllowedPics(
      u.allowedPics && u.allowedPics.length > 0
        ? u.allowedPics
        : u.assignedPic
        ? [u.assignedPic]
        : []
    );
    setFormStatus(u.status);
    setFormError(null);
    setIsModalUserOpen(true);
  };

  // Buka Modal Ganti Password Pengguna
  const openChangePasswordModal = (u: UserProfile) => {
    setPasswordTargetUser(u);
    setTargetNewPassword('');
    setTargetConfirmPassword('');
    setShowTargetPassword(false);
    setChangePasswordError(null);
    setIsModalChangePasswordOpen(true);
  };

  // Simpan Password Baru Pengguna Lain
  const handleSaveChangedPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTargetUser) return;
    setChangePasswordError(null);

    const cleanPass = targetNewPassword.trim();
    if (cleanPass.length < 6) {
      setChangePasswordError('Password baru minimal harus 6 karakter.');
      return;
    }

    if (cleanPass !== targetConfirmPassword.trim()) {
      setChangePasswordError('Konfirmasi password tidak cocok dengan password baru.');
      return;
    }

    setIsChangingPassword(true);
    try {
      if (!db) throw new Error('Firestore belum terinisialisasi.');

      // Update autentikasi via secondary app (jika password saat ini tersimpan)
      try {
        await adminChangeOtherUserPassword(
          passwordTargetUser.email,
          cleanPass,
          passwordTargetUser.accountPassword
        );
      } catch (authErr: any) {
        console.warn('Sinkronisasi autentikasi Firebase sekunder:', authErr.message);
      }

      // Simpan password baru di dokumen Firestore profil user
      await setDoc(
        doc(db, 'users', passwordTargetUser.uid),
        {
          accountPassword: cleanPass,
          passwordUpdatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      showAlert(
        'success',
        `Password untuk ${passwordTargetUser.name} (${passwordTargetUser.email}) berhasil diperbarui! Pengguna dapat langsung login dengan kata sandi baru.`
      );
      setIsModalChangePasswordOpen(false);
      fetchUsers();
    } catch (err: any) {
      setChangePasswordError(err.message || 'Gagal mengubah password pengguna.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle Simpan User
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Nama lengkap wajib diisi.');
      return;
    }
    if (!formEmail.trim() || !formEmail.includes('@')) {
      setFormError('Alamat email valid wajib diisi.');
      return;
    }

    if (!editingUser) {
      if (!formPassword || formPassword.trim().length < 6) {
        setFormError('Password wajib diisi minimal 6 karakter untuk akun baru.');
        return;
      }
    }

    if (formRole === 'admin') {
      if (formIsPic) {
        const finalPicName = formAssignedPic.trim() || formName.trim();
        if (!finalPicName) {
          setFormError('Nama lengkap atau nama PIC wajib diisi.');
          return;
        }
      }
      if (!formIsPic && formAllowedPics.length === 0) {
        setFormError('Pilih minimal 1 sekat data PIC yang dapat diakses oleh admin Non-PIC ini.');
        return;
      }
    }

    if (formRole === 'intern' && !formAssignedPic.trim()) {
      setFormError('Pilih Admin PIC yang didampingi oleh anak magang ini.');
      return;
    }

    setIsSavingUser(true);
    try {
      if (!db) throw new Error('Firestore belum terinisialisasi.');

      const cleanEmail = formEmail.trim().toLowerCase();

      // Buat akun baru di Firebase Auth jika ini pendaftaran baru
      let createdUid = '';
      if (!editingUser) {
        try {
          createdUid = await createNewFirebaseUser(cleanEmail, formPassword.trim());
        } catch (authErr: any) {
          if (authErr.code === 'auth/email-already-in-use') {
            console.warn('Email sudah terdaftar di Firebase Auth, menghubungkan profil ke whitelist.');
          } else {
            throw new Error(`Gagal membuat autentikasi Firebase: ${authErr.message || authErr.code}`);
          }
        }
      }

      // Gunakan UID existing saat edit, UID baru dari Firebase Auth, atau email sebagai doc ID
      const targetDocId = editingUser?.uid && editingUser.uid.trim().length > 0
        ? editingUser.uid
        : (createdUid || cleanEmail);

      const validatedRole: UserRole =
        formRole === 'superadmin' ? 'superadmin' : formRole === 'intern' ? 'intern' : 'admin';

      const payload: any = {
        email: cleanEmail,
        name: formName.trim(),
        role: validatedRole,
        status: formStatus,
        createdAt: editingUser?.createdAt || new Date().toISOString(),
      };

      if (!editingUser) {
        payload.accountPassword = formPassword.trim();
        payload.passwordUpdatedAt = new Date().toISOString();
      } else if (formPassword.trim().length > 0) {
        if (formPassword.trim().length < 6) {
          setFormError('Password baru minimal 6 karakter.');
          setIsSavingUser(false);
          return;
        }
        try {
          await adminChangeOtherUserPassword(
            cleanEmail,
            formPassword.trim(),
            editingUser.accountPassword
          );
        } catch (authErr: any) {
          console.warn('Sinkronisasi auth saat edit:', authErr.message);
        }
        payload.accountPassword = formPassword.trim();
        payload.passwordUpdatedAt = new Date().toISOString();
      }

      if (validatedRole === 'admin') {
        payload.isPic = formIsPic;
        if (formIsPic) {
          payload.assignedPic = formAssignedPic.trim() || formName.trim();
          payload.allowedPics = [];
        } else {
          payload.assignedPic = '';
          payload.allowedPics = formAllowedPics;
        }
      } else if (validatedRole === 'intern') {
        payload.isPic = false;
        payload.assignedPic = formAssignedPic.trim();
        payload.allowedPics = [];
      } else {
        // superadmin
        payload.isPic = false;
        payload.assignedPic = '';
        payload.allowedPics = [];
      }

      await setDoc(doc(db, 'users', targetDocId), payload, { merge: true });

      showAlert(
        'success',
        editingUser
          ? 'Data pengguna berhasil diperbarui.'
          : `Akun baru ${formName.trim()} berhasil dibuat dan siap login dengan password yang Anda tentukan!`
      );
      setIsModalUserOpen(false);
      fetchUsers();
    } catch (e: any) {
      setFormError(e.message || 'Terjadi kesalahan.');
    } finally {
      setIsSavingUser(false);
    }
  };

  // Handle Hapus User
  const handleDeleteUser = async (u: UserProfile) => {
    if (u.email === currentUserEmail) {
      showAlert('error', 'Anda tidak dapat menghapus akun Anda sendiri.');
      return;
    }

    const confirm = window.confirm(
      `Apakah Anda yakin ingin menghapus akses whitelist untuk ${u.name} (${u.email})?`
    );
    if (!confirm) return;

    try {
      if (!db) throw new Error('Firestore belum terinisialisasi.');
      await deleteDoc(doc(db, 'users', u.uid));
      showAlert('success', `Pengguna ${u.email} berhasil dihapus dari whitelist.`);
      fetchUsers();
    } catch (e: any) {
      showAlert('error', e.message || 'Terjadi kesalahan.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <ShieldCheck size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-black text-xl text-foreground tracking-tight">
                  Pengaturan Superadmin
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Privileged Area
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                Pusat kontrol konfigurasi Google Sheets dan whitelist akses akun internal.
              </p>
            </div>
          </div>

          {/* SubTab Navigation */}
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border shrink-0">
            <button
              onClick={() => setSubTab('users')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                subTab === 'users'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users size={15} />
              <span>Manajemen Akun ({users.length})</span>
            </button>
            <button
              onClick={() => setSubTab('sheets')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                subTab === 'sheets'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileSpreadsheet size={15} />
              <span>Pengaturan Sheet</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alert Notification */}
      {alert && (
        <div
          role="alert"
          className={`p-4 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs transition-all ${
            alert.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {alert.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle size={18} className="text-rose-600 shrink-0" />
            )}
            <span>{alert.message}</span>
          </div>
          <button
            onClick={() => setAlert(null)}
            className="p-1 hover:opacity-70 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* TAB 1: PENGATURAN GOOGLE SHEETS */}
      {subTab === 'sheets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-primary" />
                <span>Pengaturan Sumber Data Spreadsheet</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Ubah ID spreadsheet di sini saat berganti dokumen sheet. Perubahan tersimpan di Cloud Firestore dan langsung aktif tanpa perlu mengubah variabel di Vercel atau deploy ulang.
              </p>
            </div>

            {isLoadingSheet ? (
              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Loader2 size={24} className="animate-spin text-primary" />
                <span className="text-xs font-semibold">Memuat pengaturan sheet...</span>
              </div>
            ) : (
              <form onSubmit={handleSaveSheet} className="space-y-4">
                {/* Input Spreadsheet ID */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="spreadsheetId"
                      className="text-xs font-bold text-foreground"
                    >
                      Google Spreadsheet ID
                    </label>
                    {spreadsheetId && (
                      <a
                        href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        <span>Buka Sheet di Google</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  <input
                    id="spreadsheetId"
                    type="text"
                    required
                    value={spreadsheetId}
                    onChange={(e) => setSpreadsheetId(e.target.value)}
                    placeholder="Contoh: your_spreadsheet_id_here"
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    ID dapat disalin dari URL Google Sheets antara <code>/d/</code> dan <code>/edit</code>.
                  </p>
                </div>

                {/* Info Tab Otomatis */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>
                      Tab terhubung otomatis: <strong>Database Reservasi</strong> &amp; <strong>RincianHPP</strong>
                    </span>
                  </div>
                  {sheetUpdatedAt && (
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Diperbarui: {new Date(sheetUpdatedAt).toLocaleString('id-ID')}
                    </span>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingSheet}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm shadow-xs hover:opacity-90 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isSavingSheet ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Menyimpan ke Firestore...</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>Simpan ID Spreadsheet</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Info Card Sidebar */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                <Info size={16} className="text-amber-500" />
                <span>Cara Kerja Penyimpanan Dinamis</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4 leading-relaxed font-medium">
                <li>
                  ID Spreadsheet yang Anda simpan di sini akan disimpan di dokumen <code>settings/sheets</code> Cloud Firestore.
                </li>
                <li>
                  Setiap kali server memproses data, sistem otomatis membaca ID dari Firestore ini terlebih dahulu.
                </li>
                <li>
                  Jika data di Firestore belum ada, sistem akan otomatis menggunakan nilai fallback dari file <code>.env.local</code>.
                </li>
                <li>
                  Tidak ada downtime dan tidak perlu melakukan redeploy di Vercel saat mengganti sheet.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MANAJEMEN ADMIN */}
      {subTab === 'users' && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Users size={18} className="text-primary" />
                <span>Daftar Pengguna &amp; Hak Akses</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Hanya pengguna yang terdaftar di whitelist ini dengan status aktif yang diizinkan masuk ke sistem.
              </p>
            </div>
            <button
              onClick={openAddUser}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer self-start sm:self-auto"
            >
              <Plus size={16} />
              <span>Tambah Admin Baru</span>
            </button>
          </div>

          {isLoadingUsers ? (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Loader2 size={24} className="animate-spin text-primary" />
              <span className="text-xs font-semibold">Memuat daftar admin...</span>
            </div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/50 border-b border-border text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Nama Lengkap</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role Akses</th>
                    <th className="py-3 px-4">PIC / Dampingan</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        Belum ada data admin di whitelist.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isSelf = u.email === currentUserEmail;
                      const isSuper = u.role === 'superadmin';
                      const isIntern = u.role === 'intern';
                      const isPicAdmin = u.role === 'admin' && u.isPic !== false;
                      const isNonPicAdmin = u.role === 'admin' && u.isPic === false;

                      return (
                        <tr key={u.uid || u.email} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-foreground flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0">
                              {u.name
                                .split(' ')
                                .filter(Boolean)
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()}
                            </div>
                            <div>
                              <span>{u.name}</span>
                              {isSelf && (
                                <span className="ml-2 text-[10px] text-primary font-bold">
                                  (Anda)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-muted-foreground">
                            {u.email}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isSuper
                                  ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20'
                                  : isIntern
                                  ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20'
                                  : isNonPicAdmin
                                  ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20'
                                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                              }`}
                            >
                              {isSuper
                                ? 'SUPERADMIN'
                                : isIntern
                                ? 'INTERN (MAGANG)'
                                : isNonPicAdmin
                                ? 'ADMIN (NON-PIC)'
                                : 'ADMIN (PIC)'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-foreground">
                            {isSuper ? (
                              <span className="text-[11px] text-muted-foreground italic">Semua PIC</span>
                            ) : isIntern ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400">
                                Asisten: {u.assignedPic || '-'}
                              </span>
                            ) : isNonPicAdmin ? (
                              <div className="flex flex-wrap items-center gap-1">
                                {u.allowedPics && u.allowedPics.length > 0 ? (
                                  u.allowedPics.map((p) => (
                                    <span
                                      key={p}
                                      className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-500/20"
                                    >
                                      {p}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[11px] text-muted-foreground italic">
                                    Belum ada sekat
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                PIC: {u.assignedPic || '-'}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                u.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              {u.status === 'active' ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openChangePasswordModal(u)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10 transition-colors cursor-pointer"
                                title={`Ganti Password untuk ${u.name}`}
                              >
                                <Key size={14} />
                              </button>
                              <button
                                onClick={() => openEditUser(u)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                title="Edit Role / Status"
                              >
                                <Edit2 size={14} />
                              </button>
                              {!isSelf && (
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  title="Hapus dari Whitelist"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL TAMBAH / EDIT ADMIN */}
      {isModalUserOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalUserOpen(false);
          }}
        >
          <div
            className="bg-card border border-border rounded-2xl max-w-lg w-full my-auto shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal - Selalu terlihat di bagian atas */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card shrink-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Key size={18} />
                </div>
                <div>
                  <h3 className="font-heading font-black text-base text-foreground">
                    {editingUser ? 'Edit Pengguna Admin' : 'Tambah Admin Baru'}
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-medium truncate max-w-[240px]">
                    {editingUser ? editingUser.email : 'Daftarkan hak akses akun baru'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalUserOpen(false)}
                className="w-8 h-8 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors"
                title="Tutup (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Form Body - Dapat discroll jika layar pendek */}
              <div className="p-5 overflow-y-auto flex-1 space-y-4">
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle size={15} className="shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Rian Operasional"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Email Perusahaan</label>
                <input
                  type="email"
                  required
                  disabled={Boolean(editingUser)}
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="nama@tripbanyuwangi.com"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              {/* INPUT PASSWORD KHUSUS PENGGUNA BARU */}
              {!editingUser && (
                <div className="space-y-1.5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">
                      Password Akun Baru <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-muted-foreground font-semibold">Min. 6 Karakter</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showFormPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="Masukkan password akun baru..."
                      className="w-full pl-3.5 pr-10 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormPassword(!showFormPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      title={showFormPassword ? 'Sembunyikan password' : 'Lihat password'}
                    >
                      {showFormPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Akun ini otomatis dibuatkan di Firebase Authentication dan langsung siap digunakan untuk login.
                  </p>
                </div>
              )}

              {/* INPUT PASSWORD SAAT EDIT USER (OPSIONAL) */}
              {editingUser && (
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-2.5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Key size={14} className="text-amber-500" />
                      <span>Ganti Password Akun (Opsional)</span>
                    </label>
                    <span className="text-[10px] text-muted-foreground font-semibold">Min. 6 Karakter</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showFormPassword ? 'text' : 'password'}
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="Kosongkan jika tidak ingin mengubah password..."
                      className="w-full pl-3.5 pr-10 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormPassword(!showFormPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      title={showFormPassword ? 'Sembunyikan password' : 'Lihat password'}
                    >
                      {showFormPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Superadmin dapat langsung mengganti password user ini tanpa memerlukan link reset email.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Tingkat Hak Akses</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer"
                  >
                    <option value="admin">Admin (Pengelola Sekat Reservasi)</option>
                    <option value="intern">Intern (Anak Magang / Asisten PIC)</option>
                    <option value="superadmin">Superadmin (Akses Penuh Seluruh PIC)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Status Akun</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
                </div>
              </div>

              {/* TOGGLE PIC / NON-PIC KHUSUS ROLE ADMIN */}
              {formRole === 'admin' && (
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2.5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">
                      Status PIC Akun Admin Ini
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {formIsPic ? 'Akun PIC Tunggal' : 'Admin Non-PIC (Multi-Sekat)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormIsPic(true)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer border ${
                        formIsPic
                          ? 'bg-amber-500 text-white border-amber-600 shadow-2xs font-black'
                          : 'bg-background hover:bg-muted text-foreground border-border'
                      }`}
                    >
                      ✓ Ya, Akun PIC
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormIsPic(false);
                        if (formAllowedPics.length === 0 && adminPicList.length > 0) {
                          setFormAllowedPics(adminPicList.slice(0, 2));
                        }
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer border ${
                        !formIsPic
                          ? 'bg-primary text-primary-foreground border-primary shadow-2xs font-black'
                          : 'bg-background hover:bg-muted text-foreground border-border'
                      }`}
                    >
                      Bukan PIC (Non-PIC)
                    </button>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-normal">
                    {formIsPic
                      ? 'Akun ini adalah PIC trip. Namanya otomatis muncul di list PIC sistem dan akun ini hanya mengelola data reservasi miliknya.'
                      : 'Akun ini bukan PIC trip (contoh: Ops/Supervisor). Admin ini dapat memilih lebih dari satu sekat data PIC yang Anda izinkan di bawah.'}
                  </p>
                </div>
              )}

              {/* 1. JIKA ADMIN PIC: AKUN INI ADALAH PIC ITU SENDIRI */}
              {formRole === 'admin' && formIsPic && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2.5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <ShieldCheck size={15} className="text-amber-600 dark:text-amber-400" />
                      <span>Akun Ini Adalah PIC</span>
                    </label>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full bg-amber-500/20">
                      Sekat Mandiri
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-foreground">
                      Label / Nama PIC di Sistem (Reservasi &amp; Dashboard)
                    </label>
                    <input
                      type="text"
                      value={formAssignedPic}
                      onChange={(e) => setFormAssignedPic(e.target.value)}
                      placeholder={formName.trim() ? formName.trim() : 'Contoh nama panggilan PIC...'}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      Admin ini adalah PIC itu sendiri. Nama ini otomatis terdaftar ke dalam list PIC sistem (masuk ke filter sekat reservasi &amp; dashboard). Biarkan kosong jika ingin otomatis sama dengan Nama Lengkap di atas.
                    </p>
                  </div>
                </div>
              )}

              {/* 2. JIKA ADMIN NON-PIC: PILIH LEBIH DARI SATU SEKAT DATA PIC */}
              {formRole === 'admin' && !formIsPic && (
                <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-2.5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                      Pilihan Sekat Data PIC (Bisa Lebih Dari Satu)
                    </label>
                    <div className="flex items-center gap-2 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setFormAllowedPics([...adminPicList])}
                        className="text-primary font-bold hover:underline cursor-pointer"
                      >
                        Pilih Semua
                      </button>
                      <span className="text-muted-foreground">•</span>
                      <button
                        type="button"
                        onClick={() => setFormAllowedPics([])}
                        className="text-rose-500 font-bold hover:underline cursor-pointer"
                      >
                        Hapus Semua
                      </button>
                    </div>
                  </div>

                  {adminPicList.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {adminPicList.map((picName) => {
                        const isSelected = formAllowedPics.some(
                          (p) => p.toLowerCase() === picName.toLowerCase()
                        );
                        return (
                          <button
                            key={picName}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setFormAllowedPics(
                                  formAllowedPics.filter(
                                    (p) => p.toLowerCase() !== picName.toLowerCase()
                                  )
                                );
                              } else {
                                setFormAllowedPics([...formAllowedPics, picName]);
                              }
                            }}
                            className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer border ${
                              isSelected
                                ? 'bg-primary text-primary-foreground border-primary font-black shadow-2xs'
                                : 'bg-background hover:bg-muted text-foreground border-border'
                            }`}
                          >
                            <span>{picName}</span>
                            <span className="text-xs">{isSelected ? '✓' : '+'}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-rose-500 font-semibold italic">
                      Belum ada Admin PIC yang terdaftar di Firestore. Buat akun Admin PIC terlebih dahulu.
                    </p>
                  )}

                  <div className="text-[11px] text-muted-foreground pt-1 flex items-center justify-between border-t border-border/60">
                    <span>
                      Sekat aktif:{' '}
                      <strong className="text-foreground">
                        {formAllowedPics.length} PIC dipilih
                      </strong>
                    </span>
                    {formAllowedPics.length > 0 && (
                      <span className="font-semibold text-primary truncate max-w-[200px]">
                        {formAllowedPics.join(', ')}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Admin Non-PIC ini dapat melihat serta memilih sekat data PIC yang diizinkan di atas pada dashboard maupun database reservasi.
                  </p>
                </div>
              )}

              {/* 3. JIKA INTERN: ASISTEN PIC TUNGGAL */}
              {formRole === 'intern' && (
                <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/20 space-y-2.5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-sky-900 dark:text-sky-200">
                      Mendampingi Admin PIC (Asisten Untuk)
                    </label>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-full bg-sky-500/20">
                      Wajib
                    </span>
                  </div>

                  {adminPicList.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {adminPicList.map((picName) => (
                        <button
                          key={picName}
                          type="button"
                          onClick={() => setFormAssignedPic(picName)}
                          className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer border ${
                            formAssignedPic.toLowerCase() === picName.toLowerCase()
                              ? 'bg-sky-500 text-white border-sky-600 font-black shadow-2xs'
                              : 'bg-background hover:bg-muted text-foreground border-border'
                          }`}
                        >
                          {picName}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-rose-500 font-semibold italic">
                      Belum ada Admin PIC yang terdaftar. Buat akun Admin PIC terlebih dahulu.
                    </p>
                  )}

                  <div className="pt-1">
                    <input
                      type="text"
                      value={formAssignedPic}
                      onChange={(e) => setFormAssignedPic(e.target.value)}
                      placeholder="Pilih dari tombol di atas atau ketik nama PIC..."
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Anak magang ini mendampingi Admin PIC di atas. Bisa update data reservasi, source &amp; review, serta HPP, namun DILARANG menghapus (delete) data apapun.
                  </p>
                </div>
              )}

              </div>

              {/* Footer Modal - Selalu terlihat di bagian bawah */}
              <div className="px-5 py-3.5 border-t border-border bg-card flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalUserOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingUser}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:opacity-90 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSavingUser ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{editingUser ? 'Perbarui Akun' : 'Simpan ke Whitelist'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GANTI PASSWORD PENGGUNA LAIN OLEH SUPERADMIN */}
      {isModalChangePasswordOpen && passwordTargetUser && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalChangePasswordOpen(false);
          }}
        >
          <div
            className="bg-card border border-border rounded-2xl max-w-md w-full my-auto shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal - Selalu terlihat */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card shrink-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Key size={18} />
                </div>
                <div>
                  <h3 className="font-heading font-black text-base text-foreground">
                    Ganti Password Pengguna
                  </h3>
                  <p className="text-xs text-muted-foreground truncate max-w-[240px]">
                    {passwordTargetUser.name} • {passwordTargetUser.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalChangePasswordOpen(false)}
                className="w-8 h-8 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors"
                title="Tutup (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveChangedPassword} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="p-5 overflow-y-auto flex-1 space-y-4">
                {changePasswordError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle size={15} className="shrink-0" />
                    <span>{changePasswordError}</span>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-muted/40 border border-border/80 text-xs text-muted-foreground">
                  Superadmin dapat langsung mengatur kata sandi baru untuk <strong>{passwordTargetUser.name}</strong> tanpa perlu mengirimkan link reset ke email.
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">
                      Password Baru <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-muted-foreground font-semibold">Min. 6 Karakter</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showTargetPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={targetNewPassword}
                      onChange={(e) => setTargetNewPassword(e.target.value)}
                      placeholder="Masukkan password baru akun..."
                      className="w-full pl-3.5 pr-10 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTargetPassword(!showTargetPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      title={showTargetPassword ? 'Sembunyikan password' : 'Lihat password'}
                    >
                      {showTargetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Konfirmasi Password Baru <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showTargetPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={targetConfirmPassword}
                      onChange={(e) => setTargetConfirmPassword(e.target.value)}
                      placeholder="Ulangi password baru..."
                      className="w-full pl-3.5 pr-10 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Modal */}
              <div className="px-5 py-3.5 border-t border-border bg-card flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalChangePasswordOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:opacity-90 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Menyimpan Password...</span>
                    </>
                  ) : (
                    <span>Simpan Password Baru</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
