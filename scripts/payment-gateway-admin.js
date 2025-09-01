  // Domain and Email load/save helpers (will be wired on DOMContentLoaded)
  async function loadDomainConfig(){
    try{
      const r = await window.adminAuth.api('/api/admin/domain-config');
      if (!r.ok) return null;
      const cfg = await r.json();
      return cfg && typeof cfg.domain !== 'undefined' ? cfg.domain : null;
    }catch(e){ return null; }
  }

  async function saveDomain(domain){
    try{
      const resp = await window.adminAuth.api('/api/admin/domain-config', {
        method: 'POST',
        body: JSON.stringify({ domain: domain })
      });
      return await resp.json();
    }catch(e){ return { error: 'network' }; }
  }

  async function loadEmailConfig(){
    try{
      const r = await window.adminAuth.api('/api/admin/email-config');
      if (!r.ok) return null;
      const cfg = await r.json();
      return cfg && typeof cfg.emailUser !== 'undefined' ? cfg.emailUser : null;
    }catch(e){ return null; }
  }

  async function saveEmailConfig(emailUser, emailPass){
    try{
      const resp = await window.adminAuth.api('/api/admin/email-config', {
        method: 'POST',
        body: JSON.stringify({ emailUser: emailUser, emailPass: emailPass })
      });
      return await resp.json();
    }catch(e){ return { error: 'network' }; }
  }
// payment-gateway-admin.js
// Admin-only logic for updating PayPal account email

