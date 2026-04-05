'use strict';

// ─── ANALYTICS PAGE ───────────────────────────────────────────────────────────
window.addEventListener('langchange', () => {
  const page = document.getElementById('page-analytics');
  if (page && page.classList.contains('active')) initAnalytics();
});

function initAnalytics() {
  setTimeout(() => {
    initModelMetrics();
    initRegionalChart();
    initTypeChart();
    initTrendChart();
    initScatterChart();
    initClusterChart();
    initProbabilityChart();
    loadRealAnalyticsCharts();
  }, 100);
}

// ─── MODEL PERFORMANCE METRICS ────────────────────────────────────────────────
function initModelMetrics() {
  // Use applicants that have both model recommendation and original status
  const labeled = AppState.applicants.filter(a =>
    a.originalStatus === 'Исполнена' || a.originalStatus === 'Отклонена'
  );
  if (!labeled.length) return;

  let TP = 0, FP = 0, TN = 0, FN = 0;
  labeled.forEach(a => {
    const predicted = (a.recommendation === 'Ұсынылды');
    const actual    = (a.originalStatus  === 'Исполнена');
    if (predicted && actual)   TP++;
    else if (predicted && !actual) FP++;
    else if (!predicted && actual) FN++;
    else                           TN++;
  });

  const precision = TP + FP > 0 ? TP / (TP + FP) : 0;
  const recall    = TP + FN > 0 ? TP / (TP + FN) : 0;
  const f1        = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
  const accuracy  = (TP + TN) / (TP + FP + TN + FN);

  const fmt = v => (v * 100).toFixed(1) + '%';
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('m-accuracy',  fmt(accuracy));
  set('m-precision', fmt(precision));
  set('m-recall',    fmt(recall));
  set('m-f1',        fmt(f1));
  set('cm-tp', TP);
  set('cm-fp', FP);
  set('cm-fn', FN);
  set('cm-tn', TN);

  // Feature importance bars
  const features = [
    { name: 'F1 — Мал саны (Бас)',        weight: 33, color: '#1B5E20' },
    { name: 'F2 — Бағыт басымдылығы',     weight: 28, color: '#2E7D32' },
    { name: 'F3 — Субсидия категориясы',  weight: 22, color: '#F9A825' },
    { name: 'F4 — Аймақтық салыстыру',    weight: 17, color: '#1565C0' },
  ];
  const fiEl = document.getElementById('feature-importance-bars');
  if (fiEl) {
    fiEl.innerHTML = features.map(f => `
      <div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
          <span style="color:var(--text-secondary)">${f.name}</span>
          <span style="font-weight:700;color:${f.color}">${f.weight}%</span>
        </div>
        <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${f.weight}%;background:${f.color};border-radius:4px;transition:width 0.6s ease"></div>
        </div>
      </div>`).join('');
  }
}

// ─── REAL DATASET CHARTS (from /api/real-stats) ────────────────────────────
function loadRealAnalyticsCharts() {
  fetch('/api/real-stats')
    .then(r => r.ok ? r.json() : null)
    .then(s => {
      if (!s) return;
      initRealDirectionChart(s.byDirection);
      initRealStatusChart(s.byStatus);
      initRegionalChartReal(s.byRegion);
    })
    .catch(() => {});
}

function initRealDirectionChart(byDir) {
  const ctx = document.getElementById('real-direction-chart'); if (!ctx) return;
  if (Charts.realDir) Charts.realDir.destroy();
  const SHORT = {
    'Субсидирование в скотоводстве':          'Скотоводство',
    'Субсидирование в птицеводстве':           'Птицеводство',
    'Субсидирование в овцеводстве':            'Овцеводство',
    'Субсидирование в коневодстве':            'Коневодство',
    'Субсидирование в верблюдоводстве':        'Верблюдоводство',
    'Субсидирование в свиноводстве':           'Свиноводство',
    'Субсидирование в пчеловодстве':           'Пчеловодство',
    'Субсидирование в козоводстве':            'Козоводство',
    'Субсидирование затрат по искусственному осеменению': 'Жасанды ұрықтандыру',
  };
  const sorted = Object.entries(byDir).sort((a, b) => b[1] - a[1]);
  const colors = ['#1B5E20','#2E7D32','#388E3C','#43A047','#4CAF50','#66BB6A','#81C784','#A5D6A7','#C8E6C9'];
  Charts.realDir = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sorted.map(([k]) => SHORT[k] || k),
      datasets: [{ label: 'Өтінімдер', data: sorted.map(([,v]) => v),
        backgroundColor: colors, borderRadius: 5 }]
    },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => c.parsed.x.toLocaleString() + ' өтінім' } } },
      scales: { x: { beginAtZero: true, ticks: { font: { size: 10 } } }, y: { ticks: { font: { size: 11 } } } }
    }
  });
}

