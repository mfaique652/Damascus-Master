// album-runtime.js
// Shared runtime for album pages: reads window.__ALBUM_PLACEHOLDERS and renders unit/total price with sale support.
(function(){
  try{
    const ph = window.__ALBUM_PLACEHOLDERS || {};
    const parsedPhPrice = (ph.price !== undefined && ph.price !== null && String(ph.price).trim() !== '') ? Number(ph.price) : NaN;
    const sale = (ph.sale && ph.sale.active) ? ph.sale : null;
    // If placeholder price is missing or non-positive, prefer sale.prevPrice when available.
    let rawPrice = Number.isFinite(parsedPhPrice) && Number(parsedPhPrice) > 0 ? Number(parsedPhPrice) : NaN;
    if (!Number.isFinite(rawPrice) || Number(rawPrice) <= 0) {
      if (ph.sale && ph.sale.prevPrice !== undefined && ph.sale.prevPrice !== null && Number(ph.sale.prevPrice) > 0) {
        rawPrice = Number(ph.sale.prevPrice);
      } else {
        rawPrice = NaN;
      }
    }
    // Final fallback: try dataset on wishlist heart or existing DOM text
    if (!Number.isFinite(rawPrice) || rawPrice <= 0) {
      const heart = document.querySelector('.wishlist-heart');
      const dsPrice = heart && (heart.dataset && heart.dataset.wishlistPrice) ? Number(heart.dataset.wishlistPrice) : NaN;
      if (Number.isFinite(dsPrice) && dsPrice > 0) rawPrice = dsPrice;
      else {
        const unitElText = document.getElementById('unitPrice')?.textContent || '';
        const parsedFromDom = parseFloat(String(unitElText).replace(/[^0-9.]+/g,''));
        if (Number.isFinite(parsedFromDom) && parsedFromDom > 0) rawPrice = parsedFromDom;
      }
    }
    if (!Number.isFinite(rawPrice)) rawPrice = 0;
    const unitEl = document.getElementById('unitPrice');
    const totalEl = document.getElementById('totalPrice');

    // Core renderers
    function renderUnit(){
      try{
        if (!unitEl) return;
        if (sale && Number(sale.price) > 0) {
          const prev = (sale.prevPrice && Number(sale.prevPrice) > 0) ? Number(sale.prevPrice) : rawPrice;
          const sp = Number(sale.price);
          unitEl.innerHTML = '<span class="orig-price" style="text-decoration:line-through;color:#9aa3af;margin-right:0.6rem">$' + prev.toFixed(2) + '</span>' + '<span class="sale-price" style="background:#fff;color:#000;padding:0.2em 0.6em;border-radius:0.4em;font-weight:800">$' + sp.toFixed(2) + '</span>';
          // Show sale ribbon
          try{
            const ribbon = document.getElementById('saleRibbon');
            const ribbonPrice = document.getElementById('saleRibbonPrice');
            const ribbonPct = document.getElementById('saleRibbonPct');
            if (ribbon) {
              // compute percent off if possible, otherwise show generic SALE
              try{
                let pctText = 'SALE';
                const prevVal = (prev && Number(prev) > 0) ? Number(prev) : NaN;
                if (Number.isFinite(prevVal) && prevVal > 0) {
                  const pct = Math.round(((prevVal - Number(sp)) / prevVal) * 100);
                  if (Number.isFinite(pct) && pct > 0) pctText = '-' + pct + '%';
                }
                if (ribbonPct) { ribbonPct.textContent = pctText; ribbonPct.style.display = 'inline-block'; }
                // keep price span updated for accessibility if present
                if (ribbonPrice) { ribbonPrice.textContent = '$' + sp.toFixed(2); }
                // ensure ribbon is visible (matches product-card diagonal badge)
                ribbon.style.display = '';
              }catch(err){ try{ if (ribbon) ribbon.style.display = ''; }catch(e){} }
            }
          }catch(e){}
        } else {
          unitEl.textContent = '$' + Number(rawPrice).toFixed(2);
          try{ const ribbon = document.getElementById('saleRibbon'); if (ribbon) ribbon.style.display = 'none'; }catch(e){}
        }
      }catch(e){ /* swallow to avoid breaking page */ }
    }
    function renderTotal(){
      try{
        if (!totalEl) return;
        const qtyEl = document.getElementById('qtySlider');
        const qty = Math.max(1, parseInt(qtyEl?.value||'1',10)||1);
        const unit = (sale && Number(sale.price) > 0) ? Number(sale.price) : Number(rawPrice);
        totalEl.textContent = '$' + (unit * qty).toFixed(2);
      }catch(e){}
    }

    // Public re-render function so other code can call it if needed
    window.__renderAlbumSale = function(){ renderUnit(); renderTotal(); };

    // Run immediately (fast path)
    renderUnit(); renderTotal();

    // Fetch latest product metadata from server (admin toggles sales dynamically).
    // If the API returns an active sale for this product, merge it into the
    // placeholders and update DOM, heart dataset and localStorage entries so
    // wishlist / catalogue / order flows receive the most up-to-date sale.
    (function fetchAndMergeLatestSale(){
      try{
        const productId = (window.__ALBUM_PLACEHOLDERS && window.__ALBUM_PLACEHOLDERS.productId) || null;
        if(!productId) return;
        // Avoid hammering the API if called repeatedly on the same page
        if(window.__albumSaleFetchDone && window.__albumSaleFetchDone[productId]) return;
        window.__albumSaleFetchDone = window.__albumSaleFetchDone || {};
        window.__albumSaleFetchDone[productId] = true;

        // Use fetch if available; gracefully degrade if not
  // Build backend base similar to site.js so fetch works from file:// pages too
  const backendBase = (window.location && window.location.origin && window.location.origin !== 'null' && window.location.protocol && window.location.protocol.startsWith('http')) ? window.location.origin : 'http://localhost:3025';
  const url = backendBase + '/api/products/' + encodeURIComponent(productId);
        if(typeof fetch === 'undefined') return;
        try{ console.debug('[album-runtime] fetching product url=', url); }catch(e){}
        fetch(url, { method: 'GET', credentials: 'same-origin', headers: { 'Accept': 'application/json' } })
          .then(res => { if(!res.ok) throw new Error('fetch failed:' + res.status); return res.json(); })
          .then(json => {
            try{
              if(!json) return;
              const remoteSale = json.sale || null;
              // Only merge when sale is active and has a positive price
              if(remoteSale && remoteSale.active && Number(remoteSale.price) > 0){
                // Normalize numeric fields
                remoteSale.price = Number(remoteSale.price);
                if(remoteSale.prevPrice !== undefined && remoteSale.prevPrice !== null) remoteSale.prevPrice = Number(remoteSale.prevPrice);

                // Merge into placeholder so renderers pick it up
                try{ window.__ALBUM_PLACEHOLDERS = window.__ALBUM_PLACEHOLDERS || {}; window.__ALBUM_PLACEHOLDERS.sale = remoteSale; }catch(e){}

                // Update wishlist-heart dataset if present so add-to-wishlist captures sale
                try{
                  const heart = document.querySelector('.wishlist-heart');
                  if(heart){ heart.dataset.wishlistSale = JSON.stringify(remoteSale); }
                }catch(e){}

                // Update any wishlist / catalogue entries in localStorage that match this productId
                try{
                  const updateLocalStorageItems = (key) => {
                    try{
                      const raw = localStorage.getItem(key);
                      if(!raw) return false;
                      let arr = JSON.parse(raw);
                      if(!Array.isArray(arr)) return false;
                      let changed = false;
                      arr = arr.map(it => {
                        try{
                          // match by productId field or id
                          if((it && (it.productId === productId || it.id === productId || it.id === window.__ALBUM_PLACEHOLDERS.productId)) || (it && it.album && String(it.album).toLowerCase().indexOf((window.location && window.location.pathname && window.location.pathname.split('/').pop())||'')!==-1)){
                            it.sale = remoteSale;
                            changed = true;
                          }
                        }catch(e){}
                        return it;
                      });
                      if(changed) localStorage.setItem(key, JSON.stringify(arr));
                      return changed;
                    }catch(e){ return false; }
                  };
                  updateLocalStorageItems('wishlist');
                  updateLocalStorageItems('catalogue');
                }catch(e){}

                // Re-render unit / total now that sale is present
                try{ if(typeof window.__renderAlbumSale === 'function') window.__renderAlbumSale(); }catch(e){}
              }
            }catch(e){ /* ignore remote parse errors */ }
          }).catch((err)=>{ try{ console.debug('[album-runtime] fetch error', err && (err.message||err)); }catch(e){} /* ignore network errors */ });
      }catch(e){}
    })();

    // Re-apply after window load to survive scripts that run later and may touch the DOM
    window.addEventListener('load', function(){ try{ setTimeout(window.__renderAlbumSale, 30); }catch(e){} });

    // If something else overwrites the unit price, restore sale UI
    if (unitEl && typeof MutationObserver !== 'undefined'){
      try{
        const mo = new MutationObserver(function(muts){
          // If unit price changed visually and sale should be active, restore it
          for(const m of muts){
            if (m.type === 'childList' || m.type === 'characterData' || m.type === 'subtree'){
              // small debounce
              if (window.__renderAlbumSaleTimer) clearTimeout(window.__renderAlbumSaleTimer);
              window.__renderAlbumSaleTimer = setTimeout(()=>{ try{ window.__renderAlbumSale(); }catch(e){} }, 35);
              break;
            }
          }
        });
        mo.observe(unitEl, { childList: true, characterData: true, subtree: true });
      }catch(e){}
    }

    // Keep quantity wiring
    const qtyEl = document.getElementById('qtySlider'); if (qtyEl) { qtyEl.addEventListener('input', renderTotal); qtyEl.addEventListener('change', renderTotal); }
  }catch(e){ console.warn('album-runtime failed', e); }
})();
