'use strict';

// ─── AUDIT TRAIL PAGE ─────────────────────────────────────────────────────────
let _auditAll = [];

function initAudit() {
  loadAuditLog();
  initSyncIndicator();
}

function loadAuditLog() {
  fetch('/api/audit?limit=500')
    .then(r => r.ok ? r.json() : { items: [], total: 0 })
    .then(data => {
      _auditAll = data.items || [];
      renderAuditKPIs(_auditAll);
      filterAuditTable();
    })
    .catch(() => {
      // Offline fallback: show AppState changes
      _auditAll = buildLocalAuditLog();
      renderAuditKPIs(_auditAll);
      filterAuditTable();
    });
}

function buildLocalAuditLog() {
  const entries = [];
  if (AppState.applicants.length) {
    entries.push({ ts: new Date().toISOString(), action: 'sync', user: 'local', count: AppState.applicants.length });
  }
  AppState.shortlist.forEach(a => {
    entries.push({ ts: a.addedAt || new Date().toISOString(), action: 'shortlist_add', user: 'local', id: a.id });
  });
  return entries.reverse();
}

function renderAuditKPIs(items) {
  const syncs   = items.filter(i => i.action === 'sync').length;
  const reviews = items.filter(i => i.action === 'review').length;
  const users   = new Set(items.map(i => i.user).filter(Boolean)).size;
  animateCounter(document.getElementById('audit-total'),   items.length);
  animateCounter(document.getElementById('audit-syncs'),   syncs);
  animateCounter(document.getElementById('audit-reviews'), reviews);
  animateCounter(document.getElementById('audit-users'),   users);
}

function filterAuditTable() {
  const actionF = (document.getElementById('audit-filter-action')?.value || '').toLowerCase();
  const userF   = (document.getElementById('audit-filter-user')?.value   || '').toLowerCase();
  let filtered  = _auditAll;
  if (actionF) filtered = filtered.filter(i => (i.action || '').toLowerCase().includes(actionF));
  if (userF)   filtered = filtered.filter(i => (i.user  || '').toLowerCase().includes(userF));

  const lbl = document.getElementById('audit-count-label');
  if (lbl) lbl.textContent = `${filtered.length} жазба`;
  renderAuditTable(filtered);
}

