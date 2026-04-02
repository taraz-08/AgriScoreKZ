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

// ─── GAUGE SVG ────────────────────────────────────────────────────────────────
function buildGaugeSVG(score, size = 160) {
  const r = size * 0.38, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const dashArr = circ * 0.75;
  const gap = circ * 0.25;
  const filled = dashArr * (score / 100);
  const color = score >= 70 ? '#2E7D32' : score >= 50 ? '#F9A825' : '#C62828';
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--border)" stroke-width="${size*0.07}"
      stroke-dasharray="${dashArr} ${gap}" stroke-dashoffset="${circ * 0.125}" stroke-linecap="round" />
    <circle id="gauge-arc" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${size*0.07}"
      stroke-dasharray="0 ${circ}" stroke-dashoffset="${circ * 0.125}" stroke-linecap="round"
      data-filled="${filled}" data-circ="${circ}" style="transition:stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)" />
  </svg>`;
}

function animateGauge(score) {
  const arc = document.getElementById('gauge-arc');
  if (!arc) return;
  const filled = parseFloat(arc.dataset.filled);
  const circ = parseFloat(arc.dataset.circ);
  arc.style.strokeDasharray = `${filled} ${circ - filled}`;
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

// ─── DEBOUNCE / FORMAT HELPERS ────────────────────────────────────────────────
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function formatDate(d) {
  if (!d) return '—';
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt)) return String(d);
  return `${String(dt.getDate()).padStart(2,'0')}.${String(dt.getMonth()+1).padStart(2,'0')}.${dt.getFullYear()}`;
}
