'use strict';

// ─── PDF GENERATION ───────────────────────────────────────────────────────────
function generateShortlistPDF() {
  if (!AppState.shortlist.length) { showToast('Shortlist бос', 'warning'); return; }
  const now = new Date();
  const total = AppState.shortlist.reduce((s,a)=>s+(a.recommendedAmount||0),0);
  const rows = AppState.shortlist.map((a,i) => {
    const score = a.hybridScore||a.totalScore;
    const ident = a.name || a.appNum || a.id;
    const subLabel = (a.direction||a.productionType||'').replace('Субсидирование затрат по ','').replace('Субсидирование ','').replace(/^в /,'').replace(/^по /,'').slice(0,28);
    return `<tr>
      <td>${i+1}</td>
      <td><b>${ident}</b>${a.appNum&&a.name?`<br><span style="font-size:9px;color:#888">${a.appNum}</span>`:''}</td>
      <td>${a.region||'—'}</td>
      <td>${a.district||a.iin||'—'}</td>
      <td>${subLabel||'—'}</td>
      <td style="text-align:center;font-weight:700;color:${score>=70?'#1B5E20':score>=50?'#F57F17':'#C62828'}">${score}</td>
      <td>${formatMoney(a.requestedAmount)}</td>
      <td style="font-weight:600">${formatMoney(a.recommendedAmount)}</td>
      <td style="color:${score>=70?'#1B5E20':'#F57F17'}">${a.shortlistStatus||'Ұсынылды'}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>AgriScore KZ — Shortlist ${now.getFullYear()}</title>
  <style>
    body{font-family:Arial,sans-serif;font-size:12px;color:#111;margin:30px}
    h1{font-size:20px;color:#1B5E20;margin-bottom:4px}
    .subtitle{color:#666;font-size:12px;margin-bottom:20px}
    .meta{display:flex;gap:40px;margin-bottom:24px;padding:12px;background:#F4F6F4;border-radius:8px}
    .meta-item{text-align:center}
    .meta-num{font-size:22px;font-weight:800;color:#1B5E20}
    .meta-lbl{font-size:10px;color:#666;margin-top:2px}
    table{width:100%;border-collapse:collapse;font-size:11px}
    th{background:#1B5E20;color:#fff;padding:8px 6px;text-align:left}
    td{padding:7px 6px;border-bottom:1px solid #e0e0e0}
    tr:nth-child(even){background:#f9f9f9}
    .footer{margin-top:24px;padding-top:12px;border-top:1px solid #ccc;font-size:10px;color:#888;display:flex;justify-content:space-between}
    @media print{body{margin:15px}}
  </style></head><body>
  <h1>🌾 AgriScore KZ — Shortlist тізімі</h1>
  <div class="subtitle">ҚР Ауыл шаруашылығы министрлігі · ${now.getFullYear()} жылғы субсидия науқаны · Жасалды: ${formatDate(now)}</div>
  <div class="meta">
    <div class="meta-item"><div class="meta-num">${AppState.shortlist.length}</div><div class="meta-lbl">Өтінімдер</div></div>
    <div class="meta-item"><div class="meta-num">${formatMoney(total)}</div><div class="meta-lbl">Ұсынылған сома</div></div>
    <div class="meta-item"><div class="meta-num">${Math.round(AppState.shortlist.reduce((s,a)=>s+(a.hybridScore||a.totalScore),0)/AppState.shortlist.length)}</div><div class="meta-lbl">Орташа балл</div></div>
    <div class="meta-item"><div class="meta-num">${AppState.shortlist.filter(a=>(a.hybridScore||a.totalScore)>=70).length}</div><div class="meta-lbl">Жоғары балл (70+)</div></div>
  </div>
  <table>
    <thead><tr><th>#</th><th>Өтініш / Нөмір</th><th>Облыс</th><th>Аудан</th><th>Бағыт</th><th>Балл</th><th>Сұралған ₸</th><th>Ұсынылған ₸</th><th>Мәртебе</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">
    <span>AgriScore KZ скоринг жүйесі — автоматты есеп</span>
    <span>Комиссия күні: 15.09.${now.getFullYear()}</span>
  </div>
  <script>window.onload=()=>{window.print()}<\/script>
  </body></html>`;

  const w = window.open('','_blank','width=1000,height=700');
  if (w) { w.document.write(html); w.document.close(); }
  else showToast('Popup блокталған — браузер рұқсатын беріңіз', 'warning');
}

function generateMethodologyPDF() {
  const weights = loadWeights();
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>AgriScore KZ — Методология</title>
  <style>
    body{font-family:Arial,sans-serif;font-size:12px;color:#111;margin:30px}
    h1{font-size:22px;color:#1B5E20;margin-bottom:4px}
    h2{font-size:15px;color:#1B5E20;margin:20px 0 8px;border-bottom:2px solid #1B5E20;padding-bottom:4px}
    .subtitle{color:#666;font-size:12px;margin-bottom:20px}
    .factor{margin-bottom:12px;padding:12px;border-left:4px solid #1B5E20;background:#f9f9f9;border-radius:0 8px 8px 0}
    .factor-title{font-weight:700;font-size:13px;margin-bottom:4px}
    .weight-badge{display:inline-block;background:#1B5E20;color:#fff;padding:2px 8px;border-radius:10px;font-size:10px;margin-left:8px}
    .formula{background:#f0f0f0;padding:12px;border-radius:6px;font-family:monospace;font-size:12px;margin:12px 0}
    table{width:100%;border-collapse:collapse;font-size:11px;margin-top:8px}
    th{background:#1B5E20;color:#fff;padding:7px 10px;text-align:left}
    td{padding:7px 10px;border-bottom:1px solid #ddd}
    tr:nth-child(even){background:#f9f9f9}
    .footer{margin-top:24px;padding-top:12px;border-top:1px solid #ccc;font-size:10px;color:#888;display:flex;justify-content:space-between}
    @media print{body{margin:15px}}
  </style></head><body>
  <h1>📖 AgriScore KZ — Скоринг методологиясы</h1>
  <div class="subtitle">ҚР Ауыл шаруашылығы министрлігі · Merit-based субсидия бөлу жүйесі · ${formatDate(new Date())}</div>
  <h2>1. Жүйенің мақсаты</h2>
  <p>AgriScore KZ — ауылшаруашылығы субсидияларын "бірінші берген — бірінші алады" принципінен деректерге негізделген объективті рейтингке көшіру жүйесі.</p>
  <h2>2. Гибридті скоринг</h2>
  <p><b>Финалды балл = 50% ML + 30% бизнес ережелер + 20% тәуекел инверсиясы + кластер бонусы</b></p>
  <div class="formula">FINAL = businessScore×0.30 + mlProbability×0.50 + (100−riskPenalty)×0.20 + clusterBonus</div>
  <p style="font-size:11px;color:#666">ML модель 36,651 нақты өтінімге (subsidy.plem.kz, 2025) калибрленген</p>
  <h2>3. Бизнес-скоринг факторлары (Приложение 1 и 2, Правила №108)</h2>
  <div class="factor"><div class="factor-title">Поголовье / Масштаб хозяйства <span class="weight-badge">${Math.round((weights.headCount??0.30)*100)}%</span></div>headCount = субсидия сомасы ÷ норматив (§3 Правил). Аймақ медианымен лог-шкала бойынша салыстырылады. Максимум: 30 балл.</div>
  <div class="factor"><div class="factor-title">Стратегиялық бағыт <span class="weight-badge">${Math.round((weights.directionPriority??0.25)*100)}%</span></div>Ұлттық бюджет бөлінісіне негізделген приоритет: Скотоводство (91 млрд) &gt; Птицеводство (30 млрд) &gt; Овцеводство (10 млрд). Максимум: 25 балл.</div>
  <div class="factor"><div class="factor-title">Субсидия категориясы <span class="weight-badge">${Math.round((weights.subsidyCategory??0.20)*100)}%</span></div>Норматив мәніне қарай: племенной скот (≥100K/бас) &gt; селекция (15K) &gt; генетикалық қызмет &gt; өнімділік субсидиясы (кг-ға). Максимум: 20 балл.</div>
  <div class="factor"><div class="factor-title">Аймақтық салыстыру <span class="weight-badge">${Math.round((weights.regionalComparison??0.15)*100)}%</span></div>Субсидия сомасы бағыт+аймақ медианымен салыстырылады. Медианнан жоғары = тұрақты шаруашылық. Максимум: 15 балл.</div>
  <h2>4. Шешім қабылдау матрицасы</h2>
  <table>
    <thead><tr><th>Балл</th><th>Мәртебе</th><th>Тәуекел</th><th>Ұсыным</th></tr></thead>
    <tbody>
      <tr><td>70–100</td><td>✅ Ұсынылды</td><td>🟢 Төмен</td><td>Shortlist-ке қосу</td></tr>
      <tr><td>50–69</td><td>⚠️ Тексеруде</td><td>🟡 Орташа</td><td>Комиссия қарауы</td></tr>
      <tr><td>0–49</td><td>❌ Ұсынылмайды</td><td>🔴 Жоғары</td><td>Бас тарту</td></tr>
    </tbody>
  </table>
  <div class="footer">
    <span>AgriScore KZ — ҚР АШМ скоринг жүйесі</span><span>Жасалды: ${formatDate(new Date())}</span>
  </div>
  <script>window.onload=()=>{window.print()}<\/script>
  </body></html>`;

  const w = window.open('','_blank','width=900,height=700');
  if (w) { w.document.write(html); w.document.close(); }
  else showToast('Popup блокталған — браузер рұқсатын беріңіз', 'warning');
}
