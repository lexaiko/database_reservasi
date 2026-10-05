'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { UserProfile } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isConfigured: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  error: null,
  isConfigured: false,
  loginWithEmail: async () => {},
  logout: async () => {},
  clearError: () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fungsi internal untuk memverifikasi dokumen user di Firestore
  const verifyAndLoadProfile = useCallback(async (firebaseUser: User): Promise<UserProfile> => {
    if (!db) {
      throw new Error('Koneksi Firestore belum terinisialisasi.');
    }

    const userEmail = (firebaseUser.email || '').toLowerCase().trim();

    // 1. Coba cari dengan document ID = UID
    try {
      const docRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const status = (data.status || data.Status || 'active').toString().toLowerCase();
        if (status === 'inactive' || status === 'disabled' || status === 'nonaktif') {
          throw new Error('Akun Anda dinonaktifkan oleh administrator.');
        }
        return {
          uid: firebaseUser.uid,
          email: data.email || data.Email || firebaseUser.email || '',
          name: data.name || data.Name || firebaseUser.displayName || 'Admin TripBanyuwangi',
          role: (data.role || data.Role || 'admin').toString().toLowerCase() as any,
          status: 'active',
          isPic: data.isPic !== undefined ? Boolean(data.isPic) : true,
          assignedPic: data.assignedPic || data.AssignedPic || '',
          allowedPics: Array.isArray(data.allowedPics) ? data.allowedPics : [],
          accountPassword: data.accountPassword,
          passwordUpdatedAt: data.passwordUpdatedAt,
          createdAt: data.createdAt,
        };
      }
    } catch (err: any) {
      if (err.message === 'Akun Anda dinonaktifkan oleh administrator.') {
        throw err;
      }
    }

    // 2. Coba cari dengan document ID = email
    if (userEmail) {
      try {
        const docRef = doc(db, 'users', userEmail);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const status = (data.status || data.Status || 'active').toString().toLowerCase();
          if (status === 'inactive' || status === 'disabled' || status === 'nonaktif') {
            throw new Error('Akun Anda dinonaktifkan oleh administrator.');
          }
          return {
            uid: docSnap.id,
            email: data.email || data.Email || firebaseUser.email || '',
            name: data.name || data.Name || firebaseUser.displayName || 'Admin TripBanyuwangi',
            role: (data.role || data.Role || 'admin').toString().toLowerCase() as any,
            status: 'active',
            isPic: data.isPic !== undefined ? Boolean(data.isPic) : true,
            assignedPic: data.assignedPic || data.AssignedPic || '',
            allowedPics: Array.isArray(data.allowedPics) ? data.allowedPics : [],
            accountPassword: data.accountPassword,
            passwordUpdatedAt: data.passwordUpdatedAt,
            createdAt: data.createdAt,
          };
        }
      } catch (err: any) {
        if (err.message === 'Akun Anda dinonaktifkan oleh administrator.') {
          throw err;
        }
      }

      // 3. Fallback: Cari di koleksi 'users' dengan field 'email'
      try {
        const q = query(collection(db, 'users'), where('email', '==', userEmail));
        const querySnap = await getDocs(q);

        if (!querySnap.empty) {
          const foundDoc = querySnap.docs[0];
          const data = foundDoc.data();
          const status = (data.status || data.Status || 'active').toString().toLowerCase();
          if (status === 'inactive' || status === 'disabled' || status === 'nonaktif') {
            throw new Error('Akun Anda dinonaktifkan oleh administrator.');
          }
          return {
            uid: foundDoc.id,
            email: data.email || data.Email || firebaseUser.email || '',
            name: data.name || data.Name || firebaseUser.displayName || 'Admin TripBanyuwangi',
            role: (data.role || data.Role || 'admin').toString().toLowerCase() as any,
            status: 'active',
            isPic: data.isPic !== undefined ? Boolean(data.isPic) : true,
            assignedPic: data.assignedPic || data.AssignedPic || '',
            allowedPics: Array.isArray(data.allowedPics) ? data.allowedPics : [],
            accountPassword: data.accountPassword,
            passwordUpdatedAt: data.passwordUpdatedAt,
            createdAt: data.createdAt,
          };
        }
      } catch (err: any) {
        if (err.message === 'Akun Anda dinonaktifkan oleh administrator.') {
          throw err;
        }
      }
    }

    // 4. Auto-Bootstrap: HANYA untuk akun superadmin utama (admin@tripbanyuwangi.com).
    // Akun @tripbanyuwangi.com lain (Dela, Alvin, Holiday) harus didaftarkan via Settings oleh Superadmin.
    if (userEmail === 'admin@tripbanyuwangi.com') {
      try {
        const superadminProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: userEmail,
          name: firebaseUser.displayName || 'Super Admin TripBanyuwangi',
          role: 'superadmin',
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), superadminProfile);
        return superadminProfile;
      } catch (bootErr) {
        console.warn('Auto-bootstrap superadmin warning:', bootErr);
      }
    }

    // Jika tidak ditemukan sama sekali di koleksi Firestore
    throw new Error('Akun Anda belum terdaftar di whitelist sistem. Hubungi administrator.');
  }, []);

  // Listen perubahan state login Firebase Auth
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userProf = await verifyAndLoadProfile(firebaseUser);
          setUser(firebaseUser);
          setProfile(userProf);
          setError(null);
        } catch (err: any) {
          console.warn('Verifikasi profil Firestore gagal:', err.message);
          if (auth) {
            await signOut(auth).catch(() => {});
          }
          setUser(null);
          setProfile(null);
          setError(err.message || 'Gagal memverifikasi izin akses akun.');
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [verifyAndLoadProfile]);

  // Fungsi Login
  const loginWithEmail = async (email: string, pass: string) => {
    setError(null);

    if (!isFirebaseConfigured || !auth) {
      const msg = 'Kredensial Firebase belum dikonfigurasi di file .env.local.';
      setError(msg);
      throw new Error(msg);
    }

    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const userProf = await verifyAndLoadProfile(cred.user);
      setUser(cred.user);
      setProfile(userProf);
      setError(null);

      // Sinkronisasikan password aktif ke dokumen profil di Firestore jika belum tersimpan
      if (db && cred.user?.uid) {
        try {
          await setDoc(
            doc(db, 'users', cred.user.uid),
            {
              accountPassword: pass,
              passwordUpdatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch {
          // Abaikan jika Firestore merge gagal
        }
      }
    } catch (err: any) {
      if (auth) {
        await signOut(auth).catch(() => {});
      }
      setUser(null);
      setProfile(null);

      let msg = 'Gagal melakukan login. Periksa koneksi dan coba lagi.';
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password'
      ) {
        msg = 'Email atau kata sandi yang Anda masukkan salah.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Format alamat email tidak valid.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat lagi.';
      } else if (err.message) {
        msg = err.message;
      }

      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi Logout
  const logout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
      setUser(null);
      setProfile(null);
      setError(null);
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  const clearError = () => setError(null);

  const refreshProfile = async () => {
    if (auth?.currentUser) {
      try {
        const p = await verifyAndLoadProfile(auth.currentUser);
        setProfile(p);
      } catch (err) {
        console.error('Refresh profile error:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        error,
        isConfigured: isFirebaseConfigured,
        loginWithEmail,
        logout,
        clearError,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
