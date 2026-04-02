'use strict';

// ─── APPLICANTS PAGE ──────────────────────────────────────────────────────────
const appState = { filtered:[], page:1, perPage:25, sortCol:'hybridScore', sortDir:'desc', selected:new Set() };

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
  const q          = (document.getElementById('app-search')?.value||'').toLowerCase();
  const region     = document.getElementById('filter-region')?.value||'';
  const district   = document.getElementById('filter-district')?.value||'';
  const pType      = document.getElementById('filter-type')?.value||'';
  const scoreRange = document.getElementById('filter-score')?.value||'';
  const status     = document.getElementById('filter-status')?.value||'';
  const cluster    = document.getElementById('filter-cluster')?.value||'';
  const anomaly    = document.getElementById('filter-anomaly')?.value||'';

  appState.filtered = AppState.applicants.filter(a => {
    if (q && !( (a.appNum||'').toLowerCase().includes(q) || (a.name||'').toLowerCase().includes(q) || (a.iin||'').includes(q) || (a.region||'').toLowerCase().includes(q) || (a.direction||'').toLowerCase().includes(q) )) return false;
    if (region   && a.region !== region)           return false;
    if (district && a.district !== district)       return false;
    if (pType    && a.productionType !== pType)    return false;
    if (status   && a.recommendation !== status)   return false;
    if (cluster  && a.clusterLabel !== cluster)    return false;
    if (anomaly) {
      const an = detectAnomalies(a);
      if (anomaly === 'high' && an.anomalyRisk !== 'Жоғары') return false;
      if (anomaly === 'any'  && an.anomalyRisk === 'Жоқ')    return false;
    }
    if (scoreRange) {
      const [mn, mx] = scoreRange.split('-').map(Number);
      const sc = a.hybridScore || a.totalScore;
      if (sc < mn || sc > (mx||100)) return false;
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
    tbody.innerHTML = `<tr><td colspan="11"><div class="empty-state">
      <div class="empty-icon">🔍</div>
      <div class="empty-title">Нәтиже табылмады</div>
      <div class="empty-subtitle">Іздеу немесе сүзгі параметрлерін өзгертіп көріңіз</div>
      <button class="btn btn-outline" onclick="resetApplicantFilters()">Сүзгіні тазарту</button>
    </div></td></tr>`;
  } else {
    tbody.innerHTML = rows.map((a, i) => {
      const score = a.hybridScore || a.totalScore;
      return `
      <tr class="${selected.has(a.id)?'selected':''}" style="animation-delay:${i*30}ms">
        <td style="padding:10px 6px"><input type="checkbox" class="row-cb" data-id="${a.id}" ${selected.has(a.id)?'checked':''} onchange="toggleSelect('${a.id}',this.checked)" style="accent-color:var(--primary);cursor:pointer"></td>
        <td style="padding:10px 6px;color:var(--text-muted);font-size:12px;font-weight:600">${a.rank}</td>
        <td>
          <div style="font-family:monospace;font-weight:700;font-size:13px;letter-spacing:0.3px;color:var(--text)">${a.appNum || a.id}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${a.region}</div>
        </td>
        <td><div style="font-size:13px;font-weight:500">${a.district}</div><div style="font-size:11px;color:var(--text-muted);margin-top:2px">${(a.direction||a.productionType||'').replace('Субсидирование ','').replace('в ','').slice(0,22)}</div></td>
        <td><span class="badge ${getScoreBadgeClass(score)} ${score>=90?'badge-pulse':''}" style="font-size:14px;padding:5px 10px;font-weight:800" title="Гибрид: ${a.hybridScore||'—'} / Бизнес: ${a.totalScore}">${score}</span></td>
        <td><span class="badge ${a.clusterBadge||'cluster-mid'}" style="font-size:11px;white-space:nowrap;padding:4px 8px">${a.clusterIcon||'📊'} ${a.clusterLabel||'—'}</span></td>
        <td style="font-size:13px;font-weight:700;white-space:nowrap">${a.successProb ? '<span style="color:' + (a.successProb.probability>=70?'var(--success)':a.successProb.probability>=50?'var(--warning)':'var(--danger)') + '">' + a.successProb.probability + '%</span>' : '—'}</td>
        <td style="font-size:13px;white-space:nowrap">${getRiskDot(a.riskLevel)} ${a.riskLevel}</td>
        <td><span class="badge ${getStatusBadgeClass(a.recommendation)}" style="font-size:11px;padding:4px 8px">${a.recommendation}</span></td>
        <td style="color:var(--text-muted);font-size:12px;white-space:nowrap">${a.applicationDate}</td>
        <td>
          <div class="row-actions" style="opacity:1;gap:4px">
            <button class="action-btn" onclick="navigateTo('applicants/${a.id}')" title="Көру"><i class="fas fa-eye"></i></button>
            <button class="action-btn success" onclick="quickAddShortlist('${a.id}')" title="Shortlist"><i class="fas fa-star"></i></button>
            <button class="action-btn" onclick="showScoreQuick('${a.id}')" title="Балл"><i class="fas fa-chart-bar"></i></button>
          </div>
        </td>
      </tr>`;
    }).join('');
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
  ['app-search','filter-region','filter-district','filter-type','filter-score','filter-status'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
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

function changeOriginalStatus(id, status) {
  const a = AppState.getApplicant(id);
  if (!a) return;
  a.originalStatus = status;
  AppState.save();
}

function showScoreQuick(id) {
  const a = AppState.getApplicant(id);
  if (!a) return;
  const score = a.hybridScore || a.totalScore;
  showModal(`📊 ${a.name}`,
    `<div style="text-align:center;padding:16px">
      ${buildGaugeSVG(score, 160)}
      <div style="font-size:36px;font-weight:800;color:${getScoreColor(score)};margin-top:-8px">${score}</div>
      <div style="font-size:12px;color:var(--text-muted)">Рейтинг: #${a.rank} / ${AppState.applicants.length}</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:12px">
      ${[{n:'Поголовье',s:a.factors?.f1||0,mx:30},{n:'Бағыт',s:a.factors?.f2||0,mx:25},{n:'Категория',s:a.factors?.f3||0,mx:20},{n:'Аймақ',s:a.factors?.f4||0,mx:15}]
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
  setTimeout(() => animateGauge(score), 200);
}
