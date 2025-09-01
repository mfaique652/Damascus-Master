// Fix album placeholder blocks by extracting visible page data and writing a safe
// window.__ALBUM_PLACEHOLDERS block using JSON literals and template literals.
// Usage: node tools/fix_album_placeholders.js path/to/file.html
const fs = require('fs');
const path = require('path');
const file = process.argv[2];
if(!file) { console.error('Usage: node tools/fix_album_placeholders.js path/to/file.html'); process.exit(2); }
let s = fs.readFileSync(file, 'utf8');
function extract(regex){ const m = s.match(regex); return m ? m[1].trim() : ''; }
const title = extract(/<div[^>]+class="album-title"[^>]*>([\s\S]*?)<\/div>/i) || extract(/<div[^>]+class='album-title'[^>]*>([\s\S]*?)<\/div>/i);
const desc = extract(/<div[^>]+class="album-desc"[^>]*>([\s\S]*?)<\/div>/i) || extract(/<div[^>]+class='album-desc'[^>]*>([\s\S]*?)<\/div>/i);
const detailsText = extract(/<div[^>]+class="album-details"[^>]*>([\s\S]*?)<\/div>/i) || extract(/<div[^>]+class='album-details'[^>]*>([\s\S]*?)<\/div>/i) || '';
const mainImage = (s.match(/<img[^>]+id="mainImg"[^>]+src=\"([^\"]+)\"/i) || s.match(/<img[^>]+id='mainImg'[^>]+src='([^']+)'/i) || [])[1] || '';
const imagesHtml = (s.match(/<div[^>]+id="albumThumbs"[^>]*>([\s\S]*?)<\/div>/i) || s.match(/<div[^>]+id='albumThumbs'[^>]*>([\s\S]*?)<\/div>/i) || [])[1] || '';
const heartId = (s.match(/class="wishlist-heart"[^>]*data-wishlist-id=\"([^\"]+)\"/i) || s.match(/class='wishlist-heart'[^>]*data-wishlist-id='([^']+)'/i) || [])[1] || '';
const productId = (s.match(/class="wishlist-heart"[^>]*data-wishlist-productid=\"([^\"]+)\"/i) || s.match(/class='wishlist-heart'[^>]*data-wishlist-productid='([^']+)'/i) || [])[1] || '';
const unitPriceHtml = (s.match(/<div[^>]+id="unitPrice"[^>]*>([\s\S]*?)<\/div>/i) || s.match(/<div[^>]+id='unitPrice'[^>]*>([\s\S]*?)<\/div>/i) || [])[1] || '';
const saleAttr = (s.match(/class="wishlist-heart"[^>]*data-wishlist-sale=\'([^\']*)\'/i) || s.match(/class='wishlist-heart'[^>]*data-wishlist-sale=\'([^\']*)\'/i) || [])[1];
let saleJson = null;
if(saleAttr) {
  try { saleJson = JSON.parse(saleAttr); } catch(e) { saleJson = null; }
}
// Build safe literals
function escapeBackticks(t){ return String(t||'').replace(/`/g,'\\`'); }
function escapeForJson(t){ return String(t||'').replace(/\\/g,'\\\\').replace(/"/g,'\\\"').replace(/\n/g,'\\n').replace(/\r/g,''); }
// use it in a no-op to avoid unused var lint errors in tooling
void escapeForJson('');
const safeTitle = JSON.stringify(String(title||''));
const safeDesc = escapeBackticks(typeof desc === 'string' ? desc.replace(/\r/g,'') : String(desc));
const safeMainImage = JSON.stringify(String(mainImage||''));
const safeImagesHtml = escapeBackticks(imagesHtml.replace(/\r/g,'').trim());
const safeHeartId = JSON.stringify(String(heartId||''));
const safeProductId = JSON.stringify(String(productId||''));
const detailsObj = { description: detailsText.replace(/\r/g,'') };
const detailsJsonRaw = JSON.stringify(detailsObj);
const priceString = (unitPriceHtml||'').replace(/\s+/g,' ').trim();
// Compose new placeholder block
const newBlock = '  <script>\n' +
'  // Rebuilt placeholder block (safe)\n' +
'  window.__ALBUM_PLACEHOLDERS = {\n' +
'    title: ' + safeTitle + ',\n' +
'    desc: `' + escapeBackticks(safeDesc) + '`,\n' +
'    price: ' + JSON.stringify(priceString) + ',\n' +
'    mainImage: ' + safeMainImage + ',\n' +
'    imagesHtml: (function(){ try{ return `' + escapeBackticks(safeImagesHtml) + '`; }catch(e){ return `' + escapeBackticks(safeImagesHtml) + '`; } })(),\n' +
'    heartId: ' + safeHeartId + ',\n' +
'    detailsJson: ' + detailsJsonRaw + ',\n' +
'    albumFilename: ' + JSON.stringify(path.basename(file)) + ',\n' +
'    productId: ' + safeProductId + ',\n' +
'    // Sale JSON\n' +
'    sale: (function(){ try{ return ' + (saleJson ? JSON.stringify(saleJson) : 'null') + '; }catch(e){ return null; } })(),\n' +
'    reviewsApi: ' + JSON.stringify(productId ? (`/api/products/${productId}/reviews`) : ('')) + '\n' +
'  }\n' +
'  <\\/script>';
// Replace existing first placeholder script block
const marker = /<script>[\s\S]*?window\.__ALBUM_PLACEHOLDERS[\s\S]*?<\/script>/i;
if(marker.test(s)){
  s = s.replace(marker, newBlock);
  fs.writeFileSync(file, s, 'utf8');
  console.log('Rewrote placeholders in', file);
} else {
  console.error('placeholder block not found in', file);
  process.exit(2);
}
