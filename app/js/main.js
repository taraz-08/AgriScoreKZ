'use strict';

// ─── APP ENTRY POINT ──────────────────────────────────────────────────────────
function initApp() {
  AppState.load();
  syncToServer();

  // Theme
  if (localStorage.getItem('agri_dark') === '1') applyDarkMode(true);

  // Sidebar collapsed state
  if (localStorage.getItem('agri_sidebar') === '1') {
    document.getElementById('app-shell')?.classList.add('sidebar-collapsed');
  }

  // Language
  window.currentLang = localStorage.getItem('agri_lang') || 'kk';
  setLanguage(window.currentLang);

  // Lang buttons
  document.querySelectorAll('.lang-btn, .lang-flat-btn').forEach(btn => {
    btn.onclick = () => setLanguage(btn.dataset.lang);
  });

  // Nav items
  document.querySelectorAll('.nav-item[data-page], .bottom-nav-item[data-page]').forEach(el => {
    el.onclick = () => navigateTo(el.dataset.page);
  });

  // Avatar dropdown
  document.getElementById('navbar-avatar')?.addEventListener('click', e => {
    e.stopPropagation();
    document.getElementById('avatar-wrap')?.classList.toggle('open');
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
  });

  // Search bar
  document.getElementById('search-btn')?.addEventListener('click', () => {
    document.getElementById('search-bar')?.classList.toggle('open');
    document.getElementById('global-search-input')?.focus();
  });
  document.getElementById('global-search-input')?.addEventListener('input', debounce(e => {
    if (location.hash.includes('applicants')) {
      const el = document.getElementById('app-search');
      if (el) { el.value = e.target.value; filterApplicants(); }
    }
  }, 300));

  // Escape closes modal
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // Login page init
  initLoginPage();

  // Router
  window.addEventListener('hashchange', router);
  router();
}

// ─── DARK / LIGHT MODE ───────────────────────────────────────────────────────
function applyDarkMode(isDark) {
  document.body.classList.toggle('dark-mode', isDark);
  const icon = document.getElementById('theme-icon');
  if (icon) icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
  localStorage.setItem('agri_dark', isDark ? '1' : '0');
}

function toggleDarkMode() {
  applyDarkMode(!document.body.classList.contains('dark-mode'));
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', initApp)
  : initApp();
