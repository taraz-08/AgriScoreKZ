'use strict';
// ─── CHART REGISTRY ──────────────────────────────────────────────────────────
const Charts = {};

// ─── TOAST ───────────────────────────────────────────────────────────────────
function showToast(message, type = 'success', duration = 4000) {
  const icons = { success:'fa-check-circle', error:'fa-times-circle', warning:'fa-exclamation-triangle', info:'fa-info-circle' };
  const c = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<i class="fas ${icons[type]||icons.info} toast-icon"></i><span class="toast-text">${message}</span><button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>`;
  el.onclick = () => el.remove();
  c.appendChild(el);
  if (duration > 0) setTimeout(() => { if (el.parentNode) { el.classList.add('removing'); setTimeout(() => el.remove(), 300); } }, duration);
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function showModal(title, body, footer = '', size = '') {
  const ov = document.getElementById('modal-overlay');
  ov.classList.remove('hidden');
  ov.innerHTML = `<div class="modal ${size}" role="dialog">
    <div class="modal-header">
      <div class="modal-title">${title}</div>
      <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
    </div>
    <div class="modal-body">${body}</div>
    ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
  </div>`;
  ov.onclick = e => { if (e.target === ov) closeModal(); };
}

function closeModal() {
  const ov = document.getElementById('modal-overlay');
  ov.classList.add('hidden');
  ov.innerHTML = '';
}

// Global confirm callback — window-ға тікелей жазылады
window._confirmCb = null;

function showConfirm(title, text, onYes, danger = true) {
  window._confirmCb = onYes;
  showModal(
    `<i class="fas fa-exclamation-triangle" style="color:var(--warning)"></i> ${title}`,
    `<p style="font-size:14px;color:var(--text-muted);line-height:1.6">${text}</p>`,
    `<button class="btn btn-ghost" onclick="closeModal()">Болдырмау</button>
     <button class="btn ${danger?'btn-danger':'btn-primary'}" onclick="if(window._confirmCb){var cb=window._confirmCb;window._confirmCb=null;closeModal();cb();}">Иә, растаймын</button>`,
    'modal-sm'
  );
}

// ─── LOADING ──────────────────────────────────────────────────────────────────
function showLoading(text) {
  const ov = document.getElementById('loading-overlay');
  ov.classList.remove('hidden');
  const p = ov.querySelector('p');
  if (p) p.textContent = text || 'Жүктелуде...';
}
function hideLoading() { document.getElementById('loading-overlay').classList.add('hidden'); }

// ─── GEMINI AI ────────────────────────────────────────────────────────────────
const DEMO_AI_RESPONSES = {
  score: `Бұл өтінімдер бойынша автоматты скоринг жүйесі 5 негізгі факторды ескерді:\n\n✅ **Субсидия тарихы (25%)** — Өтінімдер субсидияны бұрын тиімді пайдаланған.\n✅ **Өнімділік (30%)** — Аймақтық орташадан жоғары өнімділік деңгейі анықталды.\n⚠️ **Шаруашылық профилі (20%)** — Жер алаңы оңтайлы диапазонда.\n✅ **Әлеуметтік-экономикалық (15%)** — Ауылдық аймақта орналасқан, жұмыс орындары бар.\n✅ **Тәуекел бағасы (10%)** — Таза несие тарихы, салық берешегі жоқ.\n\nЖалпы баға: субсидия беруге **ұсынылады**.`,
  risk: `Тәуекел талдауы негізінде:\n\n🟢 **Қаржылық тәуекел — ТӨМЕН**: Таза несие тарихы анықталды, банктік міндеттемелер жоқ.\n🟡 **Операциялық тәуекел — ОРТАША**: Техника паркі жеткілікті, бірақ ескіру деңгейін бақылау қажет.\n🟢 **Заңдық тәуекел — ТӨМЕН**: Сот дауы жоқ, салық берешегі тазаланған.\n\nЖалпы тәуекел деңгейі: **ТӨМЕН** ✅`,
  recommend: `Скоринг нәтижелері мен тәуекел талдауы негізінде осы өтінімді субсидия беруге ҰСЫНАМЫЗ.\n\nНегіздеме:\n• Өнімділік аймақтық орташадан 15-20% жоғары\n• Бұрынғы субсидияларды толық игерген тарих бар\n• Ауылдық аймақта жұмыс орындарын қамтамасыз етеді\n• Тәуекел деңгейі төмен, қаржылық жағдайы тұрақты\n\nСубсидия сомасы бюджет шегінде бекітілуі мүмкін.`,
  analyze: `Жүйеге жүктелген деректер талдауы:\n\n📊 **Жалпы сурет:**\n• Өтінімдердің 45%+ ұсынылуға лайықты (70+ балл)\n• Ең белсенді аймақтар: Алматы, Қостанай, Шығыс ҚЗ\n• Егіншілік саласы басым (48%)\n\n🔍 **Негізгі тенденциялар:**\n• Орташа жер алаңы: 450 га\n• Суландыру жүйесі бар шаруашылықтар жоғары балл алады\n• Техника саны >5 болған жағдайда балл 12-15%-ға артады\n\n💡 **Ұсыныс:** Shortlist үшін 65+ балл шегін қолдану оңтайлы.`,
};

async function callGemini(prompt, type = 'score') {
  // API кілті серверде (.env) — frontend-те ешқашан көрінбейді
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  const d = await res.json();
  // Серверде GEMINI_API_KEY орнатылмаған → demo режим
  if (d.demo) {
    await new Promise(r => setTimeout(r, 1200));
    return DEMO_AI_RESPONSES[type] || DEMO_AI_RESPONSES.score;
  }
  if (!res.ok || d.error) throw new Error(d.error?.message || `API қатесі: ${res.status}`);
  return d.candidates?.[0]?.content?.parts?.[0]?.text || 'Жауап алынбады';
}

function showAIModal(title, prompt, type = 'score') {
  showModal(title,
    `<div id="ai-loading" style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:32px">
       <div style="font-size:40px;color:var(--primary);animation:spin 1.5s linear infinite"><i class="fas fa-seedling"></i></div>
       <p style="font-size:13px;color:var(--text-muted)" id="ai-loading-text">AI талдауда...</p>
     </div>
     <div id="ai-result" style="display:none">
       <div class="ai-response" id="ai-text" style="background:var(--primary-pale);border-left:3px solid var(--primary);border-radius:0 8px 8px 0;padding:16px;font-size:13px;line-height:1.8;white-space:pre-wrap"></div>
       <p id="ai-footer-note" style="font-size:11px;color:var(--text-muted);margin-top:8px;text-align:right">🤖 AgriScore AI</p>
     </div>`,
    `<button class="btn btn-outline" onclick="closeModal()">Жабу</button>`,
    'modal-lg'
  );
  // Check server gemini status first, then run
  fetch('/api/gemini-status').then(r=>r.json()).then(s => {
    const ltxt = document.getElementById('ai-loading-text');
    if (ltxt) ltxt.textContent = s.hasKey ? 'Google Gemini талдауда...' : 'Demo жауап дайындалуда...';
  }).catch(()=>{});

  callGemini(prompt, type).then(text => {
    const loading = document.getElementById('ai-loading');
    const result = document.getElementById('ai-result');
    const textEl = document.getElementById('ai-text');
    const note = document.getElementById('ai-footer-note');
    if (!loading || !result || !textEl) return;
    loading.style.display = 'none';
    result.style.display = 'block';
    if (note) {
      fetch('/api/gemini-status').then(r=>r.json()).then(s => {
        note.textContent = s.hasKey ? '🤖 Google Gemini 2.5 Flash' : '⚠️ Demo режим — .env файлына GEMINI_API_KEY қосыңыз';
      }).catch(()=>{});
    }
    typewriter(textEl, text, 15);
  }).catch(err => {
    const loading = document.getElementById('ai-loading');
    if (loading) loading.innerHTML = `<p style="color:var(--danger)">❌ ${err.message}</p><p style="font-size:12px;color:var(--text-muted);margin-top:8px">server.js → .env файлын тексеріңіз</p>`;
  });
}

function typewriter(el, text, speed = 20) {
  el.textContent = '';
  let i = 0;
  const t = setInterval(() => {
    if (i < text.length) { el.textContent += text[i++]; el.scrollTop = el.scrollHeight; }
    else clearInterval(t);
  }, speed);
}

// ─── ROUTER ───────────────────────────────────────────────────────────────────
const PAGES = { '/login':'login', '/dashboard':'dashboard', '/applicants':'applicants',
  '/scoring':'scoring', '/shortlist':'shortlist', '/analytics':'analytics',
  '/upload':'upload', '/settings':'settings', '/methodology':'methodology' };

function router() {
  const hash = location.hash.replace('#','') || '/login';
  const user = localStorage.getItem('agri_user');
  if (!user && hash !== '/login') { location.hash = '#/login'; return; }

  const detail = hash.match(/^\/applicants\/(.+)$/);
  if (detail) { showPage('applicant-detail'); initApplicantDetail(detail[1]); setActiveNav('applicants'); return; }

  const pid = PAGES[hash];
  if (pid) { showPage(pid); setActiveNav(pid); }
  else { location.hash = user ? '#/dashboard' : '#/login'; }
}

function showPage(id) {
  const isLogin = id === 'login';
  document.getElementById('page-login').style.display = isLogin ? 'flex' : 'none';
  const shell = document.getElementById('app-shell');
  shell.classList.toggle('hidden', isLogin);
  if (!isLogin) {
    document.querySelectorAll('#main-content .page').forEach(p => p.classList.remove('active'));
    const pg = document.getElementById(`page-${id}`);
    if (pg) { pg.classList.add('active'); setTimeout(() => initPage(id), 60); }
    updateNavTitle(id);
  }
}

const PAGE_INITS = { dashboard:initDashboard, applicants:initApplicants, scoring:initScoring,
  shortlist:initShortlist, analytics:initAnalytics, upload:initUpload, settings:initSettings,
  methodology:initMethodology };

function initPage(id) { if (PAGE_INITS[id]) PAGE_INITS[id](); }

function setActiveNav(id) {
  document.querySelectorAll('.nav-item[data-page]').forEach(el => el.classList.toggle('active', el.dataset.page === id));
  document.querySelectorAll('.bottom-nav-item[data-page]').forEach(el => el.classList.toggle('active', el.dataset.page === id));
}

function navigateTo(page) { location.hash = '#/' + page; }

function updateNavTitle(id) {
  const map = { dashboard:'Басқару тақтасы', applicants:'Өтінімдер', 'applicant-detail':'Өтінім',
    scoring:'Скоринг', shortlist:'Shortlist', analytics:'Аналитика', upload:'Деректер жүктеу',
    settings:'Параметрлер', methodology:'Методология' };
  const el = document.getElementById('navbar-title');
  if (el) el.textContent = map[id] || '';
}

function toggleSidebar() {
  const shell = document.getElementById('app-shell');
  shell.classList.toggle('sidebar-collapsed');
  localStorage.setItem('agri_sidebar', shell.classList.contains('sidebar-collapsed') ? '1' : '0');
}

// ─── COUNTER ANIMATION ────────────────────────────────────────────────────────
function animateCounter(el, target, dur = 1400) {
  if (!el) return;
  const start = performance.now();
  const update = t => {
    const p = Math.min((t - start) / dur, 1);
    el.textContent = formatNumber(Math.floor((1 - Math.pow(1 - p, 3)) * target));
    if (p < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

function animateAllProgressBars() {
  document.querySelectorAll('.progress-bar[data-width]').forEach(bar => {
    const w = bar.dataset.width;
    bar.style.width = '0%';
    requestAnimationFrame(() => setTimeout(() => { bar.style.width = w + '%'; }, 100));
  });
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function initLoginPage() {
  const form = document.getElementById('login-form');
  if (!form) return;
  form.onsubmit = e => {
    e.preventDefault();
    const iin = document.getElementById('login-iin').value.trim();
    const pass = document.getElementById('login-password').value.trim();
    let ok = true;
    document.getElementById('iin-group').classList.toggle('has-error', !iin);
    document.getElementById('pass-group').classList.toggle('has-error', !pass);
    if (!iin || !pass) return;

    const btn = document.getElementById('login-btn');
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
        if (document.getElementById('login-remember').checked) localStorage.setItem('agri_remember_login', iin);
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

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function initDashboard() {
  const stats = AppState.getStats();
  const today = new Date();
  const d = document.getElementById('today-date');
  if (d) d.textContent = formatDate(today);

  animateCounter(document.getElementById('kpi-total'), stats.total);
  animateCounter(document.getElementById('kpi-processing'), stats.processing);
  animateCounter(document.getElementById('kpi-shortlisted'), stats.shortlisted);
  const bEl = document.getElementById('kpi-budget');
  if (bEl) { bEl.textContent = '0'; setTimeout(() => bEl.textContent = formatMoney(stats.totalRequested), 100); }

  renderTopApplicants();
  initDashboardAreaChart('30d');
  initDashboardDonutChart(stats.byRegion);
  renderDashboardMLWidgets(stats);

  const user = JSON.parse(localStorage.getItem('agri_user') || '{}');
  const av = document.getElementById('navbar-avatar');
  if (av) av.textContent = (user.login || 'A').charAt(0).toUpperCase();

  setTimeout(animateAllProgressBars, 200);
}

function renderDashboardMLWidgets(stats) {
  // Avg success probability
  const probs = AppState.applicants.map(a => a.successProb ? a.successProb.probability : calcSuccessProbability(a).probability);
  const avgProb = probs.length ? Math.round(probs.reduce((s,v)=>s+v,0)/probs.length) : 0;
  const probEl = document.getElementById('kpi-avg-prob');
  if (probEl) animateCounter(probEl, avgProb);

  // Anomaly count
  const anomalyCount = AppState.applicants.filter(a => { const an = detectAnomalies(a); return an.anomalyRisk === 'Жоғары' || an.anomalyRisk === 'Орташа'; }).length;
  const anomalyEl = document.getElementById('kpi-anomaly');
  if (anomalyEl) animateCounter(anomalyEl, anomalyCount);

  // Cluster distribution
  const clusterEl = document.getElementById('dash-cluster-dist');
  if (clusterEl) {
    clusterEl.innerHTML = CLUSTER_ORDERED_LABELS.map(lbl => {
      const cnt = AppState.applicants.filter(a=>a.clusterLabel===lbl.name).length;
      const pct = AppState.applicants.length ? Math.round(cnt/AppState.applicants.length*100) : 0;
      return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="width:10px;height:10px;border-radius:50%;background:${lbl.color};flex-shrink:0"></span>
        <span style="flex:1;font-size:12px">${lbl.icon} ${lbl.name}</span>
        <span style="font-weight:700;font-size:13px">${cnt}</span>
        <div style="width:60px;height:6px;background:var(--border);border-radius:3px">
          <div style="width:${pct}%;height:100%;background:${lbl.color};border-radius:3px"></div>
        </div>
      </div>`;
    }).join('');
  }
}

function renderTopApplicants() {
  const tbody = document.getElementById('top-applicants-tbody');
  if (!tbody) return;
  const top = AppState.applicants.slice(0, 5);
  tbody.innerHTML = top.map((a, i) => `
    <tr style="border-bottom:1px solid var(--border)">
      <td style="padding:10px 8px;width:36px">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;font-size:12px;font-weight:700;background:${i<3?['#FFD700','#C0C0C0','#CD7F32'][i]:'var(--bg)'};color:${i<3?'#333':'var(--text-muted)'}">${i<3?['🥇','🥈','🥉'][i]:i+1}</span>
      </td>
      <td style="padding:10px 8px">
        <div style="font-weight:600;font-size:13px">${a.name}</div>
        <div style="font-size:11px;color:var(--text-muted)">${a.region}</div>
      </td>
      <td style="padding:10px 8px"><span class="badge ${getScoreBadgeClass(a.totalScore)}">${a.totalScore}</span></td>
      <td style="padding:10px 8px"><span class="badge ${getStatusBadgeClass(a.recommendation)}">${a.recommendation}</span></td>
      <td style="padding:10px 8px"><button class="btn btn-sm btn-outline" onclick="navigateTo('applicants/${a.id}')" style="font-size:11px">Көру →</button></td>
    </tr>`).join('');
}

