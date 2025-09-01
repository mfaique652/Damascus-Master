// check_heart_id_sync.js
// Node.js script to check heart id sync between products and album/gallery HTML files

const fs = require('fs');
const path = require('path');

// CONFIG: Adjust these as needed
const dbPath = path.join(__dirname, 'server', 'data', 'db.json');
const htmlGlob = /^([a-zA-Z0-9_-]+)\.html$/; // All .html files in root

// 1. Load product data
function loadProducts() {
  try {
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    return Array.isArray(db.products) ? db.products : [];
  } catch (e) {
    console.error('Failed to load db.json:', e);
    return [];
  }
}

// 2. Find all album/gallery HTML files
function findHtmlFiles() {
  return fs.readdirSync(__dirname)
    .filter(f => htmlGlob.test(f));
}

// 3. Extract heart ids from HTML files
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

// 4. Main check
function checkSync() {
  const products = loadProducts();
  const htmlFiles = findHtmlFiles();
  const productIdMap = {};
  products.forEach(p => {
    const id = (p.details && p.details.displayId) ? p.details.displayId : p.id;
    if (id) productIdMap[id] = p;
  });

  let ok = true;
  htmlFiles.forEach(file => {
    const heartIds = extractHeartIdsFromHtml(file);
    heartIds.forEach(id => {
      if (!productIdMap[id]) {
        console.warn(`[WARN] Heart id '${id}' in ${file} does not match any product displayId/id.`);
        ok = false;
      }
    });
  });

  // Check for products missing from any album/gallery
  Object.keys(productIdMap).forEach(id => {
    const found = htmlFiles.some(file => extractHeartIdsFromHtml(file).includes(id));
    if (!found) {
      console.warn(`[WARN] Product id '${id}' not found in any album/gallery HTML.`);
      ok = false;
    }
  });

  if (ok) {
    console.log('All heart ids are synced between products and albums/galleries.');
  } else {
    console.log('Some heart ids are not synced. See warnings above.');
  }
}

if (require.main === module) {
  checkSync();
}
