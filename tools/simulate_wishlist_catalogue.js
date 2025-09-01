const fs = require('fs');
const path = require('path');

function extractPlaceholders(html) {
  const m = html.match(/window.__ALBUM_PLACEHOLDERS\s*=\s*\{([\s\S]*?)\};/);
  if (!m) return null;
  const body = m[1];
  const res = {};
  // crude extract title
  const titleM = body.match(/title:\s*"([\s\S]*?)",\s*\n/);
  if (titleM) res.title = titleM[1];
  const mainImgM = body.match(/mainImage:\s*"([^"]*)",/);
  if (mainImgM) res.mainImage = mainImgM[1];
  const pidM = body.match(/productId:\s*"([^"]*)",/);
  if (pidM) res.productId = pidM[1];
  // sale JSON pattern 'sale: {...} || null'
  const saleM = body.match(/sale:\s*({[\s\S]*?})\s*\|\|\s*null/);
  if (saleM) {
    try { res.sale = JSON.parse(saleM[1]); } catch(e){ res.sale = { parseError: e.message, raw: saleM[1].slice(0,200) }; }
  } else {
    res.sale = null;
  }
  return res;
}

const file = path.join(__dirname, '..', 'hand_forged_damascus_steel_5_pcs_rosewood_handle_chef_knife_set.html');
const html = fs.readFileSync(file,'utf8');
const ph = extractPlaceholders(html);
if (!ph) { console.error('Placeholders not found'); process.exit(1); }
console.log('Placeholders extracted:', { title: ph.title, productId: ph.productId, mainImage: ph.mainImage, sale: ph.sale });

// Simulate adding to wishlist
const wishlist = [];
const unitPrice = (ph.sale && ph.sale.active && Number(ph.sale.price) > 0) ? Number(ph.sale.price) : 0;
const product = { id: ph.productId, title: ph.title, price: unitPrice, img: ph.mainImage, album: 'hand_forged_damascus_steel_5_pcs_rosewood_handle_chef_knife_set.html', quantity: 1, sale: ph.sale };
wishlist.push(product);
console.log('\nSimulated wishlist entry:', wishlist[0]);

// Simulate moving from wishlist to catalogue
const catalogue = [];
function addToCatalogueFromWishlist(wlIndex) {
  const item = wishlist[wlIndex];
  if (!item) return;
  // preserve sale
  const entry = { ...item, addedAt: new Date().toISOString() };
  catalogue.push(entry);
}
addToCatalogueFromWishlist(0);
console.log('\nCatalogue after move (preserves sale):', catalogue[0]);

// Compute totals preferring sale.price when active
function computeTotals(cat) {
  let subtotal = 0;
  for (const it of cat) {
    const price = (it.sale && it.sale.active && Number(it.sale.price) > 0) ? Number(it.sale.price) : Number(it.price||0);
    subtotal += price * (Number(it.quantity)||1);
  }
  return { subtotal };
}

const totals = computeTotals(catalogue);
console.log('\nComputed totals:', totals);

process.exit(0);