function initDashboardAreaChart(period) {
  const ctx = document.getElementById('dash-area-chart');
  if (!ctx) return;
  if (Charts.dashArea) Charts.dashArea.destroy();
  const pts = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const lang = window.currentLang || 'kk';
  const months = TRANSLATIONS[lang].months;
  const labels = [], d1 = [], d2 = [];
  const now = new Date();
  for (let i = pts - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    labels.push(pts <= 30 ? `${d.getDate()} ${months[d.getMonth()]}` : months[d.getMonth()]);
    d1.push(rnd(20, 120)); d2.push(rnd(10, 70));
  }
  const grd = ctx.getContext('2d').createLinearGradient(0,0,0,260);
  grd.addColorStop(0,'rgba(27,94,32,0.25)'); grd.addColorStop(1,'rgba(27,94,32,0)');
  const grd2 = ctx.getContext('2d').createLinearGradient(0,0,0,260);
  grd2.addColorStop(0,'rgba(249,168,37,0.2)'); grd2.addColorStop(1,'rgba(249,168,37,0)');

  Charts.dashArea = new Chart(ctx, {
    type:'line', data:{ labels, datasets:[
      { label:'Өтінімдер', data:d1, borderColor:'#1B5E20', backgroundColor:grd, fill:true, tension:0.4, pointRadius:3, pointHoverRadius:6 },
      { label:'Мақұлданды', data:d2, borderColor:'#F9A825', backgroundColor:grd2, fill:true, tension:0.4, pointRadius:3 }
    ]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:'top', labels:{ usePointStyle:true, font:{ family:'Inter', size:12 } } }, tooltip:{ mode:'index', intersect:false } },
      scales:{ x:{ grid:{ display:false }, ticks:{ font:{ size:11 }, maxTicksLimit:8 } }, y:{ beginAtZero:true, ticks:{ font:{ size:11 } } } }
    }
  });
}

function initDashboardDonutChart(byRegion) {
  const ctx = document.getElementById('dash-donut-chart');
  if (!ctx) return;
  if (Charts.dashDonut) Charts.dashDonut.destroy();
  const top = Object.entries(byRegion).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const colors = ['#1B5E20','#2E7D32','#388E3C','#43A047','#4CAF50','#66BB6A'];

  Charts.dashDonut = new Chart(ctx, {
    type:'doughnut',
    data:{ labels:top.map(r=>r[0]), datasets:[{ data:top.map(r=>r[1]), backgroundColor:colors, borderWidth:2, borderColor:'#fff', hoverOffset:8 }] },
    options:{ responsive:true, maintainAspectRatio:false, cutout:'65%',
      plugins:{ legend:{ position:'bottom', labels:{ usePointStyle:true, font:{ family:'Inter', size:11 }, padding:8 } } }
    }
  });

  // Progress bars below chart
  const cont = document.getElementById('dash-progress-bars');
  if (!cont) return;
  const types = AppState.getStats().byType;
  const total = Object.values(types).reduce((s,v)=>s+v,0);
  const typeColors = { 'Егіншілік':'#1B5E20','Мал шаруашылығы':'#F9A825','Аралас':'#1565C0','Бақша':'#E53935' };
  cont.innerHTML = Object.entries(types).map(([k,v]) => {
    const pct = Math.round(v/total*100);
    return `<div>
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
        <span>${k}</span><span style="font-weight:600">${pct}%</span>
      </div>
      <div class="progress-wrap"><div class="progress-bar" data-width="${pct}" style="background:${typeColors[k]||'var(--primary)'}"></div></div>
    </div>`;
  }).join('');
  setTimeout(animateAllProgressBars, 300);
}

function setDashPeriod(period, btn) {
  document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  initDashboardAreaChart(period);
}

// ─── APPLICANTS ───────────────────────────────────────────────────────────────
const appState = { filtered:[], page:1, perPage:25, sortCol:'totalScore', sortDir:'desc', selected:new Set() };

function initApplicants() {
  populateRegionFilter();
  appState.filtered = [...AppState.applicants];
  appState.page = 1;
  sortApplicants();
  renderApplicantsTable();

  document.getElementById('app-search').oninput = debounce(filterApplicants, 250);
  ['filter-region','filter-district','filter-type','filter-score','filter-status','filter-cluster','filter-anomaly'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.onchange = filterApplicants;
  });
  document.getElementById('filter-region').onchange = function() {
    const dist = document.getElementById('filter-district');
    dist.innerHTML = '<option value="">Аудан</option>';
    if (this.value && REGIONS_DATA[this.value]) {
      REGIONS_DATA[this.value].forEach(d => { const o = document.createElement('option'); o.value = d; o.textContent = d; dist.appendChild(o); });
    }
    filterApplicants();
  };

  const selAll = document.getElementById('select-all-cb');
  if (selAll) selAll.onchange = e => {
    getPageIds().forEach(id => e.target.checked ? appState.selected.add(id) : appState.selected.delete(id));
    renderApplicantsTable(); updateBulkBar();
  };

  document.querySelectorAll('#applicants-table thead th[data-sort]').forEach(th => {
    th.onclick = () => {
      const col = th.dataset.sort;
      if (appState.sortCol === col) appState.sortDir = appState.sortDir === 'asc' ? 'desc' : 'asc';
      else { appState.sortCol = col; appState.sortDir = 'desc'; }
      document.querySelectorAll('#applicants-table thead th[data-sort]').forEach(h => h.classList.remove('sort-asc','sort-desc'));
      th.classList.add(appState.sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
      sortApplicants(); renderApplicantsTable();
    };
  });
}

function populateRegionFilter() {
  const sel = document.getElementById('filter-region');
  if (!sel || sel.options.length > 1) return;
  REGIONS.forEach(r => { const o = document.createElement('option'); o.value = r; o.textContent = r; sel.appendChild(o); });
}

function filterApplicants() {
  const q = (document.getElementById('app-search')?.value||'').toLowerCase();
  const region = document.getElementById('filter-region')?.value||'';
  const district = document.getElementById('filter-district')?.value||'';
  const pType = document.getElementById('filter-type')?.value||'';
  const scoreRange = document.getElementById('filter-score')?.value||'';
  const status = document.getElementById('filter-status')?.value||'';
  const cluster = document.getElementById('filter-cluster')?.value||'';
  const anomaly = document.getElementById('filter-anomaly')?.value||'';

  appState.filtered = AppState.applicants.filter(a => {
    if (q && !a.name.toLowerCase().includes(q) && !a.iin.includes(q)) return false;
    if (region && a.region !== region) return false;
    if (district && a.district !== district) return false;
    if (pType && a.productionType !== pType) return false;
    if (status && a.recommendation !== status) return false;
    if (cluster && a.clusterLabel !== cluster) return false;
    if (anomaly) {
      const an = detectAnomalies(a);
      if (anomaly === 'high' && an.anomalyRisk !== 'Жоғары') return false;
      if (anomaly === 'any' && an.anomalyRisk === 'Жоқ') return false;
    }
    if (scoreRange) {
      const [mn, mx] = scoreRange.split('-').map(Number);
      if (a.totalScore < mn || a.totalScore > (mx||100)) return false;
    }
    return true;
  });
  appState.page = 1;
  sortApplicants();
  renderApplicantsTable();

  const activeCnt = ['filter-region','filter-district','filter-type','filter-score','filter-status','filter-cluster','filter-anomaly'].filter(id=>document.getElementById(id)?.value).length;
  const badge = document.getElementById('filter-badge');
  if (badge) { badge.textContent = activeCnt > 0 ? `${activeCnt} сүзгі белсенді` : ''; badge.style.display = activeCnt > 0 ? 'inline-flex' : 'none'; }
}

function sortApplicants() {
  const { sortCol, sortDir } = appState;
  appState.filtered.sort((a,b) => {
    let va = a[sortCol], vb = b[sortCol];
    if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb||'').toLowerCase(); }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });
}

function renderApplicantsTable() {
  const tbody = document.getElementById('applicants-tbody');
  if (!tbody) return;
  const { filtered, page, perPage, selected } = appState;
  const start = (page-1)*perPage, rows = filtered.slice(start, start+perPage);
  const countEl = document.getElementById('apps-count');
  if (countEl) countEl.textContent = formatNumber(filtered.length);

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="12"><div class="empty-state">
      <div class="empty-icon">🔍</div>
      <div class="empty-title">Нәтиже табылмады</div>
      <div class="empty-subtitle">Іздеу немесе сүзгі параметрлерін өзгертіп көріңіз</div>
      <button class="btn btn-outline" onclick="resetApplicantFilters()">Сүзгіні тазарту</button>
    </div></td></tr>`;
  } else {
    const p = 'padding:7px 6px';
    tbody.innerHTML = rows.map((a, i) => `
      <tr class="${selected.has(a.id)?'selected':''}" style="animation-delay:${i*30}ms">
        <td style="${p}"><input type="checkbox" class="row-cb" data-id="${a.id}" ${selected.has(a.id)?'checked':''} onchange="toggleSelect('${a.id}',this.checked)" style="accent-color:var(--primary);cursor:pointer"></td>
        <td style="${p};color:var(--text-muted);font-size:11px">${a.rank}</td>
        <td style="${p}"><span style="font-family:monospace;font-size:10px">${a.iin}</span></td>
        <td style="${p}"><div style="font-weight:600;font-size:12px">${a.name}</div><div style="font-size:10px;color:var(--text-muted)">${a.entityType}</div></td>
        <td style="${p}"><div style="font-size:11px">${a.district}</div><div style="font-size:10px;color:var(--text-muted)">${a.region}</div></td>
        <td style="${p};font-size:11px">${a.productionType}</td>
        <td style="${p};font-size:11px">${formatNumber(a.landArea)} га</td>
        <td style="${p}"><span class="badge ${getScoreBadgeClass(a.totalScore)} ${a.totalScore>=90?'badge-pulse':''}" style="font-size:12px">${a.totalScore}</span></td>
        <td style="${p}"><span class="badge ${a.clusterBadge||'cluster-mid'}" style="font-size:10px;white-space:nowrap">${a.clusterIcon||'📊'} ${a.clusterLabel||'—'}</span></td>
        <td style="${p};font-size:11px;white-space:nowrap">${a.successProb ? '<span style="color:' + (a.successProb.probability>=70?'var(--success)':a.successProb.probability>=50?'var(--warning)':'var(--danger)') + ';font-weight:700">' + a.successProb.probability + '%</span>' : '—'}</td>
        <td style="${p};font-size:11px;white-space:nowrap">${getRiskDot(a.riskLevel)} ${a.riskLevel}</td>
        <td style="${p}"><span class="badge ${getStatusBadgeClass(a.recommendation)}" style="font-size:10px">${a.recommendation}</span></td>
        <td style="${p};color:var(--text-muted);font-size:10px;white-space:nowrap">${a.applicationDate}</td>
        <td style="${p}">
          <div class="row-actions" style="opacity:1;gap:3px">
            <button class="action-btn" onclick="navigateTo('applicants/${a.id}')" title="Көру"><i class="fas fa-eye"></i></button>
            <button class="action-btn success" onclick="quickAddShortlist('${a.id}')" title="Shortlist"><i class="fas fa-star"></i></button>
            <button class="action-btn" onclick="showScoreQuick('${a.id}')" title="Балл"><i class="fas fa-chart-bar"></i></button>
          </div>
        </td>
      </tr>`).join('');
  }
  renderPagination();
  updateBulkBar();
  updateSelectAll();
}

function toggleSelect(id, checked) {
  checked ? appState.selected.add(id) : appState.selected.delete(id);
  const row = document.querySelector(`[data-id="${id}"]`)?.closest('tr');
  if (row) row.classList.toggle('selected', checked);
  updateBulkBar(); updateSelectAll();
}

function getPageIds() {
  const { filtered, page, perPage } = appState;
  return filtered.slice((page-1)*perPage, page*perPage).map(a => a.id);
}

function updateSelectAll() {
  const cb = document.getElementById('select-all-cb');
  if (!cb) return;
  const ids = getPageIds();
  cb.checked = ids.length > 0 && ids.every(id => appState.selected.has(id));
  cb.indeterminate = !cb.checked && ids.some(id => appState.selected.has(id));
}

function updateBulkBar() {
  const bar = document.getElementById('bulk-bar');
  if (!bar) return;
  const n = appState.selected.size;
  bar.classList.toggle('hidden', n === 0);
  const el = document.getElementById('bulk-count');
  if (el) el.textContent = `${n} жазба таңдалды`;
}

function clearBulkSelection() { appState.selected.clear(); renderApplicantsTable(); }

function bulkAddShortlist() {
  let added = 0;
  appState.selected.forEach(id => { const a = AppState.getApplicant(id); if (a && AppState.addToShortlist(a)) added++; });
  appState.selected.clear();
  renderApplicantsTable();
  showToast(`${added} өтінім shortlist-ке қосылды ✅`, 'success');
}

function bulkExport() {
  const data = Array.from(appState.selected).map(id => AppState.getApplicant(id)).filter(Boolean);
  exportToExcel(data, 'AgriScore_Selected');
  showToast('Excel файлы жүктелді', 'success');
}

function resetApplicantFilters() {
  ['app-search','filter-region','filter-district','filter-type','filter-score','filter-status'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  filterApplicants();
  showToast('Сүзгілер тазартылды', 'info', 2000);
}

function renderPagination() {
  const { filtered, page, perPage } = appState;
  const total = Math.ceil(filtered.length / perPage);
  const start = (page-1)*perPage+1, end = Math.min(page*perPage, filtered.length);
  const pag = document.getElementById('pagination');
  if (!pag) return;
  pag.querySelector('.pagination-info').textContent = `${formatNumber(start)}-${formatNumber(end)} / ${formatNumber(filtered.length)}`;
  const ctrl = pag.querySelector('.pagination-controls');
  let html = `<button class="page-btn" onclick="goPage(${page-1})" ${page<=1?'disabled':''}>‹</button>`;
  getPagRange(page, total).forEach(p => {
    html += p==='...' ? `<span class="page-btn" style="cursor:default">…</span>` : `<button class="page-btn ${p===page?'active':''}" onclick="goPage(${p})">${p}</button>`;
  });
  html += `<button class="page-btn" onclick="goPage(${page+1})" ${page>=total?'disabled':''}>›</button>`;
  ctrl.innerHTML = html;
}

function getPagRange(cur, total) {
  if (total <= 7) return Array.from({length:total},(_,i)=>i+1);
  const r = [1]; if (cur>3) r.push('...');
  for (let i=Math.max(2,cur-1); i<=Math.min(total-1,cur+1); i++) r.push(i);
  if (cur<total-2) r.push('...'); r.push(total);
  return r;
}

function goPage(p) {
  const total = Math.ceil(appState.filtered.length / appState.perPage);
  if (p < 1 || p > total) return;
  appState.page = p;
  renderApplicantsTable();
}

function setApplicantPerPage(n) { appState.perPage = parseInt(n); appState.page = 1; renderApplicantsTable(); }

function quickAddShortlist(id) {
  const a = AppState.getApplicant(id);
  if (!a) return;
  if (AppState.addToShortlist(a)) showToast(`✅ ${a.name} shortlist-ке қосылды`, 'success');
  else showToast('⚠️ Бұл өтінім shortlist-те бар', 'warning', 2000);
}

function showScoreQuick(id) {
  const a = AppState.getApplicant(id);
  if (!a) return;
  showModal(`📊 ${a.name}`,
    `<div style="text-align:center;padding:16px">
      ${buildGaugeSVG(a.totalScore, 160)}
      <div style="font-size:36px;font-weight:800;color:${getScoreColor(a.totalScore)};margin-top:-8px">${a.totalScore}</div>
      <div style="font-size:12px;color:var(--text-muted)">Рейтинг: #${a.rank} / ${AppState.applicants.length}</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:12px">
      ${[{n:'Субсидия',s:a.factors?.f1||0,mx:25},{n:'Өнімділік',s:a.factors?.f2||0,mx:30},{n:'Профиль',s:a.factors?.f3||0,mx:20},{n:'Әлеум.',s:a.factors?.f4||0,mx:15},{n:'Тәуекел',s:a.factors?.f5||0,mx:10}]
      .map(f=>`<div style="text-align:center;background:var(--bg);padding:8px;border-radius:8px">
        <div style="font-size:16px;font-weight:700;color:var(--primary)">${f.s}</div>
        <div style="font-size:9px;color:var(--text-muted);margin-top:2px">${f.n}</div>
        <div style="font-size:9px;color:var(--text-muted)">/${f.mx}</div>
      </div>`).join('')}
    </div>`,
    `<button class="btn btn-ghost" onclick="closeModal()">Жабу</button>
     <button class="btn btn-primary" onclick="closeModal();navigateTo('applicants/${id}')">Толық көру</button>`,
    'modal-sm'
  );
  setTimeout(() => animateGauge(a.totalScore), 200);
}

// ─── APPLICANT DETAIL ─────────────────────────────────────────────────────────
function initApplicantDetail(id) {
  const a = AppState.getApplicant(id);
  if (!a) { navigateTo('applicants'); return; }

  // Breadcrumb & Hero
  document.getElementById('breadcrumb-name').textContent = a.name;
  document.getElementById('detail-avatar').textContent = a.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  document.getElementById('detail-name').textContent = a.name;
  document.getElementById('detail-iin-label').textContent = `ЖСН: ${a.iin} | БИН: ${a.bin||'—'}`;
  document.getElementById('detail-location').innerHTML = `<i class="fas fa-map-marker-alt" style="color:var(--primary)"></i> ${a.region}, ${a.district}`;
  document.getElementById('detail-badges').innerHTML = `<span class="badge badge-info">${a.productionType}</span> <span class="badge ${getStatusBadgeClass(a.recommendation)}">${a.recommendation}</span>`;
  document.getElementById('detail-date').textContent = `📅 ${a.applicationDate}`;
  document.getElementById('detail-rank').textContent = `Рейтинг: #${a.rank} / ${AppState.applicants.length}`;

  // Quality + Anomaly badges in hero
  const dq = calcDataQuality(a);
  const an = detectAnomalies(a);
  const qaBadges = document.getElementById('detail-qa-badges');
  if (qaBadges) {
    const qColor = dq.completeness>=90?'var(--success)':dq.completeness>=70?'var(--warning)':'var(--danger)';
    const anColor = an.anomalyRisk==='Жоқ'?'var(--success)':an.anomalyRisk==='Төмен'?'var(--success)':an.anomalyRisk==='Орташа'?'var(--warning)':'var(--danger)';
    qaBadges.innerHTML = `
      <span class="quality-pill" style="border-color:${qColor};color:${qColor}" title="Деректер толықтығы">
        <i class="fas fa-database"></i> ${dq.completeness}% толық
      </span>
      <span class="quality-pill" style="border-color:${anColor};color:${anColor}" title="Аномалия тәуекелі">
        <i class="fas fa-shield-alt"></i> ${an.anomalyRisk==='Жоқ'?'Норма':an.anomalyRisk+' тәуекел'}
      </span>`;
  }

  // Gauge
  const gc = document.getElementById('detail-gauge-container');
  if (gc) {
    gc.innerHTML = `${buildGaugeSVG(a.totalScore, 180)}
      <div style="text-align:center;margin-top:-8px">
        <div id="detail-score-num" style="font-size:40px;font-weight:800;color:${getScoreColor(a.totalScore)}">0</div>
        <div style="font-size:12px;color:var(--text-muted)">Балл</div>
      </div>`;
    animateCounter(document.getElementById('detail-score-num'), a.totalScore);
    setTimeout(() => animateGauge(a.totalScore), 200);
  }

  // Shortlist button
  const slBtn = document.getElementById('detail-shortlist-btn');
  if (slBtn) {
    if (AppState.isInShortlist(id)) {
      slBtn.innerHTML = `<i class="fas fa-check"></i> Shortlist-те`;
      slBtn.className = 'btn btn-outline btn-sm'; slBtn.disabled = true;
    } else {
      slBtn.innerHTML = `<i class="fas fa-plus"></i> Shortlist-ке қосу`;
      slBtn.className = 'btn btn-primary btn-sm'; slBtn.disabled = false;
      slBtn.onclick = () => { AppState.addToShortlist(a); showToast('✅ Shortlist-ке қосылды','success'); initApplicantDetail(id); };
    }
  }

  // AI button
  const aiBtn = document.getElementById('detail-ai-btn');
  if (aiBtn) aiBtn.onclick = () => {
    const prompt = `Қазақстан ауылшаруашылығы субсидия жүйесі. Өтінімдер: ${a.name}, облыс: ${a.region}, өндіріс: ${a.productionType}, жер: ${a.landArea} га, балл: ${a.totalScore}/100. 5 фактор бойынша баллды қазақша түсіндіріңіз.`;
    showAIModal('🤖 AI Скор түсіндірмесі', prompt, 'score');
  };

  // Tabs
  document.querySelectorAll('#page-applicant-detail .tab-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#page-applicant-detail .tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('#page-applicant-detail .tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const tgt = document.getElementById(btn.dataset.tab);
      if (tgt) { tgt.classList.add('active'); renderDetailTab(btn.dataset.tab, a); }
    };
  });

  renderDetailTab('tab-scoring', a);
}

