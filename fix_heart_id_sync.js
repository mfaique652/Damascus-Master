// fix_heart_id_sync.js
// This script will:
// 1. Output CSV reports for missing/mismatched heart ids and orphaned products.
// 2. Optionally, remove orphaned products from db.json (if you uncomment the relevant line).

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'data', 'db.json');
const htmlGlob = /^([a-zA-Z0-9_-]+)\.html$/;

function loadProducts() {
  try {
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    return Array.isArray(db.products) ? db.products : [];
  } catch (e) {
    console.error('Failed to load db.json:', e);
    return [];
  }
}

function findHtmlFiles() {
  return fs.readdirSync(__dirname)
    .filter(f => htmlGlob.test(f));
}

function extractHeartIdsFromHtml(file) {
  const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
  const regex = /addToWishlist\(['"]([^'"]+)['"]/g;
  const ids = [];
  let m;
  while ((m = regex.exec(content))) {
    ids.push(m[1]);
  }
  return ids;
}

function main() {
  const products = loadProducts();
  const htmlFiles = findHtmlFiles();
  const productIdMap = {};
  products.forEach(p => {
    const id = (p.details && p.details.displayId) ? p.details.displayId : p.id;
    if (id) productIdMap[id] = p;
  });

  // 1. Heart ids in HTML not in products
  let missingHeartIds = [];
  htmlFiles.forEach(file => {
    extractHeartIdsFromHtml(file).forEach(id => {
      if (!productIdMap[id]) {
        missingHeartIds.push({ file, id });
      }
    });
  });

  // 2. Products not in any HTML
  let orphanedProducts = [];
  Object.keys(productIdMap).forEach(id => {
    const found = htmlFiles.some(file => extractHeartIdsFromHtml(file).includes(id));
    if (!found) {
      orphanedProducts.push(productIdMap[id]);
    }
  });

  // Write CSV reports
  fs.writeFileSync('missing_heart_ids.csv', 'file,id\n' + missingHeartIds.map(x => `${x.file},${x.id}`).join('\n'));
  fs.writeFileSync('orphaned_products.csv', 'id,title,desc,price\n' + orphanedProducts.map(p => `${p.id},${(p.title||'').replace(/,/g,' ')},${(p.desc||'').replace(/,/g,' ')},${p.price||''}`).join('\n'));

  // Automatically remove orphaned products from db.json
  if (orphanedProducts.length) {
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    db.products = db.products.filter(p => {
      const id = (p.details && p.details.displayId) ? p.details.displayId : p.id;
      return !orphanedProducts.some(op => op.id === id);
    });
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    console.log('Removed orphaned products from db.json');
  }

  console.log('CSV reports generated: missing_heart_ids.csv, orphaned_products.csv');
  console.log('Review these files and update your products or HTML as needed.');
}

if (require.main === module) {
  main();
}
