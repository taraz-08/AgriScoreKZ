'use strict';

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function initDashboard() {
  const stats = AppState.getStats();
  const today = new Date();
  const d = document.getElementById('today-date');
  if (d) d.textContent = formatDate(today);

  animateCounter(document.getElementById('kpi-total'), stats.total);
  animateCounter(document.getElementById('kpi-processing'), stats.processing);
  animateCounter(document.getElementById('kpi-shortlisted'), stats.shortlisted);
  const bEl = document.getElementById('kpi-budget');
  if (bEl) { bEl.textContent = '0'; setTimeout(() => bEl.textContent = formatMoney(stats.totalRequested), 100); }

  renderTopApplicants();
  initDashboardAreaChart('30d');
  initDashboardDonutChart(stats.byRegion);
  renderDashboardMLWidgets(stats);

  const user = JSON.parse(localStorage.getItem('agri_user') || '{}');
  const av = document.getElementById('navbar-avatar');
  if (av) av.textContent = (user.login || 'A').charAt(0).toUpperCase();

  setTimeout(animateAllProgressBars, 200);
}

function renderDashboardMLWidgets(stats) {
  const probs = AppState.applicants.map(a => a.successProb ? a.successProb.probability : calcSuccessProbability(a).probability);
  const avgProb = probs.length ? Math.round(probs.reduce((s,v)=>s+v,0)/probs.length) : 0;
  const probEl = document.getElementById('kpi-avg-prob');
  if (probEl) animateCounter(probEl, avgProb);

  const anomalyCount = AppState.applicants.filter(a => {
    const an = detectAnomalies(a);
    return an.anomalyRisk === 'Жоғары' || an.anomalyRisk === 'Орташа';
  }).length;
  const anomalyEl = document.getElementById('kpi-anomaly');
  if (anomalyEl) animateCounter(anomalyEl, anomalyCount);

  const clusterEl = document.getElementById('dash-cluster-dist');
  if (clusterEl) {
    clusterEl.innerHTML = CLUSTER_ORDERED_LABELS.map(lbl => {
      const cnt = AppState.applicants.filter(a=>a.clusterLabel===lbl.name).length;
      const pct = AppState.applicants.length ? Math.round(cnt/AppState.applicants.length*100) : 0;
      return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="width:10px;height:10px;border-radius:50%;background:${lbl.color};flex-shrink:0"></span>
        <span style="flex:1;font-size:12px">${lbl.icon} ${lbl.name}</span>
        <span style="font-weight:700;font-size:13px">${cnt}</span>
        <div style="width:60px;height:6px;background:var(--border);border-radius:3px">
          <div style="width:${pct}%;height:100%;background:${lbl.color};border-radius:3px"></div>
        </div>
      </div>`;
    }).join('');
  }
}

function renderTopApplicants() {
  const tbody = document.getElementById('top-applicants-tbody');
  if (!tbody) return;
  const top = AppState.applicants.slice(0, 5);
  tbody.innerHTML = top.map((a, i) => `
    <tr style="border-bottom:1px solid var(--border)">
      <td style="padding:10px 8px;width:36px">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;font-size:12px;font-weight:700;background:${i<3?['#FFD700','#C0C0C0','#CD7F32'][i]:'var(--bg)'};color:${i<3?'#333':'var(--text-muted)'}">${i<3?['🥇','🥈','🥉'][i]:i+1}</span>
      </td>
      <td style="padding:10px 8px">
        <div style="font-weight:600;font-size:13px">${a.name}</div>
        <div style="font-size:11px;color:var(--text-muted)">${a.region}</div>
      </td>
      <td style="padding:10px 8px"><span class="badge ${getScoreBadgeClass(a.totalScore)}">${a.totalScore}</span></td>
      <td style="padding:10px 8px"><span class="badge ${getStatusBadgeClass(a.recommendation)}">${a.recommendation}</span></td>
      <td style="padding:10px 8px"><button class="btn btn-sm btn-outline" onclick="navigateTo('applicants/${a.id}')" style="font-size:11px">Көру →</button></td>
    </tr>`).join('');
}

function initDashboardAreaChart(period) {
  const ctx = document.getElementById('dash-area-chart');
  if (!ctx) return;
  if (Charts.dashArea) Charts.dashArea.destroy();
  const pts = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const lang = window.currentLang || 'kk';
  const months = TRANSLATIONS[lang].months;
  const labels = [], d1 = [], d2 = [];
  const now = new Date();
  for (let i = pts - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    labels.push(pts <= 30 ? `${d.getDate()} ${months[d.getMonth()]}` : months[d.getMonth()]);
    d1.push(rnd(20, 120)); d2.push(rnd(10, 70));
  }
  const grd = ctx.getContext('2d').createLinearGradient(0,0,0,260);
  grd.addColorStop(0,'rgba(27,94,32,0.25)'); grd.addColorStop(1,'rgba(27,94,32,0)');
  const grd2 = ctx.getContext('2d').createLinearGradient(0,0,0,260);
  grd2.addColorStop(0,'rgba(249,168,37,0.2)'); grd2.addColorStop(1,'rgba(249,168,37,0)');

  Charts.dashArea = new Chart(ctx, {
    type:'line', data:{ labels, datasets:[
      { label:'Өтінімдер', data:d1, borderColor:'#1B5E20', backgroundColor:grd, fill:true, tension:0.4, pointRadius:3, pointHoverRadius:6 },
      { label:'Мақұлданды', data:d2, borderColor:'#F9A825', backgroundColor:grd2, fill:true, tension:0.4, pointRadius:3 }
    ]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:'top', labels:{ usePointStyle:true, font:{ family:'Inter', size:12 } } }, tooltip:{ mode:'index', intersect:false } },
      scales:{ x:{ grid:{ display:false }, ticks:{ font:{ size:11 }, maxTicksLimit:8 } }, y:{ beginAtZero:true, ticks:{ font:{ size:11 } } } }
    }
  });
}

function initDashboardDonutChart(byRegion) {
  const ctx = document.getElementById('dash-donut-chart');
  if (!ctx) return;
  if (Charts.dashDonut) Charts.dashDonut.destroy();
  const top = Object.entries(byRegion).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const colors = ['#1B5E20','#2E7D32','#388E3C','#43A047','#4CAF50','#66BB6A'];

  Charts.dashDonut = new Chart(ctx, {
    type:'doughnut',
    data:{ labels:top.map(r=>r[0]), datasets:[{ data:top.map(r=>r[1]), backgroundColor:colors, borderWidth:2, borderColor:'#fff', hoverOffset:8 }] },
    options:{ responsive:true, maintainAspectRatio:false, cutout:'65%',
      plugins:{ legend:{ position:'bottom', labels:{ usePointStyle:true, font:{ family:'Inter', size:11 }, padding:8 } } }
    }
  });

  const cont = document.getElementById('dash-progress-bars');
  if (!cont) return;
  const types = AppState.getStats().byType;
  const total = Object.values(types).reduce((s,v)=>s+v,0);
  const typeColors = { 'Егіншілік':'#1B5E20','Мал шаруашылығы':'#F9A825','Аралас':'#1565C0','Бақша':'#E53935' };
  cont.innerHTML = Object.entries(types).map(([k,v]) => {
    const pct = Math.round(v/total*100);
    return `<div>
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
        <span>${k}</span><span style="font-weight:600">${pct}%</span>
      </div>
      <div class="progress-wrap"><div class="progress-bar" data-width="${pct}" style="background:${typeColors[k]||'var(--primary)'}"></div></div>
    </div>`;
  }).join('');
  setTimeout(animateAllProgressBars, 300);
}

function setDashPeriod(period, btn) {
  document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  initDashboardAreaChart(period);
}
