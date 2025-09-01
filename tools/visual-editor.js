// Centralized Visual Website Editor helpers
// Extracted from admin.html to avoid duplicate implementations
(function(){
  const backendBase = (location.origin && location.origin !== 'null' && location.protocol.startsWith('http')) ? location.origin : 'http://localhost:3025';

  window.visualEditorState = {
    visualEditorActive: false,
    currentEditingElement: null,
    editorIframe: null,
    currentPageUrl: '',
    siteImages: []
  };

  function api(path, opts = {}) {
    const token = localStorage.getItem('adm_token') || '';
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    if (token) headers.Authorization = 'Bearer ' + token;
    return fetch(backendBase + path, { ...opts, headers });
  }

  async function apiUpload(path, form) {
    const token = localStorage.getItem('adm_token') || '';
    const headers = token ? { Authorization: 'Bearer ' + token } : {};
    return fetch(backendBase + path, { method: 'POST', body: form, headers });
  }

  async function verifyProf() {
    try {
      if (window.adminAuth && typeof window.adminAuth.verifyAdminToken === 'function') return await window.adminAuth.verifyAdminToken();
      return null;
    } catch(e){ return null; }
  }

  async function initVisualEditor(){
    (async function(){
      const prof = await verifyProf();
      if (!prof) {
        localStorage.removeItem('adm_token');
        if (window.adminAuth && typeof window.adminAuth.showLoginOverlay === 'function') {
          try{ window.adminAuth.showLoginOverlay(); }catch(_){ }
        } else {
          try{ document.getElementById('login-container').style.display = 'flex'; }catch(_){ }
        }
        return;
      }
      try{ document.getElementById('visual-editor-container').classList.remove('visual-editor-hidden'); }catch(_){ }
      try{ document.getElementById('main-admin').classList.add('visual-editor-hidden'); }catch(_){ }
      window.visualEditorState.visualEditorActive = true;
      loadSitePages();
      loadSiteImages();
    })();
  }

  function exitVisualEditor(){
    try{ document.getElementById('visual-editor-container').classList.add('visual-editor-hidden'); }catch(_){ }
    try{ document.getElementById('main-admin').classList.remove('visual-editor-hidden'); }catch(_){ }
    // If #app was moved into visual editor, restore it back to its placeholder to avoid leaving it inside the editor area
    try{
      const app = document.getElementById('app');
      const placeholder = document.getElementById('app-placeholder');
      if (app && placeholder && placeholder.parentNode) {
        placeholder.parentNode.insertBefore(app, placeholder);
        placeholder.parentNode.removeChild(placeholder);
        // Keep #app hidden until explicitly opened again
        app.classList.add('u-hidden');
      }
    }catch(_){ }
    window.visualEditorState.visualEditorActive = false;
    window.visualEditorState.currentEditingElement = null;
    window.visualEditorState.editorIframe = null;
    window.visualEditorState.currentPageUrl = '';
  }

  async function loadSitePages(){
    try{
      const response = await api('/api/pages');
      const data = await response.json();
      const pageList = document.getElementById('page-list');
  if (!pageList) return;
  pageList.innerHTML = '';
      const mainPages = ['index.html','about.html','contact.html','admin.html'];
      mainPages.forEach(page=>{
        if (data && data.files && data.files.includes(page)){
          const pageItem = document.createElement('div');
          pageItem.className = 'page-item';
          pageItem.innerHTML = `<span>${page}</span><button class="editor-btn" onclick="loadPageInEditor('${page}')">Edit</button>`;
          pageList.appendChild(pageItem);
        }
      });
      if (data && data.files) data.files.forEach(file=>{
        if (!mainPages.includes(file) && file.endsWith('.html')){
          const pageItem = document.createElement('div');
          pageItem.className = 'page-item';
          // In minimal mode, clicking navigates to admin page editor instead of opening iframe
          pageItem.innerHTML = `<span>${file}</span><button class="editor-btn" onclick="(function(){ window.visualEditorState.selectedPage='${file}'; exitVisualEditor(); setTimeout(()=>{ document.getElementById('page_selector').value='${file}'; loadPageContent(); },120); })()">Manage</button>`;
          pageList.appendChild(pageItem);
        }
      });
    }catch(e){ console.error('loadSitePages failed', e); }
  }

  // Expose a method to enable full iframe editing if desired later
  function enableIframeEditing(){
    // loadPageInEditor remains available; this is a marker for UI flows to invoke iframe editing
    console.log('Full iframe editing available via loadPageInEditor(page)');
  }

  async function loadSiteImages(){
    try{
      const response = await api('/api/images');
      if (response.ok){ const data = await response.json(); window.visualEditorState.siteImages = data.images || []; updateImageGallery(); }
    }catch(e){ console.error('loadSiteImages failed', e); window.visualEditorState.siteImages = []; }
  }

  function updateImageGallery(){
    const gallery = document.getElementById('image-gallery') || document.getElementById('image-grid');
    if(!gallery) return; gallery.innerHTML = '';
    (window.visualEditorState.siteImages||[]).forEach(imagePath=>{
      const img = document.createElement('img');
      const src = imagePath && imagePath.toString ? imagePath.toString() : '';
      img.src = src.startsWith('uploads/') ? src : `uploads/${src}`;
      img.addEventListener('click', (ev)=> selectImage(img.src, ev));
      gallery.appendChild(img);
    });
  }

  function selectImage(imageSrc, ev){
    try{ document.querySelectorAll('#image-gallery img, #image-grid img').forEach(img=>img.classList.remove('selected')); }catch(_){ }
    try{
      if (ev && ev.currentTarget) ev.currentTarget.classList.add('selected');
      else {
        // fallback: find image by src
        const found = Array.from(document.querySelectorAll('#image-gallery img, #image-grid img')).find(i => i.src === imageSrc || i.getAttribute('src') === imageSrc);
        if (found) found.classList.add('selected');
      }
    }catch(_){ }
    const inp=document.getElementById('selected-image-url'); if(inp) inp.value = imageSrc;
  }

  async function loadPageInEditor(filename){
    try{
      window.visualEditorState.currentPageUrl = filename;
      const iframe = document.getElementById('editor-iframe'); if(!iframe) return;
      iframe.src = 'about:blank';
      iframe.style.background = '#f8f9fa url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBzdHJva2U9IiMzNDk4ZGIiPjxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMSAxKSIgc3Ryb2tlLXdpZHRoPSIyIj48Y2lyY2xlIGN4PSIyMiIgY3k9IjIyIiByPSI2Ij48YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJyIiBiZWdpbj0iMHMiIGR1cj0iMS44cyIgdmFsdWVzPSI2OzIyIiBjYWxjTW9kZT0ibGluZWFyIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIvPjxjaXJjbGUgY3g9IjIyIiBjeT0iMjIiIHI9IjYiPjxhbmltYXRlIGF0dHJpYnV0ZU5hbWU9InIiIGJlZ2luPSIwLjZzIiBkdXI9IjEuOHMiIHZhbHVlcz0iNjsyMiIgY2FsY01vZGU9ImxpbmVhciIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiLz48L2c+PC9nPjwvc3ZnPg==") center center no-repeat';
      document.querySelectorAll('.page-item').forEach(item=>item.classList.remove('active'));
      const clickedItem = document.querySelector(`[onclick="loadPageInEditor('${filename}')"]`); if (clickedItem) clickedItem.closest('.page-item').classList.add('active');
      const pageUrl = `${backendBase}/${filename}?edit_mode=1&t=${Date.now()}`;
      iframe.src = pageUrl;
      iframe.onload = ()=>{ try{ iframe.style.background='white'; injectEditorScripts(); // store original snapshot for undo/load-default
        try{ const docHtml = (iframe.contentDocument || iframe.contentWindow.document).documentElement.outerHTML; window.visualEditorState.originalPageSnapshot = docHtml; window.visualEditorState.veUndoStack = []; }catch(_){ }
        const statusDiv=document.getElementById('editor-status'); if(statusDiv){ statusDiv.textContent = `✅ ${filename} loaded successfully`; statusDiv.style.color='#27ae60'; } }catch(err){ console.error('inject error',err); const statusDiv=document.getElementById('editor-status'); if(statusDiv){ statusDiv.textContent = `❌ Error loading editor for ${filename}`; statusDiv.style.color='#e74c3c'; } } };
      iframe.onerror = ()=>{ iframe.style.background='white'; const statusDiv=document.getElementById('editor-status'); if(statusDiv){ statusDiv.textContent = `❌ Failed to load ${filename}`; statusDiv.style.color='#e74c3c'; } };
    }catch(e){ console.error('loadPageInEditor failed', e); alert(`Error loading ${filename}: ${e.message}`); }
  }

  function injectEditorScripts(){
    const iframe = document.getElementById('editor-iframe'); if(!iframe) return; const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    // Clean up any previously-injected floating toolbar or toolbar styles that may exist in page HTML
    try{
      iframeDoc.querySelectorAll('.ve-toolbar').forEach(n=>n.remove());
      Array.from(iframeDoc.querySelectorAll('style')).forEach(s=>{ if(s.textContent && s.textContent.indexOf('.ve-toolbar')>=0) s.remove(); });
    }catch(_){ }

    const editorStyles = iframeDoc.createElement('style');
    // Keep only the visual editing helper styles; do not inject a floating toolbar inside the page
    editorStyles.textContent = `.ve-editable:hover { border: 2px dashed #3498db !important; cursor: pointer; } .ve-editing { border: 2px solid #e74c3c !important; background: rgba(231,76,60,0.1) !important; }`;
    iframeDoc.head.appendChild(editorStyles);
    makeElementsEditable(iframeDoc);
  }

  function makeElementsEditable(doc){
    const editableSelectors = ['h1','h2','h3','h4','h5','h6','p','span','div','a','img','button'];
    editableSelectors.forEach(selector=>{
      const elements = doc.querySelectorAll(selector);
      elements.forEach(element=>{
        if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') return;
        element.classList.add('ve-editable');
        element.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); selectElementForEditing(element); });
      });
    });
  }

  function selectElementForEditing(element){
    const iframe = document.getElementById('editor-iframe'); const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.querySelectorAll('.ve-editing').forEach(el=>el.classList.remove('ve-editing'));
    element.classList.add('ve-editing'); window.visualEditorState.currentEditingElement = element; updateEditorPanel(element);
    // Dispatch a cross-window selection event so the parent inspector can update immediately
    try{
      const tagName = (element.tagName || '').toLowerCase();
      const detail = {
        tagName,
        text: element.textContent || '',
        css: element.style && element.style.cssText ? element.style.cssText : '',
        src: (tagName === 'img') ? (element.src || '') : '',
        alt: (tagName === 'img') ? (element.alt || '') : ''
      };
      // Use a CustomEvent so listeners in the parent can update UI immediately
      window.dispatchEvent(new CustomEvent('ve:selection', { detail }));
    }catch(e){ console.warn('ve selection dispatch failed', e); }
  }

  // Ensure Google font link is loaded into iframe document when fontName is a known google font
  function ensureGoogleFontLoadedInIframe(fontName){
    if (!fontName) return;
    try{
      const name = String(fontName).split(',')[0].replace(/['"]/g,'').trim();
      const iframe = document.getElementById('editor-iframe'); if(!iframe) return;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      const family = name.replace(/\s+/g, '+');
      const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@300;400;600;700&display=swap`;
      // avoid duplicate links
      const exists = Array.from(iframeDoc.querySelectorAll('link[rel="stylesheet"]')).some(l=>l.href && l.href.indexOf('fonts.googleapis.com')>=0 && l.href.indexOf(family)>=0);
      if (!exists){ const link = iframeDoc.createElement('link'); link.rel='stylesheet'; link.href=href; iframeDoc.head.appendChild(link); }
    }catch(e){ /* ignore */ }
  }

  // Set font for the currently selected element inside iframe editor
  function setSelectedElementFont(fontFamily, opts){
    try{
      const el = window.visualEditorState.currentEditingElement;
      if (!el) { alert('Select an element in the editor first'); return; }
      // Apply inline style
      el.style.fontFamily = fontFamily || '';
      if (opts && opts.weight) el.style.fontWeight = opts.weight;
      if (opts && opts.size) el.style.fontSize = opts.size;
      // If it's a Google font, attempt to load it into iframe
      ensureGoogleFontLoadedInIframe(fontFamily);
      updateEditorPanel(el);
    }catch(e){ console.warn('setSelectedElementFont failed', e); }
  }

  // Inject CSS into iframe to apply site-wide fonts. If saveGlobally is true, attempt
  // to persist to server by PUTing to css/theme.css via the pages API (best-effort).
  async function setSiteFonts(headersFont, textFont, saveGlobally, opts){
    try{
      const iframe = document.getElementById('editor-iframe'); if(!iframe) return;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      // ensure google fonts loaded in iframe
      ensureGoogleFontLoadedInIframe(headersFont);
      ensureGoogleFontLoadedInIframe(textFont);
      const id = 've-global-fonts';
      let style = iframeDoc.getElementById(id);
      const hf = headersFont ? headersFont : '';
      const tf = textFont ? textFont : '';
      // include weight and size if present
      const weightRule = (opts && opts.weight) ? `; font-weight: ${opts.weight} !important` : '';
      const sizeRule = (opts && opts.size) ? `; font-size: ${opts.size} !important` : '';
      const css = `:root{ --ve-headers-font: ${hf}; --ve-text-font: ${tf}; } body{ ${tf?`font-family: var(--ve-text-font) !important${sizeRule};`:''} } h1,h2,h3,h4,h5,h6{ ${hf?`font-family: var(--ve-headers-font) !important${weightRule}${sizeRule};`:''} }`;
      if (!style){ style = iframeDoc.createElement('style'); style.id = id; style.textContent = css; iframeDoc.head.appendChild(style); }
      else { style.textContent = css; }
      // Offer to persist to theme.css on server
      if (saveGlobally){
        try{
          if (!confirm('Save these font changes to site theme (css/theme.css)? This will update the site stylesheet.') ) return;
          // Fetch existing theme.css (best-effort) and append custom vars block
          const token = localStorage.getItem('adm_token') || '';
          const headers = { 'Content-Type': 'application/json' }; if (token) headers.Authorization = 'Bearer ' + token;
          // Attempt to GET current css
          let existing = '';
          try{ const resp = await fetch((location.origin || '') + '/css/theme.css', { cache:'no-store' }); if (resp && resp.ok) existing = await resp.text(); }catch(_){ existing = ''; }
          const markerStart = '/* ve-global-fonts-start */';
          const markerEnd = '/* ve-global-fonts-end */';
          // remove previous block
          const cleaned = existing.replace(new RegExp(`${markerStart}[\s\S]*?${markerEnd}`,'g'), '');
          const weightPart = (opts && opts.weight) ? `--site-font-weight: ${opts.weight};` : '';
          const sizePart = (opts && opts.size) ? `--site-font-size: ${opts.size};` : '';
          const newCss = cleaned + '\n' + markerStart + '\n' + `:root{ --site-headers-font: ${hf}; --site-text-font: ${tf}; ${weightPart} ${sizePart} }\nbody{ ${tf?`font-family: var(--site-text-font) !important; ${opts && opts.size?`font-size: var(--site-font-size) !important;` : ''}`:''} }\nh1,h2,h3,h4,h5,h6{ ${hf?`font-family: var(--site-headers-font) !important; ${opts && opts.weight?`font-weight: var(--site-font-weight) !important;` : ''}`:''} }` + '\n' + markerEnd + '\n';
          // Send to server via pages API - best-effort PUT
          const putUrl = '/api/admin/theme-css';
          const putResp = await fetch(putUrl, { method: 'PUT', headers, body: JSON.stringify({ content: newCss }) });
          if (putResp && putResp.ok) alert('Site theme updated successfully (css/theme.css).'); else { const txt = await (putResp.text().catch(()=>'')); alert('Failed to save site theme: ' + (txt || putResp.status)); }
        }catch(e){ console.warn('saveGlobally failed', e); alert('Failed to save theme: ' + (e && e.message)); }
      }
    }catch(e){ console.warn('setSiteFonts error', e); }
  }

  function updateEditorPanel(element){
    const tagName = element.tagName.toLowerCase(); try{ document.getElementById('element-tag').textContent = tagName; }catch(_){ }
    try{ document.getElementById('element-text').value = element.textContent || ''; }catch(_){ }
    if (tagName === 'img'){
      try{ document.getElementById('element-src').value = element.src || ''; document.getElementById('element-alt').value = element.alt || ''; document.getElementById('image-controls').style.display = 'block'; document.getElementById('text-controls').style.display = 'none'; }catch(_){ }
    } else {
      try{ document.getElementById('image-controls').style.display = 'none'; document.getElementById('text-controls').style.display = 'block'; }catch(_){ }
    }
    try{ document.getElementById('element-css').value = element.style.cssText || ''; }catch(_){ }
    const statusDiv = document.getElementById('editor-status'); if(statusDiv){ statusDiv.textContent = `🎯 Selected: <${tagName}> element`; statusDiv.style.color = '#3498db'; }
  }

  function updateElementText(){ if (!window.visualEditorState.currentEditingElement) return; try{ const newText = document.getElementById('element-text').value; window.visualEditorState.currentEditingElement.textContent = newText; }catch(_){ } }
  function updateElementImage(){ if (!window.visualEditorState.currentEditingElement) return; try{ const newSrc = document.getElementById('element-src').value; const newAlt = document.getElementById('element-alt').value; window.visualEditorState.currentEditingElement.src = newSrc; window.visualEditorState.currentEditingElement.alt = newAlt; }catch(_){ } }
  function updateElementCSS(){ if (!window.visualEditorState.currentEditingElement) return; try{ const newCSS = document.getElementById('element-css').value; window.visualEditorState.currentEditingElement.style.cssText = newCSS; }catch(_){ } }
  function useSelectedImage(){ try{ const selectedImageUrl = document.getElementById('selected-image-url').value; if (selectedImageUrl && window.visualEditorState.currentEditingElement && window.visualEditorState.currentEditingElement.tagName.toLowerCase() === 'img'){ document.getElementById('element-src').value = selectedImageUrl; updateElementImage(); } }catch(_){ } }

  // Undo helpers: maintain a simple per-page undo stack of HTML snapshots.
  function pushVeUndoForCurrentElement(action){
    try{
      const iframe = document.getElementById('editor-iframe'); if(!iframe) return;
      const doc = iframe.contentDocument || iframe.contentWindow.document; if(!doc) return;
      window.visualEditorState.veUndoStack = window.visualEditorState.veUndoStack || [];
      // store small snapshot (documentElement.outerHTML)
      const snap = doc.documentElement.outerHTML;
      // limit stack
      window.visualEditorState.veUndoStack.push({ ts: Date.now(), action: action||'edit', html: snap });
      if (window.visualEditorState.veUndoStack.length > 20) window.visualEditorState.veUndoStack.shift();
    }catch(e){ console.warn('pushVeUndo failed', e); }
  }

  async function veUndo(){
    try{
      const stack = window.visualEditorState.veUndoStack || [];
      if (!stack.length) return alert('Nothing to undo');
      // pop last
      stack.pop();
      const last = stack.length ? stack[stack.length-1] : window.visualEditorState.originalPageSnapshot;
      if (!last) return alert('No snapshot to restore');
      const iframe = document.getElementById('editor-iframe'); if(!iframe) return;
      const doc = iframe.contentDocument || iframe.contentWindow.document; if(!doc) return;
      doc.open(); doc.write(last.html || last); doc.close();
      // re-inject scripts/styles
      setTimeout(()=>{ try{ injectEditorScripts(); }catch(_){ } }, 120);
      return true;
    }catch(e){ console.error('veUndo failed', e); alert('Undo failed: ' + (e && e.message)); return false; }
  }

  async function veLoadDefault(){
    try{
      const snap = window.visualEditorState.originalPageSnapshot;
      if (!snap) return alert('No original snapshot available');
      const iframe = document.getElementById('editor-iframe'); if(!iframe) return;
      const doc = iframe.contentDocument || iframe.contentWindow.document; if(!doc) return;
      if (!confirm('Load original page HTML and discard unsaved edits?')) return;
      doc.open(); doc.write(snap); doc.close();
      // reset undo stack
      window.visualEditorState.veUndoStack = [];
      setTimeout(()=>{ try{ injectEditorScripts(); }catch(_){ } }, 120);
      return true;
    }catch(e){ console.error('veLoadDefault failed', e); alert('Load default failed: ' + (e && e.message)); return false; }
  }

  async function savePageChanges(){ if (!window.visualEditorState.currentPageUrl){ alert('No page loaded'); return; } const statusDiv = document.getElementById('editor-status'); if(statusDiv){ statusDiv.textContent = '💾 Saving changes...'; statusDiv.style.color = '#f39c12'; }
    const iframe = document.getElementById('editor-iframe'); const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  // remove helper classes and any leftover toolbar markup/styles before serializing
  try{ iframeDoc.querySelectorAll('.ve-editable').forEach(el=>{ el.classList.remove('ve-editable','ve-editing'); }); }catch(_){ }
  try{ iframeDoc.querySelectorAll('.ve-toolbar').forEach(n=>n.remove()); }catch(_){ }
  try{ Array.from(iframeDoc.querySelectorAll('style')).forEach(s=>{ if(s.textContent && (s.textContent.indexOf('.ve-editable')>=0 || s.textContent.indexOf('.ve-toolbar')>=0)) s.remove(); }); }catch(_){ }
  const htmlContent = iframeDoc.documentElement.outerHTML;
    try{
      const encoded = encodeURIComponent(window.visualEditorState.currentPageUrl || '');
      const response = await api(`/api/pages/${encoded}`, { method: 'PUT', body: JSON.stringify({ content: htmlContent }) });
      if (response && response.ok){ if(statusDiv){ statusDiv.textContent = `✅ ${window.visualEditorState.currentPageUrl} saved successfully!`; statusDiv.style.color = '#27ae60'; } setTimeout(()=>{ loadPageInEditor(window.visualEditorState.currentPageUrl); },1500); return true; }
      else {
        let errorText = '';
        try{ errorText = await response.text(); }catch(_){ errorText = response && response.statusText ? response.statusText : String(response && response.status); }
        throw new Error(`Server responded with ${response && response.status}: ${errorText}`);
      }
    }catch(e){
      console.error('Save error:', e);
      if(statusDiv){ statusDiv.textContent = `❌ Error saving ${window.visualEditorState.currentPageUrl}: ${e.message}`; statusDiv.style.color = '#e74c3c'; }
      alert(`Error saving page: ${e.message}`);
      return false;
    }
  }

  async function uploadNewImage(){ const fileInput = document.getElementById('new-image-upload'); if (!fileInput || !fileInput.files.length){ alert('Please select an image'); return; } const formData = new FormData(); formData.append('files', fileInput.files[0]); try{ const response = await apiUpload('/api/uploads', formData); if (response.ok){ const data = await response.json(); const newImageUrl = data.files[0].url; window.visualEditorState.siteImages.push(newImageUrl); updateImageGallery(); fileInput.value=''; alert('Image uploaded successfully!'); } else { alert('Failed to upload image'); } }catch(e){ console.error('Upload error:', e); alert('Error uploading image'); } }

  // Toggle a simple iframe edit mode: sets contentEditable on common text elements
  function toggleIframeEditMode(){
    try{
      let iframe = document.getElementById('editor-iframe');
      // If iframe doesn't exist, attempt to create one inside the editor viewport so toggle can work without a loaded page
      if (!iframe){
        try{
          const viewport = document.getElementById('editor-viewport') || document.querySelector('.editor-viewport');
          if (viewport){
            iframe = document.createElement('iframe');
            iframe.id = 'editor-iframe'; iframe.style.width = '100%'; iframe.style.height = '100%'; iframe.style.border = '0';
            // ensure the viewport is cleared and iframe appended
            try{ viewport.innerHTML = ''; }catch(_){ }
            viewport.appendChild(iframe);
            // enable save button in the parent if present
            try{ if (window.savePageChanges && typeof window.savePageChanges === 'function'){} }catch(_){ }
          }
        }catch(_){ }
      }
      if(!iframe) return alert('No editor iframe present');
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (!iframeDoc) return;
      const body = iframeDoc.body;
      if (!body) return;
      const enabled = !!body.classList.toggle('ve-editing-enabled');
      const selectors = ['h1','h2','h3','h4','h5','h6','p','span','div','a'];
      selectors.forEach(sel=>{ iframeDoc.querySelectorAll(sel).forEach(el=>{ if (enabled) el.setAttribute('contenteditable','true'); else el.removeAttribute('contenteditable'); }); });
      window.visualEditorState.visualEditingMode = enabled;

      // when entering edit mode: ensure an initial undo snapshot exists and attach listeners
      try{
        // helper to inject a small floating save/discard prompt into the iframe
        function ensureSavePrompt(doc){
          try{
            if (!doc || !doc.body) return;
            if (doc.getElementById('ve-save-prompt')) return;
            const sp = doc.createElement('div'); sp.id = 've-save-prompt';
            sp.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:2147483647;background:#fff;border:1px solid rgba(0,0,0,0.08);padding:8px;border-radius:8px;box-shadow:0 8px 30px rgba(0,0,0,0.12);font-family:Inter, Arial, sans-serif;font-size:13px;color:#111';
            sp.innerHTML = `<div style="margin-bottom:6px">Unsaved changes</div><div style="display:flex;gap:8px"><button id="ve-save-btn" style="background:#27ae60;color:#fff;padding:6px 10px;border-radius:6px;border:0;cursor:pointer">Save</button><button id="ve-discard-btn" style="background:transparent;border:1px solid #d0d0d0;padding:6px 10px;border-radius:6px;cursor:pointer">Discard</button></div>`;
            doc.body.appendChild(sp);
            // button handlers inside iframe should call parent methods
            const saveBtn = doc.getElementById('ve-save-btn');
            const discBtn = doc.getElementById('ve-discard-btn');
            if (saveBtn) saveBtn.addEventListener('click', function(ev){ try{ if (window.parent && typeof window.parent.savePageChanges === 'function') window.parent.savePageChanges(); }catch(e){ alert('Save failed: '+(e&&e.message)); } });
            if (discBtn) discBtn.addEventListener('click', function(ev){ try{ if (!confirm('Discard unsaved edits and restore original?')) return; if (window.parent && typeof window.parent.veLoadDefault === 'function') window.parent.veLoadDefault(); }catch(e){ alert('Discard failed'); } });
            sp.style.display = 'none'; // hidden until first edit
          }catch(e){ /* ignore */ }
        }

        function showSavePrompt(doc){ try{ const sp = doc.getElementById('ve-save-prompt'); if (sp) sp.style.display = 'block'; }catch(e){} }
        function hideSavePrompt(doc){ try{ const sp = doc.getElementById('ve-save-prompt'); if (sp) sp.style.display = 'none'; }catch(e){} }

        // attach observer/listener only when enabling
        if (enabled){
          // ensure initial snapshot for undo if not already present
          try{ window.visualEditorState.veUndoStack = window.visualEditorState.veUndoStack || []; if (!window.visualEditorState.veUndoStack.length) pushVeUndoForCurrentElement('enter-edit-mode'); }catch(_){ }
          // track whether we've seen edits
          window.visualEditorState.veHasEdits = false;

          // inject save prompt element (hidden initially)
          try{ ensureSavePrompt(iframeDoc); }catch(_){ }

          // MutationObserver to detect edits inside iframe
          try{
            const mo = new MutationObserver((mutations)=>{
              if (!window.visualEditorState.veHasEdits){
                window.visualEditorState.veHasEdits = true;
                try{ pushVeUndoForCurrentElement('first-edit'); }catch(_){ }
                try{ showSavePrompt(iframeDoc); }catch(_){ }
              }
            });
            mo.observe(iframeDoc.body, { subtree: true, childList: true, characterData: true, attributes: true });
            // store observer so we can disconnect later
            window.visualEditorState._veEditObserver = mo;
          }catch(_){ }

          // also listen for input events (typing) to show prompt earlier
          try{
            const inputHandler = function(){ if (!window.visualEditorState.veHasEdits){ window.visualEditorState.veHasEdits = true; try{ pushVeUndoForCurrentElement('first-input'); }catch(_){ } try{ showSavePrompt(iframeDoc); }catch(_){ } } };
            iframeDoc.addEventListener('input', inputHandler, true);
            iframeDoc.addEventListener('keydown', inputHandler, true);
            window.visualEditorState._veInputHandler = inputHandler;
          }catch(_){ }
        } else {
          // disabling: cleanup observer, handlers and hide prompt
          try{ if (window.visualEditorState._veEditObserver){ window.visualEditorState._veEditObserver.disconnect(); delete window.visualEditorState._veEditObserver; } }catch(_){ }
          try{ if (window.visualEditorState._veInputHandler){ iframeDoc.removeEventListener('input', window.visualEditorState._veInputHandler, true); iframeDoc.removeEventListener('keydown', window.visualEditorState._veInputHandler, true); delete window.visualEditorState._veInputHandler; } }catch(_){ }
          try{ hideSavePrompt(iframeDoc); }catch(_){ }
          // reset edit flag
          try{ window.visualEditorState.veHasEdits = false; }catch(_){ }
        }
      }catch(e){ console.warn('edit-mode wiring failed', e); }

      // notify parent UI (no-op if not present)
      try{ const statusDiv=document.getElementById('editor-status'); if(statusDiv) statusDiv.textContent = enabled ? '✏️ Edit mode enabled' : '🔒 Edit mode disabled'; }catch(_){ }
    }catch(e){ console.warn('toggleIframeEditMode failed', e); alert('Failed to toggle edit mode: '+(e && e.message)); }
  }

  // expose methods globally used by admin.html
  window.initVisualEditor = initVisualEditor;
  window.exitVisualEditor = exitVisualEditor;
  window.loadSitePages = loadSitePages;
  window.loadSiteImages = loadSiteImages;
  window.loadPageInEditor = loadPageInEditor;
  window.injectEditorScripts = injectEditorScripts;
  window.selectImage = selectImage;
  window.updateElementText = updateElementText;
  window.updateElementImage = updateElementImage;
  window.updateElementCSS = updateElementCSS;
  window.useSelectedImage = useSelectedImage;
  window.savePageChanges = savePageChanges;
  window.uploadNewImage = uploadNewImage;
  window.enableIframeEditing = enableIframeEditing;
  window.toggleIframeEditMode = toggleIframeEditMode;
  // undo/load-default helpers
  window.pushVeUndoForCurrentElement = pushVeUndoForCurrentElement;
  window.veUndo = veUndo;
  window.veLoadDefault = veLoadDefault;
  // Font helpers added for visual editor
  window.setSelectedElementFont = setSelectedElementFont;
  window.setSiteFonts = setSiteFonts;

})();
