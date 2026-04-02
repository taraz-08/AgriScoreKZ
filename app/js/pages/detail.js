'use strict';

// ─── APPLICANT DETAIL PAGE ────────────────────────────────────────────────────
function initApplicantDetail(id) {
  const a = AppState.getApplicant(id);
  if (!a) { navigateTo('applicants'); return; }

  document.getElementById('breadcrumb-name').textContent = a.name;
  document.getElementById('detail-avatar').textContent = a.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  document.getElementById('detail-name').textContent = a.name;
  document.getElementById('detail-iin-label').textContent = `ЖСН: ${a.iin} | БИН: ${a.bin||'—'}`;
  document.getElementById('detail-location').innerHTML = `<i class="fas fa-map-marker-alt" style="color:var(--primary)"></i> ${a.region}, ${a.district}`;
  document.getElementById('detail-badges').innerHTML = `<span class="badge badge-info">${a.productionType}</span> <span class="badge ${getStatusBadgeClass(a.recommendation)}">${a.recommendation}</span>`;
  document.getElementById('detail-date').textContent = `📅 ${a.applicationDate}`;
  document.getElementById('detail-rank').textContent = `Рейтинг: #${a.rank} / ${AppState.applicants.length}`;

  const dq = calcDataQuality(a);
  const an = detectAnomalies(a);
  const qaBadges = document.getElementById('detail-qa-badges');
  if (qaBadges) {
    const qColor = dq.completeness>=90?'var(--success)':dq.completeness>=70?'var(--warning)':'var(--danger)';
    const anColor = an.anomalyRisk==='Жоқ'||an.anomalyRisk==='Төмен'?'var(--success)':an.anomalyRisk==='Орташа'?'var(--warning)':'var(--danger)';
    qaBadges.innerHTML = `
      <span class="quality-pill" style="border-color:${qColor};color:${qColor}" title="Деректер толықтығы">
        <i class="fas fa-database"></i> ${dq.completeness}% толық
      </span>
      <span class="quality-pill" style="border-color:${anColor};color:${anColor}" title="Аномалия тәуекелі">
        <i class="fas fa-shield-alt"></i> ${an.anomalyRisk==='Жоқ'?'Норма':an.anomalyRisk+' тәуекел'}
      </span>`;
  }

  const gc = document.getElementById('detail-gauge-container');
  if (gc) {
    const score = a.hybridScore || a.totalScore;
    gc.innerHTML = `${buildGaugeSVG(score, 180)}
      <div style="text-align:center;margin-top:-8px">
        <div id="detail-score-num" style="font-size:40px;font-weight:800;color:${getScoreColor(score)}">0</div>
        <div style="font-size:12px;color:var(--text-muted)">Балл</div>
      </div>`;
    animateCounter(document.getElementById('detail-score-num'), score);
    setTimeout(() => animateGauge(score), 200);
  }

  const slBtn = document.getElementById('detail-shortlist-btn');
  if (slBtn) {
    if (AppState.isInShortlist(id)) {
      slBtn.innerHTML = `<i class="fas fa-check"></i> Shortlist-те`;
      slBtn.className = 'btn btn-outline btn-sm'; slBtn.disabled = true;
    } else {
      slBtn.innerHTML = `<i class="fas fa-plus"></i> Shortlist-ке қосу`;
      slBtn.className = 'btn btn-primary btn-sm'; slBtn.disabled = false;
      slBtn.onclick = () => { AppState.addToShortlist(a); showToast('✅ Shortlist-ке қосылды','success'); initApplicantDetail(id); };
    }
  }

  const aiBtn = document.getElementById('detail-ai-btn');
  if (aiBtn) aiBtn.onclick = () => {
    const prompt = `Қазақстан ауылшаруашылығы субсидия жүйесі. Өтінімдер: ${a.name}, облыс: ${a.region}, өндіріс: ${a.productionType}, жер: ${a.landArea} га, балл: ${a.totalScore}/100. 5 фактор бойынша баллды қазақша түсіндіріңіз.`;
    showAIModal('🤖 AI Скор түсіндірмесі', prompt, 'score');
  };

  document.querySelectorAll('#page-applicant-detail .tab-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#page-applicant-detail .tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('#page-applicant-detail .tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const tgt = document.getElementById(btn.dataset.tab);
      if (tgt) { tgt.classList.add('active'); renderDetailTab(btn.dataset.tab, a); }
    };
  });

  renderDetailTab('tab-scoring', a);
}

function renderDetailTab(tab, a) {
  if (tab === 'tab-scoring')    renderScoringTab(a);
  else if (tab === 'tab-risk')       renderRiskTab(a);
  else if (tab === 'tab-whatif')     renderWhatIfTab(a);
  else if (tab === 'tab-data')       renderDataTab(a);
  else if (tab === 'tab-history')    renderHistoryTab(a);
  else if (tab === 'tab-docs')       renderDocsTab(a);
  else if (tab === 'tab-comments')   renderCommentsTab(a);
  else if (tab === 'tab-commission') renderCommissionTab(a);
}

