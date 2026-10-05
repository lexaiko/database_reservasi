const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
let apiKey = '';

envContent.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_FIREBASE_API_KEY=')) {
    apiKey = line.substring('NEXT_PUBLIC_FIREBASE_API_KEY='.length).trim();
  }
});

async function testAccountsUpdate() {
  console.log('Testing accounts:update...');

  // Create test user
  const email = `test_update_${Date.now()}@tripbanyuwangi.com`;
  const signUpRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'OldPassword123!', returnSecureToken: true })
  });
  const signUpData = await signUpRes.json();
  console.log('Sign up result:', signUpData.localId ? 'SUCCESS' : signUpData);
  const uid = signUpData.localId;
  const idToken = signUpData.idToken;

  // Now test updating password with localId directly (as admin would do)
  const updateRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      localId: uid,
      password: 'NewPassword999!',
      returnSecureToken: true
    })
  });
  const updateData = await updateRes.json();
  console.log('Update without idToken response:', updateData);

  // Now test updating with idToken
  const updateWithToken = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idToken: idToken,
      password: 'NewPassword999!',
      returnSecureToken: true
    })
  });
  const updateWithTokenData = await updateWithToken.json();
  console.log('Update WITH idToken response:', updateWithTokenData.localId ? 'SUCCESS' : updateWithTokenData);

  // Cleanup
  await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: updateWithTokenData.idToken || idToken })
  });
  console.log('Cleaned up.');
}

testAccountsUpdate().catch(console.error);
