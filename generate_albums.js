// generate_albums.js
// Generates an album HTML page for each product using album_template.html
// Album page is named after the product's title (spaces replaced with underscores, .html)

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'data', 'db.json');
const templatePath = path.join(__dirname, 'album_template.html');

/* exported sanitizeFilename (used by other tools) */
function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_') + '.html';
}

// export helper for tools that may require it programmatically
if (typeof module !== 'undefined' && module.exports) module.exports.sanitizeFilename = sanitizeFilename;

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getHeartId(category, idx) {
  // This function is now deprecated as IDs are assigned directly in db.json
  // It's kept for fallback/reference purposes.
  const map = {
    'hunting-knives': 'hn',
    'pocket-knives': 'pn',
    'swords': 'sw',
    'axes': 'ax',
    'rings': 'ri',
    'others': 'ot',
    'kitchen-knives': 'kn',
  };
  const prefix = map[(category || '').toLowerCase()] || 'ot';
  return prefix + (idx + 1);
}

function main() {
  try {
    console.log('Album generator starting in', __dirname);
    if (!fs.existsSync(dbPath)) throw new Error('db.json not found: ' + dbPath);
    if (!fs.existsSync(templatePath)) throw new Error('template not found: ' + templatePath);
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const template = fs.readFileSync(templatePath, 'utf8');
  // Group products by category for index
  const catIndexes = {};
  (db.products || []).forEach(product => {
    const title = product.title || 'Product';
    const desc = product.desc || '';
    // Preserve explicit zero prices. Only use empty string when price is undefined/null.
  // price is intentionally read via placeholderPriceValue below; avoid unused local
  // const price = (product.price !== undefined && product.price !== null) ? String(product.price) : '';
  const images = Array.isArray(product.images) ? product.images : [];
  const norm = images.map(u => String(u||'').replace(/^\/+/, ''));
  const mainImage = norm[0] || '';
  const category = (product.category || '').toLowerCase();
  catIndexes[category] = (catIndexes[category] || 0) + 1;
  const idx = catIndexes[category] - 1;
  // Prefer stable displayId from product.details if present; else fall back to category-based heart id
  const detailsFromDb = (product.details && typeof product.details === 'object') ? product.details : {};
  const displayId = (detailsFromDb && detailsFromDb.displayId) ? String(detailsFromDb.displayId) : getHeartId(category, idx);
    // Flexible thumbs: always use data-img for swipe support
  const thumbs = norm.map((u,i) => `<img class='album-thumb${i===0?' selected':''}' src='${u}' data-img='${u}' alt='${title}'>`).join('\n        ');
    // Album/category page for fallback
    const galleryPage = (category ? category.replace(/[^a-z0-9]+/g, '-') + '.html' : 'index.html');
    // Album filename is sanitized product title only (no heartId, no displayId, all categories)
  // Create a safe filename (slug) but keep displayId for title and internal IDs
  const slug = String(title || 'product').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  const filename = slug + '.html';
  const albumName = filename; // album URL for this page
  // Details with displayId stabilized
  let detailsObj = {};
  if (product.details && typeof product.details === 'object' && !Array.isArray(product.details)) {
    detailsObj = Object.assign({}, product.details);
  } else if (product.details && typeof product.details === 'string') {
    // If details was stored as a string, try to parse it as JSON, otherwise store under `description`.
    try {
      const parsed = JSON.parse(product.details);
      detailsObj = (parsed && typeof parsed === 'object') ? parsed : { description: String(product.details) };
    } catch (e) {
      detailsObj = { description: String(product.details) };
    }
  }
  if (!detailsObj.displayId) detailsObj.displayId = displayId;
    const details = JSON.stringify(detailsObj);
    // Build a friendly HTML snippet for the details area so templates show readable text
    let detailsHtml = '';
    try {
      const parts = [];
      if (detailsObj.blade) parts.push('<strong>Blade:</strong> ' + escapeHtml(String(detailsObj.blade)));
      if (detailsObj.handle) parts.push('<strong>Handle:</strong> ' + escapeHtml(String(detailsObj.handle)));
      if (detailsObj.length) parts.push('<strong>Length:</strong> ' + escapeHtml(String(detailsObj.length)));
      if (detailsObj.weight) parts.push('<strong>Weight:</strong> ' + escapeHtml(String(detailsObj.weight)));
      if (detailsObj.features) parts.push('<strong>Features:</strong> ' + escapeHtml(String(detailsObj.features)));
      if (parts.length) {
        detailsHtml = parts.join('<br>');
      } else if (detailsObj.description) {
        detailsHtml = escapeHtml(String(detailsObj.description));
      } else {
        // If details object looks like an indexed char map (numeric keys), join in order
        const numKeys = Object.keys(detailsObj || {}).filter(k => /^\d+$/.test(k)).sort((a,b)=>Number(a)-Number(b));
        if (numKeys.length) {
          const vals = numKeys.map(k => String(detailsObj[k] || ''));
          detailsHtml = escapeHtml(vals.join(''));
        } else {
          // Fallback: empty
          detailsHtml = '';
        }
      }
    } catch (e) {
      detailsHtml = '';
    }
  // Determine a safe display price for the template placeholder.
  // If product.price is present (including 0) use it; otherwise fall back to sale.prevPrice when available.
  const placeholderPriceValue = (product.price !== undefined && product.price !== null)
    ? product.price
    : (product.sale && product.sale.prevPrice !== undefined && product.sale.prevPrice !== null ? product.sale.prevPrice : '');
  // JS-safe literals for inline scripts (these will replace JS_ placeholders in template)
  const jsTitle = JSON.stringify(String(title));
  const jsDesc = JSON.stringify(String(desc));
  const jsPrice = JSON.stringify(String(placeholderPriceValue));
  const jsMainImage = JSON.stringify(String(mainImage));
  const jsImages = JSON.stringify(String(thumbs));
  const jsHeartId = JSON.stringify(String(displayId));
  const jsAlbum = JSON.stringify(String(albumName));
  const jsProductId = JSON.stringify(String(product.id || ''));
  const jsReviewsApi = JSON.stringify(`/api/products/${product.id}/reviews`);
    // HTML-escaped for display text/attributes
    const htmlTitle = escapeHtml(title);
    const htmlDesc = escapeHtml(desc);
    // Ensure HEART_ID placeholder receives stable displayId and DETAILS placeholder gets detailsHtml
    // Prepare sale JSON and optional inline script for sale visuals
    // Normalize sale info from DB: coerce numbers and only consider active sales with a positive price
    let saleObj = null;
    if (product.sale && product.sale.active) {
      const sPrice = Number(product.sale.price || 0);
      const sPrev = (product.sale.prevPrice !== undefined && product.sale.prevPrice !== null) ? Number(product.sale.prevPrice) : ((product.price !== undefined && product.price !== null) ? Number(product.price) : 0);
      if (!isNaN(sPrice) && sPrice > 0) {
        saleObj = { active: true, price: sPrice, prevPrice: (!isNaN(sPrev) && sPrev > 0) ? sPrev : sPrice };
      }
    }

    // Helper: produce a JS-safe JSON literal string for inline injection
    function safeJsonLiteral(obj) {
      try {
        let s = JSON.stringify(obj);
        // Escape closing script fragments and unicode line separators that can break inline scripts
        s = s.replace(/<\/(script)/ig, '<\\/$1').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
        return s;
      } catch (e) {
        return 'null';
      }
    }

    const saleJson = saleObj ? safeJsonLiteral(saleObj) : 'null';
    // Do not inject inline sale scripts from the generator to avoid accidental duplication/corruption.
    // The template will handle rendering sale UI from window.__ALBUM_PLACEHOLDERS.sale at runtime.
    const saleScript = '';
    // Build sale-aware price HTML placeholders so generated page shows correct unit/total at load
    let priceHtml = '';
    let totalPriceHtml = '';
    const isOnSale = saleObj && saleObj.active && Number(saleObj.price) > 0;
    const origPriceVal = (isOnSale && saleObj.prevPrice && Number(saleObj.prevPrice) > 0) ? Number(saleObj.prevPrice) : (product.price !== undefined && product.price !== null ? Number(product.price) : 0);
    const salePriceVal = isOnSale ? Number(saleObj.price) : null;
    if (isOnSale) {
      priceHtml = `<span class="orig-price" style="text-decoration:line-through;color:#9aa3af;margin-right:0.6rem">$${Number(origPriceVal).toFixed(2)}</span><span class="sale-price" style="background:#fff;color:#000;padding:0.2em 0.6em;border-radius:0.4em;font-weight:800">$${Number(salePriceVal).toFixed(2)}</span>`;
      totalPriceHtml = `$${Number(salePriceVal).toFixed(2)}`;
    } else {
      priceHtml = `$${Number(origPriceVal).toFixed(2)}`;
      totalPriceHtml = `$${Number(origPriceVal).toFixed(2)}`;
    }

  const html = template
    .replace(/\{\{TITLE\}\}/g, htmlTitle)
    .replace(/\{\{DESC\}\}/g, htmlDesc)
    .replace(/\{\{PRICE\}\}/g, String(placeholderPriceValue))
  .replace(/\{\{MAIN_IMAGE\}\}/g, mainImage)
  .replace(/\{\{MAIN_IMAGE\}\}/g, mainImage)
  .replace(/\{\{IMAGES\}\}/g, thumbs)
  // Legacy template tokens expected by some templates
  .replace(/\{\{IMAGESHTML\}\}/g, thumbs)
  .replace(/\{\{DETAILSJSON\}\}/g, details)
  .replace(/\{\{PRODUCTID\}\}/g, product.id || '')
  .replace(/\{\{HEART_ID\}\}/g, displayId)
  .replace(/\{\{ALBUMFILENAME\}\}/g, albumName)
  .replace(/\{\{REVIEWSAPI\}\}/g, `/api/products/${product.id}/reviews`)
  .replace(/\{\{HEART_ID\}\}/g, displayId)
    .replace(/\{\{ALBUM\}\}/g, albumName)
  .replace(/\{\{PRODUCT_ID\}\}/g, product.id || '')
  .replace(/\{\{REVIEWS_API\}\}/g, `/api/products/${product.id}/reviews`)
  .replace(/\{\{DETAILS\}\}/g, detailsHtml)
    // Replace JS_ JSON literals for safe injection into template's JS placeholders
    .replace(/\{\{JS_TITLE\}\}/g, jsTitle)
    .replace(/\{\{JS_DESC\}\}/g, jsDesc)
    .replace(/\{\{JS_PRICE\}\}/g, jsPrice)
    .replace(/\{\{JS_MAIN_IMAGE\}\}/g, jsMainImage)
    .replace(/\{\{JS_IMAGES\}\}/g, jsImages)
    .replace(/\{\{JS_HEART_ID\}\}/g, jsHeartId)
    .replace(/\{\{JS_ALBUM\}\}/g, jsAlbum)
    .replace(/\{\{JS_PRODUCT_ID\}\}/g, jsProductId)
    .replace(/\{\{JS_REVIEWS_API\}\}/g, jsReviewsApi)
      .replace(/\{\{GALLERY_PAGE\}\}/g, galleryPage)
      .replace(/\{\{JS_TITLE\}\}/g, jsTitle)
      .replace(/\{\{JS_DESC\}\}/g, jsDesc);
    // Inject SALE placeholders: raw JSON and inline script
  // Normalize any malformed SALE_JSON tokens and inject the safe JSON literal
  const normalizedHtml = html.replace(/(\{+\s*SALE_JSON\s*\}+)/g, '{{SALE_JSON}}');
  const htmlWithSale = normalizedHtml.replace(/\{\{SALE_JSON\}\}/g, saleJson)
      .replace(/\{\{SALE_SCRIPT\}\}/g, saleScript)
      .replace(/\{\{DETAILS_JSON\}\}/g, details);
    // Inject price HTML placeholders
    const htmlFinal = htmlWithSale.replace(/\{\{PRICE_HTML\}\}/g, priceHtml).replace(/\{\{TOTAL_PRICE_HTML\}\}/g, totalPriceHtml).replace(/\{\{SALE_JSON\}\}/g, saleJson);
    // Remove accidental embedded full-document duplicates (e.g. a second <!DOCTYPE ...> block)
    function removeEmbeddedDoctypes(s) {
      if (!s || typeof s !== 'string') return s;
      const first = s.indexOf('<!DOCTYPE');
      if (first === -1) return s;
      let out = s;
      // Find any subsequent full-document starts and splice them out (from the second <!DOCTYPE to its matching </html>)
      let next = out.indexOf('<!DOCTYPE', first + 1);
      let removed = 0;
      while (next !== -1) {
        const closing = out.indexOf('</html>', next);
        if (closing === -1) break; // can't find end, bail
        out = out.slice(0, next) + out.slice(closing + 7);
        removed++;
        next = out.indexOf('<!DOCTYPE', first + 1);
      }
      if (removed) console.log(`Sanitized ${removed} embedded <!DOCTYPE> block(s) from ${filename}`);
      return out;
    }

    try {
  const clean = removeEmbeddedDoctypes(htmlFinal);
  fs.writeFileSync(path.join(__dirname, filename), clean);
      console.log('Generated', filename);
    } catch (werr) {
      console.error('Failed to write', filename, werr && werr.stack ? werr.stack : werr);
    }
  });
  } catch (err) {
    console.error('Generator failed:', err && err.stack ? err.stack : err);
    process.exitCode = 2;
  }
}

if (require.main === module) main();
