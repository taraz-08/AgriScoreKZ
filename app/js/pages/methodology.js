'use strict';

// ─── METHODOLOGY PAGE ─────────────────────────────────────────────────────────
function initMethodology() {
  const el = document.getElementById('meth-total-apps');
  if (el) animateCounter(el, AppState.applicants.length);
}
