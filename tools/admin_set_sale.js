#!/usr/bin/env node
// tools/admin_set_sale.js
// Usage: node tools/admin_set_sale.js <productId> --price 199 --prevPrice 250 --active true --apply

const fs = require('fs');
const path = require('path');

function usage(){
  console.log('Usage: node tools/admin_set_sale.js <productId> [--price N] [--prevPrice N] [--active true|false] [--apply]');
  process.exit(2);
}

const argv = process.argv.slice(2);
if (!argv || argv.length === 0) usage();
const productId = argv[0];
const opts = {};
for (let i=1;i<argv.length;i++){
  const a = argv[i];
  if (a === '--apply') opts.apply = true;
  else if (a.startsWith('--price')) opts.price = Number(a.split('=')[1] || argv[++i]);
  else if (a.startsWith('--prevPrice')) opts.prevPrice = Number(a.split('=')[1] || argv[++i]);
  else if (a.startsWith('--active')) opts.active = (String(a.split('=')[1] || argv[++i] || '').toLowerCase() === 'true');
  else { console.warn('Unknown arg', a); usage(); }
}

(async ()=>{
  const dbPath = path.join(process.cwd(), 'server', 'data', 'db.json');
  if (!fs.existsSync(dbPath)) { console.error('DB not found at', dbPath); process.exit(1); }
  const raw = fs.readFileSync(dbPath, 'utf8');
  const db = JSON.parse(raw);
  const prod = (db.products || []).find(p => p.id === productId);
  if (!prod) { console.error('Product not found:', productId); process.exit(1); }

  console.log('Current sale for', productId, JSON.stringify(prod.sale || null));
  const newSale = Object.assign({}, prod.sale || { active: false });
  if (typeof opts.active !== 'undefined') newSale.active = !!opts.active;
  if (typeof opts.price !== 'undefined') newSale.price = Number(opts.price);
  if (typeof opts.prevPrice !== 'undefined') newSale.prevPrice = Number(opts.prevPrice);

  console.log('Proposed sale:', newSale);
  if (!opts.apply){
    console.log('\nDRY RUN — no changes written. Add --apply to write DB and run embed.');
    process.exit(0);
  }

  // backup DB
  const bakDb = dbPath + '.bak.' + Date.now();
  fs.copyFileSync(dbPath, bakDb);
  console.log('DB backed up to', bakDb);

  prod.sale = newSale;
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  console.log('DB updated. Now running embed...');

  // call shared embed
  try{
    const { createRequire } = require('module');
    const requireC = createRequire(__filename);
    const embed = requireC(path.join(process.cwd(), 'server', 'lib', 'embed.cjs'));
    const res = await embed.embedSaleForProduct(productId);
    console.log('Embed result:', res);
    if (res && res.ok) process.exit(0); else process.exit(2);
  }catch(e){ console.error('Embed failed:', e && e.message || e); process.exit(1); }
})();
