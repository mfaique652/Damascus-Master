// Admin CMS helper functions moved out from admin.html
(function(){
  const backendBase = (location.origin && location.origin !== 'null' && location.protocol.startsWith('http')) ? location.origin : 'http://localhost:3025';
  async function api(path, opts = {}){
    const token = localStorage.getItem('adm_token') || '';
    const headers = { 'Content-Type':'application/json', ...(opts.headers||{}) };
    if (token) headers.Authorization = 'Bearer ' + token;
    return fetch(backendBase + path, { ...opts, headers });
  }

  // Page list loader
  async function refreshPageList() {
    try {
      const r = await api('/api/pages');
      if (!r.ok) return;
      const d = await r.json();
      const files = d.files || [];
      const selector = document.getElementById('page_selector');
      if (selector) {
        selector.innerHTML = '<option value="">-- Select a page --</option>' + files.map(f => `<option value="${f}">${f}</option>`).join('');
      }
    } catch (e) { console.warn('refreshPageList failed', e); }
  }

  // Load page content into preview iframe
  async function loadPageContent(){
    const selector = document.getElementById('page_selector');
    const pagePath = selector ? selector.value : '';
    if (!pagePath){
      const preview = document.getElementById('page_preview'); if (preview) preview.innerHTML = '<div style="text-align:center; padding:40px; color:#666;">Select a page from the dropdown above to start editing content</div>';
      return;
    }
    try{
      const response = await fetch('/' + pagePath);
      if (!response.ok) throw new Error('Failed to load page');
      const content = await response.text();
      window._cms_currentPageContent = content;
      window._cms_currentPagePath = pagePath;
      const preview = document.getElementById('page_preview');
      if (preview){
        preview.innerHTML = `<div style="margin-bottom:12px; padding:8px; background:#e8f4f8; border-radius:4px;"><strong>📄 ${pagePath}</strong> - Click "Enable Edit Mode" to start editing</div><iframe id="page_iframe" src="/${pagePath}" style="width:100%; height:500px; border:1px solid #ccc; border-radius:4px;"></iframe>`;
      }
    }catch(e){ console.warn('loadPageContent failed', e); const preview = document.getElementById('page_preview'); if (preview) preview.innerHTML = `<div style="text-align:center; padding:40px; color:#d00;">❌ Failed to load page: ${e.message}</div>`; }
  }

  function enableEditMode(){
    if (!window._cms_currentPagePath){ alert('Please select a page first'); return; }
    try{ editMode = true }catch(_){ }
    try{ document.getElementById('edit_mode_btn').style.display='none'; }catch(_){ }
    try{ document.getElementById('save_mode_btn').style.display=''; }catch(_){ }
    try{ document.getElementById('edit_controls').style.display=''; }catch(_){ }
    const iframe = document.getElementById('page_iframe'); if (iframe){ iframe.style.pointerEvents = 'none'; iframe.style.opacity='0.7'; }
    showContentEditor();
  }

  function disableEditMode(){ try{ editMode=false }catch(_){ }
    try{ document.getElementById('edit_mode_btn').style.display=''; }catch(_){ }
    try{ document.getElementById('save_mode_btn').style.display='none'; }catch(_){ }
    try{ document.getElementById('edit_controls').style.display='none'; }catch(_){ }
    const iframe = document.getElementById('page_iframe'); if (iframe){ iframe.style.pointerEvents=''; iframe.style.opacity=''; }
  }

  function showContentEditor(){
    const editorForm = document.getElementById('editor_form'); if (!editorForm) return;
    editorForm.innerHTML = `
      <div style="margin-bottom:16px;">
        <label><strong>Raw HTML Content:</strong></label>
        <textarea id="content_editor" style="width:100%; height:300px; font-family:monospace; font-size:12px;">${window._cms_currentPageContent || ''}</textarea>
      </div>
      <div style="margin-bottom:16px;">
        <h5>🔍 Quick Text Finder & Editor</h5>
        <div style="display:flex; gap:8px; margin-bottom:8px;"><input id="find_text" placeholder="Find text to replace..." style="flex:1;"><button onclick="highlightText()">🔍 Find</button></div>
        <div style="display:flex; gap:8px; margin-bottom:8px;"><input id="replace_text" placeholder="Replace with..." style="flex:1;"><button onclick="replaceText()">🔄 Replace</button><button onclick="replaceAllText()">🔄 Replace All</button></div>
      </div>
      <div style="margin-bottom:16px;"><h5>🖼️ Image Replacer</h5><div style="display:flex; gap:8px; margin-bottom:8px;"><input id="find_image" placeholder="Current image filename (e.g., logo.png)..." style="flex:1;"><input id="replace_image" placeholder="New image filename..." style="flex:1;"><button onclick="replaceImage()">🖼️ Replace Image</button></div></div>
      <div style="display:flex; gap:8px;"><button onclick="savePageContent()" style="background:#28a745; color:white; padding:8px 16px; border:none; border-radius:4px;">💾 Save Changes</button><button onclick="revertChanges()" style="background:#dc3545; color:white; padding:8px 16px; border:none; border-radius:4px;">🔄 Revert</button><button onclick="previewChanges()" style="background:#007bff; color:white; padding:8px 16px; border:none; border-radius:4px;">👁️ Preview</button></div>
    `;
  }

  function highlightText(){ const findText=document.getElementById('find_text').value; const editor=document.getElementById('content_editor'); if(!findText||!editor) return; const content=editor.value; const index=content.toLowerCase().indexOf(findText.toLowerCase()); if(index!==-1){ editor.focus(); editor.setSelectionRange(index,index+findText.length); } else { alert('Text not found'); } }

  function replaceText(){ try{ const findText=document.getElementById('find_text').value; const replaceText=document.getElementById('replace_text').value; const editor=document.getElementById('content_editor'); if(!editor) return; const content=editor.value; const newContent=content.replace(new RegExp(escapeRegex(findText),'i'),replaceText); editor.value=newContent; window._cms_currentPageContent=newContent; }catch(e){ console.warn(e); } }
  function replaceAllText(){ try{ const findText=document.getElementById('find_text').value; const replaceText=document.getElementById('replace_text').value; const editor=document.getElementById('content_editor'); if(!editor) return; const content=editor.value; const newContent=content.replace(new RegExp(escapeRegex(findText),'gi'),replaceText); editor.value=newContent; window._cms_currentPageContent=newContent; }catch(e){ console.warn(e); } }

  function escapeRegex(s){ return String(s||'').replace(/[-\/\\^$*+?.()|[\]{}]/g,'\\$&'); }

  function replaceImage(){ try{ const findImage=document.getElementById('find_image').value; const replaceImage=document.getElementById('replace_image').value; const editor=document.getElementById('content_editor'); if(!editor) return; let content=editor.value; if(!findImage||!replaceImage) return; let newContent = content.replace(new RegExp(`src=["']([^"']*${escapeRegex(findImage)}[^"']*)["']`,'gi'), `src="${replaceImage}"`); newContent = newContent.replace(new RegExp(`url\\(([^)]*${escapeRegex(findImage)}[^)]*)\\)`,'gi'), `url(${replaceImage})`); newContent = newContent.replace(new RegExp(escapeRegex(findImage),'gi'), replaceImage); editor.value=newContent; window._cms_currentPageContent=newContent; }catch(e){ console.warn('replaceImage failed',e); } }

  async function savePageContent(){ try{ if (!window._cms_currentPagePath) { alert('No page selected'); return; } const content = document.getElementById('content_editor') ? document.getElementById('content_editor').value : window._cms_currentPageContent || ''; const resp = await api(`/api/pages/${window._cms_currentPagePath}`, { method:'PUT', body: JSON.stringify({ content }) }); if (resp.ok){ alert('Page saved'); try{ loadPageContent(); }catch(_){ } } else { const txt = await resp.text().catch(()=>''); alert('Failed to save: ' + txt); } }catch(e){ console.warn('savePageContent failed', e); alert('Save failed: ' + (e && e.message)); } }

  function revertChanges(){ try{ document.getElementById('content_editor').value = window._cms_currentPageContent || ''; }catch(_){ } }
  function previewChanges(){ try{ const previewFrame = document.getElementById('page_iframe'); if (previewFrame) { const blob = new Blob([document.getElementById('content_editor').value], { type: 'text/html' }); const url = URL.createObjectURL(blob); previewFrame.src = url; } }catch(e){ console.warn(e); } }

  function replaceImageGlobally(imageName){ try{ const newImage = prompt(`Replace "${imageName}" with which image? Enter filename:`, ''); if(!newImage) return; if (window._cms_currentPagePath && window.editMode) { document.getElementById('find_image').value = imageName; document.getElementById('replace_image').value = newImage; replaceImage(); alert(`🔄 Replaced "${imageName}" with "${newImage}" in current page. Don't forget to save!`); } else { alert('⚠️ Please select a page and enable edit mode first'); } }catch(e){ console.warn(e); } }

  // Export helpers (no-op here) - existing code may call these
  window.refreshPageList = refreshPageList;
  window.loadPageContent = loadPageContent;
  window.enableEditMode = enableEditMode;
  window.disableEditMode = disableEditMode;
  window.showContentEditor = showContentEditor;
  window.savePageContent = savePageContent;
  window.replaceImage = replaceImage;
  window.replaceText = replaceText;
  window.replaceAllText = replaceAllText;
  window.replaceImageGlobally = replaceImageGlobally;
  window.revertChanges = revertChanges;
  window.previewChanges = previewChanges;

})();
