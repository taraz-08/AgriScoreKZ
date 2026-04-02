'use strict';

// ─── SHORTLIST PAGE ───────────────────────────────────────────────────────────
let dragSrc = null;

function initShortlist() { renderShortlistBudget(); renderShortlistTable(); }

function renderShortlistBudget() {
  const total = AppState.shortlist.reduce((s,a)=>s+(a.recommendedAmount||0),0);
  const budget = 6_100_000_000, pct = Math.min(100, Math.round(total/budget*100));
  const rem = document.getElementById('budget-remaining');
  const bar = document.getElementById('budget-progress');
  const lbl = document.getElementById('budget-label');
  const fc  = document.getElementById('shortlist-footer-count');
  const fa  = document.getElementById('shortlist-footer-amount');
  if(rem) rem.textContent = `Қалған: ${formatMoney(budget-total)}`;
  if(bar) bar.style.width = pct+'%';
  if(lbl) lbl.textContent = `${formatMoney(total)} / ${formatMoney(budget)} (${pct}%)`;
  if(fc)  fc.textContent  = `${formatNumber(AppState.shortlist.length)} өтінімдер`;
  if(fa)  fa.textContent  = formatMoney(total);
}

function renderShortlistTable() {
  const tbody = document.getElementById('shortlist-tbody');
  if (!tbody) return;
  if (!AppState.shortlist.length) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state">
      <div class="empty-icon">📋</div><div class="empty-title">Shortlist бос</div>
      <div class="empty-subtitle">Өтінімдер бетінен өтінімдерді shortlist-ке қосыңыз</div>
      <button class="btn btn-primary" onclick="navigateTo('applicants')"><i class="fas fa-list"></i> Өтінімдерге өту</button>
    </div></td></tr>`; return;
  }
  tbody.innerHTML = AppState.shortlist.map((a,i)=>`
    <tr draggable="true" data-sl-id="${a.id}" ondragstart="onDragStart(event,${i})" ondragover="onDragOver(event)" ondrop="onDrop(event,${i})" ondragend="onDragEnd(event)">
      <td><span class="drag-handle">⋮⋮</span></td>
      <td><span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:var(--bg);font-size:12px;font-weight:700">${i+1}</span></td>
      <td><div style="font-weight:600;font-family:monospace;font-size:12px">${a.appNum||a.name}</div><div style="font-size:11px;color:var(--text-muted)">${a.district}</div></td>
      <td style="font-size:13px">${a.district}</td>
      <td><span class="badge ${getScoreBadgeClass(a.hybridScore||a.totalScore)}">${a.hybridScore||a.totalScore}</span></td>
      <td style="font-size:13px">${formatMoney(a.requestedAmount)}</td>
      <td>
        <input type="text" class="inline-edit" style="width:120px" value="${formatMoney(a.recommendedAmount)}"
          onfocus="this.value='${a.recommendedAmount}'"
          onblur="updateRecAmount('${a.id}',this)">
      </td>
      <td><span class="badge badge-success">${a.shortlistStatus||'Ұсынылды'}</span></td>
      <td><button class="action-btn danger" onclick="removeFromSL('${a.id}')"><i class="fas fa-trash"></i></button></td>
    </tr>`).join('');
}

function updateRecAmount(id, input) {
  const raw = parseFloat(input.value.replace(/[^\d.]/g,''))||0;
  const item = AppState.shortlist.find(s=>s.id===id);
  if (item) { item.recommendedAmount = raw > 10000 ? raw : raw * 1_000_000; AppState.save(); }
  input.value = formatMoney(item.recommendedAmount);
  renderShortlistBudget();
}

function removeFromSL(id) {
  showConfirm('Алып тастау', 'Shortlist-тен алып тастайсыз ба?', () => {
    AppState.removeFromShortlist(id);
    renderShortlistTable();
    renderShortlistBudget();
    showToast('Shortlist-тен алынды', 'info', 2000);
  });
}

function finalApprove() {
  showConfirm('✅ Финалды бекіту', `${formatNumber(AppState.shortlist.length)} өтінімді бекітуді растайсыз ба?`, () => {
    showToast('🎉 Shortlist тізімі бекітілді!', 'success', 5000);
  }, false);
}

function shortlistAIAnalysis() {
  const n = AppState.shortlist.length;
  const avg = n ? Math.round(AppState.shortlist.reduce((s,a)=>s+(a.hybridScore||a.totalScore),0)/n) : 0;
  const budget = AppState.shortlist.reduce((s,a)=>s+(a.recommendedAmount||0),0);
  const prompt = `AgriScore KZ жүйесі. ${n} өтінімнен тұратын shortlist. Орташа балл: ${avg}/100. Жалпы сома: ${formatMoney(budget)}. Тізімнің сапасы туралы қазақша талдау.`;
  showAIModal('🤖 AI Shortlist Талдауы', prompt, 'analyze');
}

function exportShortlistExcel() { exportToExcel(AppState.shortlist,'AgriScore_Shortlist'); showToast('Excel файлы жүктелді ✅','success'); }

function showEmailModal() {
  showModal('<i class="fas fa-envelope"></i> Комиссияға жіберу',
    `<div class="form-group"><label class="form-label">Кімге</label><input class="form-control" value="commission@agrimin.kz"></div>
     <div class="form-group"><label class="form-label">Тақырып</label><input class="form-control" value="AgriScore KZ — Shortlist ${new Date().getFullYear()}"></div>
     <div class="form-group"><label class="form-label">Хабарлама</label><textarea class="form-control" rows="4">Shortlist тізімі қоса беріліп отыр. Жалпы ${AppState.shortlist.length} өтінімдер.</textarea></div>
     <label class="form-check"><input type="checkbox" checked> <span style="font-size:13px">Shortlist тізімін тіркеу</span></label>`,
    `<button class="btn btn-ghost" onclick="closeModal()">Болдырмау</button>
     <button class="btn btn-primary" onclick="closeModal();showToast('✉️ Хат жіберілді','success')"><i class="fas fa-paper-plane"></i> Жіберу</button>`);
}

// Drag & Drop
function onDragStart(e,i) { dragSrc=i; e.target.closest('tr').classList.add('dragging'); e.dataTransfer.effectAllowed='move'; }
function onDragOver(e) { e.preventDefault(); e.currentTarget.closest('tr')?.classList.add('drag-over'); }
function onDrop(e,i) {
  e.preventDefault(); e.currentTarget.closest('tr')?.classList.remove('drag-over');
  if(dragSrc===null||dragSrc===i) return;
  const arr=AppState.shortlist; const [item]=arr.splice(dragSrc,1); arr.splice(i,0,item);
  AppState.save(); renderShortlistTable();
}
function onDragEnd(e) { e.target.closest('tr')?.classList.remove('dragging'); document.querySelectorAll('tr.drag-over').forEach(r=>r.classList.remove('drag-over')); dragSrc=null; }