function renderDetailTab(tab, a) {
  if (tab === 'tab-scoring')    renderScoringTab(a);
  else if (tab === 'tab-risk')       renderRiskTab(a);
  else if (tab === 'tab-whatif')     renderWhatIfTab(a);
  else if (tab === 'tab-data')       renderDataTab(a);
  else if (tab === 'tab-history')    renderHistoryTab(a);
  else if (tab === 'tab-docs')       renderDocsTab(a);
  else if (tab === 'tab-comments')   renderCommentsTab(a);
  else if (tab === 'tab-commission') renderCommissionTab(a);
}

function renderScoringTab(a) {
  const inner = document.getElementById('scoring-tab-inner');
  if (!inner) return;

  const factors = [
    { name:'Субсидия тарихы', weight:'25%', score:a.factors?.f1||0, max:25, items:[
      {ok:a.breakdown?.hasPreviousSubsidy,text:'Алдыңғы субсидия бар',pts:10},
      {ok:a.breakdown?.usedFullSubsidy,text:'100% игерілген',pts:8},
      {ok:a.breakdown?.reportsOnTime,text:'Есептер уақытылы',pts:7},
      {ok:a.breakdown?.noViolations,text:'Бұзушылықтар жоқ',pts:5},
    ]},
    { name:'Өнімділік', weight:'30%', score:a.factors?.f2||0, max:30, items:[
      {ok:a.breakdown?.aboveAvgYield,text:'Орташадан жоғары өнімділік',pts:12},
      {ok:a.breakdown?.positiveTrend,text:'3 жылдық өсу тренді',pts:10},
      {ok:a.breakdown?.costEfficient,text:'Шығын тиімділігі',pts:8},
    ]},
    { name:'Шаруашылық профилі', weight:'20%', score:a.factors?.f3||0, max:20, items:[
      {ok:a.breakdown?.landAreaOk,text:`Жер алаңы оңтайлы (${a.landArea} га)`,pts:8},
      {ok:a.breakdown?.equipmentOk,text:`Техника саны >5 (${a.equipmentCount})`,pts:7},
      {ok:a.breakdown?.hasIrrigation,text:'Суландыру жүйесі',pts:5},
    ]},
    { name:'Әлеуметтік-экономикалық', weight:'15%', score:a.factors?.f4||0, max:15, items:[
      {ok:a.breakdown?.manyEmployees,text:`Қызметкерлер >10 (${a.employees} адам)`,pts:6},
      {ok:a.breakdown?.isRural,text:'Ауылдық аймақ',pts:5},
      {ok:a.breakdown?.isMinorityRegion,text:'Аз тараған аймақ',pts:4},
    ]},
    { name:'Тәуекел бағасы', weight:'10%', score:a.factors?.f5||0, max:10, items:[
      {ok:a.breakdown?.cleanCreditHistory,text:'Таза несие тарихы',pts:4},
      {ok:a.breakdown?.noTaxDebt,text:'Салық берешегі жоқ',pts:4},
      {ok:a.breakdown?.noLegalDisputes,text:'Сот дауы жоқ',pts:2},
    ]},
  ];

  const dq = calcDataQuality(a);
  const an = detectAnomalies(a);

  // Top positive/negative factors
  const allItems = [
    {ok:a.breakdown?.hasPreviousSubsidy, name:'Алдыңғы субсидия бар', pts:10, factor:'Субсидия тарихы'},
    {ok:a.breakdown?.usedFullSubsidy,    name:'100% игерілген',        pts:8,  factor:'Субсидия тарихы'},
    {ok:a.breakdown?.reportsOnTime,      name:'Есептер уақытылы',      pts:7,  factor:'Субсидия тарихы'},
    {ok:a.breakdown?.noViolations,       name:'Бұзушылықтар жоқ',      pts:5,  factor:'Субсидия тарихы'},
    {ok:a.breakdown?.aboveAvgYield,      name:'Өнімділік орташадан жоғары', pts:12, factor:'Өнімділік'},
    {ok:a.breakdown?.positiveTrend,      name:'3 жылдық өсу тренді',   pts:10, factor:'Өнімділік'},
    {ok:a.breakdown?.costEfficient,      name:'Шығын тиімділігі',       pts:8,  factor:'Өнімділік'},
    {ok:a.breakdown?.landAreaOk,         name:'Жер алаңы оңтайлы',     pts:8,  factor:'Профиль'},
    {ok:a.breakdown?.equipmentOk,        name:'Техника >5 бірлік',      pts:7,  factor:'Профиль'},
    {ok:a.breakdown?.hasIrrigation,      name:'Суландыру бар',          pts:5,  factor:'Профиль'},
    {ok:a.breakdown?.manyEmployees,      name:'Қызметкерлер >10',       pts:6,  factor:'Әлеуметтік'},
    {ok:a.breakdown?.isRural,            name:'Ауылдық аймақ',          pts:5,  factor:'Әлеуметтік'},
    {ok:a.breakdown?.cleanCreditHistory, name:'Таза несие тарихы',      pts:4,  factor:'Тәуекел'},
    {ok:a.breakdown?.noTaxDebt,          name:'Салық берешегі жоқ',     pts:4,  factor:'Тәуекел'},
    {ok:a.breakdown?.noLegalDisputes,    name:'Сот дауы жоқ',           pts:2,  factor:'Тәуекел'},
  ];
  const positives = allItems.filter(i => i.ok).sort((a,b) => b.pts - a.pts).slice(0, 4);
  const negatives = allItems.filter(i => !i.ok).sort((a,b) => b.pts - a.pts).slice(0, 4);

  const isRec = a.totalScore >= 65, isRev = a.totalScore >= 50 && a.totalScore < 65;
  const recCls = isRec?'rec-green':isRev?'rec-yellow':'rec-red';
  const recIcon = isRec?'✅':isRev?'⚠️':'❌';
  const recTitle = isRec?'ҰСЫНЫЛАДЫ':isRev?'ТЕКСЕРУ ҚАЖЕТ':'ҰСЫНЫЛМАЙДЫ';
  const recText = isRec
    ? `${a.name} ${a.totalScore} балл жинады. Барлық факторлар жеткілікті нәтиже көрсетті.`
    : isRev ? `${a.name} орташа нәтиже (${a.totalScore} балл). Қосымша тексеру қажет.`
    : `${a.name} жеткіліксіз балл (${a.totalScore}). Субсидия беруге ұсынылмайды.`;

  inner.innerHTML = `
    <div class="alert alert-success mb-4" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div>💡 Балл ${factors.length} фактор бойынша есептелді — <b>${a.totalScore}/100</b>
        &nbsp;·&nbsp; Деректер: <b style="color:${dq.completeness>=80?'var(--success)':'var(--warning)'}">${dq.completeness}%</b>
        &nbsp;·&nbsp; Аномалия: <b style="color:${an.anomalyRisk==='Жоқ'||an.anomalyRisk==='Төмен'?'var(--success)':an.anomalyRisk==='Орташа'?'var(--warning)':'var(--danger)'}">${an.anomalyRisk==='Жоқ'?'Норма':an.anomalyRisk}</b>
      </div>
      <button id="ai-score-btn" class="btn btn-sm" style="background:#7B1FA2;color:#fff;white-space:nowrap" onclick="requestAIScoring('${a.id}')">
        <i class="fas fa-robot"></i> AI Бағалау
      </button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
      <div class="card" style="padding:14px;border-left:3px solid var(--success)">
        <div style="font-size:11px;font-weight:700;color:var(--success);margin-bottom:8px;text-transform:uppercase">✅ Күшті факторлар</div>
        ${positives.length ? positives.map(i=>`<div style="font-size:12px;display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--border)"><span>${i.name}</span><b style="color:var(--success)">+${i.pts}</b></div>`).join('') : '<div style="font-size:12px;color:var(--text-muted)">Жоқ</div>'}
      </div>
      <div class="card" style="padding:14px;border-left:3px solid var(--danger)">
        <div style="font-size:11px;font-weight:700;color:var(--danger);margin-bottom:8px;text-transform:uppercase">❌ Жетіспейтін факторлар</div>
        ${negatives.length ? negatives.map(i=>`<div style="font-size:12px;display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--border)"><span>${i.name}</span><b style="color:var(--danger)">-${i.pts}</b></div>`).join('') : '<div style="font-size:12px;color:var(--text-muted)">Жоқ</div>'}
      </div>
    </div>
    ${(function(){
      const sp = a.successProb || calcSuccessProbability(a);
      const clr = a.clusterColor || '#1565C0';
      const probColor = sp.probability>=70?'var(--success)':sp.probability>=50?'var(--warning)':'var(--danger)';
      const probW = sp.probability;
      const riskW = sp.riskProb;
      return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
        <div class="card" style="padding:16px;border-top:3px solid ${clr}">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px">🤖 ML Кластер</div>
          <div style="font-size:18px;font-weight:800;color:${clr};margin-bottom:4px">${a.clusterIcon||'📊'} ${a.clusterLabel||'Есептелуде'}</div>
          <div style="font-size:11px;color:var(--text-secondary);line-height:1.5">${getClusterExplanation(a)}</div>
        </div>
        <div class="card" style="padding:16px;border-top:3px solid ${probColor}">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px">📈 Сәтті игеру ықтималдығы</div>
          <div style="font-size:18px;font-weight:800;color:${probColor};margin-bottom:8px">${probW}%</div>
          <div style="display:flex;gap:4px;margin-bottom:6px">
            <div style="height:8px;border-radius:4px 0 0 4px;background:${probColor};width:${probW}%;transition:width 1s ease"></div>
            <div style="height:8px;border-radius:0 4px 4px 0;background:var(--danger);width:${riskW}%;opacity:0.3;transition:width 1s ease"></div>
          </div>
          <div style="font-size:11px;color:var(--text-muted)">Сенімділік: <b>${sp.confidence}</b> · Proxy модель</div>
        </div>
      </div>`;
    })()}
    <div class="factors-grid" id="factors-grid-detail">
      ${factors.map((f,fi) => `
        <div class="factor-card">
          <div class="factor-header">
            <span class="factor-name">${f.name}</span>
            <span class="badge badge-info" style="font-size:10px">${f.weight}</span>
          </div>
          <div class="factor-score-big">${f.score}<span style="font-size:14px;color:var(--text-muted)">/${f.max}</span></div>
          <div class="progress-wrap mb-2">
            <div class="progress-bar" data-width="${Math.round(f.score/f.max*100)}" style="background:${getScoreColor(Math.round(f.score/f.max*100))};transition:width 1s ease"></div>
          </div>
          <div class="factor-items">
            ${f.items.map(item=>`<div class="factor-item"><span>${item.ok?'✅':'❌'}</span><span style="flex:1;font-size:11px">${item.text}</span><span class="pts">+${item.pts}</span></div>`).join('')}
          </div>
          <button class="btn btn-ghost btn-sm mt-2" style="width:100%;font-size:11px" onclick="explainFactor(${fi},'${a.id}')">🤖 Толығырақ</button>
        </div>`).join('')}
    </div>
    <div id="ai-scoring-result"></div>
    <div class="card mt-4 mb-4">
      <div class="card-header"><span class="card-title">Факторлар диаграммасы</span></div>
      <div class="chart-wrapper"><canvas id="radar-chart"></canvas></div>
    </div>
    <div class="recommendation-box ${recCls}">
      <div class="rec-title">${recIcon} ${recTitle}</div>
      <div class="rec-text">${recText}</div>
      <div class="rec-actions">
        <button class="btn btn-primary btn-ripple" onclick="quickAddShortlist('${a.id}')"><i class="fas fa-star"></i> Shortlist</button>
        <button class="btn btn-accent btn-ripple" onclick="showToast('Тексеруге жіберілді','info')"><i class="fas fa-search"></i> Тексеру</button>
        <button class="btn btn-outline-danger btn-ripple" onclick="showToast('Бас тартылды','warning')"><i class="fas fa-times"></i> Бас тарту</button>
      </div>
    </div>`;

  setTimeout(() => {
    animateAllProgressBars();
    initRadarChart(a);
  }, 100);
}

function explainFactor(idx, id) {
  const a = AppState.getApplicant(id);
  const names = ['Субсидия тарихы','Өнімділік','Шаруашылық профилі','Әлеуметтік-экономикалық','Тәуекел бағасы'];
  const scores = [a?.factors?.f1,a?.factors?.f2,a?.factors?.f3,a?.factors?.f4,a?.factors?.f5];
  const prompt = `${a?.name} өтінімі бойынша "${names[idx]}" факторының ${scores[idx]} баллын қазақша 3-4 сөйлемде түсіндіріңіз.`;
  showAIModal(`🤖 ${names[idx]}`, prompt, 'score');
}

async function requestAIScoring(id) {
  const a = AppState.getApplicant(id);
  if (!a) return;
  const btn = document.getElementById('ai-score-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AI бағалауда...'; }

  const prompt = `Сен ауылшаруашылық субсидия скоринг жүйесісің. Мына өтінімді талдап, əр фактор бойынша балл қой.

