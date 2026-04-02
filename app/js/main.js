'use strict';

// ─── APP ENTRY POINT ──────────────────────────────────────────────────────────
function initApp() {
  // Load data + sync to server
  AppState.load();
  syncToServer();

  // Theme
  if (localStorage.getItem('agri_theme') === 'dark') document.body.classList.add('dark-mode');

  // Sidebar
  if (localStorage.getItem('agri_sidebar') === '1') document.getElementById('app-shell')?.classList.add('sidebar-collapsed');

  // Language
  window.currentLang = localStorage.getItem('agri_lang') || 'kk';
  setLanguage(window.currentLang);

  // Lang buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.onclick = () => setLanguage(btn.dataset.lang);
  });

  // Nav items
  document.querySelectorAll('.nav-item[data-page], .bottom-nav-item[data-page]').forEach(el => {
    el.onclick = () => navigateTo(el.dataset.page);
  });

  // Hamburger
  document.getElementById('hamburger-btn')?.addEventListener('click', toggleSidebar);

  // Dropdowns
  document.getElementById('notif-btn')?.addEventListener('click', e => {
    e.stopPropagation();
    document.getElementById('notif-wrap')?.classList.toggle('open');
    document.getElementById('avatar-wrap')?.classList.remove('open');
  });
  document.getElementById('navbar-avatar')?.addEventListener('click', e => {
    e.stopPropagation();
    document.getElementById('avatar-wrap')?.classList.toggle('open');
    document.getElementById('notif-wrap')?.classList.remove('open');
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown.open').forEach(d=>d.classList.remove('open'));
  });

  // Search bar
  document.getElementById('search-btn')?.addEventListener('click', () => {
    document.getElementById('search-bar')?.classList.toggle('open');
    document.getElementById('global-search-input')?.focus();
  });
  document.getElementById('global-search-input')?.addEventListener('input', debounce(e => {
    if (location.hash.includes('applicants')) {
      const el = document.getElementById('app-search'); if(el){el.value=e.target.value;filterApplicants();}
    }
  }, 300));

  // Escape closes modal
  document.addEventListener('keydown', e => { if (e.key==='Escape') closeModal(); });

  // Login page init
  initLoginPage();

  // Router
  window.addEventListener('hashchange', router);
  router();
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', initApp)
  : initApp();
