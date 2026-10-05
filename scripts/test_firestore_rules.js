const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc } = require('firebase/firestore');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const config = {};
envContent.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_FIREBASE_API_KEY=')) config.apiKey = line.substring('NEXT_PUBLIC_FIREBASE_API_KEY='.length).trim();
  if (line.startsWith('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=')) config.authDomain = line.substring('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN='.length).trim();
  if (line.startsWith('NEXT_PUBLIC_FIREBASE_PROJECT_ID=')) config.projectId = line.substring('NEXT_PUBLIC_FIREBASE_PROJECT_ID='.length).trim();
  if (line.startsWith('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=')) config.storageBucket = line.substring('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET='.length).trim();
  if (line.startsWith('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=')) config.messagingSenderId = line.substring('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID='.length).trim();
  if (line.startsWith('NEXT_PUBLIC_FIREBASE_APP_ID=')) config.appId = line.substring('NEXT_PUBLIC_FIREBASE_APP_ID='.length).trim();
});

async function testFirestoreRules() {
  const app = initializeApp(config, 'RuleTester');
  const db = getFirestore(app);

  try {
    const snap = await getDocs(collection(db, 'users'));
    console.log('Firestore read SUCCESS without auth token! Documents found:', snap.size);
  } catch (err) {
    console.error('Firestore read error:', err.message);
  }
}

testFirestoreRules().catch(console.error);
