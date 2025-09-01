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
products.forEach(prod => {
  if(!prod.page) return;
  const filePath = path.join(root, prod.page);
  if(!fs.existsSync(filePath)) { console.warn('missing file', filePath); return; }
  let content = fs.readFileSync(filePath, 'utf8');
  const saleObj = (prod.sale && prod.sale.active && Number(prod.sale.price) > 0) ? { active: true, price: Number(prod.sale.price), prevPrice: prod.sale.prevPrice ? Number(prod.sale.prevPrice) : null } : null;
  const saleStrRaw = saleObj ? JSON.stringify(saleObj) : 'null';
  const saleAttrSafe = saleObj ? saleStrRaw.replace(/'/g, "&#39;") : 'null';

  // backup
  try { fs.copyFileSync(filePath, filePath + '.bak'); } catch(e){ /* ignore */ }

  // robustly update or insert data-wishlist-sale attribute inside the wishlist-heart opening tag
  // This handles malformed or duplicated attributes by removing any existing data-wishlist-sale
  // and then inserting a single well-formed attribute.
  // Robust scan: locate each occurrence of 'wishlist-heart' and rebuild the opening <div ...> tag
  // by finding the '<div' start and matching the closing '>' while respecting quoted strings.
  (function rebuildWishlistTags(){
    let idx = 0;
    while(true){
      const found = content.indexOf('wishlist-heart', idx);
      if(found === -1) break;
      // find the '<div' before this position
      const divStart = content.lastIndexOf('<div', found);
      if(divStart === -1) { idx = found + 12; continue; }
      // scan forward to find the matching '>' for this tag
      let i = divStart;
      let inSingle = false, inDouble = false;
      for(; i < content.length; i++){
        const ch = content[i];
        if(ch === '"' && !inSingle) inDouble = !inDouble;
        else if(ch === "'" && !inDouble) inSingle = !inSingle;
        else if(ch === '>' && !inSingle && !inDouble) break;
      }
      if(i >= content.length) break; // malformed, stop
      const tag = content.substring(divStart, i+1);
      // extract quoted attributes
      const attrs = {};
      const attrRe = /(\b[\w-:]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
      let aMatch;
      while((aMatch = attrRe.exec(tag)) !== null){
        const name = aMatch[1];
        const val = aMatch[2] !== undefined ? aMatch[2] : aMatch[3] !== undefined ? aMatch[3] : '';
        if(name.toLowerCase() === 'data-wishlist-sale') continue;
        attrs[name] = val;
      }
      if(!attrs.class) attrs.class = 'wishlist-heart';
      // rebuild tag
      let out = '<div';
      for(const key of Object.keys(attrs)){
        const v = String(attrs[key]).replace(/"/g,'&quot;');
        out += ` ${key}="${v}"`;
      }
      out += ` data-wishlist-sale='${saleAttrSafe}'>`;
      // replace in content
      content = content.slice(0, divStart) + out + content.slice(i+1);
      // move index forward
      idx = divStart + out.length;
    }
  })();
  // cleanup any stray sale JSON fragments that might have been accidentally left in the tag
  // e.g. occurrences like: ...data-wishlist-album="..."active":true,"price":200,"prevPrice":250}'
  content = content.replace(/active"?:\s*(?:true|false)\s*,\s*"price"\s*:\s*\d+(?:\s*,\s*"prevPrice"\s*:\s*\d+)?'?/gi, '');

  // update unitPrice and totalPrice (match product-card styling when on sale)
  if (saleObj) {
    const prev = (saleObj.prevPrice && Number(saleObj.prevPrice) > 0) ? Number(saleObj.prevPrice) : (Number(prod.price) || 0);
    const sp = Number(saleObj.price);
    const saleUnitHtml = `<div  class="price-container"><div class="orig-price orig-price" >$${Number(prev).toFixed(2)}</div><div class="sale-price sale-price" >$${Number(sp).toFixed(2)}</div></div>`;
  content = content.replace(/<div\s+id=["']unitPrice["'][^>]*>[^<]*<\/div>/, `<div id="unitPrice">${saleUnitHtml}</div>`);
    content = content.replace(/<div\s+id=["']totalPrice["'][^>]*>[^<]*<\/div>/, `<div id="totalPrice" style="font-weight:700">$${Number(sp).toFixed(2)}</div>`);
  } else {
    const unitPrice = (prod.price || 0);
    content = content.replace(/<div\s+id=["']unitPrice["'][^>]*>[^<]*<\/div>/, `<div id="unitPrice">$${Number(unitPrice).toFixed(2)}</div>`);
    content = content.replace(/<div\s+id=["']totalPrice["'][^>]*>[^<]*<\/div>/, `<div id="totalPrice" style="font-weight:700">$${Number(unitPrice).toFixed(2)}</div>`);
  }

  // update saleRibbon block
  if(saleObj){
  const pct = (saleObj.prevPrice && saleObj.prevPrice>0) ? Math.round((1 - (saleObj.price / saleObj.prevPrice)) * 100) : null;
  const pctText = pct ? ('-' + pct + '%') : 'SALE';
  // Product cards show only the percent (e.g. -20%), keep same format here
  const ribbonHtml = `<div id="saleRibbon" class="sale-ribbon" style="display:block;"><span id="saleRibbonPct" class="sale-pct">${pctText}</span><span class="sale-price u-hidden" id="saleRibbonPrice" >$${Number(saleObj.price).toFixed(2)}</span></div>`;
    if(/<div\s+id=["']saleRibbon["'][\s\S]*?<\/div>/.test(content)){
      content = content.replace(/<div\s+id=["']saleRibbon["'][\s\S]*?<\/div>/, ribbonHtml);
    } else {
      // insert after main-img-wrap opening
      content = content.replace(/(<div\s+class=["']main-img-wrap["'][^>]*>)/, `$1${ribbonHtml}`);
    }
  } else {
  const hiddenHtml = `<div id="saleRibbon" class="sale-ribbon u-hidden" ><span id="saleRibbonPct" class="sale-pct"></span><span class="sale-price u-hidden" id="saleRibbonPrice" ></span></div>`;
    if(/<div\s+id=["']saleRibbon["'][\s\S]*?<\/div>/.test(content)){
      content = content.replace(/<div\s+id=["']saleRibbon["'][\s\S]*?<\/div>/, hiddenHtml);
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated', prod.page);
});
