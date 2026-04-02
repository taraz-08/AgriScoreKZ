'use strict';

// ─── UPLOAD PAGE ──────────────────────────────────────────────────────────────
function initUpload() {
  const zone = document.getElementById('upload-zone');
  const fi   = document.getElementById('file-input');
  if (!zone || !fi) return;
  zone.onclick    = () => fi.click();
  zone.ondragover = e => { e.preventDefault(); zone.classList.add('drag-active'); };
  zone.ondragleave = () => zone.classList.remove('drag-active');
  zone.ondrop     = e => { e.preventDefault(); zone.classList.remove('drag-active'); if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); };
  fi.onchange     = e => { if(e.target.files[0]) handleFile(e.target.files[0]); };
  renderUploadHistory();
}

function handleFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  document.getElementById('upload-file-info')?.classList.remove('hidden');
  const fn = document.getElementById('upload-file-name'); if(fn) fn.textContent = file.name;
  const fs = document.getElementById('upload-file-size'); if(fs) fs.textContent = (file.size/1024).toFixed(1)+' KB';

  const onOk = (apps, colMap, headers) => {
    window._uploadHeaders   = headers;
    window._pendingColMap   = { ...colMap };
    window._pendingRawRows  = apps;
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
  const tbody   = document.getElementById('column-mapping-tbody'); if(!tbody) return;
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
    AppState.applicants.sort((a,b)=>(b.hybridScore||b.totalScore)-(a.hybridScore||a.totalScore));
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
