const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const dbPath = path.join(root, 'server', 'data', 'db.json');
function readDB(){ try{ return JSON.parse(fs.readFileSync(dbPath,'utf8')); }catch(e){ console.error('failed to read db.json', e.message); process.exit(2); } }
function backupFile(file){ try{ const bak = file + '.bak.' + Date.now(); fs.copyFileSync(file, bak); return bak; }catch(e){ return null; } }
function embedSaleInHtml(file, saleObj){ let txt = fs.readFileSync(file,'utf8'); const saleJson = JSON.stringify(saleObj);
 const re = /sale:\s*\(function\(\)\{[\s\S]*?return\s+(?:null|\{[\s\S]*?\})[\s\S]*?\}\)\(\)\s*,/m;
 if(!re.test(txt)){
   // try simpler line match
   const reLine = /sale:\s*\(function\(\)\{[\s\S]*?\}\)\(\)\s*,/m;
   if(!reLine.test(txt)) return { ok:false, reason:'no-sale-placeholder' };
   txt = txt.replace(reLine, `sale: (function(){ try{ return ${saleJson}; }catch(e){ return ${saleJson}; } })(),`);
 } else {
   txt = txt.replace(re, `sale: (function(){ try{ return ${saleJson}; }catch(e){ return ${saleJson}; } })(),`);
 }
 fs.writeFileSync(file, txt, 'utf8'); return { ok:true };
}
function main(){ const db = readDB(); const prods = (db.products||[]).filter(p=>p.sale && p.sale.active);
 if(!prods.length){ console.log('No active sales found in DB.'); return; }
 const results = [];
 prods.forEach(p=>{
   const page = p.page || p.pageName || null;
   if(!page){ results.push({id:p.id, page:null, status:'no-page'}); return; }
   const file = path.join(root, page);
   if(!fs.existsSync(file)){ results.push({id:p.id, page, status:'missing-file'}); return; }
   const bak = backupFile(file);
   const res = embedSaleInHtml(file, p.sale);
   results.push(Object.assign({id:p.id, page, bak}, res));
 });
 console.log('embed results:'); console.table(results);
}
main();
