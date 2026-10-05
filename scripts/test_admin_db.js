const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
let rawKey = '';
let projectId = '';
envContent.split('\n').forEach(line => {
  if (line.startsWith('GOOGLE_SERVICE_ACCOUNT_KEY=')) rawKey = line.substring('GOOGLE_SERVICE_ACCOUNT_KEY='.length).trim();
  if (line.startsWith('NEXT_PUBLIC_FIREBASE_PROJECT_ID=')) projectId = line.substring('NEXT_PUBLIC_FIREBASE_PROJECT_ID='.length).trim();
});

const serviceAccount = JSON.parse(rawKey);
const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: projectId,
}, 'test-admin-db');

const db = getFirestore(app);
db.collection('users').get()
  .then(snap => {
    console.log('adminDb SUCCESS! Docs count:', snap.size);
    snap.forEach(d => console.log('User doc:', d.id, d.data().email, d.data().name));
  })
  .catch(err => {
    console.error('adminDb error:', err.message);
  });