function initRealStatusChart(byStatus) {
  const ctx = document.getElementById('real-status-chart'); if (!ctx) return;
  if (Charts.realStatus) Charts.realStatus.destroy();
  const colorMap = {
    'Исполнена':                  '#1B5E20',
    'Одобрена':                   '#43A047',
    'Сформировано поручение':     '#1565C0',
    'Отозвано':                   '#F9A825',
    'Отклонена':                  '#C62828',
    'Получена':                   '#9E9E9E',
  };
  const entries = Object.entries(byStatus).sort((a, b) => b[1] - a[1]);
  Charts.realStatus = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: entries.map(([k]) => k),
      datasets: [{ data: entries.map(([, v]) => v),
        backgroundColor: entries.map(([k]) => colorMap[k] || '#9E9E9E'),
        borderWidth: 2, borderColor: '#fff', hoverOffset: 6 }]
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: '58%',
      plugins: { legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 11 }, usePointStyle: true, padding: 6 } },
        tooltip: { callbacks: { label: c => `${c.label}: ${c.parsed.toLocaleString()} (${Math.round(c.parsed / c.dataset.data.reduce((a,b)=>a+b,0)*100)}%)` } }
      }
    }
  });
}

function initRegionalChartReal(byRegion) {
  const ctx = document.getElementById('regional-chart'); if (!ctx) return;
  if (Charts.regional) Charts.regional.destroy();
  const data = Object.entries(byRegion).sort((a, b) => b[1] - a[1]).slice(0, 10);
  Charts.regional = new Chart(ctx, { type: 'bar',
    data: { labels: data.map(d => d[0].length > 14 ? d[0].slice(0, 14) + '…' : d[0]),
      datasets: [{ label: 'Өтінімдер', data: data.map(d => d[1]), backgroundColor: '#1B5E20', borderRadius: 4 }] },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => c.parsed.x.toLocaleString() } } },
      scales: { x: { beginAtZero: true, ticks: { font: { size: 11 } } }, y: { ticks: { font: { size: 11 } } } }
    }
  });
}

// ─── SCORE DISTRIBUTION (replaces mock "type" chart) ────────────────────────
function initTypeChart() {
  const ctx = document.getElementById('type-chart'); if (!ctx) return;
  if (Charts.typeChart) Charts.typeChart.destroy();

  // Try to use real_stats scoreDistribution, otherwise compute from AppState
  fetch('/api/real-stats')
    .then(r => r.ok ? r.json() : null)
    .then(s => {
      let labels, values, colors;
      if (s && s.scoreDistribution) {
        labels = ['Жоғары (70–100)', 'Орташа (50–69)', 'Төмен (<50)'];
        values = [s.scoreDistribution.high70, s.scoreDistribution.mid50, s.scoreDistribution.low50];
        colors = ['#1B5E20', '#F9A825', '#C62828'];
      } else {
        const buckets = { h: 0, m: 0, l: 0 };
        AppState.applicants.forEach(a => {
          const sc = a.hybridScore || a.totalScore || 0;
          if (sc >= 70) buckets.h++; else if (sc >= 50) buckets.m++; else buckets.l++;
        });
        labels = ['Жоғары (70+)', 'Орташа (50–69)', 'Төмен (<50)'];
        values = [buckets.h, buckets.m, buckets.l];
        colors = ['#1B5E20', '#F9A825', '#C62828'];
      }
      if (Charts.typeChart) Charts.typeChart.destroy();
      Charts.typeChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#fff', hoverOffset: 6 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '60%',
          plugins: { legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 12 }, usePointStyle: true } },
            tooltip: { callbacks: { label: c => `${c.label}: ${c.parsed.toLocaleString()} (${Math.round(c.parsed/values.reduce((a,b)=>a+b,0)*100)}%)` } }
          }
        }
      });
    }).catch(() => {});
}

// ─── REGIONAL CHART (fallback if real-stats not available) ───────────────────
function initRegionalChart() {
  // Will be overridden by loadRealAnalyticsCharts → initRegionalChartReal
  const ctx = document.getElementById('regional-chart'); if (!ctx) return;
  if (Charts.regional) Charts.regional.destroy();
  const data = Object.entries(AppState.getStats().byRegion).sort((a, b) => b[1] - a[1]).slice(0, 8);
  Charts.regional = new Chart(ctx, { type: 'bar',
    data: { labels: data.map(d => d[0].length > 12 ? d[0].slice(0, 12) + '...' : d[0]),
      datasets: [{ label: 'Өтінімдер', data: data.map(d => d[1]), backgroundColor: '#1B5E20', borderRadius: 4 }] },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, ticks: { font: { size: 11 } } }, y: { ticks: { font: { size: 11 } } } }
    }
  });
}

