'use strict';

// ─── SCORING PAGE ─────────────────────────────────────────────────────────────
function initScoring() {
  renderScoreHistogram();
  renderSegmentCards();
  renderScoringTable(AppState.applicants);
}

function runScoring() {
  const btn = document.getElementById('run-scoring-btn');
  const section = document.getElementById('scoring-progress-section');
  const bar = document.getElementById('scoring-progress-bar');
  const stepsEl = document.getElementById('scoring-steps-text');
  if (btn) btn.disabled = true;
  if (section) section.classList.remove('hidden');

  let pct = 0;
  const steps = ['Деректер оқылуда...','Факторлар есептелуде...','Нәтижелер дайындалуда...','✅ Аяқталды!'];
  const iv = setInterval(() => {
    pct += rnd(8, 18); if (pct > 100) pct = 100;
    if (bar) bar.style.width = pct + '%';
    if (stepsEl) stepsEl.textContent = pct < 35 ? steps[0] : pct < 70 ? steps[1] : pct < 95 ? steps[2] : steps[3];
    if (pct === 100) {
      clearInterval(iv);
      AppState.recalculateScores();
      renderScoreHistogram(); renderSegmentCards(); renderScoringTable(AppState.applicants);
      if (btn) btn.disabled = false;
      setTimeout(() => { if (section) section.classList.add('hidden'); if (bar) bar.style.width='0%'; }, 1200);
      showToast(`✅ ${formatNumber(AppState.applicants.length)} өтінімдер бағаланды`, 'success');
    }
  }, 120);
}

function renderScoreHistogram() {
  const ctx = document.getElementById('score-histogram');
  if (!ctx) return;
  if (Charts.histogram) Charts.histogram.destroy();
  const bins = Array(10).fill(0);
  AppState.applicants.forEach(a => { bins[Math.min(9, Math.floor((a.hybridScore||a.totalScore)/10))]++; });
  const labels = ['0-9','10-19','20-29','30-39','40-49','50-59','60-69','70-79','80-89','90-100'];
  const colors = labels.map((_,i) => i<5?'#EF5350':i<7?'#FF9800':'#4CAF50');
  Charts.histogram = new Chart(ctx, {
    type:'bar', data:{ labels, datasets:[{label:'Өтінімдер',data:bins,backgroundColor:colors,borderRadius:4}] },
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{callbacks:{label:c=>` ${c.parsed.y} өтінімдер`}} },
      scales:{ x:{grid:{display:false},ticks:{font:{size:11}}}, y:{beginAtZero:true,ticks:{font:{size:11},stepSize:1}} }
    }
  });
}

function renderSegmentCards() {
  const tot = AppState.applicants.length || 1;
  const score = a => a.hybridScore || a.totalScore;
  const high = AppState.applicants.filter(a=>score(a)>=70).length;
  const mid  = AppState.applicants.filter(a=>score(a)>=50&&score(a)<70).length;
  const low  = AppState.applicants.filter(a=>score(a)<50).length;
  const hEl=document.getElementById('seg-high-count'); if(hEl) hEl.textContent=formatNumber(high);
  const hP=document.getElementById('seg-high-pct'); if(hP) hP.textContent=Math.round(high/tot*100)+'%';
  const mEl=document.getElementById('seg-mid-count'); if(mEl) mEl.textContent=formatNumber(mid);
  const mP=document.getElementById('seg-mid-pct'); if(mP) mP.textContent=Math.round(mid/tot*100)+'%';
  const lEl=document.getElementById('seg-low-count'); if(lEl) lEl.textContent=formatNumber(low);
  const lP=document.getElementById('seg-low-pct'); if(lP) lP.textContent=Math.round(low/tot*100)+'%';
}

function filterBySegment(seg, btn) {
  document.querySelectorAll('.segment-card').forEach(c=>c.classList.remove('active'));
  if(btn) btn.classList.add('active');
  const sc = a => a.hybridScore || a.totalScore;
  const data = seg==='high' ? AppState.applicants.filter(a=>sc(a)>=70)
    : seg==='mid' ? AppState.applicants.filter(a=>sc(a)>=50&&sc(a)<70)
    : AppState.applicants.filter(a=>sc(a)<50);
  renderScoringTable(data);
}

function renderScoringTable(data) {
  const tbody = document.getElementById('scoring-tbody');
  if (!tbody) return;
  tbody.innerHTML = (data||[]).slice(0,100).map((a,i)=>{
    const sc = a.hybridScore || a.totalScore;
    return `<tr style="animation-delay:${i*25}ms">
      <td><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;font-size:11px;font-weight:700;background:${a.rank<=3?['#FFD700','#C0C0C0','#CD7F32'][a.rank-1]:'var(--bg)'};color:${a.rank<=3?'#333':'var(--text-muted)'}">${a.rank<=3?['🥇','🥈','🥉'][a.rank-1]:a.rank}</span></td>
      <td><div style="font-weight:600;font-family:monospace;font-size:12px">${a.appNum||a.name}</div><div style="font-size:11px;color:var(--text-muted)">${a.region}</div></td>
      <td style="font-size:13px">${a.region}</td>
      <td><span class="badge ${getScoreBadgeClass(sc)} ${sc>=90?'badge-pulse':''}">${sc}</span></td>
      <td>${getRiskDot(a.riskLevel)} ${a.riskLevel}</td>
      <td><span class="badge ${getStatusBadgeClass(a.recommendation)}">${a.recommendation}</span></td>
      <td>
        <div class="row-actions" style="opacity:1">
          <button class="action-btn" onclick="navigateTo('applicants/${a.id}')"><i class="fas fa-eye"></i></button>
          <button class="action-btn success" onclick="quickAddShortlist('${a.id}')"><i class="fas fa-star"></i></button>
        </div>
      </td>
    </tr>`;
  }).join('');
}