Шаруашылық: ${a.name}
Аймақ: ${a.region}
Жер алаңы: ${a.landArea} га
Дақыл: ${a.cropType}
Өнімділік: ${a.yield} т/га
Техника: ${a.equipmentCount} бірлік
Қызметкерлер: ${a.employees}
Субсидия тарихы: ${a.hasPreviousSubsidy ? 'бар' : 'жоқ'}
Игеру пайызы: ${a.subsidyUtilization}%
Сұралған сома: ${a.requestedAmount} тг
Жылдық кіріс: ${a.annualRevenue} тг
Несие рейтингі: ${a.creditScore}
Суландыру: ${a.hasIrrigation ? 'бар' : 'жоқ'}
Ауылдық аймақ: ${a.isRural ? 'иə' : 'жоқ'}
Салық берешегі: ${a.hasTaxDebt ? 'бар' : 'жоқ'}
Сот дауы: ${a.hasLegalDisputes ? 'бар' : 'жоқ'}

Жауапты ТІКЕЛЕЙ JSON форматында бер (markdown жоқ, тек JSON):
{
  "f1": {"score": 0-25, "reason": "бір сөйлем қазақша"},
  "f2": {"score": 0-30, "reason": "бір сөйлем қазақша"},
  "f3": {"score": 0-20, "reason": "бір сөйлем қазақша"},
  "f4": {"score": 0-15, "reason": "бір сөйлем қазақша"},
  "f5": {"score": 0-10, "reason": "бір сөйлем қазақша"},
  "summary": "жалпы бағалау 2-3 сөйлем қазақша"
}`;

  try {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const d = await res.json();
    let text = '';
    if (d.demo) {
      // demo fallback
      text = `{"f1":{"score":${a.factors?.f1||15},"reason":"Субсидия игеру тарихы орташа деңгейде."},"f2":{"score":${a.factors?.f2||20},"reason":"Өнімділік аймақтық орташаға сəйкес келеді."},"f3":{"score":${a.factors?.f3||14},"reason":"Жер алаңы мен техника саны жеткілікті."},"f4":{"score":${a.factors?.f4||10},"reason":"Ауылдық аймақта əлеуметтік маңызы бар."},"f5":{"score":${a.factors?.f5||7},"reason":"Несие тарихы таза, тәуекел деңгейі төмен."},"summary":"Өтінім орташа деңгейде бағаланды. Комиссия қосымша қарауды ұсынады."}`;
    } else {
      text = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON жауап алынбады');
    const aiScores = JSON.parse(jsonMatch[0]);
    renderAIScoringResult(id, aiScores);
  } catch(e) {
    showToast('AI бағалауда қате: ' + e.message, 'error');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-robot"></i> AI Бағалау'; }
  }
}

function renderAIScoringResult(id, aiScores) {
  const a = AppState.getApplicant(id);
  if (!a) return;
  const factorKeys  = ['f1','f2','f3','f4','f5'];
  const factorNames = ['Субсидия тарихы','Өнімділік','Шаруашылық профилі','Әлеуметтік-экономикалық','Тәуекел бағасы'];
  const factorMax   = [25, 30, 20, 15, 10];
  const factorWeights = ['25%','30%','20%','15%','10%'];

  const grid = document.getElementById('factors-grid-detail');
  if (grid) {
    grid.innerHTML = factorKeys.map((key, i) => {
      const ai  = aiScores[key] || {};
      const det = a.factors?.[key] || 0;
      const score = Math.min(Math.max(Math.round(ai.score || 0), 0), factorMax[i]);
      const pct = Math.round(score / factorMax[i] * 100);
      return `
        <div class="factor-card" style="border-top:3px solid #7B1FA2">
          <div class="factor-header">
            <span class="factor-name">${factorNames[i]}</span>
            <span class="badge" style="background:#7B1FA2;color:#fff;font-size:10px">${factorWeights[i]}</span>
          </div>
          <div class="factor-score-big">${score}<span style="font-size:14px;color:var(--text-muted)">/${factorMax[i]}</span></div>
          <div style="font-size:10px;color:var(--text-muted);margin-bottom:6px">Детерминистік: <b>${det}</b></div>
          <div class="progress-wrap mb-2">
            <div class="progress-bar" style="width:${pct}%;background:${getScoreColor(pct)}"></div>
          </div>
          <div style="font-size:11px;color:var(--text-secondary);line-height:1.6;padding:8px;background:var(--bg);border-radius:6px;border:1px solid var(--border)">
            🤖 ${ai.reason || ''}
          </div>
        </div>`;
    }).join('');
  }

  const total = factorKeys.reduce((s, k) => s + Math.min(Math.round(aiScores[k]?.score || 0), factorMax[factorKeys.indexOf(k)]), 0);
  const aiResult = document.getElementById('ai-scoring-result');
  if (aiResult) {
    aiResult.innerHTML = `
      <div class="alert" style="background:linear-gradient(135deg,#EDE7F6,#F3E5F5);border-left:4px solid #7B1FA2;margin-top:16px">
        <div style="font-weight:700;color:#7B1FA2;margin-bottom:6px;font-size:14px">🤖 AI жалпы бағасы: ${total}/100</div>
        <div style="font-size:13px;line-height:1.6">${aiScores.summary || ''}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:8px">⚠️ AI бағасы ақпараттық сипатта — финалды шешімді комиссия қабылдайды</div>
      </div>`;
  }

  const btn = document.getElementById('ai-score-btn');
  if (btn) { btn.innerHTML = '✅ AI бағаланды'; btn.style.background = '#7B1FA2'; btn.disabled = false; }
  animateAllProgressBars();
}

function initRadarChart(a) {
  const ctx = document.getElementById('radar-chart');
  if (!ctx) return;
  if (Charts.radar) Charts.radar.destroy();
  const maxes = [25,30,20,15,10];
  const scores = [a.factors?.f1||0,a.factors?.f2||0,a.factors?.f3||0,a.factors?.f4||0,a.factors?.f5||0];
  const norm = scores.map((s,i)=>Math.round(s/maxes[i]*100));
  Charts.radar = new Chart(ctx, {
    type:'radar',
    data:{
      labels:['Субсидия\nтарихы','Өнімділік','Шаруашылық\nпрофилі','Әлеуметтік-\nэконом.','Тәуекел\nбағасы'],
      datasets:[
        {label:'Өтінімдер',data:norm,backgroundColor:'rgba(27,94,32,0.2)',borderColor:'#1B5E20',borderWidth:2,pointBackgroundColor:'#1B5E20',pointRadius:4},
        {label:'Аймақтық орташа',data:[60,55,50,45,65],backgroundColor:'rgba(21,101,192,0.1)',borderColor:'#1565C0',borderWidth:2,borderDash:[5,5],pointRadius:3}
      ]
    },
    options:{responsive:true,maintainAspectRatio:false,
      scales:{r:{min:0,max:100,ticks:{stepSize:25,font:{size:9}},grid:{color:'rgba(0,0,0,0.05)'},pointLabels:{font:{family:'Inter',size:11}}}},
      plugins:{legend:{position:'bottom',labels:{font:{family:'Inter',size:12},usePointStyle:true}}}
    }
  });
}

function renderDataTab(a) {
  const el = document.getElementById('data-tab-content');
  if (!el) return;
  el.innerHTML = `<div class="data-grid">
    <div class="card data-card"><h4><i class="fas fa-id-card"></i> Жалпы мәліметтер</h4>
      ${dr('ЖСН',a.iin)}${dr('БИН',a.bin||'—')}${dr('Нысан түрі',a.entityType)}${dr('Тіркелген',a.registrationDate)}${dr('Субсидия түрі',a.subsidyType)}
    </div>
    <div class="card data-card"><h4><i class="fas fa-map-marker-alt"></i> Орналасу</h4>
      ${dr('Облыс',a.region)}${dr('Аудан',a.district)}${dr('Аймақ',a.isRural?'🌾 Ауылдық':'🏙 Қалалық')}
    </div>
    <div class="card data-card"><h4><i class="fas fa-tractor"></i> Жер қоры</h4>
      ${dr('Жалпы алаң',formatNumber(a.landArea)+' га')}${dr('Меншік',formatNumber(a.landOwned)+' га')}${dr('Жалға алынған',formatNumber(a.landLeased)+' га')}${dr('Суландыру',a.hasIrrigation?'✅ Бар':'❌ Жоқ')}
    </div>
    <div class="card data-card"><h4><i class="fas fa-seedling"></i> Өндіріс</h4>
      ${dr('Өндіріс түрі',a.productionType)}${a.mainCrops?.length?dr('Дақылдар',a.mainCrops.join(', ')):''}${a.livestock?dr('Мал басы',formatNumber(a.livestock)+' бас'):''}${dr('Өнімділік',a.productivity+'%')}
    </div>
    <div class="card data-card"><h4><i class="fas fa-chart-line"></i> Қаржы</h4>
      ${dr('Жылдық айналым',formatMoney(a.annualRevenue))}${dr('Таза пайда',formatMoney(a.netProfit))}${dr('Сұралған субсидия',formatMoney(a.requestedAmount))}
    </div>
    <div class="card data-card"><h4><i class="fas fa-tools"></i> Ресурстар</h4>
      ${dr('Техника саны',a.equipmentCount+' бірлік')}${dr('Қызметкерлер',a.employees+' адам')}
    </div>
  </div>`;
}

function dr(k, v) { return `<div class="data-row"><span class="data-key">${k}</span><span class="data-val">${v}</span></div>`; }

function renderHistoryTab(a) {
  const el = document.getElementById('history-tab-content');
  if (!el) return;
  const hist = a.subsidyHistory || [];
  if (!hist.length) { el.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">Субсидия тарихы жоқ</div></div>`; return; }
  const total = hist.reduce((s,h)=>s+h.amount,0);
  const avgUtil = Math.round(hist.reduce((s,h)=>s+h.utilization,0)/hist.length);
  el.innerHTML = `
    <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap">
      <div class="card" style="flex:1;min-width:140px;text-align:center;padding:16px">
        <div style="font-size:22px;font-weight:800;color:var(--primary)">${formatMoney(total)}</div>
        <div style="font-size:12px;color:var(--text-muted)">Барлығы алды</div>
      </div>
      <div class="card" style="flex:1;min-width:140px;text-align:center;padding:16px">
        <div style="font-size:22px;font-weight:800;color:var(--accent)">${avgUtil}%</div>
        <div style="font-size:12px;color:var(--text-muted)">Орташа игерілу</div>
      </div>
    </div>
    <div class="timeline">
      ${hist.map(h=>`<div class="timeline-item">
        <div class="timeline-dot">${String(h.year).slice(-2)}</div>
        <div class="timeline-card">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <b>${h.type}</b><span class="badge ${h.utilization>=90?'badge-success':'badge-warning'}">${h.status}</span>
          </div>
          <div style="font-size:13px;color:var(--text-muted);display:flex;gap:16px">
            <span>💰 ${formatMoney(h.amount)}</span><span>📈 ${h.utilization}%</span>
          </div>
          <div class="progress-wrap mt-2">
            <div class="progress-bar" style="width:${h.utilization}%;background:${h.utilization>=90?'var(--success)':'var(--warning)'}"></div>
          </div>
        </div>
      </div>`).join('')}
    </div>
    <div class="card mt-4" style="padding:16px">
      <div class="card-header mb-2"><span class="card-title">Жылдар бойынша</span></div>
      <div class="chart-wrapper-sm"><canvas id="hist-bar-chart"></canvas></div>
    </div>`;

  setTimeout(() => {
    const ctx = document.getElementById('hist-bar-chart');
    if (ctx) new Chart(ctx, { type:'bar',
      data:{ labels:hist.map(h=>h.year), datasets:[
        {label:'Сома (млн)',data:hist.map(h=>+(h.amount/1e6).toFixed(1)),backgroundColor:'#1B5E20',borderRadius:4},
        {label:'Игерілу %',data:hist.map(h=>h.utilization),backgroundColor:'#F9A825',borderRadius:4,yAxisID:'y1'}
      ]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{font:{size:11},usePointStyle:true}}},
        scales:{y:{beginAtZero:true,ticks:{font:{size:10}}},y1:{position:'right',min:0,max:100,grid:{drawOnChartArea:false},ticks:{callback:v=>v+'%',font:{size:10}}}}}
    });
  }, 100);
}

