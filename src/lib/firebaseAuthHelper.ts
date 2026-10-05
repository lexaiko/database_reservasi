import { initializeApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth, firebaseConfig } from './firebase';

/**
 * Membuat user baru di Firebase Authentication tanpa memutus / logout sesi Superadmin saat ini.
 * Menggunakan temporary secondary app instance.
 */
export async function createNewFirebaseUser(email: string, pass: string): Promise<string> {
  const secondaryAppName = `secondary-auth-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), pass);
    const uid = userCredential.user.uid;
    await signOut(secondaryAuth);
    return uid;
  } finally {
    try {
      await deleteApp(secondaryApp);
    } catch {
      // Abaikan jika pembersihan secondary app gagal
    }
  }
}

/**
 * Mengubah password pengguna lain secara langsung oleh Superadmin.
 * Menggunakan temporary secondary app instance agar sesi Superadmin tetap aktif.
 */
export async function adminChangeOtherUserPassword(
  email: string,
  newPassword: string,
  currentPassword?: string
): Promise<{ success: boolean; authSynced: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanNewPass = newPassword.trim();

  if (cleanNewPass.length < 6) {
    throw new Error('Password baru minimal harus 6 karakter.');
  }

  // Jika password akun saat ini tersedia di sistem/input, sinkronkan langsung ke Firebase Auth
  if (currentPassword && currentPassword.trim().length > 0) {
    const secondaryAppName = `sec-pwd-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      const cred = await signInWithEmailAndPassword(secondaryAuth, cleanEmail, currentPassword.trim());
      await updatePassword(cred.user, cleanNewPass);
      await signOut(secondaryAuth);
      return {
        success: true,
        authSynced: true,
        message: 'Password akun berhasil diperbarui langsung di Firebase Authentication.',
      };
    } catch (err: any) {
      console.warn('Gagal sinkronisasi updatePassword via secondary app:', err);
      // Jika password lama salah
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        throw new Error('Password lama akun tidak cocok di autentikasi.');
      }
      throw new Error(`Gagal memperbarui autentikasi: ${err.message || err.code}`);
    } finally {
      try {
        await deleteApp(secondaryApp);
      } catch {
        // Abaikan pembersihan
      }
    }
  }

  return {
    success: true,
    authSynced: false,
    message: 'Password baru berhasil disimpan ke database profil pengguna.',
  };
}

/**
 * Mengubah password untuk user yang sedang aktif login.
 * Jika diperlukan re-autentikasi (auth/requires-recent-login), gunakan currentPassword.
 */
export async function changeCurrentUserPassword(
  newPass: string,
  currentPass?: string
): Promise<void> {
  if (!auth || !auth.currentUser) {
    throw new Error('Tidak ada sesi login pengguna aktif.');
  }

  const user = auth.currentUser;

  // Jika password saat ini diberikan, lakukan re-autentikasi terlebih dahulu
  if (currentPass && user.email) {
    const credential = EmailAuthProvider.credential(user.email, currentPass);
    await reauthenticateWithCredential(user, credential);
  }

  try {
    await updatePassword(user, newPass);
  } catch (err: any) {
    if (err.code === 'auth/requires-recent-login' && !currentPass) {
      throw new Error(
        'Demi keamanan, silakan masukkan password Anda saat ini sebelum mengganti password baru.'
      );
    }
    throw err;
  }
}