// ─── SCORING TAB ─────────────────────────────────────────────────────────────
function renderScoringTab(a) {
  const inner = document.getElementById('scoring-tab-inner');
  if (!inner) return;

  const factors = [
    { name:'Субсидия тарихы', weight:'25%', score:a.factors?.f1||0, max:25, items:[
      {ok:a.breakdown?.hasPreviousSubsidy,text:'Алдыңғы субсидия бар',pts:10},
      {ok:a.breakdown?.usedFullSubsidy,text:'100% игерілген',pts:8},
      {ok:a.breakdown?.reportsOnTime,text:'Есептер уақытылы',pts:7},
      {ok:a.breakdown?.noViolations,text:'Бұзушылықтар жоқ',pts:5},
    ]},
    { name:'Өнімділік', weight:'30%', score:a.factors?.f2||0, max:30, items:[
      {ok:a.breakdown?.aboveAvgYield,text:'Орташадан жоғары өнімділік',pts:12},
      {ok:a.breakdown?.positiveTrend,text:'3 жылдық өсу тренді',pts:10},
      {ok:a.breakdown?.costEfficient,text:'Шығын тиімділігі',pts:8},
    ]},
    { name:'Шаруашылық профилі', weight:'20%', score:a.factors?.f3||0, max:20, items:[
      {ok:a.breakdown?.landAreaOk,text:`Жер алаңы оңтайлы (${a.landArea} га)`,pts:8},
      {ok:a.breakdown?.equipmentOk,text:`Техника саны >5 (${a.equipmentCount})`,pts:7},
      {ok:a.breakdown?.hasIrrigation,text:'Суландыру жүйесі',pts:5},
    ]},
    { name:'Әлеуметтік-экономикалық', weight:'15%', score:a.factors?.f4||0, max:15, items:[
      {ok:a.breakdown?.manyEmployees,text:`Қызметкерлер >10 (${a.employees} адам)`,pts:6},
      {ok:a.breakdown?.isRural,text:'Ауылдық аймақ',pts:5},
      {ok:a.breakdown?.isMinorityRegion,text:'Аз тараған аймақ',pts:4},
    ]},
    { name:'Тәуекел бағасы', weight:'10%', score:a.factors?.f5||0, max:10, items:[
      {ok:a.breakdown?.cleanCreditHistory,text:'Таза несие тарихы',pts:4},
      {ok:a.breakdown?.noTaxDebt,text:'Салық берешегі жоқ',pts:4},
      {ok:a.breakdown?.noLegalDisputes,text:'Сот дауы жоқ',pts:2},
    ]},
  ];

  const dq = calcDataQuality(a);
  const an = detectAnomalies(a);

  const allItems = [
    {ok:a.breakdown?.hasPreviousSubsidy, name:'Алдыңғы субсидия бар', pts:10},
    {ok:a.breakdown?.usedFullSubsidy,    name:'100% игерілген',        pts:8},
    {ok:a.breakdown?.reportsOnTime,      name:'Есептер уақытылы',      pts:7},
    {ok:a.breakdown?.noViolations,       name:'Бұзушылықтар жоқ',      pts:5},
    {ok:a.breakdown?.aboveAvgYield,      name:'Өнімділік орташадан жоғары', pts:12},
    {ok:a.breakdown?.positiveTrend,      name:'3 жылдық өсу тренді',   pts:10},
    {ok:a.breakdown?.costEfficient,      name:'Шығын тиімділігі',       pts:8},
    {ok:a.breakdown?.landAreaOk,         name:'Жер алаңы оңтайлы',     pts:8},
    {ok:a.breakdown?.equipmentOk,        name:'Техника >5 бірлік',      pts:7},
    {ok:a.breakdown?.hasIrrigation,      name:'Суландыру бар',          pts:5},
    {ok:a.breakdown?.manyEmployees,      name:'Қызметкерлер >10',       pts:6},
    {ok:a.breakdown?.isRural,            name:'Ауылдық аймақ',          pts:5},
    {ok:a.breakdown?.cleanCreditHistory, name:'Таза несие тарихы',      pts:4},
    {ok:a.breakdown?.noTaxDebt,          name:'Салық берешегі жоқ',     pts:4},
    {ok:a.breakdown?.noLegalDisputes,    name:'Сот дауы жоқ',           pts:2},
  ];
  const positives = allItems.filter(i => i.ok).sort((a,b) => b.pts - a.pts).slice(0, 4);
  const negatives = allItems.filter(i => !i.ok).sort((a,b) => b.pts - a.pts).slice(0, 4);

  const isRec = a.totalScore >= 65, isRev = a.totalScore >= 50 && a.totalScore < 65;
  const recCls = isRec?'rec-green':isRev?'rec-yellow':'rec-red';
  const recIcon = isRec?'✅':isRev?'⚠️':'❌';
  const recTitle = isRec?'ҰСЫНЫЛАДЫ':isRev?'ТЕКСЕРУ ҚАЖЕТ':'ҰСЫНЫЛМАЙДЫ';
  const recText = isRec
    ? `${a.name} ${a.totalScore} балл жинады. Барлық факторлар жеткілікті нәтиже көрсетті.`
    : isRev ? `${a.name} орташа нәтиже (${a.totalScore} балл). Қосымша тексеру қажет.`
    : `${a.name} жеткіліксіз балл (${a.totalScore}). Субсидия беруге ұсынылмайды.`;

  inner.innerHTML = `
    <div class="alert alert-success mb-4" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div>💡 Балл ${factors.length} фактор бойынша есептелді — <b>${a.totalScore}/100</b>
        &nbsp;·&nbsp; Деректер: <b style="color:${dq.completeness>=80?'var(--success)':'var(--warning)'}">${dq.completeness}%</b>
        &nbsp;·&nbsp; Аномалия: <b style="color:${an.anomalyRisk==='Жоқ'||an.anomalyRisk==='Төмен'?'var(--success)':an.anomalyRisk==='Орташа'?'var(--warning)':'var(--danger)'}">${an.anomalyRisk==='Жоқ'?'Норма':an.anomalyRisk}</b>
      </div>
      <button id="ai-score-btn" class="btn btn-sm" style="background:#7B1FA2;color:#fff;white-space:nowrap" onclick="requestAIScoring('${a.id}')">
        <i class="fas fa-robot"></i> AI Бағалау
      </button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
      <div class="card" style="padding:14px;border-left:3px solid var(--success)">
        <div style="font-size:11px;font-weight:700;color:var(--success);margin-bottom:8px;text-transform:uppercase">✅ Күшті факторлар</div>
        ${positives.length ? positives.map(i=>`<div style="font-size:12px;display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--border)"><span>${i.name}</span><b style="color:var(--success)">+${i.pts}</b></div>`).join('') : '<div style="font-size:12px;color:var(--text-muted)">Жоқ</div>'}
      </div>
      <div class="card" style="padding:14px;border-left:3px solid var(--danger)">
        <div style="font-size:11px;font-weight:700;color:var(--danger);margin-bottom:8px;text-transform:uppercase">❌ Жетіспейтін факторлар</div>
        ${negatives.length ? negatives.map(i=>`<div style="font-size:12px;display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--border)"><span>${i.name}</span><b style="color:var(--danger)">-${i.pts}</b></div>`).join('') : '<div style="font-size:12px;color:var(--text-muted)">Жоқ</div>'}
      </div>
    </div>
    ${(function(){
      const sp = a.successProb || calcSuccessProbability(a);
      const clr = a.clusterColor || '#1565C0';
      const probColor = sp.probability>=70?'var(--success)':sp.probability>=50?'var(--warning)':'var(--danger)';
      return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
        <div class="card" style="padding:16px;border-top:3px solid ${clr}">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px">🤖 ML Кластер</div>
          <div style="font-size:18px;font-weight:800;color:${clr};margin-bottom:4px">${a.clusterIcon||'📊'} ${a.clusterLabel||'Есептелуде'}</div>
          <div style="font-size:11px;color:var(--text-secondary);line-height:1.5">${getClusterExplanation(a)}</div>
        </div>
        <div class="card" style="padding:16px;border-top:3px solid ${probColor}">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px">📈 Сәтті игеру ықтималдығы</div>
          <div style="font-size:18px;font-weight:800;color:${probColor};margin-bottom:8px">${sp.probability}%</div>
          <div style="display:flex;gap:4px;margin-bottom:6px">
            <div style="height:8px;border-radius:4px 0 0 4px;background:${probColor};width:${sp.probability}%;transition:width 1s ease"></div>
            <div style="height:8px;border-radius:0 4px 4px 0;background:var(--danger);width:${sp.riskProb}%;opacity:0.3;transition:width 1s ease"></div>
          </div>
          <div style="font-size:11px;color:var(--text-muted)">Сенімділік: <b>${sp.confidence}</b> · Proxy модель</div>
        </div>
      </div>`;
    })()}
    ${(function(){
      const hyb = a.hybridComponents;
      if (!hyb) return '';
      const hScore = a.hybridScore || a.totalScore;
      const hColor = getScoreColor(hScore);
      const comps = [
        { label:'Business Rules', pct: Math.round(hyb.business.weight*100)+'%', score: hyb.business.score, weighted: hyb.business.weighted, color:'#1B5E20' },
        { label:'ML (Logistic)',  pct: Math.round(hyb.ml.weight*100)+'%',       score: hyb.ml.score,       weighted: hyb.ml.weighted,       color:'#1565C0' },
        { label:'Risk Score',     pct: Math.round(hyb.risk.weight*100)+'%',     score: hyb.risk.score,     weighted: hyb.risk.weighted,     color:'#E65100' },
      ];
      const shapData = calcSHAPExplanation(a, AppState.applicants);
      return `
      <div class="card mb-4" style="padding:16px;border-top:3px solid ${hColor}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <div>
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--text-muted)">🔀 Гибридті финалды скор</div>
            <div style="font-size:24px;font-weight:900;color:${hColor}">${hScore}<span style="font-size:14px;font-weight:400;color:var(--text-muted)">/100</span></div>
          </div>
          <div style="font-size:11px;color:var(--text-muted);text-align:right">50% ML · 30% ережелер · 20% тәуекел${hyb.cluster.bonus!==0?`<br>Кластер бонус: <b style="color:${hyb.cluster.bonus>0?'var(--success)':'var(--danger)'}">${hyb.cluster.bonus>0?'+':''}${hyb.cluster.bonus}</b>`:''}</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px">
          ${comps.map(c=>`
          <div style="padding:10px;background:var(--bg);border-radius:8px;border:1px solid var(--border)">
            <div style="font-size:10px;color:var(--text-muted);margin-bottom:4px">${c.label} <b>${c.pct}</b></div>
            <div style="font-size:16px;font-weight:700;color:${c.color}">${c.weighted}<span style="font-size:10px;font-weight:400;color:var(--text-muted)">pts</span></div>
            <div style="height:4px;background:var(--border);border-radius:2px;margin-top:6px"><div style="height:100%;width:${c.score}%;background:${c.color};border-radius:2px"></div></div>
          </div>`).join('')}
        </div>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px">📊 SHAP — Факторлар ықпалы</div>
        ${shapData.contributions.map(c=>{
          const barW = Math.min(Math.abs(c.contribution)/5*100, 100);
          const col = c.direction==='positive'?'var(--success)':c.direction==='negative'?'var(--danger)':'var(--text-muted)';
          const sign = c.contribution>0?'+':'';
          return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <span style="width:160px;font-size:11px;flex-shrink:0">${c.name}</span>
            <div style="flex:1;height:14px;background:var(--bg);border-radius:3px;border:1px solid var(--border);overflow:hidden">
              <div style="height:100%;width:${barW}%;background:${col};opacity:0.8;border-radius:3px"></div>
            </div>
            <span style="width:42px;text-align:right;font-size:11px;font-weight:700;color:${col}">${sign}${c.contribution.toFixed(1)}</span>
          </div>`;
        }).join('')}
        <div style="font-size:11px;color:var(--text-secondary);margin-top:10px;padding:8px;background:var(--bg);border-radius:6px;line-height:1.6">${shapData.summary}</div>
      </div>`;
    })()}
    <div class="factors-grid" id="factors-grid-detail">
      ${factors.map((f,fi) => `
        <div class="factor-card">
          <div class="factor-header">
            <span class="factor-name">${f.name}</span>
            <span class="badge badge-info" style="font-size:10px">${f.weight}</span>
          </div>
          <div class="factor-score-big">${f.score}<span style="font-size:14px;color:var(--text-muted)">/${f.max}</span></div>
          <div class="progress-wrap mb-2">
            <div class="progress-bar" data-width="${Math.round(f.score/f.max*100)}" style="background:${getScoreColor(Math.round(f.score/f.max*100))};transition:width 1s ease"></div>
          </div>
          <div class="factor-items">
            ${f.items.map(item=>`<div class="factor-item"><span>${item.ok?'✅':'❌'}</span><span style="flex:1;font-size:11px">${item.text}</span><span class="pts">+${item.pts}</span></div>`).join('')}
          </div>
          <button class="btn btn-ghost btn-sm mt-2" style="width:100%;font-size:11px" onclick="explainFactor(${fi},'${a.id}')">🤖 Толығырақ</button>
        </div>`).join('')}
    </div>
    <div id="ai-scoring-result"></div>
    <div class="card mt-4 mb-4">
      <div class="card-header"><span class="card-title">Факторлар диаграммасы</span></div>
      <div class="chart-wrapper"><canvas id="radar-chart"></canvas></div>
    </div>
    <div class="recommendation-box ${recCls}">
      <div class="rec-title">${recIcon} ${recTitle}</div>
      <div class="rec-text">${recText}</div>
      <div class="rec-actions">
        <button class="btn btn-primary btn-ripple" onclick="quickAddShortlist('${a.id}')"><i class="fas fa-star"></i> Shortlist</button>
        <button class="btn btn-accent btn-ripple" onclick="showToast('Тексеруге жіберілді','info')"><i class="fas fa-search"></i> Тексеру</button>
        <button class="btn btn-outline-danger btn-ripple" onclick="showToast('Бас тартылды','warning')"><i class="fas fa-times"></i> Бас тарту</button>
      </div>
    </div>`;

  setTimeout(() => { animateAllProgressBars(); initRadarChart(a); }, 100);
}

