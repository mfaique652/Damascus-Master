// Shared admin auth helper for admin pages
(() => {
  const backendBase = (location.origin && location.origin !== 'null' && location.protocol.startsWith('http')) ? location.origin : 'http://localhost:3025';

  function api(path, opts = {}) {
    const token = localStorage.getItem('adm_token') || '';
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    if (token) headers.Authorization = 'Bearer ' + token;
    return fetch(backendBase + path, { ...opts, headers });
  }

  // Use direct fetch for login to avoid sending any pre-existing Authorization header.
  async function performLogin(email, password) {
    try {
      const r = await fetch(backendBase + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      if (!r.ok) return { ok: false, status: r.status, body: await safeText(r) };
      const d = await r.json();
      if (d && d.token) {
        localStorage.setItem('adm_token', d.token);
        // Immediately verify the token and ensure admin role before returning success
        const prof = await verifyAdminToken();
        if (!prof) {
          localStorage.removeItem('adm_token');
          return { ok: false, status: 403, body: 'token verification failed or insufficient role' };
        }
        return { ok: true };
      }
      return { ok: false };
    } catch (e) { return { ok: false, err: e }; }
  }

  async function safeText(resp) { try { return await resp.text(); } catch { return ''; } }

  // Verify token with server and ensure returned profile indicates an admin role.
  // Returns a normalized user object on success, or null on failure.
  async function verifyAdminToken() {
    try {
      const r = await api('/api/auth/profile');
      if (!r.ok) return null;
      const d = await r.json();
      // Normalize: some endpoints return { user: { ... } } while others return the user directly
      const user = (d && d.user) ? d.user : d;
      if (!user) return null;
      // Ensure role === 'admin'
      const role = (user.role || '').toString().toLowerCase();
      if (role !== 'admin') return null;
      return user;
    } catch (e) { return null; }
  }

  function createMenuModal() {
    if (document.getElementById('admin-chooser-modal')) return document.getElementById('admin-chooser-modal');
    const div = document.createElement('div');
    div.id = 'admin-chooser-modal';
    div.style.position = 'fixed';
    div.style.inset = '0';
    div.style.background = 'rgba(0,0,0,0.6)';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
    div.style.zIndex = '100000';
    div.innerHTML = `
      <div style="background:#fff;border-radius:12px;padding:28px;max-width:540px;width:100%;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,0.4);">
        <h2 style="margin:0 0 8px;color:#222">Welcome, Admin</h2>
        <p style="color:#666;margin:0 0 18px">Choose where to go:</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <button id="admin-chooser-dashboard" style="padding:10px 16px;border-radius:8px;border:none;background:#2ecc71;color:#fff;font-weight:700;cursor:pointer">Dashboard</button>
          <button id="admin-chooser-gateway" style="padding:10px 16px;border-radius:8px;border:none;background:#D4AF37;color:#111;font-weight:700;cursor:pointer">Payment Gateway</button>
          <button id="admin-chooser-editor" style="padding:10px 16px;border-radius:8px;border:none;background:#3498db;color:#fff;font-weight:700;cursor:pointer">Editor</button>
        </div>
        <div style="margin-top:14px"><small style="color:#999">You can logout later from the target page.</small></div>
      </div>
    `;
    document.body.appendChild(div);
    return div;
  }

  function showAdminMenu() {
    const modal = createMenuModal();
    modal.style.display = 'flex';
    const dashBtn = document.getElementById('admin-chooser-dashboard');
    const gatewayBtn = document.getElementById('admin-chooser-gateway');
    const editBtn = document.getElementById('admin-chooser-editor');
    dashBtn.onclick = async () => {
      modal.style.display = 'none';
      // Verify token before proceeding and ensure admin role
      const user = await verifyAdminToken();
      if (!user) { localStorage.removeItem('adm_token'); showLoginOverlay(); return; }
      // If already on dashboard page, refresh data; otherwise navigate
      if (location.pathname.toLowerCase().endsWith('admin-dashboard.html')) {
        if (typeof window.refreshData === 'function') setTimeout(window.refreshData, 100);
      } else {
        location.href = '/admin-dashboard.html';
      }
    };
    gatewayBtn.onclick = async () => {
      modal.style.display = 'none';
      const user = await verifyAdminToken();
      if (!user) { localStorage.removeItem('adm_token'); showLoginOverlay(); return; }
      if (location.pathname.toLowerCase().endsWith('payment-gateway.html')) {
        // no-op
      } else {
        location.href = '/payment-gateway.html';
      }
    };
    editBtn.onclick = async () => {
      modal.style.display = 'none';
      // Verify token before proceeding and ensure admin role
      const user = await verifyAdminToken();
      if (!user) { localStorage.removeItem('adm_token'); showLoginOverlay(); return; }
      if (location.pathname.toLowerCase().endsWith('visual-editor.html')) {
        // already on visual editor - nothing required
      } else {
        location.href = '/visual-editor.html';
      }
    };
  }

  function showLoginOverlay() {
    const el = document.getElementById('login-container') || document.getElementById('login-overlay');
    if (el) el.style.display = 'flex';
  }

  function hideLoginOverlay() {
    const el = document.getElementById('login-container') || document.getElementById('login-overlay');
    if (el) el.style.display = 'none';
  }

  // Expose to global
  window.adminAuth = {
    performLogin,
    verifyAdminToken,
    showAdminMenu,
    showLoginOverlay,
    hideLoginOverlay,
    api
  };
})();
