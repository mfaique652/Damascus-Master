import * as crypto from 'crypto';

function b64u(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
}

const header = { alg: 'HS256', typ: 'JWT' };
const payload = {
  userId: '33c84483-d3db-4051-a4d2-d12aff22c38a',
  email: 'admin@example.com',
  role: 'admin',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 86400
};
const h = b64u(header);
const p = b64u(payload);
const secret = process.env.JWT_SECRET || require('crypto').randomBytes(16).toString('hex');
const sig = crypto.createHmac('sha256', secret).update(h + '.' + p).digest('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const token = `${h}.${p}.${sig}`;

console.log('TOKEN:', token);

const hosts = [ 'http://localhost:3025/api/admin/support-messages', 'http://127.0.0.1:3025/api/admin/support-messages' ];

async function run() {
  let res = null;
  let lastErr = null;
  for (const u of hosts) {
    try {
      console.log('Trying', u);
      res = await fetch(u, { method: 'GET', headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' } });
      break; // success
    } catch (e) {
      lastErr = e;
      console.error('Connection failed to', u, '-', e && e.message ? e.message : e);
    }
  }
  if (!res) {
    console.error('No response from any host');
    console.error('LAST ERROR:', lastErr && lastErr.message ? lastErr.message : lastErr);
    try { console.error('FULL ERROR:', lastErr); } catch {}
    return;
  }

  console.log('STATUS:', res.status);
  const text = await res.text();
  try {
    const j = JSON.parse(text);
    console.log('BODY:', JSON.stringify(j, null, 2));
  } catch (e) {
    console.log('BODY (raw):', text);
  }
}

run();
