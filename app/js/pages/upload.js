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
  // Real column labels matching the sample file and actual subsidy registry
  const sys = {
    region:         'Облыс / Область',
    district:       'Аудан / Район',
    direction:      'Бағыт / Направление',
    normative:      'Норматив (₸)',
    requestedAmount:'Причитающаяся сумма (₸)',
    subsidyType:    'Наименование субсидирования',
    applicationDate:'Дата поступления',

    appNum:         'Номер заявки',
    iin:            'ЖСН / ИИН (қосымша)',
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

// ─── SAMPLE FILE DOWNLOAD ─────────────────────────────────────────────────────
function downloadSampleFile() {
  // 5 realistic sample rows matching the real dataset format (subsidy.plem.kz 2025)
  const sampleRows = [
    {
      '№ п/п': 1,
      'Дата поступления': '21.01.2025',
      'Область': 'Акмолинская область',
      'Акимат': 'ГУ "Управление сельского хозяйства Акмолинской области"',
      'Номер заявки': '01300100258072',
      'Направление': 'Субсидирование в скотоводстве',
      'Наименование субсидирования': 'Заявка на получение субсидий на ведение селекционной и племенной работы с племенным маточным поголовьем крупного рогатого скота',
      'Норматив (₸)': 15000,
      'Причитающаяся сумма (₸)': 4635000,
      'Район хозяйства': 'Целиноградский район',
    },
    {
      '№ п/п': 2,
      'Дата поступления': '31.01.2025',
      'Область': 'Костанайская область',
      'Акимат': 'ГУ "Управление сельского хозяйства Костанайской области"',
      'Номер заявки': '01300100258200',
      'Направление': 'Субсидирование в скотоводстве',
      'Наименование субсидирования': 'Заявка на получение субсидий за приобретение отечественного племенного маточного поголовья крупного рогатого скота (мясных и мясо-молочных пород)',
      'Статус заявки': 'Исполнена',
      'Норматив (₸)': 150000,
      'Причитающаяся сумма (₸)': 3000000,
      'Район хозяйства': 'Денисовский район',
    },
    {
      '№ п/п': 3,
      'Дата поступления': '05.02.2025',
      'Область': 'Северо-Казахстанская область',
      'Акимат': 'ГУ "Управление сельского хозяйства СКО"',
      'Номер заявки': '01300100258350',
      'Направление': 'Субсидирование в птицеводстве',
      'Наименование субсидирования': 'Заявка на получение субсидий на удешевление стоимости производства мяса птицы (мясного направления)',
      'Норматив (₸)': 60,
      'Причитающаяся сумма (₸)': 1920000,
      'Район хозяйства': 'Есильский район',
    },
    {
      '№ п/п': 4,
      'Дата поступления': '12.02.2025',
      'Область': 'Алматинская область',
      'Акимат': 'ГУ "Управление сельского хозяйства Алматинской области"',
      'Номер заявки': '01300100258490',
      'Направление': 'Субсидирование в овцеводстве',
      'Наименование субсидирования': 'Заявка на получение субсидий за приобретение отечественных племенных овец',
      'Статус заявки': 'Исполнена',
      'Норматив (₸)': 26000,
      'Причитающаяся сумма (₸)': 5200000,
      'Район хозяйства': 'Карасайский район',
    },
    {
      '№ п/п': 5,
      'Дата поступления': '20.02.2025',
      'Область': 'Восточно-Казахстанская область',
      'Акимат': 'ГУ "Управление сельского хозяйства ВКО"',
      'Номер заявки': '01300100258600',
      'Направление': 'Субсидирование затрат по искусственному осеменению',
      'Наименование субсидирования': 'Заявка на получение субсидий за приобретенное двуполое семя племенных быков молочного направления',
      'Норматив (₸)': 5000,
      'Причитающаяся сумма (₸)': 2500000,
      'Район хозяйства': 'Тарбагатайский район',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleRows);
  // Column widths
  ws['!cols'] = [
    {wch:6},{wch:18},{wch:28},{wch:50},{wch:18},{wch:32},{wch:80},{wch:14},{wch:22},{wch:24}
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Субсидии 2025');
  XLSX.writeFile(wb, 'agriscore_sample_upload.xlsx');
  showToast('✅ Үлгі файл жүктелді — agriscore_sample_upload.xlsx', 'success');
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