function renderDocsTab(a) {
  const el = document.getElementById('docs-tab-content');
  if (!el) return;
  const docs = [
    {name:'Жер учаскесіне құқық',icon:'fa-file-alt',ok:true},{name:'Мемлекеттік тіркеу',icon:'fa-building',ok:true},
    {name:'Банк үзіндісі',icon:'fa-university',ok:true},{name:'Техника тізімі',icon:'fa-tractor',ok:a.equipmentCount>0},
    {name:'Салық берешексіздігі',icon:'fa-receipt',ok:a.breakdown?.noTaxDebt},{name:'Страхование полисі',icon:'fa-shield-alt',ok:false},
    {name:'Өнімділік есебі',icon:'fa-chart-line',ok:a.breakdown?.aboveAvgYield},
  ];
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <span style="font-size:13px;color:var(--text-muted)">${docs.length} құжат</span>
      <button class="btn btn-sm btn-outline"><i class="fas fa-download"></i> Барлығын жүктеу</button>
    </div>
    <div class="docs-grid">
      ${docs.map(d=>`<div class="doc-item">
        <i class="fas ${d.icon} doc-icon"></i>
        <div class="doc-info"><div class="doc-name">${d.name}</div><div class="doc-meta">${formatDate(new Date())}</div></div>
        <span style="font-size:18px">${d.ok?'✅':'❌'}</span>
      </div>`).join('')}
    </div>`;
}

function renderCommentsTab(a) {
  const el = document.getElementById('comments-tab-content');
  if (!el) return;
  const comments = AppState.getComments(a.id);
  el.innerHTML = `
    <div class="comments-list mb-4" id="comments-list">
      ${!comments.length ? `<div class="empty-state" style="padding:24px"><div class="empty-icon">💬</div><div class="empty-title">Комментарийлер жоқ</div></div>` : ''}
      ${comments.map(c=>`<div class="comment-item">
        <div class="comment-avatar">${c.author.charAt(0).toUpperCase()}</div>
        <div class="comment-body">
          <div class="comment-meta"><span class="comment-author">${c.author}</span> · ${c.date} ${c.time}</div>
          <div class="comment-text">${c.text}</div>
        </div>
      </div>`).join('')}
    </div>
    <div class="card" style="padding:16px">
      <textarea id="comment-input" class="form-control" rows="3" placeholder="Комментарий жазыңыз..." style="resize:vertical;margin-bottom:10px"></textarea>
      <div style="display:flex;gap:8px;justify-content:space-between">
        <button class="btn btn-ghost btn-sm" onclick="generateAIComment('${a.id}')">🤖 AI Ұсыным жаз</button>
        <button class="btn btn-primary btn-sm" onclick="submitComment('${a.id}')"><i class="fas fa-paper-plane"></i> Жіберу</button>
      </div>
    </div>`;
}

// ─── RISK / ANOMALY TAB ───────────────────────────────────────────────────────
function renderRiskTab(a) {
  const el = document.getElementById('risk-tab-content');
  if (!el) return;
  const an = detectAnomalies(a);
  const dq = calcDataQuality(a);

  const riskColors = { 'Жоқ':'var(--success)', 'Төмен':'var(--success)', 'Орташа':'var(--warning)', 'Жоғары':'var(--danger)' };
  const riskBg    = { 'Жоқ':'#E8F5E9', 'Төмен':'#E8F5E9', 'Орташа':'#FFF8E1', 'Жоғары':'#FFEBEE' };
  const riskIcon  = { 'Жоқ':'fa-check-circle', 'Төмен':'fa-check-circle', 'Орташа':'fa-exclamation-triangle', 'Жоғары':'fa-times-circle' };
  const rc = riskColors[an.anomalyRisk] || 'var(--text-muted)';

  const flagsHtml = an.flags.length === 0
    ? `<div class="empty-state" style="padding:24px"><div class="empty-icon">✅</div><div class="empty-title">Аномалиялар анықталмады</div><div class="empty-subtitle">Деректер тексерістен өтті</div></div>`
    : an.flags.map(f => `
        <div class="anomaly-item ${f.type}">
          <i class="fas ${f.type==='error'?'fa-times-circle':'fa-exclamation-triangle'} anomaly-icon"></i>
          <div class="anomaly-body">
            <div class="anomaly-code">${f.code.replace(/_/g,' ')}</div>
            <div class="anomaly-text">${f.text}</div>
          </div>
        </div>`).join('');

  const qFieldsHtml = dq.fields.map(f => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px">
      <span style="color:${f.present?'var(--text)':'var(--danger)'}">${f.required?'<b>*</b> ':''}${f.label}</span>
      <span>${f.present ? '<span style="color:var(--success)">✅</span>' : '<span style="color:var(--danger)">❌ Жоқ</span>'}</span>
    </div>`).join('');

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
      <div class="card" style="padding:20px;border-left:4px solid ${rc};text-align:center">
        <i class="fas ${riskIcon[an.anomalyRisk]||'fa-shield-alt'}" style="font-size:32px;color:${rc};margin-bottom:8px"></i>
        <div style="font-size:22px;font-weight:800;color:${rc}">${an.anomalyRisk === 'Жоқ' ? 'Норма' : an.anomalyRisk}</div>
        <div style="font-size:12px;color:var(--text-muted)">Аномалия тәуекел деңгейі</div>
      </div>
      <div class="card" style="padding:20px;text-align:center">
        <div style="font-size:32px;font-weight:800;color:${dq.completeness>=80?'var(--success)':dq.completeness>=60?'var(--warning)':'var(--danger)'}">${dq.completeness}%</div>
        <div style="font-size:12px;color:var(--text-muted)">Деректер толықтығы</div>
        <div style="font-size:11px;margin-top:6px">${dq.filled}/${dq.total} өріс толтырылған</div>
        ${dq.missingRequired.length>0?`<div style="font-size:11px;color:var(--danger);margin-top:4px">❌ ${dq.missingRequired.map(f=>f.label).join(', ')} — міндетті</div>`:''}
      </div>
    </div>

    <div class="card mb-4" style="padding:20px">
      <div class="card-title mb-3"><i class="fas fa-flag" style="color:var(--warning)"></i> Аномалиялар (${an.flags.length})</div>
      ${flagsHtml}
    </div>

    <div class="card" style="padding:20px">
      <div class="card-title mb-3"><i class="fas fa-table" style="color:var(--primary)"></i> Деректер сапасы — өрістер</div>
      <div style="max-height:340px;overflow-y:auto">${qFieldsHtml}</div>
    </div>
  `;
}

// ─── WHAT-IF SIMULATION TAB ───────────────────────────────────────────────────
function renderWhatIfTab(a) {
  const el = document.getElementById('whatif-tab-content');
  if (!el) return;
  const threshold = AppState.shortlistThreshold;

  el.innerHTML = `
    <div class="card mb-4" style="padding:20px">
      <div class="card-title mb-2">🔬 What-if Симуляция</div>
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">Параметрлерді өзгертіп, балл қалай өзгеретінін тексеріңіз</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">

        <div class="form-group">
          <label class="form-label" style="font-size:12px">Алдыңғы субсидия</label>
          <select class="form-control" id="wi-prevSubsidy" style="font-size:12px">
            <option value="1" ${a.hasPreviousSubsidy?'selected':''}>Бар</option>
            <option value="0" ${!a.hasPreviousSubsidy?'selected':''}>Жоқ</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" style="font-size:12px">Субсидия 100% игерілді</label>
          <select class="form-control" id="wi-usedFull" style="font-size:12px">
            <option value="1" ${a.usedFullSubsidy?'selected':''}>Иә</option>
            <option value="0" ${!a.usedFullSubsidy?'selected':''}>Жоқ</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" style="font-size:12px">Өнімділік орташадан жоғары</label>
          <select class="form-control" id="wi-aboveYield" style="font-size:12px">
            <option value="1" ${a.aboveAvgYield?'selected':''}>Иә</option>
            <option value="0" ${!a.aboveAvgYield?'selected':''}>Жоқ</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" style="font-size:12px">Өсу тренді бар</label>
          <select class="form-control" id="wi-trend" style="font-size:12px">
            <option value="1" ${a.positiveTrend?'selected':''}>Иә</option>
            <option value="0" ${!a.positiveTrend?'selected':''}>Жоқ</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" style="font-size:12px">Суландыру жүйесі</label>
          <select class="form-control" id="wi-irrigation" style="font-size:12px">
            <option value="1" ${a.hasIrrigation?'selected':''}>Бар</option>
            <option value="0" ${!a.hasIrrigation?'selected':''}>Жоқ</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" style="font-size:12px">Таза несие тарихы</label>
          <select class="form-control" id="wi-credit" style="font-size:12px">
            <option value="1" ${a.cleanCreditHistory?'selected':''}>Иә</option>
            <option value="0" ${!a.cleanCreditHistory?'selected':''}>Жоқ</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" style="font-size:12px">Салық берешегі жоқ</label>
          <select class="form-control" id="wi-tax" style="font-size:12px">
            <option value="1" ${a.noTaxDebt?'selected':''}>Иә</option>
            <option value="0" ${!a.noTaxDebt?'selected':''}>Жоқ</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" style="font-size:12px">Жер алаңы (га)</label>
          <input type="number" class="form-control" id="wi-land" value="${a.landArea||0}" style="font-size:12px">
        </div>
      </div>
      <button class="btn btn-primary mt-3" onclick="runWhatIf('${a.id}')">
        <i class="fas fa-play"></i> Есептеу
      </button>
    </div>
    <div id="whatif-result"></div>`;
}

function runWhatIf(id) {
  const a = AppState.getApplicant(id);
  if (!a) return;
  const changes = {
    hasPreviousSubsidy: document.getElementById('wi-prevSubsidy')?.value === '1',
    usedFullSubsidy:    document.getElementById('wi-usedFull')?.value === '1',
    aboveAvgYield:      document.getElementById('wi-aboveYield')?.value === '1',
    positiveTrend:      document.getElementById('wi-trend')?.value === '1',
    hasIrrigation:      document.getElementById('wi-irrigation')?.value === '1',
    cleanCreditHistory: document.getElementById('wi-credit')?.value === '1',
    noTaxDebt:          document.getElementById('wi-tax')?.value === '1',
    landArea:           parseFloat(document.getElementById('wi-land')?.value||a.landArea),
  };
  const r = calcWhatIf(a, changes);
  const diffColor = r.diff > 0 ? 'var(--success)' : r.diff < 0 ? 'var(--danger)' : 'var(--text-muted)';
  const diffSign  = r.diff > 0 ? '+' : '';
  const slMsg = r.shortlistChange === 'enters'
    ? `<span style="color:var(--success);font-weight:700">✅ Shortlist-ке кіреді!</span>`
    : r.shortlistChange === 'exits'
    ? `<span style="color:var(--danger);font-weight:700">❌ Shortlist-тен шығады</span>`
    : r.wouldEnterShortlist
    ? `<span style="color:var(--success)">✅ Shortlist-те қалады</span>`
    : `<span style="color:var(--text-muted)">Shortlist-ке кірмейді</span>`;

  const el = document.getElementById('whatif-result');
  if (!el) return;
  el.innerHTML = `
    <div class="card" style="padding:20px;border-top:3px solid var(--primary)">
      <div class="card-title mb-3">📊 Симуляция нәтижесі</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;text-align:center;margin-bottom:20px">
        <div style="padding:16px;background:var(--bg);border-radius:10px">
          <div style="font-size:28px;font-weight:800;color:${getScoreColor(r.originalScore)}">${r.originalScore}</div>
          <div style="font-size:11px;color:var(--text-muted)">Қазіргі балл</div>
        </div>
        <div style="padding:16px;background:var(--bg);border-radius:10px;display:flex;align-items:center;justify-content:center">
          <div style="font-size:28px;color:${diffColor};font-weight:800">${diffSign}${r.diff}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-left:6px">өзгеріс</div>
        </div>
        <div style="padding:16px;background:var(--bg);border-radius:10px">
          <div style="font-size:28px;font-weight:800;color:${getScoreColor(r.newScore)}">${r.newScore}</div>
          <div style="font-size:11px;color:var(--text-muted)">Жаңа балл</div>
        </div>
      </div>
      <div style="text-align:center;font-size:14px;margin-bottom:12px">${slMsg}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;font-size:11px">
        ${[['Субсидия',r.factors?.f1||0,25],['Өнімділік',r.factors?.f2||0,30],['Профиль',r.factors?.f3||0,20],['Әлеум.',r.factors?.f4||0,15],['Тәуекел',r.factors?.f5||0,10]]
          .map(([n,s,mx]) => `<div style="text-align:center;background:var(--bg);padding:8px 12px;border-radius:8px;min-width:80px">
            <div style="font-weight:700;color:var(--primary)">${s}/${mx}</div>
            <div style="color:var(--text-muted)">${n}</div>
          </div>`).join('')}
      </div>
    </div>`;
}

// ─── COMMISSION REVIEW TAB ────────────────────────────────────────────────────
function renderCommissionTab(a) {
  const el = document.getElementById('commission-tab-content');
  if (!el) return;
  const rev = AppState.getCommissionReview(a.id);
  const statusMap = {
    pending:  { label:'Күтілуде',   color:'var(--text-muted)',  bg:'var(--bg)',    icon:'fa-clock' },
    approved: { label:'Бекітілді',  color:'var(--success)',     bg:'#E8F5E9',      icon:'fa-check-circle' },
    hold:     { label:'Ұсталды',    color:'var(--warning)',     bg:'#FFF8E1',      icon:'fa-pause-circle' },
    rejected: { label:'Қабылданбады', color:'var(--danger)',    bg:'#FFEBEE',      icon:'fa-times-circle' },
    override: { label:'Қайта бағаланды', color:'var(--info)',   bg:'#E3F2FD',      icon:'fa-edit' },
  };
  const st = statusMap[rev.status] || statusMap.pending;

  el.innerHTML = `
    <div class="card mb-4" style="padding:20px;border-left:4px solid ${st.color};background:${st.bg}">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
        <i class="fas ${st.icon}" style="font-size:24px;color:${st.color}"></i>
        <div>
          <div style="font-size:16px;font-weight:700;color:${st.color}">${st.label}</div>
          ${rev.reviewedBy ? `<div style="font-size:11px;color:var(--text-muted)">${rev.reviewedBy} · ${rev.reviewedAt} ${rev.time||''}</div>` : ''}
        </div>
      </div>
      ${rev.comment ? `<div style="font-size:13px;margin-top:8px;padding:10px;background:rgba(255,255,255,0.6);border-radius:8px">"${rev.comment}"</div>` : ''}
      ${rev.overrideReason ? `<div style="font-size:12px;color:var(--info);margin-top:6px"><b>Негіздеме:</b> ${rev.overrideReason}</div>` : ''}
    </div>

    <div class="card mb-4" style="padding:20px">
      <div class="card-title mb-3">⚖️ Комиссия шешімі</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">
        <button class="btn btn-sm ${rev.status==='approved'?'btn-primary':'btn-outline'}" onclick="setCommission('${a.id}','approved')">
          <i class="fas fa-check"></i> Бекіту
        </button>
        <button class="btn btn-sm ${rev.status==='hold'?'btn-accent':'btn-outline'}" onclick="setCommission('${a.id}','hold')">
          <i class="fas fa-pause"></i> Ұстап қалу
        </button>
        <button class="btn btn-sm ${rev.status==='rejected'?'btn-danger':'btn-outline'}" onclick="setCommission('${a.id}','rejected')">
          <i class="fas fa-times"></i> Қабылдамау
        </button>
        <button class="btn btn-sm ${rev.status==='override'?'btn-info':'btn-outline'}" onclick="setCommission('${a.id}','override')">
          <i class="fas fa-edit"></i> Жоғарылату
        </button>
      </div>

      <div class="form-group">
        <label class="form-label" style="font-size:12px">Комментарий</label>
        <textarea id="commission-comment" class="form-control" rows="3" placeholder="Шешімнің себебін жазыңыз..." style="font-size:13px;resize:vertical">${rev.comment||''}</textarea>
      </div>
      <div class="form-group" id="override-reason-group" style="${rev.status==='override'?'':'display:none'}">
        <label class="form-label" style="font-size:12px">Жоғарылату негіздемесі</label>
        <input type="text" id="commission-override-reason" class="form-control" placeholder="Алгоритмнен ауытқу себебі..." value="${rev.overrideReason||''}" style="font-size:13px">
      </div>
      <button class="btn btn-primary btn-sm" onclick="saveCommission('${a.id}')">
        <i class="fas fa-save"></i> Сақтау
      </button>
    </div>

    <div class="card" style="padding:20px">
      <div class="card-title mb-2">📊 AI Ұсыным</div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px">Алгоритм ұсынымы: <b style="color:${getScoreColor(a.totalScore)}">${a.recommendation}</b> (${a.totalScore} балл)</div>
      <button class="btn btn-outline btn-sm" onclick="showAIModal('🤖 Комиссия ұсынымы','${a.name} (${a.totalScore} балл, ${a.region}) өтінімі бойынша комиссия шешімін қазақша 3 сөйлемде негіздеңіз.','recommend')">
        🤖 AI Ұсыным алу
      </button>
    </div>`;
}

function setCommission(id, status) {
  const overrideGroup = document.getElementById('override-reason-group');
  if (overrideGroup) overrideGroup.style.display = status === 'override' ? '' : 'none';
  // Highlight active button
  document.querySelectorAll('#commission-tab-content .btn').forEach(b => {
    if (b.onclick?.toString().includes(status)) b.classList.add('btn-primary');
  });
  saveCommission(id, status);
}

function saveCommission(id, statusOverride) {
  const comment = document.getElementById('commission-comment')?.value || '';
  const overrideReason = document.getElementById('commission-override-reason')?.value || '';
  const current = AppState.getCommissionReview(id);
  const status = statusOverride || current.status || 'pending';
  AppState.updateCommissionReview(id, status, comment, overrideReason);
  const a = AppState.getApplicant(id);
  if (a) renderCommissionTab(a);
  showToast(`✅ Комиссия шешімі сақталды`, 'success', 2000);
}

function submitComment(id) {
  const input = document.getElementById('comment-input');
  if (!input?.value.trim()) { showToast('Комментарий бос', 'warning', 2000); return; }
  const user = JSON.parse(localStorage.getItem('agri_user')||'{}');
  AppState.addComment(id, input.value.trim(), user.login || 'Пайдаланушы');
  const a = AppState.getApplicant(id);
  if (a) renderCommentsTab(a);
  showToast('✅ Комментарий қосылды', 'success', 2000);
}

function generateAIComment(id) {
  const a = AppState.getApplicant(id);
  if (!a) return;
  const input = document.getElementById('comment-input');
  if (input) { input.value = '⏳ AI жазуда...'; input.disabled = true; }
  callGemini(`${a.name} субсидия өтінімі бойынша ресми ұсыным мәтінін қазақша жазыңыз. Балл: ${a.totalScore}/100. 2-3 сөйлем.`, 'recommend')
    .then(text => { if (input) { input.value = text; input.disabled = false; input.focus(); } })
    .catch(() => { if (input) { input.value = ''; input.disabled = false; } showToast('Қате орын алды', 'error'); });
}

// ─── GAUGE SVG ────────────────────────────────────────────────────────────────
function buildGaugeSVG(score, size = 180) {
  const r = 70, cx = 90, cy = 90;
  const circ = 2 * Math.PI * r, arcLen = circ * 0.75;
  const color = score >= 70 ? '#1B5E20' : score >= 50 ? '#F9A825' : '#C62828';
  return `<svg width="${size}" height="${size}" viewBox="0 0 180 180" style="transform:rotate(-135deg)">
    <circle fill="none" stroke="var(--bg)" stroke-width="10" cx="${cx}" cy="${cy}" r="${r}"
      stroke-dasharray="${arcLen} ${circ}" stroke-linecap="round"/>
    <circle fill="none" stroke="${color}" stroke-width="10" cx="${cx}" cy="${cy}" r="${r}"
      stroke-linecap="round" id="gauge-fill"
      stroke-dasharray="${arcLen} ${circ}" stroke-dashoffset="${arcLen}"/>
  </svg>`;
}

function animateGauge(score) {
  const fill = document.getElementById('gauge-fill');
  if (!fill) return;
  const r = 70, circ = 2*Math.PI*r, arcLen = circ*0.75;
  const filled = arcLen * Math.max(0, Math.min(score,100)) / 100;
  fill.style.transition = 'stroke-dashoffset 1.5s cubic-bezier(.4,0,.2,1)';
  fill.style.strokeDashoffset = arcLen - filled;
}

// ─── SCORING PAGE ─────────────────────────────────────────────────────────────
function initScoring() {
  renderScoreHistogram();
  renderSegmentCards();
  renderScoringTable(AppState.applicants);
}

function runScoring() {
  const btn = document.getElementById('run-scoring-btn');
  const section = document.getElementById('scoring-progress-section');
  const bar = document.getElementById('scoring-progress-bar');
  const stepsEl = document.getElementById('scoring-steps-text');
  if (btn) btn.disabled = true;
  if (section) section.classList.remove('hidden');

  let pct = 0;
  const steps = ['Деректер оқылуда...', 'Факторлар есептелуде...', 'Нәтижелер дайындалуда...', '✅ Аяқталды!'];
  const iv = setInterval(() => {
    pct += rnd(8, 18); if (pct > 100) pct = 100;
    if (bar) bar.style.width = pct + '%';
    if (stepsEl) stepsEl.textContent = pct < 35 ? steps[0] : pct < 70 ? steps[1] : pct < 95 ? steps[2] : steps[3];
    if (pct === 100) {
      clearInterval(iv);
      AppState.recalculateScores();
      renderScoreHistogram(); renderSegmentCards(); renderScoringTable(AppState.applicants);
      if (btn) btn.disabled = false;
      setTimeout(() => { if (section) section.classList.add('hidden'); if (bar) bar.style.width='0%'; }, 1200);
      showToast(`✅ ${formatNumber(AppState.applicants.length)} өтінімдер бағаланды`, 'success');
    }
  }, 120);
}

function renderScoreHistogram() {
  const ctx = document.getElementById('score-histogram');
  if (!ctx) return;
  if (Charts.histogram) Charts.histogram.destroy();
  const bins = Array(10).fill(0);
  AppState.applicants.forEach(a => { bins[Math.min(9, Math.floor(a.totalScore/10))]++; });
  const labels = ['0-9','10-19','20-29','30-39','40-49','50-59','60-69','70-79','80-89','90-100'];
  const colors = labels.map((_,i) => i<5?'#EF5350':i<7?'#FF9800':'#4CAF50');
  Charts.histogram = new Chart(ctx, {
    type:'bar', data:{ labels, datasets:[{label:'Өтінімдер',data:bins,backgroundColor:colors,borderRadius:4}] },
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{callbacks:{label:c=>` ${c.parsed.y} өтінімдер`}} },
      scales:{ x:{grid:{display:false},ticks:{font:{size:11}}}, y:{beginAtZero:true,ticks:{font:{size:11},stepSize:1}} }
    }
  });
}

function renderSegmentCards() {
  const tot = AppState.applicants.length || 1;
  const high = AppState.applicants.filter(a=>a.totalScore>=70).length;
  const mid  = AppState.applicants.filter(a=>a.totalScore>=50&&a.totalScore<70).length;
  const low  = AppState.applicants.filter(a=>a.totalScore<50).length;
  const upd = (id,val,pct) => { const el=document.getElementById(id); if(el){ el.textContent=formatNumber(val); const p=el.nextElementSibling?.nextElementSibling; if(p) p.textContent=Math.round(pct)+'%'; } };
  const hEl=document.getElementById('seg-high-count'); if(hEl){hEl.textContent=formatNumber(high);}
  const hP=document.getElementById('seg-high-pct'); if(hP){hP.textContent=Math.round(high/tot*100)+'%';}
  const mEl=document.getElementById('seg-mid-count'); if(mEl){mEl.textContent=formatNumber(mid);}
  const mP=document.getElementById('seg-mid-pct'); if(mP){mP.textContent=Math.round(mid/tot*100)+'%';}
  const lEl=document.getElementById('seg-low-count'); if(lEl){lEl.textContent=formatNumber(low);}
  const lP=document.getElementById('seg-low-pct'); if(lP){lP.textContent=Math.round(low/tot*100)+'%';}
}

function filterBySegment(seg, btn) {
  document.querySelectorAll('.segment-card').forEach(c=>c.classList.remove('active'));
  if(btn) btn.classList.add('active');
  const data = seg==='high' ? AppState.applicants.filter(a=>a.totalScore>=70)
    : seg==='mid' ? AppState.applicants.filter(a=>a.totalScore>=50&&a.totalScore<70)
    : AppState.applicants.filter(a=>a.totalScore<50);
  renderScoringTable(data);
}

function renderScoringTable(data) {
  const tbody = document.getElementById('scoring-tbody');
  if (!tbody) return;
  tbody.innerHTML = (data||[]).slice(0,100).map((a,i)=>`
    <tr style="animation-delay:${i*25}ms">
      <td><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;font-size:11px;font-weight:700;background:${a.rank<=3?['#FFD700','#C0C0C0','#CD7F32'][a.rank-1]:'var(--bg)'};color:${a.rank<=3?'#333':'var(--text-muted)'}">${a.rank<=3?['🥇','🥈','🥉'][a.rank-1]:a.rank}</span></td>
      <td><div style="font-weight:600">${a.name}</div><div style="font-size:11px;color:var(--text-muted)">${a.iin}</div></td>
      <td style="font-size:13px">${a.region}</td>
      <td><span class="badge ${getScoreBadgeClass(a.totalScore)} ${a.totalScore>=90?'badge-pulse':''}">${a.totalScore}</span></td>
      <td>${getRiskDot(a.riskLevel)} ${a.riskLevel}</td>
      <td><span class="badge ${getStatusBadgeClass(a.recommendation)}">${a.recommendation}</span></td>
      <td>
        <div class="row-actions" style="opacity:1">
          <button class="action-btn" onclick="navigateTo('applicants/${a.id}')"><i class="fas fa-eye"></i></button>
          <button class="action-btn success" onclick="quickAddShortlist('${a.id}')"><i class="fas fa-star"></i></button>
        </div>
      </td>
    </tr>`).join('');
}

// ─── SHORTLIST ────────────────────────────────────────────────────────────────
let dragSrc = null;

function initShortlist() { renderShortlistBudget(); renderShortlistTable(); }

function renderShortlistBudget() {
  const total = AppState.shortlist.reduce((s,a)=>s+(a.recommendedAmount||0),0);
  const budget = 6_100_000_000, pct = Math.min(100, Math.round(total/budget*100));
  const rem = document.getElementById('budget-remaining');
  const bar = document.getElementById('budget-progress');
  const lbl = document.getElementById('budget-label');
  const fc = document.getElementById('shortlist-footer-count');
  const fa = document.getElementById('shortlist-footer-amount');
  if(rem) rem.textContent = `Қалған: ${formatMoney(budget-total)}`;
  if(bar) bar.style.width = pct+'%';
  if(lbl) lbl.textContent = `${formatMoney(total)} / ${formatMoney(budget)} (${pct}%)`;
  if(fc) fc.textContent = `${formatNumber(AppState.shortlist.length)} өтінімдер`;
  if(fa) fa.textContent = formatMoney(total);
}

function renderShortlistTable() {
  const tbody = document.getElementById('shortlist-tbody');
  if (!tbody) return;
  if (!AppState.shortlist.length) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state">
      <div class="empty-icon">📋</div><div class="empty-title">Shortlist бос</div>
      <div class="empty-subtitle">Өтінімдер бетінен өтінімдерді shortlist-ке қосыңыз</div>
      <button class="btn btn-primary" onclick="navigateTo('applicants')"><i class="fas fa-list"></i> Өтінімдерге өту</button>
    </div></td></tr>`; return;
  }
  tbody.innerHTML = AppState.shortlist.map((a,i)=>`
    <tr draggable="true" data-sl-id="${a.id}" ondragstart="onDragStart(event,${i})" ondragover="onDragOver(event)" ondrop="onDrop(event,${i})" ondragend="onDragEnd(event)">
      <td><span class="drag-handle">⋮⋮</span></td>
      <td><span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:var(--bg);font-size:12px;font-weight:700">${i+1}</span></td>
      <td><div style="font-weight:600">${a.name}</div><div style="font-size:11px;color:var(--text-muted)">${a.iin}</div></td>
      <td style="font-size:13px">${a.district}</td>
      <td><span class="badge ${getScoreBadgeClass(a.totalScore)}">${a.totalScore}</span></td>
      <td style="font-size:13px">${formatMoney(a.requestedAmount)}</td>
      <td>
        <input type="text" class="inline-edit" style="width:120px" value="${formatMoney(a.recommendedAmount)}"
          onfocus="this.value='${a.recommendedAmount}'"
          onblur="updateRecAmount('${a.id}',this)">
      </td>
      <td><span class="badge badge-success">${a.shortlistStatus||'Ұсынылды'}</span></td>
      <td><button class="action-btn danger" onclick="removeFromSL('${a.id}')"><i class="fas fa-trash"></i></button></td>
    </tr>`).join('');
}

