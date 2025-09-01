const { execSync } = require('child_process');
const http = require('http');
try{
  const token = String(execSync('node tools/e2e_login.js', { encoding: 'utf8' })).trim();
  console.log('GOT TOKEN', token.slice(0,40) + '...');
  const opts = { hostname: 'localhost', port: 3025, path: '/api/admin/products/5e670695-92f5-4dd7-95f9-2588b9507da5/regenerate', method: 'POST', headers: { 'Authorization': 'Bearer ' + token } };
  const req = http.request(opts, res => { let body=''; res.on('data', c => body += String(c)); res.on('end', ()=>{ console.log('STATUS', res.statusCode); try{ console.log('BODY', JSON.stringify(JSON.parse(body), null, 2)); }catch(e){ console.log('BODY', body); } }); });
  req.on('error', e => { console.error('ERR', e && e.message); process.exit(2); });
  req.end();
}catch(e){ console.error('E', e && e.message); process.exit(2); }
