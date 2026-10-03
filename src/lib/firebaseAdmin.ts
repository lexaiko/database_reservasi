/**
 * Firebase Admin SDK untuk Server-Side (API Routes)
 * Menggunakan Google Service Account dari env untuk bypass Firestore Security Rules.
 * 
 * File ini hanya di-import di server-side (API routes), BUKAN di client components.
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

function getServiceAccount() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function initAdminApp() {
  if (adminApp) return adminApp;

  // Cegah duplikasi inisialisasi
  const existingApp = getApps().find((a) => a.name === 'admin-server');
  if (existingApp) {
    adminApp = existingApp;
    adminDb = getFirestore(adminApp);
    return adminApp;
  }

  const serviceAccount = getServiceAccount();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!serviceAccount || !projectId) return null;

  try {
    adminApp = initializeApp(
      {
        credential: cert(serviceAccount),
        projectId,
      },
      'admin-server'
    );
    adminDb = getFirestore(adminApp);
    return adminApp;
  } catch (err) {
    console.error('[firebaseAdmin] Gagal inisialisasi:', err);
    return null;
  }
}

export function getAdminDb(): Firestore | null {
  initAdminApp();
  return adminDb;
}
