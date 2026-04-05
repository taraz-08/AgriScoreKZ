'use strict';

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
function initLoginPage() {
  const form = document.getElementById('login-form');
  if (!form) return;
  form.onsubmit = e => {
    e.preventDefault();
    const iin  = document.getElementById('login-iin').value.trim();
    const pass = document.getElementById('login-password').value.trim();
    document.getElementById('iin-group').classList.toggle('has-error', !iin);
    document.getElementById('pass-group').classList.toggle('has-error', !pass);
    if (!iin || !pass) return;

    const btn   = document.getElementById('login-btn');
    const errEl = document.getElementById('login-error');
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${t('loginVerifying')}`;
    if (errEl) errEl.style.display = 'none';

    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: iin, password: pass })
    })
    .then(r => r.json())
    .then(data => {
      btn.disabled = false;
      btn.innerHTML = `<i class="fas fa-sign-in-alt"></i> <span data-i18n="loginBtn">${t('loginBtn')}</span>`;
      if (data.ok) {
        localStorage.setItem('agri_user', JSON.stringify(data.user));
        if (document.getElementById('login-remember').checked)
          localStorage.setItem('agri_remember_login', iin);
        showToast(`✅ ${t('loginWelcome')}, ${data.user.name}!`, 'success');
        location.hash = '#/dashboard';
      } else {
        if (errEl) { errEl.textContent = data.error || t('loginWrongCredentials'); errEl.style.display = 'block'; }
        document.getElementById('iin-group').classList.add('has-error');
        document.getElementById('pass-group').classList.add('has-error');
      }
    })
    .catch(() => {
      btn.disabled = false;
      btn.innerHTML = `<i class="fas fa-sign-in-alt"></i> <span data-i18n="loginBtn">${t('loginBtn')}</span>`;
      if (errEl) { errEl.textContent = t('loginServerError'); errEl.style.display = 'block'; }
    });
  };

  const toggleBtn = document.getElementById('toggle-password');
  if (toggleBtn) toggleBtn.onclick = () => {
    const inp = document.getElementById('login-password');
    inp.type = inp.type === 'password' ? 'text' : 'password';
    toggleBtn.querySelector('i').className = inp.type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
  };

  const saved = localStorage.getItem('agri_remember_login');
  if (saved) document.getElementById('login-iin').value = saved;
}

function showForgotModal() {
  showModal('<i class="fas fa-lock"></i> Парольді қалпына келтіру',
    '<p style="font-size:13px;line-height:1.8">АШМ IT қолдау қызметіне хабарласыңыз:<br><b>support@agrimin.kz</b><br>📞 +7 (7172) 55-97-55</p>',
    '<button class="btn btn-primary" onclick="closeModal()">Жабу</button>', 'modal-sm');
}

// ─── NCALayer (ЭЦҚ) LOGIN ─────────────────────────────────────────────────────
// NCALayer 2.x listens on port 13579. Try WSS first, fall back to WS
// (some browsers block WSS with self-signed cert on localhost).
const NCA_URLS = ['wss://127.0.0.1:13579/', 'ws://127.0.0.1:13579/'];

const NCA_CMD = JSON.stringify({
  module: 'kz.gov.pki.knca.commonUtils',
  method: 'getKeyInfo',
  args:   { storageName: 'PKCS12', keyType: 'AUTH' }
});

function loginWithEDS() {
  const btn   = document.getElementById('eds-btn');
  const errEl = document.getElementById('login-error');

  btn.disabled = true;
  btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${t('ncaConnecting')}`;
  if (errEl) errEl.style.display = 'none';

  _ncaConnect(0, btn, errEl);
}

function _ncaConnect(urlIdx, btn, errEl) {
  if (urlIdx >= NCA_URLS.length) {
    _edsError(btn,
      t('ncaNotInstalled') + '. ' +
      `<a href="https://pki.gov.kz/ncalayer/" target="_blank" style="color:inherit;font-weight:600;text-decoration:underline">${t('ncaDownloadLink')}</a>`
    );
    return;
  }

  let ws;
  let done = false; // prevent double-handling

  try { ws = new WebSocket(NCA_URLS[urlIdx]); }
  catch { _ncaConnect(urlIdx + 1, btn, errEl); return; }

  const timeout = setTimeout(() => {
    if (!done) { ws.close(); _ncaConnect(urlIdx + 1, btn, errEl); }
  }, 3000);

  ws.onopen = () => {
    clearTimeout(timeout);
    btn.innerHTML = `<i class="fas fa-id-card"></i> ${t('ncaSelectCert')}`;
    ws.send(NCA_CMD);
  };

  ws.onmessage = e => {
    done = true;
    clearTimeout(timeout);
    ws.close();
    _ncaHandleResponse(e.data, btn, errEl);
  };

  ws.onerror = () => { /* onclose will fire after */ };

  ws.onclose = () => {
    clearTimeout(timeout);
    if (!done) _ncaConnect(urlIdx + 1, btn, errEl);
  };
}

function _ncaHandleResponse(raw, btn, errEl) {
  let resp;
  try { resp = JSON.parse(raw); }
  catch { _edsError(btn, t('ncaReadError')); return; }

  const code = String(resp.code || '');
  const obj  = resp.responseObject;

  // code !== '200' → cancelled or real error from NCALayer
  if (code !== '200') {
    // If NCALayer gives a meaningful message — show it, otherwise treat as cancelled
    const msg = (resp.message && resp.message.trim())
      ? resp.message
      : t('ncaCancelled');
    _edsError(btn, msg); return;
  }

  // code === '200' but no responseObject → user closed dialog / no key selected
  if (!obj) {
    _edsError(btn, t('ncaCancelled')); return;
  }

  const subjectDn = obj.subjectDn || '';

  // SERIALNUMBER=IIN123456789012  or  SERIALNUMBER=123456789012
  const iinMatch = subjectDn.match(/SERIALNUMBER=(?:IIN)?(\d{12})/i);
  if (!iinMatch) {
    _edsError(btn, t('ncaInvalidIIN')); return;
  }
  const iin = iinMatch[1];

  const cnMatch  = subjectDn.match(/CN=([^,]+)/i);
  const certName = cnMatch ? cnMatch[1].trim() : iin;

  // certNotAfter — NCALayer returns milliseconds
  if (obj.certNotAfter && obj.certNotAfter < Date.now()) {
    _edsError(btn, t('ncaExpired')); return;
  }

  btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${t('ncaVerifying')}`;

  fetch('/api/eds-login', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ iin, subjectDn, certName })
  })
  .then(r => r.json())
  .then(data => {
    _edsReset(btn);
    if (data.ok) {
      localStorage.setItem('agri_user', JSON.stringify(data.user));
      showToast(`✅ ${t('loginWelcome')}, ${data.user.name}!`, 'success');
      location.hash = '#/dashboard';
    } else {
      const errEl = document.getElementById('login-error');
      if (errEl) { errEl.textContent = data.error || t('loginWrongCredentials'); errEl.style.display = 'block'; }
    }
  })
  .catch(() => _edsError(btn, t('loginServerError')));
}

function _edsReset(btn) {
  btn.disabled = false;
  btn.innerHTML = `<i class="fas fa-shield-alt"></i> <span data-i18n="loginEDS">${t('loginEDS')}</span>`;
}

function _edsError(btn, msg) {
  _edsReset(btn);
  const errEl = document.getElementById('login-error');
  if (errEl) {
    errEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
    errEl.style.display = 'block';
  }
}

function handleLogout() {
  localStorage.removeItem('agri_user');
  location.hash = '#/login';
  showToast(t('loggedOut'), 'info');
}
