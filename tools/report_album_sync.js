const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const dbPath = path.join(root, 'server', 'data', 'db.json');
function readDB(){ try{ const t = fs.readFileSync(dbPath,'utf8'); return JSON.parse(t); }catch(e){ console.error('failed to read db.json', e.message); return null; } }
function listHtmlFiles(){ const entries = fs.readdirSync(root); return entries.filter(f => f.endsWith('.html') && !f.includes('backup') && !f.includes('regen') && !f.startsWith('index.')); }
function extractPlaceholders(html){ const m = html.match(/window\.__ALBUM_PLACEHOLDERS\s*=\s*\{([\s\S]*?)\}\s*;/m); if(!m) return null; const block = m[1]; const idMatch = block.match(/productId:\s*\(function\([\s\S]*?return\s+JSON\.parse\((?:"|')([^"']+)(?:"|')/m);
  const saleMatch = block.match(/sale:\s*\(function\(\)\{[\s\S]*?return\s+(null|\{[\s\S]*?\})/m);
  return { productId: idMatch ? idMatch[1] : null, saleLiteral: saleMatch ? saleMatch[1] : null };
}
function main(){ const db = readDB(); if(!db){ console.error('No DB, abort'); process.exit(2); }
 const productsById = (db.products||[]).reduce((acc,p)=>{ acc[p.id]=p; return acc; },{});
 const files = listHtmlFiles(); const rows = [];
 files.forEach(file=>{
   const p = path.join(root, file);
   let txt = '';
   try{ txt = fs.readFileSync(p,'utf8'); }catch(e){ rows.push({file,err:'read failed'}); return; }
   const ph = extractPlaceholders(txt);
   if(!ph){ rows.push({file, productId:null, inDb:false, note:'no placeholders'}); return; }
   const pid = ph.productId || null;
   const saleLiteral = ph.saleLiteral || null;
   const inDb = pid && !!productsById[pid];
   const saleActive = inDb && productsById[pid].sale && !!productsById[pid].sale.active;
   const saleObj = inDb && productsById[pid].sale ? productsById[pid].sale : null;
   rows.push({ file, productId: pid, placeholderSale: saleLiteral, inDb, saleActive, saleObj });
 });
 // Print a readable table
 console.log('file,productId,inDb,saleActive,placeholderSale');
 rows.forEach(r=>{
   console.log([r.file, r.productId||'', r.inDb? 'Y':'N', (r.saleActive? 'Y':'N'), JSON.stringify(r.placeholderSale||'')].join(','));
 });
 // Also print details for missing ones
 const missing = rows.filter(r=>!r.inDb && r.productId);
 if(missing.length){ console.log('\nMissing products in DB:'); missing.forEach(m=> console.log(m.file+' -> '+m.productId)); }
}
main();
