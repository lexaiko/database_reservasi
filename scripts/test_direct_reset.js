const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
let apiKey = '';

envContent.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_FIREBASE_API_KEY=')) {
    apiKey = line.substring('NEXT_PUBLIC_FIREBASE_API_KEY='.length).trim();
  }
});

async function testDirectPasswordReset() {
  console.log('Testing direct password reset via REST API...');

  // 1. Create a dummy test user first
  const testEmail = `pw_test_${Date.now()}@tripbanyuwangi.com`;
  const initialPassword = 'InitialPassword123!';
  const newPassword = 'NewPassword456!';

  const signUpRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: initialPassword,
      returnSecureToken: true
    })
  });
  const signUpData = await signUpRes.json();
  console.log('Sign up result:', signUpData.localId ? 'SUCCESS' : signUpData);
  const idToken = signUpData.idToken;

  // 2. Request OobCode for PASSWORD_RESET
  const oobRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestType: 'PASSWORD_RESET',
      email: testEmail
    })
  });
  const oobData = await oobRes.json();
  console.log('sendOobCode response:', oobData);

  // Does oobData contain oobCode?
  if (oobData.oobCode) {
    console.log('Got oobCode directly:', oobData.oobCode);
    const resetRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oobCode: oobData.oobCode,
        newPassword: newPassword
      })
    });
    const resetData = await resetRes.json();
    console.log('resetPassword result:', resetData.email ? 'SUCCESS' : resetData);
  } else {
    console.log('oobCode not in response, sendOobCode only sent email.');
  }

  // 3. Clean up: delete user
  await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  });
  console.log('Test user cleaned up.');
}

testDirectPasswordReset().catch(console.error);
