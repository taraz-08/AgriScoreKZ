'use strict';

// ─── SERVER SYNC ─────────────────────────────────────────────────────────────
function syncToServer() {
  const user = JSON.parse(localStorage.getItem('agri_user') || '{}');
  fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user': JSON.stringify(user) },
    body: JSON.stringify({
      applicants: AppState.applicants,
      shortlist:  AppState.shortlist,
      reviews:    AppState.commissionReviews,
    })
  }).catch(() => {});
}
