'use strict';

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
function initSettings() {
  // Tabs
  document.querySelectorAll('#page-settings .tab-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#page-settings .tab-btn').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('#page-settings .tab-content').forEach(c=>c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab)?.classList.add('active');
    };
  });

  // AI status
  fetch('/api/gemini-status').then(r=>r.json()).then(s => {
    const status = document.getElementById('api-key-status');
    if (status) status.innerHTML = s.hasKey
      ? `<span style="color:var(--success);font-size:12px">✅ ${s.provider==='alem'?'Alem LLM (alemllm)':'Google Gemini 2.5 Flash'} — .env файлында орнатылды</span>`
      : '<span style="color:var(--text-muted);font-size:12px">⚠️ Demo режим — .env файлына API кілт қосыңыз</span>';
  }).catch(()=>{});

  // Weight sliders
  const container = document.getElementById('weight-sliders');
  if (container) {
    const weights = loadWeights();
    const wDefs = [
      {key:'headCount',          label:'Поголовье / масштаб хозяйства',     color:'#1B5E20', hint:'headCount = сома ÷ норматив (§3 Правил)'},
      {key:'directionPriority',  label:'Стратегиялық бағыт',                color:'#2E7D32', hint:'Скотоводство > Птицеводство > Овцеводство'},
      {key:'subsidyCategory',    label:'Субсидия категориясы',               color:'#388E3C', hint:'Племенная покупка > Селекция > Производство'},
      {key:'regionalComparison', label:'Аймақтық салыстыру',                 color:'#F9A825', hint:'Аймақ медианымен салыстыру'},
    ];
    container.innerHTML = wDefs.map(w => `
      <div class="weight-item">
        <div class="weight-label">
          <span>${w.label}</span>
          <span class="weight-val" id="wv-${w.key}">${Math.round(weights[w.key]*100)}%</span>
        </div>
        <input type="range" class="form-range" id="ws-${w.key}" min="0" max="100" value="${Math.round((weights[w.key] ?? DEFAULT_WEIGHTS[w.key] ?? 0.2)*100)}"
          oninput="document.getElementById('wv-${w.key}').textContent=this.value+'%'; updateWeightTotal()">
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${w.hint}</div>
      </div>`).join('');
    updateWeightTotal();
  }

  // Threshold
  const th = document.getElementById('scoring-threshold');
  const thv = document.getElementById('threshold-val');
  if (th) { th.value = AppState.shortlistThreshold; if(thv) thv.textContent = AppState.shortlistThreshold; }

  // Theme
  const isDark = document.body.classList.contains('dark-mode');
  document.getElementById('theme-light')?.classList.toggle('active', !isDark);
  document.getElementById('theme-dark')?.classList.toggle('active', isDark);

  // Users table
  const ubody = document.getElementById('users-tbody');
  if (ubody) ubody.innerHTML = [
    {name:'Ахметов А.',  role:'Администратор', last:'28.03.2025 09:15'},
    {name:'Сейітова Г.', role:'Сарапшы',       last:'27.03.2025 14:30'},
    {name:'Нұрланов М.', role:'Оператор',       last:'26.03.2025 11:00'},
  ].map(u=>`<tr>
    <td style="padding:12px 14px;font-weight:600">${u.name}</td>
    <td style="padding:12px 14px"><span class="badge badge-info">${u.role}</span></td>
    <td style="padding:12px 14px;font-size:12px;color:var(--text-muted)">${u.last}</td>
    <td style="padding:12px 14px"><div class="row-actions" style="opacity:1"><button class="action-btn"><i class="fas fa-edit"></i></button><button class="action-btn danger"><i class="fas fa-trash"></i></button></div></td>
  </tr>`).join('');
}

function toggleAdaptiveWeights(useAdaptive) {
  const result = calibrateAdaptiveWeights(AppState.applicants);
  const panel = document.getElementById('adaptive-weights-panel');
  const manualPanel = document.getElementById('weight-sliders');
  if (useAdaptive) {
    if (!result.success) { showToast('⚠️ ' + result.reason, 'warning'); document.getElementById('weight-mode-manual').checked = true; return; }
    if (panel) {
      panel.innerHTML = Object.entries(result.explanations).map(([k,txt]) => {
        const base = Math.round(result.base[k]*100);
        const adap = Math.round(result.adaptive[k]*100);
        const diff = adap - base;
        const arrow = diff > 0 ? `<span style="color:var(--success)">▲+${diff}%</span>` : diff < 0 ? `<span style="color:var(--danger)">▼${diff}%</span>` : '<span style="color:var(--text-muted)">—</span>';
        return `<div style="padding:10px 0;border-bottom:1px solid var(--border)">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="font-size:13px;font-weight:600">${txt.split(':')[0]}</span>
            <span style="font-size:13px">${base}% → <b>${adap}%</b> ${arrow}</span>
          </div>
          <div style="font-size:11px;color:var(--text-muted)">${txt.split(':')[1]||''}</div>
        </div>`;
      }).join('') + `<button class="btn btn-primary mt-4" onclick="applyAdaptiveWeights()"><i class="fas fa-check"></i> Адаптивті салмақты қолдану</button>`;
      panel.style.display = 'block';
    }
    if (manualPanel) manualPanel.style.opacity = '0.4';
  } else {
    if (panel) panel.style.display = 'none';
    if (manualPanel) manualPanel.style.opacity = '1';
  }
}

