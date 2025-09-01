const http = require('http');
const { execSync } = require('child_process');

function getToken(){
  try{
    const out = execSync('node tools/e2e_login.js', { encoding: 'utf8' });
    return String(out || '').trim();
  }catch(e){ console.error('login failed', e && e.message); process.exit(2); }
}

async function postSale(token){
  const payloadObj = { active: true, price: 199, prevPrice: 250, regenerate: true };
  console.log('sending payload', payloadObj);
  const payload = JSON.stringify(payloadObj);
  const opts = { hostname: 'localhost', port: 3025, path: '/api/admin/products/5e670695-92f5-4dd7-95f9-2588b9507da5/sale', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), 'Authorization': 'Bearer ' + token } };
  const req = http.request(opts, res => { let body=''; res.on('data', c=> body+=String(c)); res.on('end', ()=> { console.log('STATUS', res.statusCode); try{ console.log('BODY', JSON.stringify(JSON.parse(body), null, 2)); }catch(e){ console.log('BODY', body); } }); });
  req.on('error', e=> { console.error('ERR', e && e.message); process.exit(2); });
  req.write(payload); req.end();
}

const token = getToken();
console.log('GOT TOKEN', token.slice(0,40) + '...');
postSale(token);
