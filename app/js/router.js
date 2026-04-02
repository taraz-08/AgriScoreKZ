'use strict';

// ─── PAGES MAP ────────────────────────────────────────────────────────────────
const PAGES = {
  '/login':       'login',
  '/dashboard':   'dashboard',
  '/applicants':  'applicants',
  '/scoring':     'scoring',
  '/shortlist':   'shortlist',
  '/analytics':   'analytics',
  '/upload':      'upload',
  '/settings':    'settings',
  '/methodology': 'methodology',
};

// ─── PAGE INITIALIZERS ────────────────────────────────────────────────────────
// Defined after all page scripts are loaded
const PAGE_INITS = {
  dashboard:   () => initDashboard(),
  applicants:  () => initApplicants(),
  scoring:     () => initScoring(),
  shortlist:   () => initShortlist(),
  analytics:   () => initAnalytics(),
  upload:      () => initUpload(),
  settings:    () => initSettings(),
  methodology: () => initMethodology(),
};

// ─── ROUTER ───────────────────────────────────────────────────────────────────
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

function initPage(id) { if (PAGE_INITS[id]) PAGE_INITS[id](); }

function setActiveNav(id) {
  document.querySelectorAll('.nav-item[data-page]').forEach(el => el.classList.toggle('active', el.dataset.page === id));
  document.querySelectorAll('.bottom-nav-item[data-page]').forEach(el => el.classList.toggle('active', el.dataset.page === id));
}

function navigateTo(page) { location.hash = '#/' + page; }

function updateNavTitle(id) {
  const map = {
    dashboard:'Басқару тақтасы', applicants:'Өтінімдер', 'applicant-detail':'Өтінім',
    scoring:'Скоринг', shortlist:'Shortlist', analytics:'Аналитика',
    upload:'Деректер жүктеу', settings:'Параметрлер', methodology:'Методология',
  };
  const el = document.getElementById('navbar-title');
  if (el) el.textContent = map[id] || '';
}

function toggleSidebar() {
  const shell = document.getElementById('app-shell');
  shell.classList.toggle('sidebar-collapsed');
  localStorage.setItem('agri_sidebar', shell.classList.contains('sidebar-collapsed') ? '1' : '0');
}
