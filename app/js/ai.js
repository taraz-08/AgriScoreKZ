'use strict';

// ─── DEMO RESPONSES (API кілт жоқ болса) ─────────────────────────────────────
const DEMO_AI_RESPONSES = {
  score: `Бұл өтінімдер бойынша автоматты скоринг жүйесі 5 негізгі факторды ескерді:\n\n✅ **Субсидия тарихы (25%)** — Өтінімдер субсидияны бұрын тиімді пайдаланған.\n✅ **Өнімділік (30%)** — Аймақтық орташадан жоғары өнімділік деңгейі анықталды.\n⚠️ **Шаруашылық профилі (20%)** — Жер алаңы оңтайлы диапазонда.\n✅ **Әлеуметтік-экономикалық (15%)** — Ауылдық аймақта орналасқан, жұмыс орындары бар.\n✅ **Тәуекел бағасы (10%)** — Таза несие тарихы, салық берешегі жоқ.\n\nЖалпы баға: субсидия беруге **ұсынылады**.`,
  risk: `Тәуекел талдауы негізінде:\n\n🟢 **Қаржылық тәуекел — ТӨМЕН**: Таза несие тарихы анықталды, банктік міндеттемелер жоқ.\n🟡 **Операциялық тәуекел — ОРТАША**: Техника паркі жеткілікті, бірақ ескіру деңгейін бақылау қажет.\n🟢 **Заңдық тәуекел — ТӨМЕН**: Сот дауы жоқ, салық берешегі тазаланған.\n\nЖалпы тәуекел деңгейі: **ТӨМЕН** ✅`,
  recommend: `Скоринг нәтижелері мен тәуекел талдауы негізінде осы өтінімді субсидия беруге ҰСЫНАМЫЗ.\n\nНегіздеме:\n• Өнімділік аймақтық орташадан 15-20% жоғары\n• Бұрынғы субсидияларды толық игерген тарих бар\n• Ауылдық аймақта жұмыс орындарын қамтамасыз етеді\n• Тәуекел деңгейі төмен, қаржылық жағдайы тұрақты\n\nСубсидия сомасы бюджет шегінде бекітілуі мүмкін.`,
  analyze: `Жүйеге жүктелген деректер талдауы:\n\n📊 **Жалпы сурет:**\n• Өтінімдердің 45%+ ұсынылуға лайықты (70+ балл)\n• Ең белсенді аймақтар: Алматы, Қостанай, Шығыс ҚЗ\n• Егіншілік саласы басым (48%)\n\n🔍 **Негізгі тенденциялар:**\n• Орташа жер алаңы: 450 га\n• Суландыру жүйесі бар шаруашылықтар жоғары балл алады\n• Техника саны >5 болған жағдайда балл 12-15%-ға артады\n\n💡 **Ұсыныс:** Shortlist үшін 65+ балл шегін қолдану оңтайлы.`,
};

// ─── AI CALL ──────────────────────────────────────────────────────────────────
async function callGemini(prompt, type = 'score') {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  const d = await res.json();
  if (d.demo) {
    await new Promise(r => setTimeout(r, 1200));
    return DEMO_AI_RESPONSES[type] || DEMO_AI_RESPONSES.score;
  }
  if (!res.ok || d.error) throw new Error(d.error?.message || `API қатесі: ${res.status}`);
  return d.candidates?.[0]?.content?.parts?.[0]?.text || 'Жауап алынбады';
}

// ─── AI MODAL ─────────────────────────────────────────────────────────────────
function showAIModal(title, prompt, type = 'score') {
  showModal(title,
    `<div id="ai-loading" style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:32px">
       <div style="font-size:40px;color:var(--primary);animation:spin 1.5s linear infinite"><i class="fas fa-seedling"></i></div>
       <p style="font-size:13px;color:var(--text-muted)" id="ai-loading-text">AI талдауда...</p>
     </div>
     <div id="ai-result" style="display:none">
       <div class="ai-response" id="ai-text" style="background:var(--primary-pale);border-left:3px solid var(--primary);border-radius:0 8px 8px 0;padding:16px;font-size:13px;line-height:1.8;white-space:pre-wrap"></div>
       <p id="ai-footer-note" style="font-size:11px;color:var(--text-muted);margin-top:8px;text-align:right">🤖 AgriScore AI</p>
     </div>`,
    `<button class="btn btn-outline" onclick="closeModal()">Жабу</button>`,
    'modal-lg'
  );
  fetch('/api/gemini-status').then(r=>r.json()).then(s => {
    const ltxt = document.getElementById('ai-loading-text');
    if (ltxt) ltxt.textContent = s.hasKey ? 'Alem LLM талдауда...' : 'Demo жауап дайындалуда...';
  }).catch(()=>{});

  callGemini(prompt, type).then(text => {
    const loading = document.getElementById('ai-loading');
    const result  = document.getElementById('ai-result');
    const textEl  = document.getElementById('ai-text');
    const note    = document.getElementById('ai-footer-note');
    if (!loading || !result || !textEl) return;
    loading.style.display = 'none';
    result.style.display  = 'block';
    if (note) {
      fetch('/api/gemini-status').then(r=>r.json()).then(s => {
        note.textContent = s.provider === 'alem' ? '🤖 Alem LLM (alemllm)' : s.provider === 'gemini' ? '🤖 Google Gemini 2.5 Flash' : '⚠️ Demo режим';
      }).catch(()=>{});
    }
    typewriter(textEl, text, 15);
  }).catch(err => {
    const loading = document.getElementById('ai-loading');
    if (loading) loading.innerHTML = `<p style="color:var(--danger)">❌ ${err.message}</p><p style="font-size:12px;color:var(--text-muted);margin-top:8px">server.js → .env файлын тексеріңіз</p>`;
  });
}

// ─── TYPEWRITER EFFECT ────────────────────────────────────────────────────────
function typewriter(el, text, speed = 20) {
  el.textContent = '';
  let i = 0;
  const t = setInterval(() => {
    if (i < text.length) { el.textContent += text[i++]; el.scrollTop = el.scrollHeight; }
    else clearInterval(t);
  }, speed);
}