function updateRecAmount(id, input) {
  const raw = parseFloat(input.value.replace(/[^\d.]/g,''))||0;
  const item = AppState.shortlist.find(s=>s.id===id);
  if (item) { item.recommendedAmount = raw > 10000 ? raw : raw * 1_000_000; AppState.save(); }
  input.value = formatMoney(item.recommendedAmount);
  renderShortlistBudget();
}

function removeFromSL(id) {
  showConfirm('Алып тастау', 'Shortlist-тен алып тастайсыз ба?', () => {
    AppState.removeFromShortlist(id);
    renderShortlistTable();
    renderShortlistBudget();
    showToast('Shortlist-тен алынды', 'info', 2000);
  });
}

function finalApprove() {
  showConfirm('✅ Финалды бекіту', `${formatNumber(AppState.shortlist.length)} өтінімді бекітуді растайсыз ба?`, () => {
    showToast('🎉 Shortlist тізімі бекітілді!', 'success', 5000);
  }, false);
}

function shortlistAIAnalysis() {
  const n = AppState.shortlist.length;
  const avg = n ? Math.round(AppState.shortlist.reduce((s,a)=>s+a.totalScore,0)/n) : 0;
  const budget = AppState.shortlist.reduce((s,a)=>s+(a.recommendedAmount||0),0);
  const prompt = `AgriScore KZ жүйесі. ${n} өтінімнен тұратын shortlist. Орташа балл: ${avg}/100. Жалпы сома: ${formatMoney(budget)}. Негізгі аймақтар: ${[...new Set(AppState.shortlist.map(a=>a.region))].slice(0,3).join(', ')}. Тізімнің сапасы туралы қазақша талдау жасаңыз.`;
  showAIModal('🤖 AI Shortlist Талдауы', prompt, 'analyze');
}

function exportShortlistExcel() { exportToExcel(AppState.shortlist,'AgriScore_Shortlist'); showToast('Excel файлы жүктелді ✅','success'); }

function showEmailModal() {
  showModal('<i class="fas fa-envelope"></i> Комиссияға жіберу',
    `<div class="form-group"><label class="form-label">Кімге</label><input class="form-control" value="commission@agrimin.kz"></div>
     <div class="form-group"><label class="form-label">Тақырып</label><input class="form-control" value="AgriScore KZ — Shortlist ${new Date().getFullYear()}"></div>
     <div class="form-group"><label class="form-label">Хабарлама</label><textarea class="form-control" rows="4">Shortlist тізімі қоса беріліп отыр. Жалпы ${AppState.shortlist.length} өтінімдер.</textarea></div>
     <label class="form-check"><input type="checkbox" checked> <span style="font-size:13px">Shortlist тізімін тіркеу</span></label>`,
    `<button class="btn btn-ghost" onclick="closeModal()">Болдырмау</button>
     <button class="btn btn-primary" onclick="closeModal();showToast('✉️ Хат жіберілді','success')"><i class="fas fa-paper-plane"></i> Жіберу</button>`);
}

// Drag & Drop
function onDragStart(e,i) { dragSrc=i; e.target.closest('tr').classList.add('dragging'); e.dataTransfer.effectAllowed='move'; }
function onDragOver(e) { e.preventDefault(); e.currentTarget.closest('tr')?.classList.add('drag-over'); }
function onDrop(e,i) { e.preventDefault(); e.currentTarget.closest('tr')?.classList.remove('drag-over'); if(dragSrc===null||dragSrc===i) return; const arr=AppState.shortlist; const [item]=arr.splice(dragSrc,1); arr.splice(i,0,item); AppState.save(); renderShortlistTable(); }
function onDragEnd(e) { e.target.closest('tr')?.classList.remove('dragging'); document.querySelectorAll('tr.drag-over').forEach(r=>r.classList.remove('drag-over')); dragSrc=null; }

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
function initAnalytics() {
  setTimeout(() => { initRegionalChart(); initTypeChart(); initTrendChart(); initScatterChart(); initClusterChart(); initProbabilityChart(); }, 100);
}

function initRegionalChart() {
  const ctx = document.getElementById('regional-chart'); if(!ctx) return;
  if(Charts.regional) Charts.regional.destroy();
  const data = Object.entries(AppState.getStats().byRegion).sort((a,b)=>b[1]-a[1]).slice(0,8);
  Charts.regional = new Chart(ctx, { type:'bar',
    data:{ labels:data.map(d=>d[0].length>12?d[0].slice(0,12)+'...':d[0]), datasets:[{label:'Өтінімдер',data:data.map(d=>d[1]),backgroundColor:'#1B5E20',borderRadius:4}] },
    options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false}}, scales:{x:{beginAtZero:true,ticks:{font:{size:11}}},y:{ticks:{font:{size:11}}}} }
  });
}

function initTypeChart() {
  const ctx = document.getElementById('type-chart'); if(!ctx) return;
  if(Charts.typeChart) Charts.typeChart.destroy();
  const data = Object.entries(AppState.getStats().byType);
  Charts.typeChart = new Chart(ctx, { type:'doughnut',
    data:{ labels:data.map(d=>d[0]), datasets:[{data:data.map(d=>d[1]),backgroundColor:['#1B5E20','#F9A825','#1565C0','#E53935'],borderWidth:2,borderColor:'#fff',hoverOffset:6}] },
    options:{ responsive:true, maintainAspectRatio:false, cutout:'60%',
      plugins:{legend:{position:'bottom',labels:{font:{family:'Inter',size:12},usePointStyle:true}}} }
  });
}

