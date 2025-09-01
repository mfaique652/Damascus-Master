const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const files = fs.readdirSync(root).filter(f => f.endsWith('.html'));
let found = 0;
const results = [];
for (const f of files) {
  const p = path.join(root, f);
  let txt = '';
  try { txt = fs.readFileSync(p,'utf8'); } catch(e){ continue; }
  const hasPlace = txt.includes('window.__ALBUM_PLACEHOLDERS');
  if (!hasPlace) continue;
  found++;
  const res = { file: f, sale: null, hasUnit: txt.includes('id="unitPrice"') || txt.includes("id='unitPrice'"), hasTotal: txt.includes('id="totalPrice"') || txt.includes("id='totalPrice'") };
  // try extract sale JSON produced by generator: pattern 'sale: {...} || null'
  const m = txt.match(/sale:\s*({[\s\S]*?})\s*\|\|\s*null/);
  if (m) {
    try {
      const js = m[1];
      // JSON from generator should be valid JSON; ensure double quotes
      const obj = JSON.parse(js);
      res.sale = obj;
    } catch(e) {
      res.sale = { parseError: e.message };
    }
  }
  // check inline sale script presence
  res.inlineScript = txt.includes('window.__ALBUM_PLACEHOLDERS.sale') || txt.includes('const sale =');
  results.push(res);
}

console.log('Checked', files.length, 'html files; found', found, 'album pages with placeholders.');
const active = results.filter(r => r.sale && r.sale.active);
console.log('Albums with active sale:', active.length);
for (const r of results) {
  console.log('\n- ' + r.file);
  console.log('  hasUnitPrice:', r.hasUnit, ' hasTotalPrice:', r.hasTotal, ' inlineScript:', r.inlineScript);
  if (r.sale && r.sale.parseError) console.log('  sale parse error:', r.sale.parseError);
  else if (r.sale) console.log('  sale:', JSON.stringify(r.sale));
}

process.exit(0);