document.addEventListener('DOMContentLoaded', function() {
  // adminApi wrapper: prefer existing adminAuth.api but fall back to explicit localhost:3025
  // This fixes pages served from a different origin (or file://) where location.origin would point elsewhere
  (function attachAdminApiFallback(){
    try {
      const orig = (window.adminAuth && window.adminAuth.api) ? window.adminAuth.api.bind(window.adminAuth) : null;
      async function adminApi(path, opts = {}){
        // Try original adminAuth.api first (if available)
        if (orig) {
          try {
            const r = await orig(path, opts);
            // If server returned HTML 404 (likely wrong backend), fallback to localhost:3025
            const ct = (r && r.headers && r.headers.get && r.headers.get('content-type')) || '';
            if (r && r.ok && !/text\/html/i.test(ct)) return r;
            // Not OK or returned HTML — fallthrough to explicit fallback
          } catch (e) {
            // continue to fallback
          }
        }
        // Fallback: call explicit local backend on port 3025
        try {
          const token = localStorage.getItem('adm_token') || '';
          const headers = Object.assign({}, opts && opts.headers ? opts.headers : {});
          if (!headers['Content-Type'] && opts && opts.body) headers['Content-Type'] = 'application/json';
          if (token && !headers.Authorization) headers.Authorization = 'Bearer ' + token;
          return await fetch('http://localhost:3025' + path, Object.assign({}, opts || {}, { headers }));
        } catch (e) {
          // Surface original error if fallback also fails
          throw e;
        }
      }
      if (!window.adminAuth) window.adminAuth = {};
      window.adminAuth.api = adminApi;
    } catch (e) { /* noop */ }
  })();
  // Populate domain and sender email once DOM is ready and user is authenticated
  (async function(){
    try{
      // Load and populate domain
      const domainVal = await loadDomainConfig();
      const pgDomainInput = document.getElementById('pg-domain');
      const domainStatus = document.getElementById('domain-status');
      const saveDomainBtn = document.getElementById('save-domain');
      if (pgDomainInput && domainVal !== null) pgDomainInput.value = domainVal || '';
      if (saveDomainBtn) saveDomainBtn.addEventListener('click', async function(e){
        e.preventDefault();
        if (!pgDomainInput) return;
        if (domainStatus) domainStatus.textContent = 'Saving...';
        const res = await saveDomain(pgDomainInput.value);
        if (res && res.success) { if (domainStatus) domainStatus.textContent = 'Domain updated!'; setTimeout(()=>{ if (domainStatus) domainStatus.textContent = ''; },3000); }
        else { if (domainStatus) domainStatus.textContent = (res && res.error) || 'Failed to update.'; }
      });

      // Load and populate sender email
      const senderEmail = await loadEmailConfig();
      const pgSenderEmail = document.getElementById('pg-sender-email');
      const pgSenderPass = document.getElementById('pg-sender-pass');
      const emailForm = document.getElementById('email-form');
      const emailStatus = document.getElementById('email-status');
      if (pgSenderEmail && senderEmail !== null) pgSenderEmail.value = senderEmail || '';
      if (emailForm) emailForm.addEventListener('submit', async function(e){
        e.preventDefault();
        if (!pgSenderEmail || !pgSenderPass) return;
        if (emailStatus) emailStatus.textContent = 'Saving...';
        const res = await saveEmailConfig(pgSenderEmail.value, pgSenderPass.value);
        if (res && res.success) { if (emailStatus) emailStatus.textContent = 'Sender email updated!'; setTimeout(()=>{ if (emailStatus) emailStatus.textContent = ''; },3000); }
        else { if (emailStatus) emailStatus.textContent = (res && res.error) || 'Failed to update.'; }
      });
    }catch(e){ /* ignore */ }
  })();

  // PayPal config
  const paypalEmailInput = document.getElementById('paypal-email');
  const paypalClientIdInput = document.getElementById('paypal-client-id');
  const paypalClientSecretInput = document.getElementById('paypal-client-secret');
  const paypalEnvInput = document.getElementById('paypal-env');
  const paypalConfigForm = document.getElementById('paypal-config-form');
  const paypalConfigStatus = document.getElementById('paypal-config-status');

  // Payout UI removed: PayPal flows redirect to PayPal and card flows use card provider

  // Fetch current PayPal config
  window.adminAuth.api('/api/admin/paypal-config')
    .then(r => r.json())
    .then(cfg => {
      if (cfg.paypalEmail) paypalEmailInput.value = cfg.paypalEmail;
      if (cfg.clientId) paypalClientIdInput.value = cfg.clientId;
      if (cfg.clientSecret) paypalClientSecretInput.value = cfg.clientSecret;
      if (cfg.env) paypalEnvInput.value = cfg.env;
  // payout fields intentionally ignored
    });

  paypalConfigForm.addEventListener('submit', function(e) {
    e.preventDefault();
    paypalConfigStatus.textContent = 'Saving...';
    window.adminAuth.api('/api/admin/paypal-config', {
      method: 'POST',
      body: JSON.stringify({
        paypalEmail: paypalEmailInput.value,
        clientId: paypalClientIdInput.value,
        clientSecret: paypalClientSecretInput.value,
        env: paypalEnvInput.value
      })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          paypalConfigStatus.textContent = 'PayPal configuration updated!';
        } else {
          paypalConfigStatus.textContent = data.error || 'Failed to update.';
        }
      });
  });

  // Payout handlers removed

  // --- Card gateway config and test handlers ---
  // Support both old and new PayPal field ids (paypal-email vs pp-email)
  const ppEmailEl = document.getElementById('paypal-email') || document.getElementById('pp-email');
  const ppClientEl = document.getElementById('paypal-client-id') || document.getElementById('pp-client');
  const ppSecretEl = document.getElementById('paypal-client-secret') || document.getElementById('pp-secret');
  const ppEnvEl = document.getElementById('paypal-env') || document.getElementById('pp-env');

  // Card config elements (new UI)
  const cardProviderEl = document.getElementById('card-provider');
  const cardPubEl = document.getElementById('card-publishable');
  const cardSecretEl = document.getElementById('card-secret');
  const cardWebhookEl = document.getElementById('card-webhook-secret');
  const cardModeEl = document.getElementById('card-mode');
  const cardStatusEl = document.getElementById('card-status');

  // Load existing card config
  function loadCardConfig(){
    window.adminAuth.api('/api/admin/card-config')
      .then(r => r.json())
      .then(cfg => {
        if (!cfg) return;
        if (cardProviderEl && cfg.provider) cardProviderEl.value = cfg.provider;
        if (cardPubEl && cfg.publishableKey) cardPubEl.value = cfg.publishableKey;
        if (cardSecretEl && cfg.secretKey) cardSecretEl.value = cfg.secretKey;
        if (cardWebhookEl && cfg.webhookSecret) cardWebhookEl.value = cfg.webhookSecret;
        if (cardModeEl && cfg.mode) cardModeEl.value = cfg.mode;
      }).catch(()=>{/* ignore load errors for now */});
  }

  // Save card config to server
  function saveCardConfig(){
    if (!cardStatusEl) return;
    cardStatusEl.textContent = 'Saving...';
    const payload = {
      provider: cardProviderEl ? cardProviderEl.value : '',
      publishableKey: cardPubEl ? cardPubEl.value : '',
      secretKey: cardSecretEl ? cardSecretEl.value : '',
      webhookSecret: cardWebhookEl ? cardWebhookEl.value : '',
      mode: cardModeEl ? cardModeEl.value : 'test'
    };
    window.adminAuth.api('/api/admin/card-config', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
      .then(r => r.json())
      .then(data => {
        if (data && data.success) {
          cardStatusEl.textContent = 'Card configuration saved!';
        } else {
          cardStatusEl.textContent = (data && data.error) || 'Failed to save card config.';
        }
      })
      .catch(err => { cardStatusEl.textContent = 'Network error saving card config.'; });
  }

  // Run a quick card test payment (admin-only test endpoint)
  function runCardTest(){
    const amountEl = document.getElementById('pg-amount');
    const statusEl = document.getElementById('domain-status') || document.getElementById('card-status');
    if (!amountEl) return alert('Amount input missing');
    let amount = amountEl.value.trim();
    if (!amount || isNaN(Number(amount))) return alert('Enter a valid numeric amount');
    if (statusEl) statusEl.textContent = 'Running test payment...';
    window.adminAuth.api('/api/admin/payments/test', {
      method: 'POST',
      body: JSON.stringify({ method: 'card', amount: Number(amount) })
    })
      .then(r => r.json())
      .then(data => {
        if (data && data.success) {
          if (statusEl) statusEl.textContent = 'Test payment succeeded: ' + (data.tx || data.id || JSON.stringify(data));
        } else {
          if (statusEl) statusEl.textContent = (data && data.error) || 'Test payment failed.';
        }
      })
      .catch(err => { if (statusEl) statusEl.textContent = 'Network error during test payment.'; });
  }

  // Simple PayPal flow runner -- delegates to server to create a checkout URL or token
  function runPaypalFlow(){
    const amountEl = document.getElementById('pg-amount-pp');
    if (!amountEl) return alert('Amount input missing');
    let amount = amountEl.value.trim();
    if (!amount || isNaN(Number(amount))) return alert('Enter a valid numeric amount');
    // Ask server to create paypal order and return an approval url
    window.adminAuth.api('/api/admin/payments/paypal/create', {
      method: 'POST',
      body: JSON.stringify({ amount: Number(amount) })
    })
      .then(r => r.json())
      .then(data => {
        if (data && data.approvalUrl) {
          window.open(data.approvalUrl, '_blank');
        } else if (data && data.error) {
          alert('PayPal flow error: ' + data.error);
        } else {
          alert('Unable to start PayPal flow.');
        }
      }).catch(()=>{ alert('Network error starting PayPal flow.'); });
  }

  // Expose utilities for page script to call
  window.saveCardConfig = saveCardConfig;
  window.loadCardConfig = loadCardConfig;
  window.runCardTest = runCardTest;
  window.runPaypalFlow = runPaypalFlow;

  // Load existing card config on admin panel load
  loadCardConfig();

  // Load current admin credentials (email only)
  const adminEmailEl = document.getElementById('admin-email');
  const adminCredsStatus = document.getElementById('admin-creds-status');
  function loadAdminCreds(){
    window.adminAuth.api('/api/admin/credentials')
      .then(r => r.json())
      .then(cfg => { if (cfg && cfg.email) adminEmailEl.value = cfg.email; })
      .catch(()=>{});
  }

  // Also update the visible "currently editing" label when we load admin creds
  (function updateCurrentAdminLabel(){
    const currentLabel = document.getElementById('current-admin-email');
    if (!currentLabel) return;
    // try profile endpoint first (more reliable)
    window.adminAuth.api('/api/auth/profile')
      .then(r => { if (!r.ok) return null; return r.json(); })
      .then(profile => {
        if (profile && profile.email) { currentLabel.textContent = profile.email; return; }
        // fallback to admin creds endpoint
        return window.adminAuth.api('/api/admin/credentials')
          .then(r => r.json())
          .then(cfg => { if (cfg && cfg.email) currentLabel.textContent = cfg.email; })
          .catch(()=>{});
      }).catch(()=>{});
  })();

  const adminCredsForm = document.getElementById('admin-creds-form');
  if (adminCredsForm) adminCredsForm.addEventListener('submit', function(e){
    e.preventDefault();
    adminCredsStatus.textContent = 'Saving...';
    // Only update the admin email from this form; password changes must go through the Change Password form
    window.adminAuth.api('/api/admin/credentials', {
      method: 'POST',
      body: JSON.stringify({ email: adminEmailEl.value || undefined })
    }).then(r => r.json()).then(data => {
      if (data && data.success) {
        adminCredsStatus.textContent = 'Admin credentials updated!';
  // Email updated; clear status after short delay
  setTimeout(()=> adminCredsStatus.textContent = '', 3000);
      }
      else adminCredsStatus.textContent = (data && data.error) || 'Failed to update admin credentials.';
    }).catch(()=> { adminCredsStatus.textContent = 'Network error saving admin credentials.'; });
  });

  loadAdminCreds();

  // Change password form (requires old password)
  const adminChangePassForm = document.getElementById('admin-change-pass-form');
  const adminOldPassEl = document.getElementById('admin-old-pass');
  const adminNewPassEl = document.getElementById('admin-new-pass');
  const adminNewPassConfirmEl = document.getElementById('admin-new-pass-confirm');
  const adminChangePassStatus = document.getElementById('admin-change-pass-status');
  if (adminChangePassForm) adminChangePassForm.addEventListener('submit', async function(e){
    e.preventDefault();
    const oldP = adminOldPassEl ? adminOldPassEl.value : '';
    const newP = adminNewPassEl ? adminNewPassEl.value : '';
    const conf = adminNewPassConfirmEl ? adminNewPassConfirmEl.value : '';
    if (!oldP || !newP) { if (adminChangePassStatus) adminChangePassStatus.textContent = 'Both current and new password are required'; return; }
    if (newP !== conf) { if (adminChangePassStatus) adminChangePassStatus.textContent = 'New password and confirmation do not match'; return; }
    if (newP.length < 8) { if (adminChangePassStatus) adminChangePassStatus.textContent = 'New password must be at least 8 characters'; return; }
    if (adminChangePassStatus) adminChangePassStatus.textContent = 'Changing...';
    try{
  const r = await window.adminAuth.api('/api/admin/change-password', { method: 'POST', body: JSON.stringify({ oldPassword: oldP, newPassword: newP }) });
      const j = await r.json();
      if (r.ok && j && j.success) { adminChangePassStatus.textContent = 'Password changed. You will be logged out of other sessions.'; adminOldPassEl.value=''; adminNewPassEl.value=''; adminNewPassConfirmEl.value=''; setTimeout(()=>adminChangePassStatus.textContent='',3000); }
      else { adminChangePassStatus.textContent = (j && j.error) || 'Failed to change password'; }
    }catch(e){ if (adminChangePassStatus) adminChangePassStatus.textContent = 'Network error'; }
  });

  // --- Admin list management (load, add, delete) ---
  async function loadAdmins(){
    try{
      try{ console.log('[pg-admin] loadAdmins start', 'origin=', location.origin, 'hasToken=', !!localStorage.getItem('adm_token')); }catch(e){}
    let r = await window.adminAuth.api('/api/admin/admins');
      try{ console.log('[pg-admin] initial response status=', r && r.status, 'content-type=', r && r.headers && r.headers.get && r.headers.get('content-type')); }catch(e){}
      // If the initial response looks like HTML or is an error, try explicit localhost fallback
      let textBody = null;
      if (!r.ok || (r.headers && r.headers.get && /text\/html/i.test(String(r.headers.get('content-type')||'')))) {
        try { textBody = await r.text().catch(()=>String(r.status)); } catch(e){ textBody = String(r && r.status || 'error'); }
        console.warn('[pg-admin] initial admin list request failed or returned HTML, trying explicit http://localhost:3025 fallback', textBody);
        try { r = await fetch('http://localhost:3025/api/admin/admins', { headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('adm_token') || '') } });
          console.log('[pg-admin] fallback response status=', r && r.status, 'content-type=', r && r.headers && r.headers.get && r.headers.get('content-type'));
        } catch(e) { console.error('[pg-admin] fallback fetch error', e); }
      }
      if (!r || !r.ok) {
        const text = textBody || await (r && r.text ? r.text().catch(()=>String(r && r.status)) : String('no-response'));
        const node = document.getElementById('admin-list'); if (node) node.innerHTML = `<div class="small muted">Failed to load admins: ${escapeHtml(text)}</div>`;
        // disable add-admin form when unauthenticated/forbidden
        const addForm = document.getElementById('add-admin-form'); if (addForm) { addForm.querySelectorAll('input,button').forEach(i=>i.disabled=true); }
        return;
      }
      const j = await r.json();
      renderAdmins((j && j.admins) || []);
    }catch(e){ const node = document.getElementById('admin-list'); if (node) node.innerHTML = '<div class="small muted">Failed to load admins</div>'; }
  }

  function renderAdmins(list){
    const node = document.getElementById('admin-list');
    if (!node) return;
    if (!Array.isArray(list) || list.length===0) { node.innerHTML = '<div class="small muted">No admins configured</div>'; return; }
    const rows = list.map(a => `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px;border-bottom:1px solid #f1f5f9"><div><strong>${escapeHtml(a.email||'')}</strong><div class="small muted">id: ${a.id}</div></div><div><button class="btn ghost" data-delete-id="${a.id}">Delete</button></div></div>`).join('');
    node.innerHTML = rows;
    // wire delete buttons
    node.querySelectorAll('button[data-delete-id]').forEach(btn => btn.addEventListener('click', async function(e){
      const id = btn.getAttribute('data-delete-id');
      if (!id) return;
      if (!confirm('Delete this admin? This cannot be undone.')) return;
      try{
  const resp = await window.adminAuth.api('/api/admin/admins/' + encodeURIComponent(id), { method: 'DELETE' });
        const j = await resp.json();
        if (resp.ok && j && j.success) { loadAdmins(); }
        else { alert('Failed to delete admin: ' + (j && j.error || resp.status)); }
      }catch(e){ alert('Network error deleting admin'); }
    }));
  }

  // add admin form wiring (use form-scoped selectors, trim values, and clear status on input)
  const addAdminForm = document.getElementById('add-admin-form');
  if (addAdminForm) {
    const statusEl = document.getElementById('add-admin-status');
    // clear status when user types
    addAdminForm.addEventListener('input', function(){ if (statusEl) statusEl.textContent = ''; });
    addAdminForm.addEventListener('submit', async function(e){
      e.preventDefault();
      const emailEl = addAdminForm.querySelector('#new-admin-email');
      const passEl = addAdminForm.querySelector('#new-admin-pass');
      const email = (emailEl && (emailEl.value||'').toString().trim()) || '';
      const pass = (passEl && (passEl.value||'').toString()) || '';
      if (!email || !pass) { if (statusEl) statusEl.textContent = 'Email and password required'; return; }
      statusEl && (statusEl.textContent = 'Creating...');
      // disable inputs while creating
      if (emailEl) emailEl.disabled = true; if (passEl) passEl.disabled = true;
      try{
        const r = await window.adminAuth.api('/api/admin/admins', { method: 'POST', body: JSON.stringify({ email, password: pass }) });
        const text = await r.text().catch(()=>'');
        let j = {};
        try { j = text ? JSON.parse(text) : {}; } catch(e) { j = { error: text || 'unknown' }; }
        if (r.ok && j && j.success) {
          statusEl && (statusEl.textContent = 'Admin added');
          if (emailEl) emailEl.value = '';
          if (passEl) passEl.value = '';
          await loadAdmins();
          setTimeout(()=>{ if (statusEl) statusEl.textContent = ''; },3000);
        } else {
          statusEl && (statusEl.textContent = j && j.error || ('Failed to add admin: ' + (text || r.status)));
        }
      }catch(e){ statusEl && (statusEl.textContent = 'Network error'); }
      if (emailEl) emailEl.disabled = false; if (passEl) passEl.disabled = false;
    });
  }

  // escape helper
  function escapeHtml(s){ return String(s||'').replace(/[&"'<>]/g, c => ({'&':'&amp;','"':'&quot;',"'":"&#39;",'<':'&lt;','>':'&gt;'}[c])); }

  // initial load
  loadAdmins();
});
