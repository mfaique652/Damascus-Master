const https = require('http');
const data = JSON.stringify({ email: 'e2eadmin@example.com', password: 'Secret123' });
const opts = { hostname: 'localhost', port: 3025, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } };
const req = https.request(opts, res => {
  let body = '';
  res.on('data', c => body += String(c));
  res.on('end', () => {
    try { const j = JSON.parse(body); console.log(j.token || JSON.stringify(j)); } catch(e){ console.log('PARSE_FAILED', body); }
  });
});
req.on('error', e => { console.error('REQERR', e && e.message); process.exit(2); });
req.write(data); req.end();
