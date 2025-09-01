(async function(){
  const fs = require('fs');
  const base = 'http://localhost:3025';
  const admin = { email: 'faiqsajjad652@gmail.com', password: 'faiq1032' };
  try{
    console.log('Logging in...');
  let r = await fetch(base + '/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(admin)});
    if(!r.ok){ console.error('Login failed', r.status); process.exit(1); }
    const j = await r.json();
    const token = j.token; console.log('Got token');
    // Pick a product id from a known generated album file
    const productId = '8b17d2d1-112c-4c33-bea4-c2b4ca9247cd';
    // Set sale
    console.log('Setting sale...');
  r = await fetch(base + '/api/products/' + productId, { method: 'PUT', headers: { 'Content-Type':'application/json', 'Authorization': 'Bearer '+token }, body: JSON.stringify({ sale: { active: true, price: 120, prevPrice: 180 } }) });
  console.log('Set sale status:', r.status);
  if (r.ok) try { const resp = await r.json(); console.log('Set sale response body:', { price: resp.price, sale: resp.sale }); } catch(e){}
    // Wait a moment
    await new Promise(r=>setTimeout(r,500));
    // Read DB
    const db = JSON.parse(fs.readFileSync('server/data/db.json','utf8'));
    const p = db.products.find(x=>x.id===productId);
    console.log('After set:', { price: p.price, sale: p.sale });
    // Remove sale
    console.log('Removing sale...');
  r = await fetch(base + '/api/products/' + productId, { method: 'PUT', headers: { 'Content-Type':'application/json', 'Authorization': 'Bearer '+token }, body: JSON.stringify({ sale: { active: false } }) });
  console.log('Remove sale status:', r.status);
  if (r.ok) try { const resp = await r.json(); console.log('Remove sale response body:', { price: resp.price, sale: resp.sale }); } catch(e){}
    await new Promise(r=>setTimeout(r,500));
    const db2 = JSON.parse(fs.readFileSync('server/data/db.json','utf8'));
    const p2 = db2.products.find(x=>x.id===productId);
    console.log('After remove:', { price: p2.price, sale: p2.sale });
  }catch(e){ console.error(e); process.exit(1); }
})();