function initTrendChart() {
  const ctx = document.getElementById('trend-chart'); if (!ctx) return;
  if (Charts.trend) Charts.trend.destroy();
  const months = TRANSLATIONS[window.currentLang || 'kk'].months;
  Charts.trend = new Chart(ctx, { type: 'line',
    data: { labels: months, datasets: [
      { label: '2023', data: months.map(() => rnd(40, 110)), borderColor: '#1B5E20', tension: 0.4, fill: false, pointRadius: 3 },
      { label: '2024', data: months.map(() => rnd(60, 130)), borderColor: '#F9A825', tension: 0.4, fill: false, pointRadius: 3 },
      { label: '2025', data: [197, 312, 2854, 4820, 7615, 9200, 11050, 13400, 15800, 18200, 21012, null].map(v => v || rnd(80, 150)),
        borderColor: '#1565C0', tension: 0.4, fill: false, pointRadius: 3 },
    ]},
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: { font: { family: 'Inter', size: 12 }, usePointStyle: true } } },
      scales: { x: { ticks: { font: { size: 11 } } }, y: { beginAtZero: true, ticks: { font: { size: 11 } } } }
    }
  });
}

// ─── SCATTER: Head Count vs Score (using real fields) ────────────────────────
function initScatterChart() {
  const ctx = document.getElementById('scatter-chart'); if (!ctx) return;
  if (Charts.scatter) Charts.scatter.destroy();
  const mkData = (min, max) => AppState.applicants
    .filter(a => { const s = a.hybridScore || a.totalScore; return s >= min && s < max; })
    .map(a => ({ x: Math.min(a.headCount || 0, 2000), y: a.hybridScore || a.totalScore || 0 }));

  Charts.scatter = new Chart(ctx, { type: 'scatter',
    data: { datasets: [
      { label: 'Жоғары (70+)',    data: mkData(70, 101), backgroundColor: 'rgba(27,94,32,0.55)',  pointRadius: 4 },
      { label: 'Орташа (50–69)', data: mkData(50, 70),  backgroundColor: 'rgba(249,168,37,0.55)', pointRadius: 4 },
      { label: 'Төмен (<50)',    data: mkData(0, 50),   backgroundColor: 'rgba(198,40,40,0.55)',  pointRadius: 4 },
    ]},
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: { font: { family: 'Inter', size: 12 }, usePointStyle: true } },
        tooltip: { callbacks: { label: c => `Бас: ${c.parsed.x}, Балл: ${c.parsed.y}` } }
      },
      scales: {
        x: { title: { display: true, text: 'Мал басы', font: { size: 11 } }, ticks: { font: { size: 11 } } },
        y: { title: { display: true, text: 'Жиынтық балл', font: { size: 11 } }, ticks: { font: { size: 11 } }, min: 0, max: 100 }
      }
    }
  });
}

function initClusterChart() {
  const ctx = document.getElementById('cluster-chart'); if (!ctx) return;
  if (Charts.cluster) Charts.cluster.destroy();
  const labels = CLUSTER_ORDERED_LABELS.map(l => l.name);
  const colors = CLUSTER_ORDERED_LABELS.map(l => l.color);
  const counts = labels.map(lbl => AppState.applicants.filter(a => a.clusterLabel === lbl).length);
  Charts.cluster = new Chart(ctx, { type: 'doughnut',
    data: { labels, datasets: [{ data: counts, backgroundColor: colors, borderWidth: 2, borderColor: '#fff', hoverOffset: 6 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '55%',
      plugins: { legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 12 }, usePointStyle: true } } }
    }
  });
}

function initProbabilityChart() {
  const ctx = document.getElementById('probability-chart'); if (!ctx) return;
  if (Charts.probability) Charts.probability.destroy();
  const buckets = ['0–20', '21–40', '41–60', '61–80', '81–100'];
  const counts = [0, 0, 0, 0, 0];
  AppState.applicants.forEach(a => {
    const p = a.successProb ? a.successProb.probability : calcSuccessProbability(a).probability;
    counts[Math.min(Math.floor(p / 20), 4)]++;
  });
  Charts.probability = new Chart(ctx, { type: 'bar',
    data: { labels: buckets.map(b => b + '%'), datasets: [{ label: 'Өтінімдер', data: counts,
      backgroundColor: ['#C62828', '#E65100', '#F9A825', '#388E3C', '#1B5E20'], borderRadius: 4 }] },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { font: { size: 11 } } }, y: { beginAtZero: true, ticks: { font: { size: 11 } } } }
    }
  });
}

function refreshAnalytics() {
  Object.values(Charts).forEach(c => { try { c.destroy(); } catch {} });
  initAnalytics();
  showToast('Жаңартылды ✅', 'success', 2000);
}
