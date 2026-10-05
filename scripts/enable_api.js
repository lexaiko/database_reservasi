const { google } = require('googleapis');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
let rawKey = '';
envContent.split('\n').forEach(line => {
  if (line.startsWith('GOOGLE_SERVICE_ACCOUNT_KEY=')) {
    rawKey = line.substring('GOOGLE_SERVICE_ACCOUNT_KEY='.length).trim();
  }
});

async function enableIdentityToolkit() {
  const credentials = JSON.parse(rawKey);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const client = await auth.getClient();
  console.log('Got Google client. Trying to enable identitytoolkit.googleapis.com on project 574709721449...');

  try {
    const res = await client.request({
      url: 'https://serviceusage.googleapis.com/v1/projects/574709721449/services/identitytoolkit.googleapis.com:enable',
      method: 'POST',
    });
    console.log('Enable API response:', res.data);
  } catch (err) {
    console.error('Failed to enable:', err.response?.data || err.message);
  }
}

enableIdentityToolkit().catch(console.error);