function initTrendChart() {
  const ctx = document.getElementById('trend-chart'); if(!ctx) return;
  if(Charts.trend) Charts.trend.destroy();
  const months = TRANSLATIONS[window.currentLang||'kk'].months;
  Charts.trend = new Chart(ctx, { type:'line',
    data:{ labels:months, datasets:[
      {label:'2023',data:months.map(()=>rnd(40,110)),borderColor:'#1B5E20',tension:0.4,fill:false,pointRadius:3},
      {label:'2024',data:months.map(()=>rnd(60,130)),borderColor:'#F9A825',tension:0.4,fill:false,pointRadius:3},
      {label:'2025',data:months.map(()=>rnd(80,150)),borderColor:'#1565C0',tension:0.4,fill:false,pointRadius:3},
    ]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{legend:{position:'top',labels:{font:{family:'Inter',size:12},usePointStyle:true}}},
      scales:{x:{ticks:{font:{size:11}}},y:{beginAtZero:true,ticks:{font:{size:11}}}}
    }
  });
}

function initScatterChart() {
  const ctx = document.getElementById('scatter-chart'); if(!ctx) return;
  if(Charts.scatter) Charts.scatter.destroy();
  const mkData = (minScore, maxScore) => AppState.applicants.filter(a=>a.totalScore>=minScore&&a.totalScore<maxScore).map(a=>({x:a.landArea,y:a.productivity}));
  Charts.scatter = new Chart(ctx, { type:'scatter',
    data:{ datasets:[
      {label:'Жоғары (70+)',data:mkData(70,101),backgroundColor:'rgba(27,94,32,0.6)',pointRadius:5},
      {label:'Орташа (50-69)',data:mkData(50,70),backgroundColor:'rgba(249,168,37,0.6)',pointRadius:5},
      {label:'Төмен (<50)',data:mkData(0,50),backgroundColor:'rgba(198,40,40,0.6)',pointRadius:5},
    ]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{legend:{position:'top',labels:{font:{family:'Inter',size:12},usePointStyle:true}},tooltip:{callbacks:{label:c=>`${c.parsed.x} га, ${c.parsed.y}% өнімділік`}}},
      scales:{x:{title:{display:true,text:'Алаң (га)',font:{size:11}},ticks:{font:{size:11}}},y:{title:{display:true,text:'Өнімділік (%)',font:{size:11}},ticks:{font:{size:11}}}}
    }
  });
}

function initClusterChart() {
  const ctx = document.getElementById('cluster-chart'); if(!ctx) return;
  if(Charts.cluster) Charts.cluster.destroy();
  const labels = CLUSTER_ORDERED_LABELS.map(l=>l.name);
  const colors = CLUSTER_ORDERED_LABELS.map(l=>l.color);
  const counts = labels.map(lbl => AppState.applicants.filter(a=>a.clusterLabel===lbl).length);
  Charts.cluster = new Chart(ctx, { type:'doughnut',
    data:{ labels, datasets:[{ data:counts, backgroundColor:colors, borderWidth:2, borderColor:'#fff', hoverOffset:6 }] },
    options:{ responsive:true, maintainAspectRatio:false, cutout:'55%',
      plugins:{ legend:{ position:'bottom', labels:{ font:{ family:'Inter', size:12 }, usePointStyle:true } } } }
  });
}

function initProbabilityChart() {
  const ctx = document.getElementById('probability-chart'); if(!ctx) return;
  if(Charts.probability) Charts.probability.destroy();
  const buckets = ['0-20','21-40','41-60','61-80','81-100'];
  const counts = [0,0,0,0,0];
  AppState.applicants.forEach(a => {
    const p = a.successProb ? a.successProb.probability : calcSuccessProbability(a).probability;
    counts[Math.min(Math.floor(p/20), 4)]++;
  });
  Charts.probability = new Chart(ctx, { type:'bar',
    data:{ labels: buckets.map(b=>b+'%'), datasets:[{ label:'Өтінімдер', data:counts,
      backgroundColor:['#C62828','#E65100','#F9A825','#388E3C','#1B5E20'], borderRadius:4 }] },
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:false } }, scales:{ x:{ ticks:{ font:{ size:11 } } }, y:{ beginAtZero:true, ticks:{ font:{ size:11 } } } } }
  });
}

function refreshAnalytics() { Object.values(Charts).forEach(c=>{try{c.destroy()}catch{}}); initAnalytics(); showToast('Жаңартылды ✅','success',2000); }

// ─── METHODOLOGY ─────────────────────────────────────────────────────────────
function initMethodology() {
  const el = document.getElementById('meth-total-apps');
  if (el) animateCounter(el, AppState.applicants.length);
}