function renderAuditTable(items) {
  const tbody = document.getElementById('audit-tbody');
  if (!tbody) return;
  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted)">Деректер жоқ</td></tr>`;
    return;
  }

  const ACTION_META = {
    sync:          { icon: 'fa-sync',        label: 'Синхронизация',   color: '#1565C0', bg: '#E3F2FD' },
    review:        { icon: 'fa-user-check',  label: 'Шешім қабылдады', color: '#E65100', bg: '#FFF3E0' },
    login:         { icon: 'fa-sign-in-alt', label: 'Жүйеге кірді',   color: '#1B5E20', bg: '#E8F5E9' },
    shortlist_add: { icon: 'fa-star',        label: 'Shortlist-ке',    color: '#7B1FA2', bg: '#EDE7F6' },
    export:        { icon: 'fa-download',    label: 'Экспорт',         color: '#9E9E9E', bg: '#F5F5F5' },
  };

  tbody.innerHTML = items.slice(0, 200).map(item => {
    const meta = ACTION_META[item.action] || { icon: 'fa-circle', label: item.action || '—', color: '#9E9E9E', bg: '#F5F5F5' };
    const ts   = item.ts ? new Date(item.ts) : null;
    const timeStr = ts ? `${ts.toLocaleDateString('kk-KZ')} ${ts.toLocaleTimeString('kk-KZ', { hour: '2-digit', minute: '2-digit' })}` : '—';
    const relTime = ts ? getRelativeTime(ts) : '';

    // Build details cell
    let details = '—';
    if (item.action === 'sync' && item.count != null) {
      details = `<span style="font-weight:600">${item.count.toLocaleString()}</span> өтінім жүктелді`;
    } else if (item.action === 'review') {
      const statusColors = { 'approve':'var(--success)', 'reject':'var(--danger)', 'pending':'var(--warning)' };
      const sc = statusColors[item.status] || 'var(--text-secondary)';
      details = item.id
        ? `ID: <b>${item.id}</b> → <span style="color:${sc};font-weight:600">${item.status||'—'}</span>${item.comment ? ` · «${item.comment.slice(0,40)}»` : ''}`
        : '—';
    } else if (item.action === 'login') {
      details = `IP: ${item.ip || '—'}`;
    }

    // AI vs Human comparison
    let aiHuman = '—';
    if (item.action === 'review' && item.aiScore != null) {
      const agree = (item.aiScore >= 65 && item.humanDecision !== 'reject') || (item.aiScore < 65 && item.humanDecision === 'reject');
      const col   = agree ? 'var(--success)' : 'var(--warning)';
      aiHuman = `<span style="color:${col};font-size:11px">${agree ? '✅ Сәйкес' : '⚠️ Алшақтық'}</span><br>
        <span style="font-size:10px;color:var(--text-muted)">AI балл: ${item.aiScore}</span>`;
    }

    return `<tr style="border-bottom:1px solid var(--border)" onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background=''">
      <td style="padding:10px 12px;white-space:nowrap">
        <div style="font-size:12px;font-weight:600">${timeStr}</div>
        <div style="font-size:10px;color:var(--text-muted)">${relTime}</div>
      </td>
      <td style="padding:10px 12px">
        <span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:20px;background:${meta.bg};color:${meta.color};font-size:11px;font-weight:600">
          <i class="fas ${meta.icon}" style="font-size:10px"></i> ${meta.label}
        </span>
      </td>
      <td style="padding:10px 12px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="width:28px;height:28px;border-radius:50%;background:var(--primary);color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            ${(item.user || '?').charAt(0).toUpperCase()}
          </span>
          <span style="font-size:13px;font-weight:500">${item.user || '—'}</span>
        </div>
      </td>
      <td style="padding:10px 12px;font-size:12px;color:var(--text-secondary)">${details}</td>
      <td style="padding:10px 12px;font-size:12px">${aiHuman}</td>
    </tr>`;
  }).join('');
}

function getRelativeTime(date) {
  const diff = Date.now() - date.getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'Дәл қазір';
  if (mins < 60)  return `${mins} мин бұрын`;
  if (hours < 24) return `${hours} сағ бұрын`;
  return `${days} күн бұрын`;
}

function exportAuditCSV() {
  if (!_auditAll.length) { showToast('Деректер жоқ', 'warning'); return; }
  const header = 'Уақыт,Әрекет,Қолданушы,ID,Мәртебе,AI балл,Сан';
  const rows = _auditAll.map(i =>
    [i.ts, i.action, i.user, i.id || '', i.status || '', i.aiScore || '', i.count || '']
      .map(v => `"${String(v).replace(/"/g,'""')}"`)
      .join(',')
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `AgriScore_Audit_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
  showToast('CSV жүктелді ✅', 'success');
}

// ─── REAL-TIME SYNC INDICATOR ─────────────────────────────────────────────────
function initSyncIndicator() {
  updateSyncIndicator();
  setInterval(updateSyncIndicator, 30000); // refresh every 30s
}

function updateSyncIndicator() {
  fetch('/api/analytics')
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      const dot   = document.getElementById('sync-dot');
      const label = document.getElementById('sync-label');
      if (!dot || !label) return;
      if (data && data.total > 0) {
        dot.style.background = '#4CAF50';
        dot.style.boxShadow  = '0 0 0 2px rgba(76,175,80,0.3)';
        label.textContent    = `${data.total.toLocaleString()} өтінім синхр.`;
        label.title          = `Shortlist: ${data.shortlisted} · Тексерілді: ${data.reviewed}`;
      } else {
        dot.style.background = '#9E9E9E';
        dot.style.boxShadow  = 'none';
        label.textContent    = 'Деректер жоқ';
      }
    })
    .catch(() => {
      const dot = document.getElementById('sync-dot');
      if (dot) { dot.style.background = '#F44336'; dot.style.boxShadow = 'none'; }
      const label = document.getElementById('sync-label');
      if (label) label.textContent = 'Сервер қолжетімді емес';
    });
}
