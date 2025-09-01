const http = require('http');

function postJson(path, body, headers = {}){
  return new Promise((resolve, reject)=>{
    const data = JSON.stringify(body);
    const opts = { hostname: 'localhost', port: 3025, path, method: 'POST', headers: Object.assign({ 'Content-Type':'application/json','Content-Length':Buffer.byteLength(data)}, headers)};
    const req = http.request(opts, res => {
      let buf = '';
      res.on('data', d=>buf+=d.toString());
      res.on('end', ()=>{
        let json = null;
        try{ json = JSON.parse(buf); }catch(e){ }
        resolve({ status: res.statusCode, body: json, raw: buf });
      });
    });
    req.on('error', reject);
    req.write(data); req.end();
  });
}

(async ()=>{
  try{
    const login = await postJson('/api/auth/login', { email: 'local-admin@example.com', password: 'AdminPass123!' });
    if(login.status !== 200) return console.error('Login failed', login.status, login.body, login.raw);
    console.log('Logged in as', login.body.user.email);
    const token = login.body.token;

    const productId = '5e670695-92f5-4dd7-95f9-2588b9507da5';
    const saleBody = { active: true, price: 190, prevPrice: 250, regenerate: true };
    const sale = await postJson(`/api/admin/products/${productId}/sale`, saleBody, { Authorization: 'Bearer '+token });
    console.log('Sale endpoint:', sale.status, sale.body || sale.raw);
  }catch(e){ console.error(e); process.exit(1); }
})();