function applyAdaptiveWeights() {
  const result = calibrateAdaptiveWeights(AppState.applicants);
  if (!result.success) { showToast('⚠️ ' + result.reason, 'warning'); return; }
  localStorage.setItem('agri_weights', JSON.stringify(result.adaptive));
  AppState.scoringWeights = result.adaptive;
  showLoading('Адаптивті салмақ қолданылуда...');
  setTimeout(() => { AppState.recalculateScores(); hideLoading(); showToast('✅ Адаптивті салмақ қолданылды', 'success'); initSettings(); }, 800);
}

function updateWeightTotal() {
  const keys = ['headCount','directionPriority','subsidyCategory','regionalComparison'];
  const total = keys.reduce((s,k) => { const el=document.getElementById(`ws-${k}`); return s+(el?parseInt(el.value):0); }, 0);
  const tw = document.getElementById('weight-total'); if(tw) tw.textContent = total+'%';
  const wrap = document.getElementById('weight-total-wrap'); if(wrap) wrap.classList.toggle('error', total!==100);
}

function saveAndRecalculate() {
  const keys = ['headCount','directionPriority','subsidyCategory','regionalComparison'];
  let total = 0;
  const weights = {};
  keys.forEach(k => { const v=parseInt(document.getElementById(`ws-${k}`)?.value||0); weights[k]=v/100; total+=v; });
  if (total !== 100) { showToast('⚠️ Үлестер жиыны 100% болуы керек!', 'warning'); return; }
  localStorage.setItem('agri_weights', JSON.stringify(weights));
  const th = parseInt(document.getElementById('scoring-threshold')?.value||65);
  localStorage.setItem('agri_threshold', th);
  AppState.scoringWeights = weights; AppState.shortlistThreshold = th;
  showLoading('Қайта есептелуде...');
  setTimeout(() => { AppState.recalculateScores(); hideLoading(); showToast(`✅ Сақталды. ${formatNumber(AppState.applicants.length)} өтінімдер қайта бағаланды`, 'success'); }, 800);
}

function saveAPIKey() {
  showModal(
    '<i class="fas fa-info-circle" style="color:var(--info)"></i> API кілтін қалай орнату',
    `<div style="font-size:13px;line-height:1.8">
      <p>API кілті қауіпсіздік үшін серверде (.env файлында) сақталады.</p><br>
      <p><b>1.</b> <code style="background:var(--bg);padding:2px 6px;border-radius:4px">.env</code> файлын ашыңыз</p>
      <p><b>2.</b> <code style="background:var(--bg);padding:2px 6px;border-radius:4px">ALEM_API_KEY=</code> немесе <code>GEMINI_API_KEY=</code> жолына кілтіңізді қосыңыз</p>
      <p><b>3.</b> Серверді қайта іске қосыңыз: <code style="background:var(--bg);padding:2px 6px;border-radius:4px">node server.js</code></p>
    </div>`,
    '<button class="btn btn-primary" onclick="closeModal()">Түсінікті</button>', 'modal-sm'
  );
}

function testAPIKey() {
  const btn = document.getElementById('test-api-btn');
  if (btn) { btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Тексерілуде...'; }
  fetch('/api/gemini-status')
    .then(r => r.json())
    .then(s => {
      const status = document.getElementById('api-key-status');
      if (s.hasKey) {
        showToast(`✅ ${s.provider==='alem'?'Alem LLM':'Gemini'} API кілті орнатылған`, 'success');
        if (status) status.innerHTML = `<span style="color:var(--success);font-size:12px">✅ ${s.provider==='alem'?'Alem LLM (alemllm)':'Gemini'} — .env файлында</span>`;
        return callGemini('Test', 'score').then(() => showToast('✅ AI байланысы жұмыс жасайды!', 'success'));
      } else {
        showToast('⚠️ API кілт орнатылмаған — demo режим', 'warning');
        if (status) status.innerHTML = '<span style="color:var(--text-muted);font-size:12px">⚠️ Demo режим — .env файлына кілт қосыңыз</span>';
      }
    })
    .catch(err => showToast('❌ '+err.message, 'error'))
    .finally(() => { if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-wifi"></i> Тексеру';} });
}

function toggleAPIKeyVisibility() {
  const inp  = document.getElementById('gemini-api-key');
  const icon = document.getElementById('api-key-eye');
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  if (icon) icon.className = inp.type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
}

function setTheme(theme) {
  document.body.classList.toggle('dark-mode', theme==='dark');
  localStorage.setItem('agri_theme', theme);
  document.getElementById('theme-light')?.classList.toggle('active', theme==='light');
  document.getElementById('theme-dark')?.classList.toggle('active', theme==='dark');
}

function clearAllData() {
  showConfirm('Деректерді тазарту', 'Барлық деректер жойылады! Бұл әрекетті қайтару мүмкін емес.', () => {
    AppState.clearAll(); showToast('✅ Деректер тазартылды', 'success');
  });
}
