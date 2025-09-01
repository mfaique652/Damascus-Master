const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const dbPath = path.join(root, 'server', 'data', 'db.json');
if (!fs.existsSync(dbPath)) {
  console.error('DB not found at', dbPath);
  process.exit(1);
}
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const products = Array.isArray(db.products) ? db.products : [];
const { createRequire } = require('module');
const requireC = createRequire(__filename);
const embedModule = requireC(path.join(root, 'server', 'lib', 'embed.cjs'));
// Optional CLI arg: product id to process only that product
const targetId = process.argv[2] && String(process.argv[2]).trim() ? String(process.argv[2]).trim() : null;

function escAttr(s) { if (s === null || s === undefined) return ''; return String(s).replace(/"/g, '&quot;').replace(/\n/g, '\n'); }

function parseAttrs(tagText) {
  const attrs = {};
  const re = /([a-zA-Z0-9:\-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let m;
  while ((m = re.exec(tagText))) {
    attrs[m[1]] = (m[2] !== undefined) ? m[2] : (m[3] !== undefined ? m[3] : (m[4] !== undefined ? m[4] : ''));
  }
  return attrs;
}

(async () => {
  for (const prod of products){
    if (targetId && prod.id !== targetId) continue;
    if (!prod.page) continue;
    try {
      const res = await embedModule.embedSaleForProduct(prod.id);
      if (res && res.ok) console.log('Fixed', prod.page, '(backup at', res.backup + ')');
      else console.warn('Skipped/failed', prod.page, res && res.error);
    } catch (e) {
      console.warn('Error processing', prod.page, e && e.message || e);
    }
  }
  console.log('Done');
})();
