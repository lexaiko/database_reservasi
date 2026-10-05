const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
let rawKey = '';
let apiKey = '';
let projectId = '';

envContent.split('\n').forEach(line => {
  if (line.startsWith('GOOGLE_SERVICE_ACCOUNT_KEY=')) {
    rawKey = line.substring('GOOGLE_SERVICE_ACCOUNT_KEY='.length).trim();
  }
  if (line.startsWith('NEXT_PUBLIC_FIREBASE_API_KEY=')) {
    apiKey = line.substring('NEXT_PUBLIC_FIREBASE_API_KEY='.length).trim();
  }
  if (line.startsWith('NEXT_PUBLIC_FIREBASE_PROJECT_ID=')) {
    projectId = line.substring('NEXT_PUBLIC_FIREBASE_PROJECT_ID='.length).trim();
  }
});

const serviceAccount = JSON.parse(rawKey);

async function testSuperadminDirectPasswordChange() {
  console.log('Testing Superadmin Direct Password Change via Custom Token -> ID Token -> accounts:update...');

  // 1. Create a test user via REST API
  const testEmail = `direct_change_${Date.now()}@tripbanyuwangi.com`;
  const initialPassword = 'InitialPass123!';
  const newPassword = 'SuperadminNewPass999!';

  const signUpRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: initialPassword, returnSecureToken: true })
  });
  const signUpData = await signUpRes.json();
  const uid = signUpData.localId;
  console.log('1. User created with UID:', uid);

  // 2. Local Custom Token generation via Firebase Admin (NO network call to identitytoolkit API!)
  const app = initializeApp({
    credential: cert(serviceAccount),
    projectId: projectId,
  }, 'local-signer');

  const adminAuth = getAuth(app);
  const customToken = await adminAuth.createCustomToken(uid);
  console.log('2. Custom token created locally (first 20 chars):', customToken.substring(0, 20) + '...');

  // 3. Exchange custom token for ID token via REST API
  const tokenExchangeRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: customToken,
      returnSecureToken: true
    })
  });
  const tokenExchangeData = await tokenExchangeRes.json();
  console.log('3. Token exchange response status:', tokenExchangeData.idToken ? 'SUCCESS' : tokenExchangeData);
  const idToken = tokenExchangeData.idToken;

  // 4. Update the user password directly!
  const updateRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idToken: idToken,
      password: newPassword,
      returnSecureToken: true
    })
  });
  const updateData = await updateRes.json();
  console.log('4. Password update result:', updateData.localId ? 'SUCCESS' : updateData);

  // 5. VERIFY: Can the user now sign in with the NEW password?
  const verifyRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: newPassword,
      returnSecureToken: true
    })
  });
  const verifyData = await verifyRes.json();
  console.log('5. Sign-in with NEW password result:', verifyData.idToken ? 'SUCCESS! USER LOGGED IN WITH NEW PASSWORD!' : verifyData);

  // 6. Cleanup
  await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: verifyData.idToken })
  });
  console.log('6. Cleaned up test user.');
}

testSuperadminDirectPasswordChange().catch(console.error);