function explainFactor(idx, id) {
  const a = AppState.getApplicant(id);
  const names = ['Субсидия тарихы','Өнімділік','Шаруашылық профилі','Әлеуметтік-экономикалық','Тәуекел бағасы'];
  const scores = [a?.factors?.f1,a?.factors?.f2,a?.factors?.f3,a?.factors?.f4,a?.factors?.f5];
  const prompt = `${a?.name} өтінімі бойынша "${names[idx]}" факторының ${scores[idx]} баллын қазақша 3-4 сөйлемде түсіндіріңіз.`;
  showAIModal(`🤖 ${names[idx]}`, prompt, 'score');
}

async function requestAIScoring(id) {
  const a = AppState.getApplicant(id);
  if (!a) return;
  const btn = document.getElementById('ai-score-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AI бағалауда...'; }

  const prompt = `Сен ауылшаруашылық субсидия скоринг жүйесісің. Мына өтінімді талдап, əр фактор бойынша балл қой.

Шаруашылық: ${a.name}
Аймақ: ${a.region}, жер: ${a.landArea} га, дақыл: ${a.cropType}
Өнімділік: ${a.yield} т/га, техника: ${a.equipmentCount} бірлік
Қызметкерлер: ${a.employees}, субсидия тарихы: ${a.hasPreviousSubsidy?'бар':'жоқ'}
Игеру: ${a.subsidyUtilization}%, несие: ${a.creditScore}, суландыру: ${a.hasIrrigation?'бар':'жоқ'}
Салық берешегі: ${a.hasTaxDebt?'бар':'жоқ'}, сот дауы: ${a.hasLegalDisputes?'бар':'жоқ'}

Жауапты ТІКЕЛЕЙ JSON форматында бер:
{"f1":{"score":0-25,"reason":"бір сөйлем қазақша"},"f2":{"score":0-30,"reason":"..."},"f3":{"score":0-20,"reason":"..."},"f4":{"score":0-15,"reason":"..."},"f5":{"score":0-10,"reason":"..."},"summary":"жалпы бағалау 2-3 сөйлем қазақша"}`;

  try {
    const res = await fetch('/api/gemini', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const d = await res.json();
    let text = d.demo
      ? `{"f1":{"score":${a.factors?.f1||15},"reason":"Субсидия игеру тарихы орташа деңгейде."},"f2":{"score":${a.factors?.f2||20},"reason":"Өнімділік аймақтық орташаға сəйкес."},"f3":{"score":${a.factors?.f3||14},"reason":"Жер алаңы мен техника жеткілікті."},"f4":{"score":${a.factors?.f4||10},"reason":"Ауылдық аймақта əлеуметтік маңызы бар."},"f5":{"score":${a.factors?.f5||7},"reason":"Несие тарихы таза."},"summary":"Өтінім орташа деңгейде бағаланды."}`
      : (d.candidates?.[0]?.content?.parts?.[0]?.text || '');
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON жауап алынбады');
    renderAIScoringResult(id, JSON.parse(jsonMatch[0]));
  } catch(e) {
    showToast('AI бағалауда қате: ' + e.message, 'error');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-robot"></i> AI Бағалау'; }
  }
}

function renderAIScoringResult(id, aiScores) {
  const a = AppState.getApplicant(id);
  if (!a) return;
  const factorKeys  = ['f1','f2','f3','f4','f5'];
  const factorNames = ['Субсидия тарихы','Өнімділік','Шаруашылық профилі','Әлеуметтік-экономикалық','Тәуекел бағасы'];
  const factorMax   = [25, 30, 20, 15, 10];
  const factorWeights = ['25%','30%','20%','15%','10%'];

  const grid = document.getElementById('factors-grid-detail');
  if (grid) {
    grid.innerHTML = factorKeys.map((key, i) => {
      const ai  = aiScores[key] || {};
      const det = a.factors?.[key] || 0;
      const score = Math.min(Math.max(Math.round(ai.score || 0), 0), factorMax[i]);
      const pct = Math.round(score / factorMax[i] * 100);
      return `
        <div class="factor-card" style="border-top:3px solid #7B1FA2">
          <div class="factor-header">
            <span class="factor-name">${factorNames[i]}</span>
            <span class="badge" style="background:#7B1FA2;color:#fff;font-size:10px">${factorWeights[i]}</span>
          </div>
          <div class="factor-score-big">${score}<span style="font-size:14px;color:var(--text-muted)">/${factorMax[i]}</span></div>
          <div style="font-size:10px;color:var(--text-muted);margin-bottom:6px">Детерминистік: <b>${det}</b></div>
          <div class="progress-wrap mb-2">
            <div class="progress-bar" style="width:${pct}%;background:${getScoreColor(pct)}"></div>
          </div>
          <div style="font-size:11px;color:var(--text-secondary);line-height:1.6;padding:8px;background:var(--bg);border-radius:6px;border:1px solid var(--border)">
            🤖 ${ai.reason || ''}
          </div>
        </div>`;
    }).join('');
  }

  const total = factorKeys.reduce((s, k, i) => s + Math.min(Math.round(aiScores[k]?.score || 0), factorMax[i]), 0);
  const aiResult = document.getElementById('ai-scoring-result');
  if (aiResult) {
    aiResult.innerHTML = `
      <div class="alert" style="background:linear-gradient(135deg,#EDE7F6,#F3E5F5);border-left:4px solid #7B1FA2;margin-top:16px">
        <div style="font-weight:700;color:#7B1FA2;margin-bottom:6px;font-size:14px">🤖 AI жалпы бағасы: ${total}/100</div>
        <div style="font-size:13px;line-height:1.6">${aiScores.summary || ''}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:8px">⚠️ AI бағасы ақпараттық сипатта — финалды шешімді комиссия қабылдайды</div>
      </div>`;
  }
  const btn = document.getElementById('ai-score-btn');
  if (btn) { btn.innerHTML = '✅ AI бағаланды'; btn.style.background = '#7B1FA2'; btn.disabled = false; }
  animateAllProgressBars();
}

function initRadarChart(a) {
  const ctx = document.getElementById('radar-chart');
  if (!ctx) return;
  if (Charts.radar) Charts.radar.destroy();
  const maxes = [25,30,20,15,10];
  const scores = [a.factors?.f1||0,a.factors?.f2||0,a.factors?.f3||0,a.factors?.f4||0,a.factors?.f5||0];
  const norm = scores.map((s,i)=>Math.round(s/maxes[i]*100));
  Charts.radar = new Chart(ctx, {
    type:'radar',
    data:{
      labels:['Субсидия\nтарихы','Өнімділік','Шаруашылық\nпрофилі','Әлеуметтік-\nэконом.','Тәуекел\nбағасы'],
      datasets:[
        {label:'Өтінімдер',data:norm,backgroundColor:'rgba(27,94,32,0.2)',borderColor:'#1B5E20',borderWidth:2,pointBackgroundColor:'#1B5E20',pointRadius:4},
        {label:'Аймақтық орташа',data:[60,55,50,45,65],backgroundColor:'rgba(21,101,192,0.1)',borderColor:'#1565C0',borderWidth:2,borderDash:[5,5],pointRadius:3}
      ]
    },
    options:{responsive:true,maintainAspectRatio:false,
      scales:{r:{min:0,max:100,ticks:{stepSize:25,font:{size:9}},grid:{color:'rgba(0,0,0,0.05)'},pointLabels:{font:{family:'Inter',size:11}}}},
      plugins:{legend:{position:'bottom',labels:{font:{family:'Inter',size:12},usePointStyle:true}}}
    }
  });
}

// ─── DATA TAB ─────────────────────────────────────────────────────────────────
function renderDataTab(a) {
  const el = document.getElementById('data-tab-content');
  if (!el) return;
  el.innerHTML = `<div class="data-grid">
    <div class="card data-card"><h4><i class="fas fa-id-card"></i> Жалпы мәліметтер</h4>
      ${dr('ЖСН',a.iin)}${dr('БИН',a.bin||'—')}${dr('Нысан түрі',a.entityType)}${dr('Тіркелген',a.registrationDate)}${dr('Субсидия түрі',a.subsidyType)}
    </div>
    <div class="card data-card"><h4><i class="fas fa-map-marker-alt"></i> Орналасу</h4>
      ${dr('Облыс',a.region)}${dr('Аудан',a.district)}${dr('Аймақ',a.isRural?'🌾 Ауылдық':'🏙 Қалалық')}
    </div>
    <div class="card data-card"><h4><i class="fas fa-tractor"></i> Жер қоры</h4>
      ${dr('Жалпы алаң',formatNumber(a.landArea)+' га')}${dr('Меншік',formatNumber(a.landOwned)+' га')}${dr('Жалға алынған',formatNumber(a.landLeased)+' га')}${dr('Суландыру',a.hasIrrigation?'✅ Бар':'❌ Жоқ')}
    </div>
    <div class="card data-card"><h4><i class="fas fa-seedling"></i> Өндіріс</h4>
      ${dr('Өндіріс түрі',a.productionType)}${a.mainCrops?.length?dr('Дақылдар',a.mainCrops.join(', ')):''}${a.livestock?dr('Мал басы',formatNumber(a.livestock)+' бас'):''}${dr('Өнімділік',a.productivity+'%')}
    </div>
    <div class="card data-card"><h4><i class="fas fa-chart-line"></i> Қаржы</h4>
      ${dr('Жылдық айналым',formatMoney(a.annualRevenue))}${dr('Таза пайда',formatMoney(a.netProfit))}${dr('Сұралған субсидия',formatMoney(a.requestedAmount))}
    </div>
    <div class="card data-card"><h4><i class="fas fa-tools"></i> Ресурстар</h4>
      ${dr('Техника саны',a.equipmentCount+' бірлік')}${dr('Қызметкерлер',a.employees+' адам')}
    </div>
  </div>`;
}
function dr(k, v) { return `<div class="data-row"><span class="data-key">${k}</span><span class="data-val">${v}</span></div>`; }

// ─── HISTORY TAB ──────────────────────────────────────────────────────────────
function renderHistoryTab(a) {
  const el = document.getElementById('history-tab-content');
  if (!el) return;
  const hist = a.subsidyHistory || [];
  if (!hist.length) { el.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">Субсидия тарихы жоқ</div></div>`; return; }
  const total = hist.reduce((s,h)=>s+h.amount,0);
  const avgUtil = Math.round(hist.reduce((s,h)=>s+h.utilization,0)/hist.length);
  el.innerHTML = `
    <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap">
      <div class="card" style="flex:1;min-width:140px;text-align:center;padding:16px">
        <div style="font-size:22px;font-weight:800;color:var(--primary)">${formatMoney(total)}</div>
        <div style="font-size:12px;color:var(--text-muted)">Барлығы алды</div>
      </div>
      <div class="card" style="flex:1;min-width:140px;text-align:center;padding:16px">
        <div style="font-size:22px;font-weight:800;color:var(--accent)">${avgUtil}%</div>
        <div style="font-size:12px;color:var(--text-muted)">Орташа игерілу</div>
      </div>
    </div>
    <div class="timeline">
      ${hist.map(h=>`<div class="timeline-item">
        <div class="timeline-dot">${String(h.year).slice(-2)}</div>
        <div class="timeline-card">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <b>${h.type}</b><span class="badge ${h.utilization>=90?'badge-success':'badge-warning'}">${h.status}</span>
          </div>
          <div style="font-size:13px;color:var(--text-muted);display:flex;gap:16px">
            <span>💰 ${formatMoney(h.amount)}</span><span>📈 ${h.utilization}%</span>
          </div>
          <div class="progress-wrap mt-2">
            <div class="progress-bar" style="width:${h.utilization}%;background:${h.utilization>=90?'var(--success)':'var(--warning)'}"></div>
          </div>
        </div>
      </div>`).join('')}
    </div>`;
}

// ─── DOCS TAB ─────────────────────────────────────────────────────────────────
function renderDocsTab(a) {
  const el = document.getElementById('docs-tab-content');
  if (!el) return;
  const docs = [
    {name:'Жер учаскесіне құқық',icon:'fa-file-alt',ok:true},{name:'Мемлекеттік тіркеу',icon:'fa-building',ok:true},
    {name:'Банк үзіндісі',icon:'fa-university',ok:true},{name:'Техника тізімі',icon:'fa-tractor',ok:a.equipmentCount>0},
    {name:'Салық берешексіздігі',icon:'fa-receipt',ok:a.breakdown?.noTaxDebt},{name:'Страхование полисі',icon:'fa-shield-alt',ok:false},
    {name:'Өнімділік есебі',icon:'fa-chart-line',ok:a.breakdown?.aboveAvgYield},
  ];
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <span style="font-size:13px;color:var(--text-muted)">${docs.length} құжат</span>
      <button class="btn btn-sm btn-outline"><i class="fas fa-download"></i> Барлығын жүктеу</button>
    </div>
    <div class="docs-grid">
      ${docs.map(d=>`<div class="doc-item">
        <i class="fas ${d.icon} doc-icon"></i>
        <div class="doc-info"><div class="doc-name">${d.name}</div><div class="doc-meta">${formatDate(new Date())}</div></div>
        <span style="font-size:18px">${d.ok?'✅':'❌'}</span>
      </div>`).join('')}
    </div>`;
}

// ─── COMMENTS TAB ─────────────────────────────────────────────────────────────
function renderCommentsTab(a) {
  const el = document.getElementById('comments-tab-content');
  if (!el) return;
  const comments = AppState.getComments(a.id);
  el.innerHTML = `
    <div class="comments-list mb-4" id="comments-list">
      ${!comments.length ? `<div class="empty-state" style="padding:24px"><div class="empty-icon">💬</div><div class="empty-title">Комментарийлер жоқ</div></div>` : ''}
      ${comments.map(c=>`<div class="comment-item">
        <div class="comment-avatar">${c.author.charAt(0).toUpperCase()}</div>
        <div class="comment-body">
          <div class="comment-meta"><span class="comment-author">${c.author}</span> · ${c.date} ${c.time}</div>
          <div class="comment-text">${c.text}</div>
        </div>
      </div>`).join('')}
    </div>
    <div class="card" style="padding:16px">
      <textarea id="comment-input" class="form-control" rows="3" placeholder="Комментарий жазыңыз..." style="resize:vertical;margin-bottom:10px"></textarea>
      <div style="display:flex;gap:8px;justify-content:space-between">
        <button class="btn btn-ghost btn-sm" onclick="generateAIComment('${a.id}')">🤖 AI Ұсыным жаз</button>
        <button class="btn btn-primary btn-sm" onclick="submitComment('${a.id}')"><i class="fas fa-paper-plane"></i> Жіберу</button>
      </div>
    </div>`;
}

function submitComment(id) {
  const input = document.getElementById('comment-input');
  if (!input?.value.trim()) { showToast('Комментарий бос', 'warning', 2000); return; }
  const user = JSON.parse(localStorage.getItem('agri_user')||'{}');
  AppState.addComment(id, input.value.trim(), user.login || 'Пайдаланушы');
  const a = AppState.getApplicant(id);
  if (a) renderCommentsTab(a);
  showToast('✅ Комментарий қосылды', 'success', 2000);
}

function generateAIComment(id) {
  const a = AppState.getApplicant(id);
  if (!a) return;
  const input = document.getElementById('comment-input');
  if (input) { input.value = '⏳ AI жазуда...'; input.disabled = true; }
  callGemini(`${a.name} субсидия өтінімі бойынша ресми ұсыным мәтінін қазақша жазыңыз. Балл: ${a.totalScore}/100. 2-3 сөйлем.`, 'recommend')
    .then(text => { if (input) { input.value = text; input.disabled = false; input.focus(); } })
    .catch(() => { if (input) { input.value = ''; input.disabled = false; } showToast('Қате орын алды', 'error'); });
}

// ─── RISK TAB ─────────────────────────────────────────────────────────────────
function renderRiskTab(a) {
  const el = document.getElementById('risk-tab-content');
  if (!el) return;
  const an = detectAnomaliesEnhanced(a, AppState.applicants);
  const dq = calcDataQuality(a);

  const riskColors = { 'Жоқ':'var(--success)', 'Төмен':'var(--success)', 'Орташа':'var(--warning)', 'Жоғары':'var(--danger)' };
  const riskIcon  = { 'Жоқ':'fa-check-circle', 'Төмен':'fa-check-circle', 'Орташа':'fa-exclamation-triangle', 'Жоғары':'fa-times-circle' };
  const rc = riskColors[an.anomalyRisk] || 'var(--text-muted)';

  const flagsHtml = an.flags.length === 0
    ? `<div class="empty-state" style="padding:24px"><div class="empty-icon">✅</div><div class="empty-title">Аномалиялар анықталмады</div></div>`
    : an.flags.map(f => `
        <div class="anomaly-item ${f.type}">
          <i class="fas ${f.type==='error'?'fa-times-circle':'fa-exclamation-triangle'} anomaly-icon"></i>
          <div class="anomaly-body">
            <div class="anomaly-code">${f.code.replace(/_/g,' ')}</div>
            <div class="anomaly-text">${f.text}</div>
          </div>
        </div>`).join('');

  const qFieldsHtml = dq.fields.map(f => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px">
      <span style="color:${f.present?'var(--text)':'var(--danger)'}">${f.required?'<b>*</b> ':''}${f.label}</span>
      <span>${f.present ? '<span style="color:var(--success)">✅</span>' : '<span style="color:var(--danger)">❌ Жоқ</span>'}</span>
    </div>`).join('');

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
      <div class="card" style="padding:20px;border-left:4px solid ${rc};text-align:center">
        <i class="fas ${riskIcon[an.anomalyRisk]||'fa-shield-alt'}" style="font-size:32px;color:${rc};margin-bottom:8px"></i>
        <div style="font-size:22px;font-weight:800;color:${rc}">${an.anomalyRisk === 'Жоқ' ? 'Норма' : an.anomalyRisk}</div>
        <div style="font-size:12px;color:var(--text-muted)">Аномалия тәуекел деңгейі</div>
      </div>
      <div class="card" style="padding:20px;text-align:center">
        <div style="font-size:32px;font-weight:800;color:${dq.completeness>=80?'var(--success)':dq.completeness>=60?'var(--warning)':'var(--danger)'}">${dq.completeness}%</div>
        <div style="font-size:12px;color:var(--text-muted)">Деректер толықтығы</div>
        <div style="font-size:11px;margin-top:6px">${dq.filled}/${dq.total} өріс толтырылған</div>
        ${dq.missingRequired.length>0?`<div style="font-size:11px;color:var(--danger);margin-top:4px">❌ ${dq.missingRequired.map(f=>f.label).join(', ')} — міндетті</div>`:''}
      </div>
    </div>
    <div class="card mb-4" style="padding:20px">
      <div class="card-title mb-3"><i class="fas fa-flag" style="color:var(--warning)"></i> Аномалиялар (${an.flags.length})</div>
      ${flagsHtml}
    </div>
    <div class="card" style="padding:20px">
      <div class="card-title mb-3"><i class="fas fa-table" style="color:var(--primary)"></i> Деректер сапасы — өрістер</div>
      <div style="max-height:340px;overflow-y:auto">${qFieldsHtml}</div>
    </div>`;
}

// ─── WHAT-IF TAB (real factors from dataset) ─────────────────────────────────
function renderWhatIfTab(a) {
  const el = document.getElementById('whatif-tab-content');
  if (!el) return;
  const dirOptions = DIRECTIONS.map(d =>
    `<option value="${d}" ${a.direction===d?'selected':''}>${d.replace('Субсидирование ','')}</option>`
  ).join('');
  el.innerHTML = `
    <div class="card mb-4" style="padding:20px">
      <div class="card-title mb-2">🔬 What-if Симуляция</div>
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">
        Нақты деректер негізіндегі симуляция — параметрлерді өзгертіп, балл қалай өзгеретінін тексеріңіз
      </p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div class="form-group"><label class="form-label" style="font-size:12px">Поголовье / Бас саны</label>
          <input type="number" class="form-control" id="wi-headcount" value="${a.headCount||0}" min="1" style="font-size:12px">
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Аймақ медианы: ${(DIR_STATS[a.direction]||{medHC:0}).medHC} бас</div>
        </div>
        <div class="form-group"><label class="form-label" style="font-size:12px">Норматив (₸/бас)</label>
          <input type="number" class="form-control" id="wi-normative" value="${a.normative||0}" min="1" style="font-size:12px">
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Категория: ${SUBSIDY_CATEGORY_LABELS[a.subsidyCategory]||'—'}</div>
        </div>
        <div class="form-group" style="grid-column:1/-1"><label class="form-label" style="font-size:12px">Бағыт / Направление</label>
          <select class="form-control" id="wi-direction" style="font-size:12px">${dirOptions}</select>
        </div>
        <div class="form-group"><label class="form-label" style="font-size:12px">Өтінім күні</label>
          <input type="text" class="form-control" id="wi-date" value="${a.applicationDate||'21.01.2025'}" placeholder="DD.MM.YYYY" style="font-size:12px">
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Ерте = жоғары приоритет (§21 Правил)</div>
        </div>
        <div class="form-group"><label class="form-label" style="font-size:12px">Бастапқы мәртебе</label>
          <select class="form-control" id="wi-status" style="font-size:12px">
            ${['Исполнена','Одобрена','Отклонена','Отозвано'].map(s=>`<option value="${s}" ${a.originalStatus===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>
      <button class="btn btn-primary mt-3" onclick="runWhatIf('${a.id}')"><i class="fas fa-play"></i> Есептеу</button>
    </div>
    <div id="whatif-result"></div>`;
}

function runWhatIf(id) {
  const a = AppState.getApplicant(id);
  if (!a) return;
  const changes = {
    headCount:      parseInt(document.getElementById('wi-headcount')?.value || a.headCount),
    normative:      parseFloat(document.getElementById('wi-normative')?.value || a.normative),
    direction:      document.getElementById('wi-direction')?.value || a.direction,
    applicationDate: document.getElementById('wi-date')?.value || a.applicationDate,
    originalStatus: document.getElementById('wi-status')?.value || a.originalStatus,
  };
  const r = calcWhatIf(a, changes);
  const diffColor = r.diff > 0 ? 'var(--success)' : r.diff < 0 ? 'var(--danger)' : 'var(--text-muted)';
  const diffSign  = r.diff > 0 ? '+' : '';
  const slMsg = r.shortlistChange==='enters'?`<span style="color:var(--success);font-weight:700">✅ Shortlist-ке кіреді!</span>`
    :r.shortlistChange==='exits'?`<span style="color:var(--danger);font-weight:700">❌ Shortlist-тен шығады</span>`
    :r.wouldEnterShortlist?`<span style="color:var(--success)">✅ Shortlist-те қалады</span>`
    :`<span style="color:var(--text-muted)">Shortlist-ке кірмейді</span>`;

  const el = document.getElementById('whatif-result');
  if (!el) return;
  el.innerHTML = `
    <div class="card" style="padding:20px;border-top:3px solid var(--primary)">
      <div class="card-title mb-3">📊 Симуляция нәтижесі</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;text-align:center;margin-bottom:20px">
        <div style="padding:16px;background:var(--bg);border-radius:10px">
          <div style="font-size:28px;font-weight:800;color:${getScoreColor(r.originalScore)}">${r.originalScore}</div>
          <div style="font-size:11px;color:var(--text-muted)">Қазіргі балл</div>
        </div>
        <div style="padding:16px;background:var(--bg);border-radius:10px;display:flex;align-items:center;justify-content:center">
          <div style="font-size:28px;color:${diffColor};font-weight:800">${diffSign}${r.diff}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-left:6px">өзгеріс</div>
        </div>
        <div style="padding:16px;background:var(--bg);border-radius:10px">
          <div style="font-size:28px;font-weight:800;color:${getScoreColor(r.newScore)}">${r.newScore}</div>
          <div style="font-size:11px;color:var(--text-muted)">Жаңа балл</div>
        </div>
      </div>
      <div style="text-align:center;font-size:14px;margin-bottom:12px">${slMsg}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;font-size:11px">
        ${[['Субсидия',r.factors?.f1||0,25],['Өнімділік',r.factors?.f2||0,30],['Профиль',r.factors?.f3||0,20],['Әлеум.',r.factors?.f4||0,15],['Тәуекел',r.factors?.f5||0,10]]
          .map(([n,s,mx])=>`<div style="text-align:center;background:var(--bg);padding:8px 12px;border-radius:8px;min-width:80px">
            <div style="font-weight:700;color:var(--primary)">${s}/${mx}</div>
            <div style="color:var(--text-muted)">${n}</div>
          </div>`).join('')}
      </div>
    </div>`;
}

// ─── COMMISSION TAB ───────────────────────────────────────────────────────────
function renderCommissionTab(a) {
  const el = document.getElementById('commission-tab-content');
  if (!el) return;
  const rev = AppState.getCommissionReview(a.id);
  const statusMap = {
    pending:  { label:'Күтілуде',        color:'var(--text-muted)', bg:'var(--bg)',   icon:'fa-clock' },
    approved: { label:'Бекітілді',       color:'var(--success)',    bg:'#E8F5E9',     icon:'fa-check-circle' },
    hold:     { label:'Ұсталды',         color:'var(--warning)',    bg:'#FFF8E1',     icon:'fa-pause-circle' },
    rejected: { label:'Қабылданбады',    color:'var(--danger)',     bg:'#FFEBEE',     icon:'fa-times-circle' },
    override: { label:'Қайта бағаланды', color:'var(--info)',       bg:'#E3F2FD',     icon:'fa-edit' },
  };
  const st = statusMap[rev.status] || statusMap.pending;

  el.innerHTML = `
    <div class="card mb-4" style="padding:20px;border-left:4px solid ${st.color};background:${st.bg}">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
        <i class="fas ${st.icon}" style="font-size:24px;color:${st.color}"></i>
        <div>
          <div style="font-size:16px;font-weight:700;color:${st.color}">${st.label}</div>
          ${rev.reviewedBy ? `<div style="font-size:11px;color:var(--text-muted)">${rev.reviewedBy} · ${rev.reviewedAt||''}</div>` : ''}
        </div>
      </div>
      ${rev.comment ? `<div style="font-size:13px;margin-top:8px;padding:10px;background:rgba(255,255,255,0.6);border-radius:8px">"${rev.comment}"</div>` : ''}
    </div>
    <div class="card mb-4" style="padding:20px">
      <div class="card-title mb-3">⚖️ Комиссия шешімі</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">
        <button class="btn btn-sm ${rev.status==='approved'?'btn-primary':'btn-outline'}" onclick="setCommission('${a.id}','approved')"><i class="fas fa-check"></i> Бекіту</button>
        <button class="btn btn-sm ${rev.status==='hold'?'btn-accent':'btn-outline'}" onclick="setCommission('${a.id}','hold')"><i class="fas fa-pause"></i> Ұстап қалу</button>
        <button class="btn btn-sm ${rev.status==='rejected'?'btn-danger':'btn-outline'}" onclick="setCommission('${a.id}','rejected')"><i class="fas fa-times"></i> Қабылдамау</button>
        <button class="btn btn-sm ${rev.status==='override'?'btn-info':'btn-outline'}" onclick="setCommission('${a.id}','override')"><i class="fas fa-edit"></i> Жоғарылату</button>
      </div>
      <div class="form-group">
        <label class="form-label" style="font-size:12px">Комментарий</label>
        <textarea id="commission-comment" class="form-control" rows="3" placeholder="Шешімнің себебін жазыңыз..." style="font-size:13px;resize:vertical">${rev.comment||''}</textarea>
      </div>
      <div class="form-group" id="override-reason-group" style="${rev.status==='override'?'':'display:none'}">
        <label class="form-label" style="font-size:12px">Жоғарылату негіздемесі</label>
        <input type="text" id="commission-override-reason" class="form-control" placeholder="Алгоритмнен ауытқу себебі..." value="${rev.overrideReason||''}" style="font-size:13px">
      </div>
      <button class="btn btn-primary btn-sm" onclick="saveCommission('${a.id}')"><i class="fas fa-save"></i> Сақтау</button>
    </div>
    <div class="card" style="padding:20px">
      <div class="card-title mb-2">📊 AI Ұсыным</div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px">Алгоритм ұсынымы: <b style="color:${getScoreColor(a.totalScore)}">${a.recommendation}</b> (${a.totalScore} балл)</div>
      <button class="btn btn-outline btn-sm" onclick="showAIModal('🤖 Комиссия ұсынымы','${a.name} (${a.totalScore} балл, ${a.region}) өтінімі бойынша комиссия шешімін қазақша 3 сөйлемде негіздеңіз.','recommend')">
        🤖 AI Ұсыным алу
      </button>
    </div>`;
}

function setCommission(id, status) {
  const overrideGroup = document.getElementById('override-reason-group');
  if (overrideGroup) overrideGroup.style.display = status === 'override' ? '' : 'none';
  saveCommission(id, status);
}

function saveCommission(id, statusOverride) {
  const comment = document.getElementById('commission-comment')?.value || '';
  const overrideReason = document.getElementById('commission-override-reason')?.value || '';
  const current = AppState.getCommissionReview(id);
  const status = statusOverride || current.status || 'pending';
  AppState.updateCommissionReview(id, status, comment, overrideReason);
  const a = AppState.getApplicant(id);
  if (a) renderCommissionTab(a);
  showToast(`✅ Комиссия шешімі сақталды`, 'success', 2000);
}
