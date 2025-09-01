const fs = require('fs');
const path = require('path');

async function embedSaleForProduct(productId){
  try {
    const dbPath = path.join(process.cwd(), 'server', 'data', 'db.json');
    if (!fs.existsSync(dbPath)) return { ok: false, error: 'DB not found' };
    const dbRaw = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const prod = (dbRaw.products || []).find(p => p.id === productId);
    if (!prod || !prod.page) return { ok: false, error: 'Product or page not found' };
    const filePath = path.join(process.cwd(), prod.page);
    if (!fs.existsSync(filePath)) return { ok: false, error: 'Page file missing', page: prod.page };

    let content = fs.readFileSync(filePath, 'utf8');
    const saleObj = (prod.sale && prod.sale.active && Number(prod.sale.price) > 0) ? { active: true, price: Number(prod.sale.price), prevPrice: prod.sale.prevPrice ? Number(prod.sale.prevPrice) : null } : null;
    const saleJson = saleObj ? JSON.stringify(saleObj) : 'null';

    function escAttr(s){ if (s === null || s === undefined) return ''; return String(s).replace(/"/g, '&quot;').replace(/\n/g, '\n'); }
    function parseAttrs(tagText){ const attrs = {}; const re = /([a-zA-Z0-9:\-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g; let m; while((m=re.exec(tagText))){ attrs[m[1]] = (m[2]!==undefined)?m[2]:(m[3]!==undefined?m[3]:(m[4]!==undefined?m[4]:'')); } return attrs; }

    const match = content.match(/<div\b[^>]*class=["'][^"']*wishlist-heart[^"']*["'][^>]*>/i);
    const existingAttrs = match ? parseAttrs(match[0]) : {};

    const attrs = Object.assign({}, existingAttrs, {
      'data-wishlist-productid': prod.id || existingAttrs['data-wishlist-productid'] || '',
      'data-wishlist-id': prod.heartId || existingAttrs['data-wishlist-id'] || ((prod.id||'').slice(0,6)),
      'data-wishlist-title': escAttr(prod.title || existingAttrs['data-wishlist-title'] || ''),
      'data-wishlist-desc': escAttr(prod.desc || existingAttrs['data-wishlist-desc'] || ''),
      'data-wishlist-price': escAttr(String(prod.price || existingAttrs['data-wishlist-price'] || '')),
      'data-wishlist-img': escAttr(prod.mainImage || existingAttrs['data-wishlist-img'] || ''),
      'data-wishlist-album': escAttr(prod.page || existingAttrs['data-wishlist-album'] || '')
    });

    const openAttrs = Object.assign({}, attrs);
    Object.keys(existingAttrs).forEach(k=>{ if (!openAttrs[k]) openAttrs[k] = existingAttrs[k]; });

    let openTag = '<div class="wishlist-heart"';
    for (const k of Object.keys(openAttrs)){
      const v = openAttrs[k] == null ? '' : String(openAttrs[k]);
      openTag += ` ${k}="${v.replace(/\"/g,'&quot;')}"`;
    }
    openTag += ` data-wishlist-sale='${saleJson}'>`;

    const startIdx = content.search(/<div\b[^>]*class=["'][^"']*wishlist-heart[^"']*["'][^>]*>/i);
    let newContent = content;
    if (startIdx !== -1){
      let i = startIdx; let inSingle=false, inDouble=false;
      for (; i < content.length; i++){
        const ch = content[i];
        if (ch === '"' && !inSingle) inDouble = !inDouble;
        else if (ch === "'" && !inDouble) inSingle = !inSingle;
        else if (ch === '>' && !inSingle && !inDouble) break;
      }
      if (i < content.length) newContent = content.slice(0, startIdx) + openTag + content.slice(i+1);
      else newContent = content.replace(/<div\b[^>]*class=["'][^"']*wishlist-heart[^"']*["'][^>]*>/i, openTag);
    } else {
      if (/(<div\b[^>]*class=["']main-img-wrap["'][^>]*>)/i.test(content)){
        newContent = content.replace(/(<div\b[^>]*class=["']main-img-wrap["'][^>]*>)/i, `$1${openTag}`);
      } else {
        return { ok: false, error: 'No insertion point' };
      }
    }

    if (saleObj){
      const prev = (saleObj.prevPrice && Number(saleObj.prevPrice) > 0) ? Number(saleObj.prevPrice) : (Number(prod.price) || 0);
      const sp = Number(saleObj.price);
  const saleUnitHtml = `<div class="price-container"><div class="orig-price orig-price">$${Number(prev).toFixed(2)}</div><div class="sale-price sale-price">$${Number(sp).toFixed(2)}</div></div>`;
      newContent = newContent.replace(/<div\s+id=["']unitPrice["'][^>]*>[\s\S]*?<\/div>/i, `<div id="unitPrice">${saleUnitHtml}</div>`);
      newContent = newContent.replace(/<div\s+id=["']totalPrice["'][^>]*>[\s\S]*?<\/div>/i, `<div id="totalPrice" style="font-weight:700">$${Number(sp).toFixed(2)}</div>`);
      const pct = (saleObj.prevPrice && saleObj.prevPrice > 0) ? Math.round((1 - (saleObj.price / saleObj.prevPrice)) * 100) : null;
  const pctText = pct ? ('-' + pct + '%') : 'SALE';
  // Ensure top-seller ribbons also include the main 'sale-ribbon' class so CSS matches
  const ribbonHtml = `<div id="saleRibbon" class="sale-ribbon" style="display:block;"><span id="saleRibbonPct" class="sale-pct">${pctText}</span><span class="sale-price u-hidden" id="saleRibbonPrice">$${Number(saleObj.price).toFixed(2)}</span></div>`;
      if (/<div\s+id=["']saleRibbon["'][\s\S]*?<\/div>/i.test(newContent)) newContent = newContent.replace(/<div\s+id=["']saleRibbon["'][\s\S]*?<\/div>/i, ribbonHtml);
      else newContent = newContent.replace(/(<div\b[^>]*class=["']main-img-wrap["'][^>]*>)/i, `$1${ribbonHtml}`);
    } else {
      newContent = newContent.replace(/<div\s+id=["']unitPrice["'][^>]*>[\s\S]*?<\/div>/i, `<div id="unitPrice">$${Number(prod.price||0).toFixed(2)}</div>`);
      newContent = newContent.replace(/<div\s+id=["']totalPrice["'][^>]*>[\s\S]*?<\/div>/i, `<div id="totalPrice" style="font-weight:700">$${Number(prod.price||0).toFixed(2)}</div>`);
      const hiddenHtml = `<div id="saleRibbon" class="sale-ribbon u-hidden"><span id="saleRibbonPct" class="sale-pct"></span><span class="sale-price u-hidden" id="saleRibbonPrice"></span></div>`;
      if (/<div\s+id=["']saleRibbon["'][\s\S]*?<\/div>/i.test(newContent)) newContent = newContent.replace(/<div\s+id=["']saleRibbon["'][\s\S]*?<\/div>/i, hiddenHtml);
    }

    const tmpPath = filePath + `.tmp.${Date.now()}`;
    const bakPath = filePath + `.bak.force.${Date.now()}`;
    try {
      fs.writeFileSync(tmpPath, newContent, 'utf8');
      const sanity = fs.readFileSync(tmpPath, 'utf8');
      if (!/window.__ALBUM_PLACEHOLDERS/i.test(sanity) || !/<div\b[^>]*class=["'][^"']*wishlist-heart[^"']*["'][^>]*>/i.test(sanity)){
        fs.unlinkSync(tmpPath);
        return { ok: false, error: 'Validation failed' };
      }
      fs.copyFileSync(filePath, bakPath);
      fs.renameSync(tmpPath, filePath);
      return { ok: true, backup: path.basename(bakPath) };
    } catch(e){ if (fs.existsSync(tmpPath)) try{ fs.unlinkSync(tmpPath) }catch(_){}; return { ok: false, error: e && e.message || e } }
  } catch(e){ return { ok: false, error: e && e.message || e } }
}

module.exports = { embedSaleForProduct };
