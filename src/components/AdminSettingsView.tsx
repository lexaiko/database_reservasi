'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, UserRole } from '@/types/auth';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
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
} from 'lucide-react';

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
  const [formRole, setFormRole] = useState<UserRole>('admin');
  const [formAssignedPic, setFormAssignedPic] = useState('');

  // Daftar PIC dari akun admin aktif — dinamis dari Firestore
  const [adminPicList, setAdminPicList] = useState<string[]>([]);

  useEffect(() => {
    if (!db) return;
    getDocs(collection(db, 'users'))
      .then((snap) => {
        const names: string[] = [];
        snap.forEach((d) => {
          const data = d.data();
          if (data.role === 'admin' && data.status !== 'inactive') {
            const n = (data.name || '').trim();
            if (n) names.push(n);
          }
        });
        const sorted = Array.from(new Set<string>(names)).sort();
        setAdminPicList(sorted);
        // Set default ke admin pertama jika form belum diisi
        if (!formAssignedPic && sorted.length > 0) {
          setFormAssignedPic(sorted[0]);
        }
      })
      .catch(() => setAdminPicList(['Dela', 'Alvin', 'Holiday']));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const res = await fetch('/api/admin/settings');
      const json = await res.json();
      if (json.ok && json.data) {
        setSpreadsheetId(json.data.spreadsheetId || '');
        setSheetUpdatedAt(json.data.updatedAt || '');
        setSheetUpdatedBy(json.data.updatedBy || '');
      }
    } catch (e: any) {
      console.error('Failed to load sheet settings:', e);
    } finally {
      setIsLoadingSheet(false);
    }
  }, []);

  // Fetch Users — langsung dari Firestore (client SDK punya auth token superadmin)
  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      if (!db) throw new Error('Firestore belum terinisialisasi.');
      const snap = await getDocs(collection(db, 'users'));
      const list: UserProfile[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          uid: d.id,
          email: data.email || '',
          name: data.name || '',
          role: (data.role === 'superadmin'
            ? 'superadmin'
            : data.role === 'intern'
            ? 'intern'
            : 'admin') as UserRole,
          status: data.status === 'inactive' ? 'inactive' : 'active',
          assignedPic: data.assignedPic || '',
          createdAt: data.createdAt,
        });
      });
      setUsers(list);
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

  // Handle Simpan Sheet Settings
  const handleSaveSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spreadsheetId.trim()) {
      showAlert('error', 'Google Spreadsheet ID wajib diisi.');
      return;
    }

    setIsSavingSheet(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId: spreadsheetId.trim(),
          updatedBy: currentUserEmail || 'Super Admin',
        }),
      });

      const json = await res.json();
      if (json.ok) {
        showAlert('success', 'Konfigurasi Google Sheets berhasil disimpan ke Firestore.');
        fetchSheetSettings();
      } else {
        showAlert('error', json.error || 'Gagal menyimpan konfigurasi sheet.');
      }
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
    setFormRole('admin');
    setFormAssignedPic(adminPicList[0] || '');
    setFormStatus('active');
    setFormError(null);
    setIsModalUserOpen(true);
  };

  const openEditUser = (u: UserProfile) => {
    setEditingUser(u);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormRole(u.role);
    setFormAssignedPic(u.assignedPic || adminPicList[0] || '');
    setFormStatus(u.status);
    setFormError(null);
    setIsModalUserOpen(true);
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
    if ((formRole === 'admin' || formRole === 'intern') && !formAssignedPic.trim()) {
      setFormError('Nama PIC yang dipegang / didampingi wajib dipilih atau diisi.');
      return;
    }

    setIsSavingUser(true);
    try {
      if (!db) throw new Error('Firestore belum terinisialisasi.');

      const cleanEmail = formEmail.trim().toLowerCase();
      // Gunakan UID existing saat edit, atau email sebagai doc ID saat buat baru
      const targetDocId = editingUser?.uid && editingUser.uid.trim().length > 0
        ? editingUser.uid
        : cleanEmail;

      const validatedRole: UserRole =
        formRole === 'superadmin' ? 'superadmin' : formRole === 'intern' ? 'intern' : 'admin';

      const payload = {
        email: cleanEmail,
        name: formName.trim(),
        role: validatedRole,
        status: formStatus,
        assignedPic: validatedRole === 'superadmin' ? '' : formAssignedPic.trim(),
        createdAt: editingUser?.createdAt || new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', targetDocId), payload, { merge: true });

      showAlert(
        'success',
        editingUser
          ? 'Data pengguna berhasil diperbarui.'
          : 'Pengguna baru berhasil didaftarkan ke whitelist Firestore.'
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
                                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                              }`}
                            >
                              {isSuper ? 'SUPERADMIN' : isIntern ? 'INTERN (MAGANG)' : 'ADMIN (PIC)'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-foreground">
                            {isSuper ? (
                              <span className="text-[11px] text-muted-foreground italic">Semua PIC</span>
                            ) : isIntern ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400">
                                Asisten: {u.assignedPic || '-'}
                              </span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-heading font-black text-base text-foreground flex items-center gap-2">
                <Key size={18} className="text-primary" />
                <span>{editingUser ? 'Edit Pengguna Admin' : 'Tambah Admin Baru'}</span>
              </h3>
              <button
                onClick={() => setIsModalUserOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4">
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
                {!editingUser && (
                  <p className="text-[11px] text-muted-foreground">
                    Pastikan email ini juga dibuatkan user di Authentication Firebase Console.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Tingkat Hak Akses</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer"
                  >
                    <option value="admin">Admin (PIC Sales Handler)</option>
                    <option value="intern">Intern (Anak Magang / Asisten PIC)</option>
                    <option value="superadmin">Superadmin (Akses Penuh)</option>
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

              {/* Dynamic Assigned PIC Field (Untuk Admin & Intern) */}
              {formRole !== 'superadmin' && (
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">
                      {formRole === 'intern'
                        ? 'Mendampingi PIC (Asisten Untuk)'
                        : 'PIC Agen yang Dipegang'}
                    </label>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-1.5 py-0.5 rounded bg-primary/10">
                      Wajib
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {adminPicList.map((picName) => (
                      <button
                        key={picName}
                        type="button"
                        onClick={() => setFormAssignedPic(picName)}
                        className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer border ${
                          formAssignedPic.toLowerCase() === picName.toLowerCase()
                            ? 'bg-primary text-primary-foreground border-primary font-black shadow-2xs'
                            : 'bg-background hover:bg-muted text-foreground border-border'
                        }`}
                      >
                        {picName}
                      </button>
                    ))}
                  </div>

                  <div className="pt-1">
                    <input
                      type="text"
                      value={formAssignedPic}
                      onChange={(e) => setFormAssignedPic(e.target.value)}
                      placeholder="Atau ketik nama PIC manual (contoh: Dela)..."
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {formRole === 'intern'
                      ? 'Anak magang ini mendampingi PIC di atas. Bisa update data reservasi, source & review, serta HPP, namun DILARANG menghapus (delete) data apapun.'
                      : 'Admin ini hanya akan melihat dan mengelola data tamu miliknya sendiri.'}
                  </p>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-border">
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
    </div>
  );
}
