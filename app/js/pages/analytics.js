'use strict';

// ─── ANALYTICS PAGE ───────────────────────────────────────────────────────────
function initAnalytics() {
  setTimeout(() => { initRegionalChart(); initTypeChart(); initTrendChart(); initScatterChart(); initClusterChart(); initProbabilityChart(); }, 100);
}

function initRegionalChart() {
  const ctx = document.getElementById('regional-chart'); if(!ctx) return;
  if(Charts.regional) Charts.regional.destroy();
  const data = Object.entries(AppState.getStats().byRegion).sort((a,b)=>b[1]-a[1]).slice(0,8);
  Charts.regional = new Chart(ctx, { type:'bar',
    data:{ labels:data.map(d=>d[0].length>12?d[0].slice(0,12)+'...':d[0]), datasets:[{label:'Өтінімдер',data:data.map(d=>d[1]),backgroundColor:'#1B5E20',borderRadius:4}] },
    options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false}}, scales:{x:{beginAtZero:true,ticks:{font:{size:11}}},y:{ticks:{font:{size:11}}}} }
  });
}

function initTypeChart() {
  const ctx = document.getElementById('type-chart'); if(!ctx) return;
  if(Charts.typeChart) Charts.typeChart.destroy();
  const data = Object.entries(AppState.getStats().byType);
  Charts.typeChart = new Chart(ctx, { type:'doughnut',
    data:{ labels:data.map(d=>d[0]), datasets:[{data:data.map(d=>d[1]),backgroundColor:['#1B5E20','#F9A825','#1565C0','#E53935'],borderWidth:2,borderColor:'#fff',hoverOffset:6}] },
    options:{ responsive:true, maintainAspectRatio:false, cutout:'60%',
      plugins:{legend:{position:'bottom',labels:{font:{family:'Inter',size:12},usePointStyle:true}}} }
  });
}

function initTrendChart() {
  const ctx = document.getElementById('trend-chart'); if(!ctx) return;
  if(Charts.trend) Charts.trend.destroy();
  const months = TRANSLATIONS[window.currentLang||'kk'].months;
  Charts.trend = new Chart(ctx, { type:'line',
    data:{ labels:months, datasets:[
      {label:'2023',data:months.map(()=>rnd(40,110)),borderColor:'#1B5E20',tension:0.4,fill:false,pointRadius:3},
      {label:'2024',data:months.map(()=>rnd(60,130)),borderColor:'#F9A825',tension:0.4,fill:false,pointRadius:3},
      {label:'2025',data:months.map(()=>rnd(80,150)),borderColor:'#1565C0',tension:0.4,fill:false,pointRadius:3},
    ]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{legend:{position:'top',labels:{font:{family:'Inter',size:12},usePointStyle:true}}},
      scales:{x:{ticks:{font:{size:11}}},y:{beginAtZero:true,ticks:{font:{size:11}}}}
    }
  });
}

function initScatterChart() {
  const ctx = document.getElementById('scatter-chart'); if(!ctx) return;
  if(Charts.scatter) Charts.scatter.destroy();
  const mkData = (min, max) => AppState.applicants.filter(a=>{const s=a.hybridScore||a.totalScore;return s>=min&&s<max;}).map(a=>({x:a.landArea,y:a.productivity}));
  Charts.scatter = new Chart(ctx, { type:'scatter',
    data:{ datasets:[
      {label:'Жоғары (70+)',data:mkData(70,101),backgroundColor:'rgba(27,94,32,0.6)',pointRadius:5},
      {label:'Орташа (50-69)',data:mkData(50,70),backgroundColor:'rgba(249,168,37,0.6)',pointRadius:5},
      {label:'Төмен (<50)',data:mkData(0,50),backgroundColor:'rgba(198,40,40,0.6)',pointRadius:5},
    ]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{legend:{position:'top',labels:{font:{family:'Inter',size:12},usePointStyle:true}},tooltip:{callbacks:{label:c=>`${c.parsed.x} га, ${c.parsed.y}% өнімділік`}}},
      scales:{x:{title:{display:true,text:'Алаң (га)',font:{size:11}},ticks:{font:{size:11}}},y:{title:{display:true,text:'Өнімділік (%)',font:{size:11}},ticks:{font:{size:11}}}}
    }
  });
}

function initClusterChart() {
  const ctx = document.getElementById('cluster-chart'); if(!ctx) return;
  if(Charts.cluster) Charts.cluster.destroy();
  const labels = CLUSTER_ORDERED_LABELS.map(l=>l.name);
  const colors = CLUSTER_ORDERED_LABELS.map(l=>l.color);
  const counts = labels.map(lbl => AppState.applicants.filter(a=>a.clusterLabel===lbl).length);
  Charts.cluster = new Chart(ctx, { type:'doughnut',
    data:{ labels, datasets:[{ data:counts, backgroundColor:colors, borderWidth:2, borderColor:'#fff', hoverOffset:6 }] },
    options:{ responsive:true, maintainAspectRatio:false, cutout:'55%',
      plugins:{ legend:{ position:'bottom', labels:{ font:{ family:'Inter', size:12 }, usePointStyle:true } } } }
  });
}

function initProbabilityChart() {
  const ctx = document.getElementById('probability-chart'); if(!ctx) return;
  if(Charts.probability) Charts.probability.destroy();
  const buckets = ['0-20','21-40','41-60','61-80','81-100'];
  const counts = [0,0,0,0,0];
  AppState.applicants.forEach(a => {
    const p = a.successProb ? a.successProb.probability : calcSuccessProbability(a).probability;
    counts[Math.min(Math.floor(p/20), 4)]++;
  });
  Charts.probability = new Chart(ctx, { type:'bar',
    data:{ labels: buckets.map(b=>b+'%'), datasets:[{ label:'Өтінімдер', data:counts,
      backgroundColor:['#C62828','#E65100','#F9A825','#388E3C','#1B5E20'], borderRadius:4 }] },
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:false } }, scales:{ x:{ ticks:{ font:{ size:11 } } }, y:{ beginAtZero:true, ticks:{ font:{ size:11 } } } } }
  });
}

function refreshAnalytics() { Object.values(Charts).forEach(c=>{try{c.destroy()}catch{}}); initAnalytics(); showToast('Жаңартылды ✅','success',2000); }