// ─── PDF GENERATION ──────────────────────────────────────────────────────────
function generateShortlistPDF() {
  if (!AppState.shortlist.length) { showToast('Shortlist бос', 'warning'); return; }
  const now = new Date();
  const dateStr = formatDate(now);
  const stats = AppState.getStats();
  const total = AppState.shortlist.reduce((s,a)=>s+(a.recommendedAmount||0),0);

  const rows = AppState.shortlist.map((a,i) => `
    <tr>
      <td>${i+1}</td>
      <td>${a.name}</td>
      <td>${a.iin}</td>
      <td>${a.region}</td>
      <td>${a.productionType}</td>
      <td style="text-align:center;font-weight:700;color:${a.totalScore>=70?'#1B5E20':a.totalScore>=50?'#F57F17':'#C62828'}">${a.totalScore}</td>
      <td>${formatMoney(a.requestedAmount)}</td>
      <td style="font-weight:600">${formatMoney(a.recommendedAmount)}</td>
      <td style="color:${a.totalScore>=70?'#1B5E20':'#F57F17'}">${a.shortlistStatus||'Ұсынылды'}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>AgriScore KZ — Shortlist ${now.getFullYear()}</title>
  <style>
    body{font-family:Arial,sans-serif;font-size:12px;color:#111;margin:30px}
    h1{font-size:20px;color:#1B5E20;margin-bottom:4px}
    .subtitle{color:#666;font-size:12px;margin-bottom:20px}
    .meta{display:flex;gap:40px;margin-bottom:24px;padding:12px;background:#F4F6F4;border-radius:8px}
    .meta-item{text-align:center}
    .meta-num{font-size:22px;font-weight:800;color:#1B5E20}
    .meta-lbl{font-size:10px;color:#666;margin-top:2px}
    table{width:100%;border-collapse:collapse;font-size:11px}
    th{background:#1B5E20;color:#fff;padding:8px 6px;text-align:left}
    td{padding:7px 6px;border-bottom:1px solid #e0e0e0}
    tr:nth-child(even){background:#f9f9f9}
    .footer{margin-top:24px;padding-top:12px;border-top:1px solid #ccc;font-size:10px;color:#888;display:flex;justify-content:space-between}
    @media print{body{margin:15px}}
  </style></head><body>
  <h1>🌾 AgriScore KZ — Shortlist тізімі</h1>
  <div class="subtitle">ҚР Ауыл шаруашылығы министрлігі · ${now.getFullYear()} жылғы субсидия науқаны · Жасалды: ${dateStr}</div>
  <div class="meta">
    <div class="meta-item"><div class="meta-num">${AppState.shortlist.length}</div><div class="meta-lbl">Өтінімдер</div></div>
    <div class="meta-item"><div class="meta-num">${formatMoney(total)}</div><div class="meta-lbl">Ұсынылған сома</div></div>
    <div class="meta-item"><div class="meta-num">${Math.round(AppState.shortlist.reduce((s,a)=>s+a.totalScore,0)/AppState.shortlist.length)}</div><div class="meta-lbl">Орташа балл</div></div>
    <div class="meta-item"><div class="meta-num">${AppState.shortlist.filter(a=>a.totalScore>=70).length}</div><div class="meta-lbl">Жоғары балл (70+)</div></div>
  </div>
  <table>
    <thead><tr><th>#</th><th>Аты-жөні</th><th>ЖСН</th><th>Облыс</th><th>Өндіріс</th><th>Балл</th><th>Сұралған ₸</th><th>Ұсынылған ₸</th><th>Мәртебе</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">
    <span>AgriScore KZ скоринг жүйесі — автоматты есеп</span>
    <span>Комиссия күні: 15.09.${now.getFullYear()}</span>
  </div>
  <script>window.onload=()=>{window.print()}<\/script>
  </body></html>`;

  const w = window.open('','_blank','width=1000,height=700');
  if (w) { w.document.write(html); w.document.close(); }
  else showToast('Popup блокталған — браузер рұқсатын беріңіз', 'warning');
}

function generateMethodologyPDF() {
  const weights = loadWeights();
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>AgriScore KZ — Методология</title>
  <style>
    body{font-family:Arial,sans-serif;font-size:12px;color:#111;margin:30px}
    h1{font-size:22px;color:#1B5E20;margin-bottom:4px}
    h2{font-size:15px;color:#1B5E20;margin:20px 0 8px;border-bottom:2px solid #1B5E20;padding-bottom:4px}
    .subtitle{color:#666;font-size:12px;margin-bottom:20px}
    .factor{margin-bottom:12px;padding:12px;border-left:4px solid #1B5E20;background:#f9f9f9;border-radius:0 8px 8px 0}
    .factor-title{font-weight:700;font-size:13px;margin-bottom:4px}
    .weight-badge{display:inline-block;background:#1B5E20;color:#fff;padding:2px 8px;border-radius:10px;font-size:10px;margin-left:8px}
    .formula{background:#f0f0f0;padding:12px;border-radius:6px;font-family:monospace;font-size:12px;margin:12px 0}
    table{width:100%;border-collapse:collapse;font-size:11px;margin-top:8px}
    th{background:#1B5E20;color:#fff;padding:7px 10px;text-align:left}
    td{padding:7px 10px;border-bottom:1px solid #ddd}
    tr:nth-child(even){background:#f9f9f9}
    .footer{margin-top:24px;padding-top:12px;border-top:1px solid #ccc;font-size:10px;color:#888;display:flex;justify-content:space-between}
    @media print{body{margin:15px}}
  </style></head><body>
  <h1>📖 AgriScore KZ — Скоринг методологиясы</h1>
  <div class="subtitle">ҚР Ауыл шаруашылығы министрлігі · Merit-based субсидия бөлу жүйесі · ${formatDate(new Date())}</div>

  <h2>1. Жүйенің мақсаты</h2>
  <p>AgriScore KZ — ауылшаруашылығы субсидияларын "бірінші берген — бірінші алады" принципінен деректерге негізделген объективті рейтингке көшіру жүйесі. Финалды шешім комиссия арқылы қабылданады.</p>

  <h2>2. Скоринг факторлары</h2>
  <div class="factor"><div class="factor-title">Субсидия тарихы <span class="weight-badge">${Math.round(weights.subsidyHistory*100)}%</span></div>Алдыңғы субсидияны игеру тарихы, есептерді уақытылы тапсыру, бұзушылықтардың болмауы. Максимум: 30 балл.</div>
  <div class="factor"><div class="factor-title">Өнімділік <span class="weight-badge">${Math.round(weights.productivity*100)}%</span></div>Аймақтық орташадан жоғары өнімділік, өсу тренді, шығын тиімділігі. Максимум: 30 балл.</div>
  <div class="factor"><div class="factor-title">Шаруашылық профилі <span class="weight-badge">${Math.round(weights.farmProfile*100)}%</span></div>Жер алаңы (50–1000 га оңтайлы), техника саны (>5), суландыру жүйесі. Максимум: 20 балл.</div>
  <div class="factor"><div class="factor-title">Әлеуметтік-экономикалық <span class="weight-badge">${Math.round(weights.socialEconomic*100)}%</span></div>Жұмыс орындары (>10 қызметкер), ауылдық аймақ, аз қамтылған аймақ. Максимум: 15 балл.</div>
  <div class="factor"><div class="factor-title">Тәуекел бағасы <span class="weight-badge">${Math.round(weights.riskAssessment*100)}%</span></div>Несие тарихы, салық берешегі жоқ, сот даулары жоқ. Максимум: 10 балл.</div>

  <h2>3. Скоринг формуласы</h2>
  <div class="formula">Score = (F1/30×25×${weights.subsidyHistory}) + (F2/30×30×${weights.productivity}) + (F3/20×20×${weights.farmProfile}) + (F4/15×15×${weights.socialEconomic}) + (F5/10×10×${weights.riskAssessment})</div>

  <h2>4. Шешім қабылдау матрицасы</h2>
  <table>
    <thead><tr><th>Балл диапазоны</th><th>Мәртебе</th><th>Тәуекел деңгейі</th><th>Ұсыным</th></tr></thead>
    <tbody>
      <tr><td>70–100</td><td>✅ Ұсынылды</td><td>🟢 Төмен</td><td>Shortlist-ке қосу</td></tr>
      <tr><td>50–69</td><td>⚠️ Тексеруде</td><td>🟡 Орташа</td><td>Комиссия қарауы</td></tr>
      <tr><td>0–49</td><td>❌ Ұсынылмайды</td><td>🔴 Жоғары</td><td>Бас тарту</td></tr>
    </tbody>
  </table>

  <h2>5. Деректер өңдеу</h2>
  <p>Excel/CSV форматындағы деректер жүктеледі → бағандар автоматты анықталады → скоринг алгоритмі есептейді → AI (Gemini 2.5 Flash) əр өтінімге түсіндірме береді → shortlist қалыптасады → комиссияға PDF есеп жіберіледі.</p>

  <div class="footer">
    <span>AgriScore KZ — ҚР АШМ скоринг жүйесі</span>
    <span>Жасалды: ${formatDate(new Date())}</span>
  </div>
  <script>window.onload=()=>{window.print()}<\/script>
  </body></html>`;

  const w = window.open('','_blank','width=900,height=700');
  if (w) { w.document.write(html); w.document.close(); }
  else showToast('Popup блокталған — браузер рұқсатын беріңіз', 'warning');
}

// ─── UPLOAD ───────────────────────────────────────────────────────────────────
function initUpload() {
  const zone = document.getElementById('upload-zone');
  const fi = document.getElementById('file-input');
  if (!zone || !fi) return;
  zone.onclick = () => fi.click();
  zone.ondragover = e => { e.preventDefault(); zone.classList.add('drag-active'); };
  zone.ondragleave = () => zone.classList.remove('drag-active');
  zone.ondrop = e => { e.preventDefault(); zone.classList.remove('drag-active'); if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); };
  fi.onchange = e => { if(e.target.files[0]) handleFile(e.target.files[0]); };
  renderUploadHistory();
}

function handleFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  document.getElementById('upload-file-info')?.classList.remove('hidden');
  const fn = document.getElementById('upload-file-name'); if(fn) fn.textContent = file.name;
  const fs = document.getElementById('upload-file-size'); if(fs) fs.textContent = (file.size/1024).toFixed(1)+' KB';

  const onOk = (apps, colMap, headers) => {
    window._uploadHeaders = headers;
    window._pendingColMap = { ...colMap };
    window._pendingRawRows = apps;
    const fr = document.getElementById('upload-file-rows'); if(fr) fr.textContent = formatNumber(apps.length);
    renderColMapping(colMap);
    document.getElementById('column-mapping-card')?.classList.remove('hidden');
    document.getElementById('upload-confirm-section')?.classList.remove('hidden');
    window._pendingImport = apps;
  };
  const onErr = msg => showToast('❌ '+msg, 'error');
  if (ext === 'xlsx' || ext === 'xls') parseExcelFile(file, onOk, onErr);
  else if (ext === 'csv') parseCSVFile(file, onOk, onErr);
  else showToast('Тек .xlsx, .xls, .csv форматы қолдаулы', 'warning');
}

function renderColMapping(colMap) {
  const tbody = document.getElementById('column-mapping-tbody'); if(!tbody) return;
  const headers = window._uploadHeaders || [];
  const sys = {
    iin:'ЖСН/БИН', name:'Атауы', region:'Облыс', district:'Аудан',
    subsidyType:'Субсидия түрі', requestedAmount:'Сомасы', landArea:'Алаңы (га)',
    productionType:'Өндіріс түрі', productivity:'Өнімділік (%)', employees:'Қызметкерлер'
  };
  const opts = ['<option value="">— таңдалмаған —</option>',
    ...headers.map((h,i) => `<option value="${i}">${h}</option>`)
  ].join('');

  tbody.innerHTML = Object.entries(sys).map(([k,label]) => {
    const m = colMap[k];
    const conf = m ? m.confidence : 0;
    const selVal = m ? m.index : '';
    const confBadge = m
      ? `<span style="font-size:11px;font-weight:600;color:${conf>=80?'var(--success)':conf>=60?'var(--warning)':'var(--danger)'}">${conf}%</span>`
      : '<span style="font-size:11px;color:var(--text-muted)">—</span>';
    return `<tr>
      <td style="padding:6px 8px;font-weight:500;font-size:12px">${label}</td>
      <td style="padding:4px 8px">
        <select class="form-control" style="font-size:11px;padding:4px 6px" data-field="${k}"
          onchange="updateColMapping('${k}',this.value)">
          ${opts.replace(`value="${selVal}"`,`value="${selVal}" selected`)}
        </select>
      </td>
      <td style="padding:6px 8px">${confBadge}</td>
    </tr>`;
  }).join('');
}

function updateColMapping(field, idx) {
  if (!window._pendingColMap) window._pendingColMap = {};
  const headers = window._uploadHeaders || [];
  if (idx === '') { delete window._pendingColMap[field]; }
  else { window._pendingColMap[field] = { index: parseInt(idx), header: headers[parseInt(idx)], confidence: 100 }; }
}

function confirmUpload() {
  if (!window._pendingImport) return;
  showLoading('Деректер жүктелуде...');
  setTimeout(() => {
    AppState.applicants = window._pendingImport;
    AppState.applicants.sort((a,b)=>b.totalScore-a.totalScore);
    AppState.applicants.forEach((a,i)=>a.rank=i+1);
    AppState.uploadHistory.unshift({ id:Date.now(), name:document.getElementById('upload-file-name')?.textContent||'файл', size:document.getElementById('upload-file-size')?.textContent||'', rows:window._pendingImport.length, date:formatDate(new Date()) });
    AppState.save();
    window._pendingImport = null;
    hideLoading();
    showToast(`✅ ${formatNumber(AppState.applicants.length)} жазба жүктелді`, 'success');
    renderUploadHistory();
    document.getElementById('upload-confirm-section')?.classList.add('hidden');
    document.getElementById('column-mapping-card')?.classList.add('hidden');
    document.getElementById('upload-file-info')?.classList.add('hidden');
    document.getElementById('file-input').value = '';
  }, 1200);
}

function loadDemoData() {
  showLoading('Demo деректер жүктелуде...');
  setTimeout(() => {
    AppState.applicants = generateSampleApplicants(50);
    AppState.save();
    AppState.uploadHistory.unshift({ id:Date.now(), name:'demo_data.xlsx', size:'18 KB', rows:50, date:formatDate(new Date()) });
    AppState.save();
    hideLoading();
    showToast('✅ 50 demo жазба жүктелді', 'success');
    renderUploadHistory();
  }, 1000);
}

function renderUploadHistory() {
  const el = document.getElementById('upload-history-list'); if(!el) return;
  if (!AppState.uploadHistory.length) { el.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">Жүктеу тарихы жоқ</div>'; return; }
  el.innerHTML = AppState.uploadHistory.slice(0,8).map(h=>`
    <div class="upload-history-item">
      <i class="fas fa-file-excel" style="color:var(--success);font-size:20px"></i>
      <div class="upload-history-info">
        <div class="upload-history-name">${h.name}</div>
        <div class="upload-history-meta">${h.date} · ${formatNumber(h.rows)} жазба · ${h.size}</div>
      </div>
      <button class="action-btn danger" onclick="removeUploadHist(${h.id})"><i class="fas fa-trash"></i></button>
    </div>`).join('');
}

function removeUploadHist(id) { AppState.uploadHistory = AppState.uploadHistory.filter(h=>h.id!==id); AppState.save(); renderUploadHistory(); }

// ─── SETTINGS ────────────────────────────────────────────────────────────────
function initSettings() {
  // Tabs
  document.querySelectorAll('#page-settings .tab-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#page-settings .tab-btn').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('#page-settings .tab-content').forEach(c=>c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab)?.classList.add('active');
    };
  });

  // API key status (server-side)
  fetch('/api/gemini-status').then(r=>r.json()).then(s => {
    const status = document.getElementById('api-key-status');
    if (status) status.innerHTML = s.hasKey
      ? '<span style="color:var(--success);font-size:12px">✅ .env → GEMINI_API_KEY орнатылды</span>'
      : '<span style="color:var(--text-muted);font-size:12px">⚠️ Demo режим — .env файлына GEMINI_API_KEY қосыңыз</span>';
    const keyEl = document.getElementById('gemini-api-key');
    if (keyEl) { keyEl.value = s.hasKey ? '••••••••••••••••••••••••••••••••••••••••' : ''; keyEl.disabled = true; keyEl.placeholder = s.hasKey ? 'Кілт .env файлында орнатылған' : 'GEMINI_API_KEY .env файлына қосыңыз'; }
  }).catch(()=>{});

  // Weights sliders
  const container = document.getElementById('weight-sliders');
  if (container) {
    const weights = loadWeights();
    const wDefs = [
      {key:'subsidyHistory',label:'Субсидия тарихы',color:'#1B5E20'},
      {key:'productivity',label:'Өнімділік',color:'#2E7D32'},
      {key:'farmProfile',label:'Шаруашылық профилі',color:'#388E3C'},
      {key:'socialEconomic',label:'Әлеуметтік-экономикалық',color:'#F9A825'},
      {key:'riskAssessment',label:'Тәуекел бағасы',color:'#1565C0'},
    ];
    container.innerHTML = wDefs.map(w => `
      <div class="weight-item">
        <div class="weight-label">
          <span>${w.label}</span>
          <span class="weight-val" id="wv-${w.key}">${Math.round(weights[w.key]*100)}%</span>
        </div>
        <input type="range" class="form-range" id="ws-${w.key}" min="0" max="100" value="${Math.round(weights[w.key]*100)}"
          oninput="document.getElementById('wv-${w.key}').textContent=this.value+'%'; updateWeightTotal()">
      </div>`).join('');
    updateWeightTotal();
  }

  // Threshold
  const th = document.getElementById('scoring-threshold');
  const thv = document.getElementById('threshold-val');
  if (th) { th.value = AppState.shortlistThreshold; if(thv) thv.textContent = AppState.shortlistThreshold; }

  // Theme
  const isDark = document.body.classList.contains('dark-mode');
  document.getElementById('theme-light')?.classList.toggle('active', !isDark);
  document.getElementById('theme-dark')?.classList.toggle('active', isDark);

  // Users table
  const ubody = document.getElementById('users-tbody');
  if (ubody) ubody.innerHTML = [
    {name:'Ахметов А.',role:'Администратор',last:'28.03.2025 09:15'},
    {name:'Сейітова Г.',role:'Сарапшы',last:'27.03.2025 14:30'},
    {name:'Нұрланов М.',role:'Сарапшы',last:'26.03.2025 11:00'},
  ].map(u=>`<tr><td style="padding:12px 14px;font-weight:600">${u.name}</td><td style="padding:12px 14px"><span class="badge badge-info">${u.role}</span></td><td style="padding:12px 14px;font-size:12px;color:var(--text-muted)">${u.last}</td><td style="padding:12px 14px"><div class="row-actions" style="opacity:1"><button class="action-btn"><i class="fas fa-edit"></i></button><button class="action-btn danger"><i class="fas fa-trash"></i></button></div></td></tr>`).join('');
}

function toggleAdaptiveWeights(useAdaptive) {
  const result = calibrateAdaptiveWeights(AppState.applicants);
  const panel = document.getElementById('adaptive-weights-panel');
  const manualPanel = document.getElementById('weight-sliders');
  if (useAdaptive) {
    if (!result.success) { showToast('⚠️ ' + result.reason, 'warning'); document.getElementById('weight-mode-manual').checked = true; return; }
    if (panel) {
      panel.innerHTML = Object.entries(result.explanations).map(([k,txt]) => {
        const base = Math.round(result.base[k]*100);
        const adap = Math.round(result.adaptive[k]*100);
        const diff = adap - base;
        const arrow = diff > 0 ? `<span style="color:var(--success)">▲+${diff}%</span>` : diff < 0 ? `<span style="color:var(--danger)">▼${diff}%</span>` : '<span style="color:var(--text-muted)">—</span>';
        return `<div style="padding:10px 0;border-bottom:1px solid var(--border)">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="font-size:13px;font-weight:600">${txt.split(':')[0]}</span>
            <span style="font-size:13px">${base}% → <b>${adap}%</b> ${arrow}</span>
          </div>
          <div style="font-size:11px;color:var(--text-muted)">${txt.split(':')[1]||''}</div>
        </div>`;
      }).join('') + `<button class="btn btn-primary mt-4" onclick="applyAdaptiveWeights()"><i class="fas fa-check"></i> Адаптивті салмақты қолдану</button>`;
      panel.style.display = 'block';
    }
    if (manualPanel) manualPanel.style.opacity = '0.4';
  } else {
    if (panel) panel.style.display = 'none';
    if (manualPanel) manualPanel.style.opacity = '1';
  }
}

function applyAdaptiveWeights() {
  const result = calibrateAdaptiveWeights(AppState.applicants);
  if (!result.success) { showToast('⚠️ ' + result.reason, 'warning'); return; }
  localStorage.setItem('agri_weights', JSON.stringify(result.adaptive));
  AppState.scoringWeights = result.adaptive;
  showLoading('Адаптивті салмақ қолданылуда...');
  setTimeout(() => { AppState.recalculateScores(); hideLoading(); showToast('✅ Адаптивті салмақ қолданылды. Скорлар қайта есептелді.', 'success'); initSettings(); }, 800);
}

function updateWeightTotal() {
  const keys = ['subsidyHistory','productivity','farmProfile','socialEconomic','riskAssessment'];
  const total = keys.reduce((s,k) => { const el=document.getElementById(`ws-${k}`); return s+(el?parseInt(el.value):0); }, 0);
  const tw = document.getElementById('weight-total'); if(tw) tw.textContent = total+'%';
  const wrap = document.getElementById('weight-total-wrap'); if(wrap) wrap.classList.toggle('error', total!==100);
}

function saveAndRecalculate() {
  const keys = ['subsidyHistory','productivity','farmProfile','socialEconomic','riskAssessment'];
  let total = 0;
  const weights = {};
  keys.forEach(k => { const v=parseInt(document.getElementById(`ws-${k}`)?.value||0); weights[k]=v/100; total+=v; });
  if (total !== 100) { showToast('⚠️ Үлестер жиыны 100% болуы керек!', 'warning'); return; }
  localStorage.setItem('agri_weights', JSON.stringify(weights));
  const th = parseInt(document.getElementById('scoring-threshold')?.value||65);
  localStorage.setItem('agri_threshold', th);
  AppState.scoringWeights = weights; AppState.shortlistThreshold = th;
  showLoading('Қайта есептелуде...');
  setTimeout(() => { AppState.recalculateScores(); hideLoading(); showToast(`✅ Сақталды. ${formatNumber(AppState.applicants.length)} өтінімдер қайта бағаланды`, 'success'); }, 800);
}

function saveAPIKey() {
  // API кілті .env файлында сақталады, frontend-те емес
  showModal(
    '<i class="fas fa-info-circle" style="color:var(--info)"></i> API кілтін қалай орнату',
    `<div style="font-size:13px;line-height:1.8">
      <p>API кілті қауіпсіздік үшін серверде (.env файлында) сақталады.</p>
      <br>
      <p><b>1.</b> <code style="background:var(--bg);padding:2px 6px;border-radius:4px">c:/AgriScoreKZ/.env</code> файлын ашыңыз</p>
      <p><b>2.</b> <code style="background:var(--bg);padding:2px 6px;border-radius:4px">GEMINI_API_KEY=</code> жолына кілтіңізді қосыңыз</p>
      <p><b>3.</b> Серверді қайта іске қосыңыз: <code style="background:var(--bg);padding:2px 6px;border-radius:4px">node server.js</code></p>
      <br>
      <p style="color:var(--text-muted);font-size:12px">🔑 Кілтті <a href="https://aistudio.google.com/app/apikey" target="_blank">aistudio.google.com</a> сайтынан алыңыз</p>
    </div>`,
    '<button class="btn btn-primary" onclick="closeModal()">Түсінікті</button>', 'modal-sm'
  );
}

function testAPIKey() {
  const btn = document.getElementById('test-api-btn');
  if (btn) { btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Тексерілуде...'; }
  fetch('/api/gemini-status')
    .then(r => r.json())
    .then(s => {
      const status = document.getElementById('api-key-status');
      if (s.hasKey) {
        showToast('✅ Gemini API кілті орнатылған', 'success');
        if (status) status.innerHTML = '<span style="color:var(--success);font-size:12px">✅ .env → GEMINI_API_KEY орнатылды</span>';
        // Actually test with a real call
        return callGemini('Test', 'score').then(() => {
          showToast('✅ Gemini байланысы жұмыс жасайды!', 'success');
        });
      } else {
        showToast('⚠️ GEMINI_API_KEY орнатылмаған — demo режим', 'warning');
        if (status) status.innerHTML = '<span style="color:var(--text-muted);font-size:12px">⚠️ Demo режим — .env файлына кілт қосыңыз</span>';
      }
    })
    .catch(err => showToast('❌ '+err.message, 'error'))
    .finally(() => { if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-wifi"></i> Тексеру';} });
}

function toggleAPIKeyVisibility() {
  const inp = document.getElementById('gemini-api-key');
  const icon = document.getElementById('api-key-eye');
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  if (icon) icon.className = inp.type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
}

function setTheme(theme) {
  document.body.classList.toggle('dark-mode', theme==='dark');
  localStorage.setItem('agri_theme', theme);
  document.getElementById('theme-light')?.classList.toggle('active', theme==='light');
  document.getElementById('theme-dark')?.classList.toggle('active', theme==='dark');
}

function clearAllData() {
  showConfirm('Деректерді тазарту', 'Барлық деректер жойылады! Бұл әрекетті қайтару мүмкін емес.', () => {
    AppState.clearAll(); showToast('✅ Деректер тазартылды', 'success');
  });
}

// ─── UTILS ────────────────────────────────────────────────────────────────────
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; }

function formatDate(d) {
  if (!d) return '—';
  if (typeof d === 'string') return d;
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
}

// ─── INIT ────────────────────────────────────────────────────────────────────
function initApp() {
  // Load data
  AppState.load();

  // Theme
  if (localStorage.getItem('agri_theme') === 'dark') document.body.classList.add('dark-mode');

  // Sidebar
  if (localStorage.getItem('agri_sidebar') === '1') document.getElementById('app-shell')?.classList.add('sidebar-collapsed');

  // Language
  window.currentLang = localStorage.getItem('agri_lang') || 'kk';
  setLanguage(window.currentLang);

  // Lang buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.onclick = () => { setLanguage(btn.dataset.lang); };
  });

  // Nav items
  document.querySelectorAll('.nav-item[data-page], .bottom-nav-item[data-page]').forEach(el => {
    el.onclick = () => navigateTo(el.dataset.page);
  });

  // Hamburger
  document.getElementById('hamburger-btn')?.addEventListener('click', toggleSidebar);

  // Dropdowns
  document.getElementById('notif-btn')?.addEventListener('click', e => { e.stopPropagation(); document.getElementById('notif-wrap')?.classList.toggle('open'); document.getElementById('avatar-wrap')?.classList.remove('open'); });
  document.getElementById('navbar-avatar')?.addEventListener('click', e => { e.stopPropagation(); document.getElementById('avatar-wrap')?.classList.toggle('open'); document.getElementById('notif-wrap')?.classList.remove('open'); });
  document.addEventListener('click', () => { document.querySelectorAll('.dropdown.open').forEach(d=>d.classList.remove('open')); });

  // Search bar
  document.getElementById('search-btn')?.addEventListener('click', () => { document.getElementById('search-bar')?.classList.toggle('open'); document.getElementById('global-search-input')?.focus(); });
  document.getElementById('global-search-input')?.addEventListener('input', debounce(e => {
    if (location.hash.includes('applicants')) {
      const el = document.getElementById('app-search'); if(el){el.value=e.target.value;filterApplicants();}
    }
  }, 300));

  // Escape closes modal
  document.addEventListener('keydown', e => { if (e.key==='Escape') closeModal(); });

  // Login init
  initLoginPage();

  // Router
  window.addEventListener('hashchange', router);
  router();
}

document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', initApp) : initApp();
