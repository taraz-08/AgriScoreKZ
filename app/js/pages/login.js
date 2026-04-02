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
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Тексерілуде...';
    if (errEl) errEl.style.display = 'none';

    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: iin, password: pass })
    })
    .then(r => r.json())
    .then(data => {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> <span data-i18n="loginBtn">Кіру</span>';
      if (data.ok) {
        localStorage.setItem('agri_user', JSON.stringify(data.user));
        if (document.getElementById('login-remember').checked)
          localStorage.setItem('agri_remember_login', iin);
        showToast(`✅ Қош келдіңіз, ${data.user.name}!`, 'success');
        location.hash = '#/dashboard';
      } else {
        if (errEl) { errEl.textContent = data.error || 'Логин немесе пароль қате'; errEl.style.display = 'block'; }
        document.getElementById('iin-group').classList.add('has-error');
        document.getElementById('pass-group').classList.add('has-error');
      }
    })
    .catch(() => {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> <span data-i18n="loginBtn">Кіру</span>';
      if (errEl) { errEl.textContent = 'Сервер қатесі — бетті жаңартыңыз'; errEl.style.display = 'block'; }
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

function showEDSModal() {
  showModal('<i class="fas fa-shield-alt"></i> ЭЦҚ арқылы кіру',
    '<p style="font-size:13px;color:var(--text-muted)">Бұл функция дайындалуда. Жақын арада қол жетімді болады.</p>',
    '<button class="btn btn-primary" onclick="closeModal()">Жабу</button>', 'modal-sm');
}

function handleLogout() {
  localStorage.removeItem('agri_user');
  location.hash = '#/login';
  showToast('Жүйеден шықтыңыз', 'info');
}
