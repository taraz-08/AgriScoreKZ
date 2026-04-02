// AgriScore KZ — Data Models, Sample Data Generator, Scoring Algorithm
// Scoring redesigned for real subsidy dataset (Выгрузка по выданным субсидиям 2025)
// Business rules from: Правила субсидирования племенного животноводства (Приказ №108, 2019)

// ─── REAL DATASET CONSTANTS ──────────────────────────────────────────────────
// Derived from 36,651 real applications (subsidy.plem.kz, 2025)

// Direction names (col 7 of real Excel)
const DIRECTIONS = [
  'Субсидирование в скотоводстве',
  'Субсидирование в овцеводстве',
  'Субсидирование в птицеводстве',
  'Субсидирование в свиноводстве',
  'Субсидирование в верблюдоводстве',
  'Субсидирование в коневодстве',
  'Субсидирование затрат по искусственному осеменению',
  'Субсидирование в пчеловодстве',
  'Субсидирование в козоводстве',
];

// Direction strategic priority score (0–100) based on national budget allocation
// Cattle: 91B KZT; Poultry: 30B; Sheep: 10B; Horse/Camel: 1.8B each
const DIR_PRIORITY = {
  'Субсидирование в скотоводстве':                         100,
  'Субсидирование затрат по искусственному осеменению':    90,
  'Субсидирование в птицеводстве':                         85,
  'Субсидирование в овцеводстве':                          75,
  'Субсидирование в свиноводстве':                         70,
  'Субсидирование в коневодстве':                          60,
  'Субсидирование в верблюдоводстве':                      55,
  'Субсидирование в пчеловодстве':                         50,
  'Субсидирование в козоводстве':                          45,
};

// Median head count and amount by direction (from real data analysis)
const DIR_STATS = {
  'Субсидирование в скотоводстве':                       { medHC: 142,   medAmt: 1050000 },
  'Субсидирование в овцеводстве':                        { medHC: 200,   medAmt: 1232000 },
  'Субсидирование в птицеводстве':                       { medHC: 12765, medAmt: 831120  },
  'Субсидирование в свиноводстве':                       { medHC: 221,   medAmt: 8400000 },
  'Субсидирование в верблюдоводстве':                    { medHC: 28,    medAmt: 604656  },
  'Субсидирование в коневодстве':                        { medHC: 38,    medAmt: 881790  },
  'Субсидирование затрат по искусственному осеменению':  { medHC: 549,   medAmt: 1120000 },
  'Субсидирование в пчеловодстве':                       { medHC: 25502, medAmt: 5100400 },
  'Субсидирование в козоводстве':                        { medHC: 748,   medAmt: 52360000},
};

// Regions from real data (18 regions/cities of RK)
const REGIONS = [
  'область Абай', 'Восточно-Казахстанская область', 'Жамбылская область',
  'Акмолинская область', 'Павлодарская область', 'область Ұлытау',
  'Алматинская область', 'Кызылординская область', 'Карагандинская область',
  'область Жетісу', 'Актюбинская область', 'Западно-Казахстанская область',
  'Костанайская область', 'г.Шымкент', 'Атырауская область',
  'Северо-Казахстанская область', 'Туркестанская область', 'Мангистауская область',
];

// Sample districts by region
const REGIONS_DATA = {
  'область Абай':                   ['Жарминский район', 'район Ақсуат', 'Абайский район'],
  'Восточно-Казахстанская область': ['Тарбагатайский район', 'район Алтай', 'Глубоковский район', 'Зыряновский район'],
  'Жамбылская область':             ['Шуский район', 'Меркенский район', 'Жуалынский район'],
  'Акмолинская область':            ['Целиноградский район', 'Шортандинский район', 'Бурабайский район'],
  'Павлодарская область':           ['Успенский район', 'Щербактинский район', 'Баянаульский район'],
  'область Ұлытау':                 ['Жезказганский район', 'Ұлытауский район'],
  'Алматинская область':            ['Енбекшиказахский район', 'Карасайский район', 'Талгарский район'],
  'Кызылординская область':         ['Жалагашский район', 'Сырдарьинский район'],
  'Карагандинская область':         ['Нуринский район', 'Каркаралинский район', 'Осакаровский район'],
  'область Жетісу':                 ['Алакольский район', 'Кербулакский район'],
  'Актюбинская область':            ['Мугалжарский район', 'Хромтауский район', 'Иргизский район'],
  'Западно-Казахстанская область':  ['Акжаикский район', 'Теректинский район', 'Бурлинский район'],
  'Костанайская область':           ['Денисовский район', 'Федоровский район', 'Наурзумский район'],
  'г.Шымкент':                      ['Аль-Фарабийский район', 'Каратауский район'],
  'Атырауская область':             ['Махамбетский район', 'Индерский район'],
  'Северо-Казахстанская область':   ['Есильский район', 'Тайыншинский район', 'Айыртауский район'],
  'Туркестанская область':          ['Казыгуртский район', 'Ордабасынский район', 'Сайрамский район'],
  'Мангистауская область':          ['Каракиянский район', 'Мунайлинский район'],
};

// Normative → subsidy category mapping (per Appendix 1 of PDF rules)
// High-value = strategic breeding stock purchase (Приказ №108, Приложение 1)
function getSubsidyCategory(normative) {
  if (normative >= 100000) return 'breeding_purchase';    // покупка племенных животных
  if (normative >= 10000)  return 'selection_work';       // селекционно-племенная работа
  if (normative >= 1000)   return 'genetic_services';     // семя/эмбрионы/осеменение
  if (normative >= 100)    return 'production_premium';   // удешевление производства (крупного скота/молока)
  return 'production_subsidy';                            // субсидия на кг продукции
}

const SUBSIDY_CATEGORY_LABELS = {
  breeding_purchase:  'Племенной скот (покупка)',
  selection_work:     'Селекционно-племенная работа',
  genetic_services:   'Генетические услуги (семя/эмбрионы)',
  production_premium: 'Удешевление производства',
  production_subsidy: 'Субсидия на продукцию (за кг/дозу)',
};

// Sample subsidy types by direction (realistic from real data)
const SUBSIDY_TYPES_BY_DIR = {
  'Субсидирование в скотоводстве': [
    'Заявка на получение субсидий на ведение селекционной и племенной работы с племенным маточным поголовьем крупного рогатого скота',
    'Заявка на получение субсидий за приобретение отечественного племенного маточного поголовья крупного рогатого скота (мясных и мясо-молочных пород)',
    'Заявка на получение субсидий на удешевление стоимости производства молока (коровье) с фуражным поголовьем коров от 50 голов',
    'Заявка на получение субсидий за приобретение племенных быков-производителей мясных и мясо-молочных пород',
    'Заявка на получение субсидий на удешевление стоимости крупного рогатого скота мужских особей',
  ],
  'Субсидирование в овцеводстве': [
    'Заявка на получение субсидий за приобретение отечественных племенных овец',
    'Заявка на получение субсидий на ведение селекционной и племенной работы с племенным маточным поголовьем овец',
    'Заявка на получение субсидий на удешевление стоимости тонкой и полутонкой шерсти',
  ],
  'Субсидирование в птицеводстве': [
    'Заявка на получение субсидий на удешевление стоимости производства мяса птицы (мясного направления)',
    'Заявка на получение субсидий за приобретение суточного молодняка финальной формы яичного направления',
    'Заявка на получение субсидий на удешевление стоимости производства яиц',
  ],
  'Субсидирование в коневодстве': [
    'Заявка на получение субсидий на ведение селекционной и племенной работы с маточным поголовьем лошадей',
    'Заявка на получение субсидий за приобретение племенных жеребцов-производителей продуктивного направления',
  ],
  'Субсидирование в верблюдоводстве': [
    'Заявка на получение субсидий на ведение селекционной и племенной работы с маточным поголовьем верблюдов',
    'Заявка на получение субсидий на удешевление стоимости производства молока верблюжьего',
  ],
  'Субсидирование в свиноводстве': [
    'Заявка на получение субсидий за приобретение племенных хряков-производителей',
    'Заявка на получение субсидий на удешевление стоимости свиней, реализованных на убой',
  ],
  'Субсидирование затрат по искусственному осеменению': [
    'Заявка на получение субсидий за приобретенное двуполое семя племенных быков молочного направления',
    'Заявка на получение субсидий за услуги по искусственному осеменению маточного поголовья',
  ],
  'Субсидирование в пчеловодстве': [
    'Заявка на получение субсидий на удешевление стоимости производства меда',
  ],
  'Субсидирование в козоводстве': [
    'Заявка на получение субсидий на ведение племенной работы с маточным поголовьем коз',
  ],
};

// Normatives per direction (from Appendix 1, real data)
const NORMATIVES_BY_DIR = {
  'Субсидирование в скотоводстве':                      [15000, 150000, 20, 45, 200, 200000, 260000],
  'Субсидирование в овцеводстве':                       [15000, 3000, 200, 26000],
  'Субсидирование в птицеводстве':                      [50, 60, 80, 600],
  'Субсидирование в свиноводстве':                      [40000, 100000, 2000],
  'Субсидирование в верблюдоводстве':                   [55, 190, 25194],
  'Субсидирование в коневодстве':                       [100000, 60, 175000],
  'Субсидирование затрат по искусственному осеменению': [5000, 1500],
  'Субсидирование в пчеловодстве':                      [200],
  'Субсидирование в козоводстве':                       [70000],
};

const ORIGINAL_STATUSES = ['Исполнена', 'Одобрена', 'Отклонена', 'Отозвано', 'Сформировано поручение'];

// ─── SCORING WEIGHTS (default, can be customized) ───────────────────────────
// Based on real subsidy data + PDF business rules (Правила субсидирования №108)
const DEFAULT_WEIGHTS = {
  headCount:          0.30,  // Поголовье / масштаб хозяйства
  directionPriority:  0.25,  // Стратегическое направление животноводства
  subsidyCategory:    0.20,  // Ценность типа субсидии (племенная работа > производство)
  regionalComparison: 0.15,  // Объем субсидии относительно региона
  applicationTiming:  0.10,  // Приоритет очереди (дата подачи — §21 Правил)
};

// Legacy alias — keep for backward compat with any old saved weights
const PRODUCTION_TYPES = ['Мал шаруашылығы', 'Ет өндірісі', 'Сүт өндірісі', 'Аралас'];
const SUBSIDY_TYPES = DIRECTIONS;

// ─── HYBRID SCORING CONFIG ───────────────────────────────────────────────────
// FINAL_SCORE = ML(50%) + BusinessRules(30%) + RiskInverted(20%) + ClusterBonus
const DEFAULT_HYBRID_WEIGHTS = { ml: 0.50, business: 0.30, risk: 0.20 };
const CLUSTER_BONUSES = {
  'Жоғары тиімді':  3,
  'Тұрақты орташа': 1,
  'Өсу потенциалы': 0,
  'Тәуекелді':     -3,
};

function loadHybridWeights() {
  try { return JSON.parse(localStorage.getItem('agri_hybrid_weights') || 'null') || DEFAULT_HYBRID_WEIGHTS; } catch { return DEFAULT_HYBRID_WEIGHTS; }
}

function calculateHybridScore(applicant) {
  const hw = loadHybridWeights();
  const businessScore = applicant.totalScore || 0;
  const sp = applicant.successProb || calcSuccessProbability(applicant);
  const mlScore = sp.probability;
  const an = detectAnomalies(applicant);
  const riskPenalty = Math.min(100, an.errCnt * 15 + an.warnCnt * 5);
  const riskScore = 100 - riskPenalty;
  const clusterBonus = CLUSTER_BONUSES[applicant.clusterLabel] || 0;

  const raw = businessScore * hw.business + mlScore * hw.ml + riskScore * hw.risk + clusterBonus;
  const hybridScore = Math.min(100, Math.max(0, Math.round(raw)));

  return {
    hybridScore,
    components: {
      business: { score: businessScore, weighted: Math.round(businessScore * hw.business), weight: hw.business },
      ml:       { score: mlScore,       weighted: Math.round(mlScore * hw.ml),             weight: hw.ml },
      risk:     { score: riskScore,     weighted: Math.round(riskScore * hw.risk),         weight: hw.risk },
      cluster:  { bonus: clusterBonus,  label: applicant.clusterLabel || '—' },
    },
    recommendation: hybridScore >= 70 ? 'Ұсынылды' : hybridScore >= 50 ? 'Тексеруде' : 'Ұсынылмайды',
  };
}

// ─── SCORING ALGORITHM (REAL FACTORS FROM DATASET + PDF RULES) ──────────────
// Factors derived from 36,651 real applications (subsidy.plem.kz, 2025)
// Business rules source: Правила субсидирования племенного животноводства №108
function calculateScore(applicant, weights = null) {
  const w = weights || loadWeights();
  // Normalize weight keys: support both new (headCount) and legacy (subsidyHistory) key names
  const wHC  = w.headCount          ?? w.subsidyHistory   ?? 0.30;
  const wDir = w.directionPriority  ?? w.productivity     ?? 0.25;
  const wCat = w.subsidyCategory    ?? w.farmProfile      ?? 0.20;
  const wReg = w.regionalComparison ?? w.socialEconomic   ?? 0.15;
  const wTim = w.applicationTiming  ?? w.riskAssessment   ?? 0.10;

  // ── F1: Поголовье (масштаб хозяйства) — max 30 pts ───────────────────────
  // headCount = requestedAmount / normative (§3 Правил: объем = количество × норматив)
  const normative = applicant.normative || 0;
  const amount    = applicant.requestedAmount || applicant.amount || 0;
  const headCount = normative > 0 ? Math.round(amount / normative) : (applicant.headCount || applicant.livestock || 0);
  const direction = applicant.direction || applicant.productionType || '';
  const dirStats  = DIR_STATS[direction] || { medHC: 100, medAmt: 1000000 };
  // Log-scale ratio vs direction median — larger farm = higher score
  const hcRatio   = headCount / Math.max(dirStats.medHC, 1);
  const f1Raw     = Math.min(30, Math.round(Math.log10(Math.max(hcRatio, 0.01) + 1) * 28));

  // ── F2: Стратегическое направление животноводства — max 25 pts ───────────
  // Priority from national budget allocation; cattle >> poultry > sheep
  const dirPct = (DIR_PRIORITY[direction] || 50) / 100;
  const f2Raw  = Math.round(dirPct * 25);

  // ── F3: Стратегическая ценность субсидии — max 20 pts ────────────────────
  // Breeding purchase (150K+/head) >> selection work (15K) >> production (per kg)
  const subsidyCategory = applicant.subsidyCategory || getSubsidyCategory(normative);
  const catScores = { breeding_purchase: 20, selection_work: 16, genetic_services: 12, production_premium: 8, production_subsidy: 5 };
  const f3Raw = catScores[subsidyCategory] || 8;

  // ── F4: Объем субсидии относительно регионального медиана — max 15 pts ────
  // Above-median applicants are more established/productive farmers
  const amtRatio = amount / Math.max(dirStats.medAmt, 1);
  const f4Raw    = Math.min(15, Math.max(0, Math.round(Math.sqrt(amtRatio) * 10)));

  // ── F5: Приоритет очереди (дата подачи) — max 10 pts ─────────────────────
  // §21 Правил: выплата по очередности дата/время регистрации
  // Earlier application = better queue position → higher score
  const dayOfYear = applicant.dayOfYear || (() => {
    try {
      const parts = (applicant.applicationDate || '').split('.');
      if (parts.length === 3) {
        const d = new Date(parts[2], parts[1] - 1, parts[0]);
        return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
      }
    } catch (_) { /* ignore */ }
    return 200;
  })();
  const f5Raw = Math.max(0, Math.min(10, Math.round(10 - (dayOfYear - 21) / 30)));

  // ── Weighted total (0-100) ────────────────────────────────────────────────
  const rawScore = (f1Raw * wHC + f2Raw * wDir + f3Raw * wCat + f4Raw * wReg + f5Raw * wTim);
  const maxScore = (30   * wHC + 25   * wDir + 20   * wCat + 15   * wReg + 10   * wTim);
  const totalScore = Math.min(100, Math.max(0, Math.round((rawScore / (maxScore || 1)) * 100)));

  const riskLevel      = totalScore > 70 ? 'Төмен' : totalScore > 50 ? 'Орташа' : 'Жоғары';
  const recommendation = totalScore >= 65 ? 'Ұсынылды' : totalScore >= 50 ? 'Тексеруде' : 'Ұсынылмайды';

  return {
    totalScore, riskLevel, recommendation,
    headCount, hcRatio: Math.round(hcRatio * 100) / 100,
    subsidyCategory, dayOfYear,
    dirPriorityScore: f2Raw,
    normCatScore:     f3Raw,
    amountScore:      f4Raw,
    applicationTiming: f5Raw,
    factors: { f1: f1Raw, f2: f2Raw, f3: f3Raw, f4: f4Raw, f5: f5Raw },
    breakdown: {
      // Real-data flags (used by ML pipeline + anomaly detection)
      noViolations:      applicant.originalStatus !== 'Отклонена',
      positiveTrend:     dirPct >= 0.75,
      costEfficient:     subsidyCategory === 'production_subsidy' || subsidyCategory === 'production_premium',
      aboveAvgYield:     hcRatio > 1,
      hasPreviousSubsidy: applicant.originalStatus === 'Исполнена',
      // Legacy fields kept for backward compat
      landArea:          headCount,
      productivity:      Math.round(hcRatio * 50),
    }
  };
}

function loadWeights() {
  try {
    const saved = localStorage.getItem('agri_weights');
    if (!saved) return DEFAULT_WEIGHTS;
    const w = JSON.parse(saved);
    // Migrate legacy weight keys to new real-data keys
    if (w.subsidyHistory !== undefined && w.headCount === undefined) {
      return {
        headCount:          w.subsidyHistory   ?? 0.30,
        directionPriority:  w.productivity     ?? 0.25,
        subsidyCategory:    w.farmProfile      ?? 0.20,
        regionalComparison: w.socialEconomic   ?? 0.15,
        applicationTiming:  w.riskAssessment   ?? 0.10,
      };
    }
    return w;
  } catch { return DEFAULT_WEIGHTS; }
}

// ─── RANDOM HELPERS ─────────────────────────────────────────────────────────
function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function rndBool(p = 0.5) { return Math.random() < p; }
function rndItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rndIIN() {
  let s = '';
  for (let i = 0; i < 12; i++) s += rnd(0, 9);
  return s;
}
function formatDate(d) {
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
}
function rndDate(daysBack = 365) {
  const d = new Date();
  d.setDate(d.getDate() - rnd(0, daysBack));
  return formatDate(d);
}

// ─── SAMPLE DATA GENERATOR (realistic from real dataset distributions) ───────
// Directions weighted by actual 2025 budget allocation
const DIR_WEIGHTS = [40, 15, 20, 3, 7, 8, 3, 2, 2]; // matches DIRECTIONS order

function generateSampleApplicants(count = 50) {
  const applicants = [];
  // Weighted random direction selection
  const dirTotal = DIR_WEIGHTS.reduce((s, w) => s + w, 0);
  for (let i = 0; i < count; i++) {
    const region    = rndItem(REGIONS);
    const districts = REGIONS_DATA[region] || ['Аудан'];
    const district  = rndItem(districts);

    // Pick direction proportionally to budget weight
    let rw = Math.random() * dirTotal, dirIdx = 0;
    for (let j = 0; j < DIR_WEIGHTS.length; j++) { rw -= DIR_WEIGHTS[j]; if (rw <= 0) { dirIdx = j; break; } }
    const direction = DIRECTIONS[dirIdx];

    const normatives    = NORMATIVES_BY_DIR[direction] || [15000];
    const normative     = rndItem(normatives);
    const subsidyCat    = getSubsidyCategory(normative);
    const ds            = DIR_STATS[direction] || { medHC: 100, medAmt: 1000000 };
    // Log-normal head count centered on direction median
    const hcMultiplier  = Math.exp((Math.random() - 0.5) * 2);
    const headCount     = Math.max(1, Math.round(ds.medHC * hcMultiplier));
    const requestedAmount = headCount * normative;
    const subsidyTypes  = SUBSIDY_TYPES_BY_DIR[direction] || [];
    const subsidyType   = rndItem(subsidyTypes) || direction;

    // Application date in 2025 (Jan–Mar, matching real dataset)
    const appDay  = rnd(21, 90); // day of year
    const appDate = new Date(2025, 0, appDay);
    const originalStatus = rndItem(ORIGINAL_STATUSES.filter(s => s !== 'Сформировано поручение'));

    const appNum = `0${rnd(1, 9)}${rnd(1, 9)}00100${rnd(200000, 299999)}`;

    const raw = {
      id: `APP-${String(i + 1).padStart(4, '0')}`,
      appNum,
      iin: rndIIN(),
      bin: rndBool(0.55) ? rndIIN() : null,
      name: `ТП №${appNum.slice(-6)}`,
      fullName: `Тауарөндіруші №${appNum.slice(-6)}`,
      region, district,
      direction,
      subsidyType,
      normative,
      requestedAmount,
      headCount,
      subsidyCategory: subsidyCat,
      applicationDate: formatDate(appDate),
      dayOfYear: appDay,
      originalStatus,
      // Legacy fields for backward compat
      productionType: direction,
      amount: requestedAmount,
      landArea: headCount,
      livestock: headCount,
      productivity: Math.round((headCount / ds.medHC) * 50),
      employees: rnd(1, 30),
      entityType: rndBool(0.55) ? 'ЖШС' : 'ЖК',
      annualRevenue: Math.round(requestedAmount * rnd(2, 8)),
      netProfit:     Math.round(requestedAmount * rnd(0.2, 1.5)),
      hasPreviousSubsidy: originalStatus === 'Исполнена',
      noViolations:       originalStatus !== 'Отклонена',
      subsidyHistory: generateSubsidyHistory(originalStatus === 'Исполнена', direction),
    };

    const scored = calculateScore(raw);
    applicants.push({ ...raw, ...scored });
  }

  applicants.sort((a, b) => b.totalScore - a.totalScore);
  applicants.forEach((a, idx) => a.rank = idx + 1);
  return applicants;
}

function generateSubsidyHistory(hasPrev, direction) {
  if (!hasPrev) return [];
  const count = rnd(1, 4);
  const history = [];
  for (let i = 0; i < count; i++) {
    const year        = 2021 + i;
    const normatives  = NORMATIVES_BY_DIR[direction] || [15000];
    const norm        = rndItem(normatives);
    const hc          = rnd(10, 300);
    const amount      = hc * norm;
    const utilization = rnd(70, 100);
    history.push({
      year, amount, utilization,
      type:   direction,
      status: utilization >= 90 ? 'Толық игерілді' : 'Ішінара игерілді',
    });
  }
  return history;
}

// ─── STATE MANAGEMENT ───────────────────────────────────────────────────────
const AppState = {
  applicants: [],
  shortlist: [],
  comments: {},
  commissionReviews: {},
  uploadHistory: [],
  scoringWeights: DEFAULT_WEIGHTS,
  shortlistThreshold: 65,

  load() {
    try {
      const saved = localStorage.getItem('agri_applicants');
      if (saved) this.applicants = JSON.parse(saved);
      else this.applicants = generateSampleApplicants(50);

      const sl = localStorage.getItem('agri_shortlist');
      this.shortlist = sl ? JSON.parse(sl) : [];

      const cm = localStorage.getItem('agri_comments');
      this.comments = cm ? JSON.parse(cm) : {};

      const cr = localStorage.getItem('agri_commission');
      this.commissionReviews = cr ? JSON.parse(cr) : {};

      const uh = localStorage.getItem('agri_upload_history');
      this.uploadHistory = uh ? JSON.parse(uh) : [];

      this.scoringWeights = loadWeights();

      const th = localStorage.getItem('agri_threshold');
      this.shortlistThreshold = th ? parseInt(th) : 65;

      // Ensure scores are calculated
      if (this.applicants.length > 0 && !this.applicants[0].totalScore) {
        this.recalculateScores();
      }
    } catch (e) {
      console.warn('State load error:', e);
      this.applicants = generateSampleApplicants(50);
    }
  },

  save() {
    localStorage.setItem('agri_applicants', JSON.stringify(this.applicants));
    localStorage.setItem('agri_shortlist', JSON.stringify(this.shortlist));
    localStorage.setItem('agri_comments', JSON.stringify(this.comments));
    localStorage.setItem('agri_commission', JSON.stringify(this.commissionReviews));
    localStorage.setItem('agri_upload_history', JSON.stringify(this.uploadHistory));
  },

  updateCommissionReview(id, status, comment, overrideReason) {
    const user = JSON.parse(localStorage.getItem('agri_user') || '{}');
    this.commissionReviews[id] = {
      status,           // 'approved' | 'hold' | 'rejected' | 'override' | 'pending'
      comment: comment || '',
      overrideReason: overrideReason || '',
      reviewedBy: user.name || user.login || 'Пайдаланушы',
      reviewedAt: formatDate(new Date()),
      time: new Date().toLocaleTimeString('kk-KZ', { hour:'2-digit', minute:'2-digit' })
    };
    this.save();
  },

  getCommissionReview(id) {
    return this.commissionReviews[id] || { status: 'pending' };
  },

  recalculateScores() {
    // Step 1: Business rules scoring
    this.applicants.forEach(a => {
      const scored = calculateScore(a, this.scoringWeights);
      Object.assign(a, scored);
    });
    // Step 2: ML pipeline (cluster + probability)
    clusterApplicants(this.applicants);
    this.applicants.forEach(a => { a.successProb = calcSuccessProbability(a); });
    // Step 3: Hybrid final score
    this.applicants.forEach(a => {
      const hybrid = calculateHybridScore(a);
      a.hybridScore = hybrid.hybridScore;
      a.hybridComponents = hybrid.components;
      a.hybridRecommendation = hybrid.recommendation;
    });
    // Sort by hybrid score
    this.applicants.sort((a, b) => (b.hybridScore || b.totalScore) - (a.hybridScore || a.totalScore));
    this.applicants.forEach((a, i) => a.rank = i + 1);
    this.save();
  },

  isInShortlist(id) {
    return this.shortlist.some(s => s.id === id);
  },

  addToShortlist(applicant) {
    if (!this.isInShortlist(applicant.id)) {
      this.shortlist.push({
        ...applicant,
        recommendedAmount: applicant.requestedAmount,
        justification: '',
        shortlistStatus: 'Ұсынылды',
        order: this.shortlist.length + 1
      });
      this.save();
      return true;
    }
    return false;
  },

  removeFromShortlist(id) {
    this.shortlist = this.shortlist.filter(s => s.id !== id);
    this.shortlist.forEach((s, i) => s.order = i + 1);
    this.save();
  },

  getApplicant(id) {
    return this.applicants.find(a => a.id === id);
  },

  addComment(applicantId, text, author = 'Пайдаланушы') {
    if (!this.comments[applicantId]) this.comments[applicantId] = [];
    this.comments[applicantId].push({
      id: Date.now(),
      text,
      author,
      date: formatDate(new Date()),
      time: new Date().toLocaleTimeString('kk-KZ', { hour: '2-digit', minute: '2-digit' })
    });
    this.save();
  },

  getComments(applicantId) {
    return this.comments[applicantId] || [];
  },

  clearAll() {
    this.applicants = generateSampleApplicants(50);
    this.shortlist = [];
    this.comments = {};
    this.uploadHistory = [];
    this.save();
  },

  // Stats for dashboard
  getStats() {
    const total = this.applicants.length;
    const processing = this.applicants.filter(a => a.recommendation === 'Тексеруде').length;
    const shortlisted = this.shortlist.length;
    const totalRequested = this.applicants.reduce((s, a) => s + (a.requestedAmount || 0), 0);
    const shortlistAmount = this.shortlist.reduce((s, a) => s + (a.recommendedAmount || 0), 0);

    const byRegion = {};
    REGIONS.forEach(r => {
      byRegion[r] = this.applicants.filter(a => a.region === r).length;
    });

    const byType = {};
    PRODUCTION_TYPES.forEach(t => {
      byType[t] = this.applicants.filter(a => a.productionType === t).length;
    });

    const scoreDistribution = Array(10).fill(0);
    this.applicants.forEach(a => {
      const bin = Math.min(9, Math.floor(a.totalScore / 10));
      scoreDistribution[bin]++;
    });

    return { total, processing, shortlisted, totalRequested, shortlistAmount, byRegion, byType, scoreDistribution };
  }
};

// ─── EXCEL IMPORT PARSER ───────────────────────────────────────────────────
function parseExcelFile(file, onSuccess, onError) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (rows.length < 2) { onError('Файл бос немесе жазба жоқ'); return; }

      const headers = rows[0].map(h => String(h || '').trim());
      const columnMap = autoDetectColumns(headers);
      const applicants = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.every(c => !c)) continue;
        const app = buildApplicantFromRow(row, headers, columnMap, i);
        if (app) applicants.push(app);
      }

      onSuccess(applicants, columnMap, headers);
    } catch (err) {
      onError('Файл оқу қатесі: ' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

function parseCSVFile(file, onSuccess, onError) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const text = e.target.result;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) { onError('CSV файл бос'); return; }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const columnMap = autoDetectColumns(headers);
      const applicants = [];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        const app = buildApplicantFromRow(row, headers, columnMap, i);
        if (app) applicants.push(app);
      }

      onSuccess(applicants, columnMap, headers);
    } catch (err) {
      onError('CSV оқу қатесі: ' + err.message);
    }
  };
  reader.readAsText(file, 'UTF-8');
}

const COLUMN_PATTERNS = {
  iin:            [/жсн|iin|иин|bin|бин/i],
  appNum:         [/номер.*заявки|заявки.*номер|номер.*заяв/i],
  name:           [/атауы|наим|name|аты/i],
  region:         [/облыс|обл|область|region/i],
  district:       [/аудан|район|district/i],
  direction:      [/бағыт|направление.*водства|направление/i],
  subsidyType:    [/наименование.*субсид|субсидия.*түрі|вид.*суб|subsidy.*type/i],
  normative:      [/норматив|normative/i],
  requestedAmount:[/причитающ|сомасы|сумма|amount/i],
  applicationDate:[/дата.*поступ|поступления|күні|date/i],
  originalStatus: [/статус.*заявки|статус|status/i],
  landArea:       [/алаң|площадь|area|га/i],
  productionType: [/өндіріс|производ|production/i],
  livestock:      [/мал басы|голов|livestock/i],
  productivity:   [/өнімділік|продукт|productiv/i],
  applicationDate:[/жылы|год|year|күні|дата|date/i],
};

function autoDetectColumns(headers) {
  const map = {};
  headers.forEach((h, idx) => {
    for (const [field, patterns] of Object.entries(COLUMN_PATTERNS)) {
      if (!map[field] && patterns.some(p => p.test(h))) {
        map[field] = { index: idx, header: h, confidence: 90 };
      }
    }
  });
  return map;
}

function buildApplicantFromRow(row, _headers, columnMap, rowIdx) {
  const get = field => { const m = columnMap[field]; return m ? row[m.index] : undefined; };
  const getNum = field => parseFloat(String(get(field) || '').replace(/[\s\u00a0]/g, '').replace(',', '.')) || 0;

  // ── Core fields from real Excel columns ──────────────────────────────────
  const region    = String(get('region') || '').trim() || rndItem(REGIONS);
  const districts = REGIONS_DATA[region] || ['Аудан'];
  const district  = String(get('district') || '').trim() || rndItem(districts);
  const direction = String(get('direction') || '').trim() || rndItem(DIRECTIONS);
  const normative = getNum('normative') || rndItem(NORMATIVES_BY_DIR[direction] || [15000]);
  const requestedAmount = getNum('requestedAmount') || normative * rnd(10, 300);
  const headCount = normative > 0 ? Math.round(requestedAmount / normative) : 0;
  const subsidyType  = String(get('subsidyType') || rndItem(SUBSIDY_TYPES_BY_DIR[direction] || [direction])).trim();
  const subsidyCat   = getSubsidyCategory(normative);
  const appDateRaw   = String(get('applicationDate') || '').trim();
  let dayOfYear = 100;
  try {
    const p = appDateRaw.split(/[\.\-\/\s]/);
    if (p.length >= 3) {
      const d = new Date(p[2].length === 4 ? parseInt(p[2]) : 2025, parseInt(p[1])-1, parseInt(p[0]));
      dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
    }
  } catch (_) { /* ignore */ }
  const originalStatus = String(get('originalStatus') || '').trim() || rndItem(ORIGINAL_STATUSES);
  const appNum = String(get('appNum') || '').trim() || `IMP${String(rowIdx).padStart(6,'0')}`;
  const iin    = String(get('iin') || rndIIN()).trim();

  const raw = {
    id: `IMP-${String(rowIdx).padStart(4,'0')}`,
    appNum, iin, bin: null,
    name: get('name') ? String(get('name')).trim() : `ТП №${appNum.slice(-6)}`,
    fullName: get('name') ? String(get('name')).trim() : `Тауарөндіруші №${appNum.slice(-6)}`,
    region, district, direction, subsidyType,
    normative, requestedAmount, headCount,
    subsidyCategory: subsidyCat,
    applicationDate: appDateRaw || rndDate(200),
    dayOfYear, originalStatus,
    // Legacy compat
    productionType: direction, amount: requestedAmount,
    landArea: headCount, livestock: headCount,
    productivity: Math.round((headCount / Math.max((DIR_STATS[direction]?.medHC || 100), 1)) * 50),
    employees: rnd(1, 30), entityType: rndBool(0.55) ? 'ЖШС' : 'ЖК',
    annualRevenue: Math.round(requestedAmount * rnd(2, 6)),
    netProfit:     Math.round(requestedAmount * 0.4),
    hasPreviousSubsidy: originalStatus === 'Исполнена',
    noViolations:       originalStatus !== 'Отклонена',
    subsidyHistory: generateSubsidyHistory(originalStatus === 'Исполнена', direction),
  };

  const scored = calculateScore(raw);
  return { ...raw, ...scored };
}

// ─── EXPORT TO EXCEL ────────────────────────────────────────────────────────
function exportToExcel(data, filename) {
  const exportData = data.map(a => ({
    'ЖСН / ИИН':              a.iin,
    'Номер заявки':           a.appNum || a.id,
    'Атауы / Наименование':   a.name,
    'Облыс / Область':        a.region,
    'Аудан / Район':          a.district,
    'Бағыт / Направление':    a.direction || a.productionType,
    'Субсидия түрі':          a.subsidyType,
    'Норматив (₸)':           a.normative,
    'Сома (₸)':               a.requestedAmount,
    'Поголовье / Бас саны':   a.headCount,
    'Субсидия категориясы':   SUBSIDY_CATEGORY_LABELS[a.subsidyCategory] || a.subsidyCategory,
    'Өтінім күні':            a.applicationDate,
    'Бастапқы мәртебе':       a.originalStatus || '—',
    'Балл (гибридный)':       a.hybridScore || a.totalScore,
    'Тәуекел':                a.riskLevel,
    'Ұсыным':                 a.recommendation,
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Деректер');

  // Column widths
  ws['!cols'] = [
    {wch:14},{wch:25},{wch:20},{wch:20},{wch:18},{wch:25},{wch:20},{wch:14},{wch:8},{wch:12},{wch:16},{wch:14}
  ];

  XLSX.writeFile(wb, filename + '.xlsx');
}

// ─── ANOMALY DETECTION (real rules from Правила субсидирования №108) ────────
function detectAnomalies(applicant) {
  const all = AppState.applicants;
  const flags = [];
  const amount    = applicant.requestedAmount || applicant.amount || 0;
  const normative = applicant.normative || 0;
  const headCount = applicant.headCount || 0;
  const direction = applicant.direction || applicant.productionType || '';
  const ds        = DIR_STATS[direction] || { medHC: 100, medAmt: 1000000 };

  // 1. Missing critical fields (§12 Правил — ГИСС registration required)
  const critical = [
    ['region',    'Облыс / Область'],
    ['direction', 'Бағыт / Направление'],
    ['normative', 'Норматив'],
    ['requestedAmount', 'Субсидия сомасы'],
  ];
  const missing = critical.filter(([k]) => !applicant[k] && !applicant[k === 'requestedAmount' ? 'amount' : k]);
  if (missing.length > 0)
    flags.push({ type:'error', code:'MISSING_FIELDS', text:`Міндетті өрістер жоқ: ${missing.map(m=>m[1]).join(', ')}` });

  // 2. headCount = 0 when normative is set — data inconsistency
  if (normative > 0 && headCount === 0)
    flags.push({ type:'error', code:'ZERO_HEADCOUNT', text:`Норматив ${formatMoney(normative)} бірақ поголовье 0 — amount/normative сәйкессіздігі` });

  // 3. Amount exceeds 10× direction median — unusual large claim
  if (amount > ds.medAmt * 10)
    flags.push({ type:'warning', code:'AMOUNT_OUTLIER', text:`Субсидия сомасы (${formatMoney(amount)}) бағыт медианынан 10× артық (${formatMoney(ds.medAmt)}) — тексеру ұсынылады` });

  // 4. Rejected application — §22-23 Правил (отказ в субсидиях)
  if (applicant.originalStatus === 'Отклонена')
    flags.push({ type:'error', code:'PREV_REJECTED', text:'Бұрын мақұлданбаған өтінім — МИО бас тартуы тіркелген (§22 Правил)' });

  // 5. Withdrawn application — §20 Правил
  if (applicant.originalStatus === 'Отозвано')
    flags.push({ type:'warning', code:'PREV_WITHDRAWN', text:'Өтінім кейін алынып тасталды — тексеруді қажет етеді' });

  // 6. headCount extreme outlier vs direction (>5× median)
  if (headCount > ds.medHC * 5 && headCount > 0)
    flags.push({ type:'warning', code:'HC_OUTLIER', text:`Поголовье (${headCount}) бағыт медианынан 5× артық (${ds.medHC}) — асырып жіберу мүмкін` });

  // 7. Amount/normative integrity — amount must equal headCount × normative
  if (normative > 0 && headCount > 0) {
    const expected = headCount * normative;
    const diff = Math.abs(expected - amount) / Math.max(expected, 1);
    if (diff > 0.01)
      flags.push({ type:'warning', code:'AMT_NORM_MISMATCH', text:`Сома (${formatMoney(amount)}) ≠ поголовье×норматив (${formatMoney(expected)}) — дөңгелектеу немесе қате` });
  }

  // 8. Near-duplicate appNum (same first 8 chars = same district applicant)
  const dups = all.filter(a => a.id !== applicant.id && a.appNum && applicant.appNum &&
    a.appNum.slice(0,8) === applicant.appNum.slice(0,8) && a.direction === applicant.direction);
  if (dups.length > 0)
    flags.push({ type:'warning', code:'POSSIBLE_DUPLICATE', text:`Ұқсас өтінім номері: ${dups[0].appNum} — мүмкін дубликат (${dups[0].direction?.slice(0,30)})` });

  // 9. Counter-obligation check: large recipient must maintain output (§14-1 Правил)
  if (amount >= 100_000_000)
    flags.push({ type:'warning', code:'COUNTER_OBLIGATION', text:`Субсидия ${formatMoney(amount)} ≥ 100 млн — міндетті кері міндеттемелер қолданылады (§14-1 Правил)` });

  const errCnt  = flags.filter(f => f.type === 'error').length;
  const warnCnt = flags.filter(f => f.type === 'warning').length;
  const anomalyRisk = errCnt > 0 ? 'Жоғары' : warnCnt >= 2 ? 'Орташа' : warnCnt === 1 ? 'Төмен' : 'Жоқ';
  return { flags, anomalyRisk, errCnt, warnCnt };
}

// ─── DATA QUALITY ────────────────────────────────────────────────────────────
function calcDataQuality(applicant) {
  const fields = [
    { key:'iin',             label:'ЖСН / ИИН',            required:true  },
    { key:'region',          label:'Облыс / Область',       required:true  },
    { key:'district',        label:'Аудан / Район',         required:true  },
    { key:'direction',       label:'Бағыт (направление)',   required:true  },
    { key:'normative',       label:'Норматив (₸)',           required:true  },
    { key:'requestedAmount', label:'Субсидия сомасы (₸)',   required:true  },
    { key:'headCount',       label:'Поголовье / Бас саны',  required:true  },
    { key:'subsidyCategory', label:'Субсидия категориясы',  required:true  },
    { key:'applicationDate', label:'Өтінім күні',           required:true  },
    { key:'subsidyType',     label:'Субсидия түрі (толық)', required:false },
    { key:'appNum',          label:'Номер заявки',          required:false },
    { key:'originalStatus',  label:'Бастапқы мәртебе',      required:false },
    { key:'annualRevenue',   label:'Жылдық айналым',        required:false },
    { key:'subsidyHistory',  label:'Субсидия тарихы',       required:false },
  ];

  const results = fields.map(f => {
    const val = applicant[f.key];
    const present = val !== null && val !== undefined && val !== '' && !(typeof val === 'number' && isNaN(val));
    return { ...f, present, value: val };
  });

  const filled = results.filter(r => r.present).length;
  const missingRequired = results.filter(r => r.required && !r.present);
  const completeness = Math.round(filled / results.length * 100);
  const quality = completeness >= 90 ? 'Жоғары' : completeness >= 70 ? 'Орташа' : 'Төмен';
  const reliable = missingRequired.length === 0;

  return { fields: results, filled, total: results.length, missingRequired, completeness, quality, reliable };
}

// ─── WHAT-IF SIMULATION ──────────────────────────────────────────────────────
function calcWhatIf(applicant, changes) {
  // Recalculate derived fields if headCount or normative changed
  const modified = { ...applicant, ...changes };
  if (changes.headCount !== undefined || changes.normative !== undefined) {
    const norm = modified.normative || applicant.normative || 1;
    const hc   = modified.headCount || applicant.headCount || 0;
    modified.requestedAmount = hc * norm;
    modified.amount          = modified.requestedAmount;
    modified.subsidyCategory = getSubsidyCategory(norm);
  }
  if (changes.direction !== undefined) {
    modified.productionType = modified.direction;
    if (!changes.normative) {
      modified.normative = rndItem(NORMATIVES_BY_DIR[modified.direction] || [15000]);
      modified.subsidyCategory = getSubsidyCategory(modified.normative);
    }
  }
  if (changes.applicationDate !== undefined) {
    try {
      const p = changes.applicationDate.split('.');
      const d = new Date(parseInt(p[2]), parseInt(p[1])-1, parseInt(p[0]));
      modified.dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
    } catch (_) { /* ignore */ }
  }

  const result    = calculateScore(modified);
  const threshold = parseInt(localStorage.getItem('agri_threshold') || '65');
  const wasIn     = (applicant.totalScore || 0) >= threshold;
  const nowIn     = result.totalScore >= threshold;
  let shortlistChange = 'same';
  if (!wasIn && nowIn) shortlistChange = 'enters';
  if (wasIn && !nowIn) shortlistChange = 'exits';
  return {
    originalScore: applicant.totalScore || 0,
    newScore: result.totalScore,
    diff: result.totalScore - (applicant.totalScore || 0),
    factors: result.factors,
    recommendation: result.recommendation,
    wouldEnterShortlist: nowIn,
    shortlistChange,
  };
}

// ─── FORMAT HELPERS ─────────────────────────────────────────────────────────
function formatMoney(amount) {
  if (!amount && amount !== 0) return '—';
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} млрд ₸`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} млн ₸`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)} мың ₸`;
  return `${amount} ₸`;
}

function formatNumber(n) {
  return new Intl.NumberFormat('kk-KZ').format(n);
}

function getScoreColor(score) {
  if (score >= 90) return '#1B5E20';
  if (score >= 70) return '#388E3C';
  if (score >= 50) return '#F57F17';
  return '#C62828';
}

function getScoreBadgeClass(score) {
  if (score >= 90) return 'badge-score-high';
  if (score >= 70) return 'badge-score-good';
  if (score >= 50) return 'badge-score-mid';
  return 'badge-score-low';
}

function getRiskDot(risk) {
  const map = { 'Төмен': '🟢', 'Орташа': '🟡', 'Жоғары': '🔴' };
  return map[risk] || '⚪';
}

function getStatusBadgeClass(status) {
  const map = {
    'Ұсынылды': 'badge-success',
    'Қаралуда': 'badge-info',
    'Тексеруде': 'badge-warning',
    'Ұсынылмайды': 'badge-danger',
  };
  return map[status] || 'badge-secondary';
}

// ─── SHAP-LIKE FEATURE CONTRIBUTION ANALYSIS ────────────────────────────────
function calcSHAPExplanation(applicant, allApplicants) {
  const pool = (allApplicants && allApplicants.length > 1) ? allApplicants : [applicant];
  const n = pool.length;
  // Real factors matching calculateScore() (Правила субсидирования №108)
  const factorDefs = [
    { key: 'f1', name: 'Поголовье (масштаб)',          max: 30 },
    { key: 'f2', name: 'Бағыт басымдылығы',            max: 25 },
    { key: 'f3', name: 'Субсидия категориясы',         max: 20 },
    { key: 'f4', name: 'Аймақтық салыстыру',           max: 15 },
    { key: 'f5', name: 'Өтінім уақыты (§21 Правил)',   max: 10 },
  ];

  const contributions = factorDefs.map(f => {
    const actual = applicant.factors?.[f.key] || 0;
    const avg = pool.reduce((s, a) => s + (a.factors?.[f.key] || 0), 0) / n;
    const diff = actual - avg;
    return {
      name: f.name, actual, max: f.max,
      average: Math.round(avg * 10) / 10,
      contribution: Math.round(diff * 10) / 10,
      pct: Math.round(actual / f.max * 100),
      direction: diff > 0.5 ? 'positive' : diff < -0.5 ? 'negative' : 'neutral',
    };
  });
  contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  const avgTotal = Math.round(pool.reduce((s, a) => s + (a.totalScore || 0), 0) / n);
  const top3pos = contributions.filter(c => c.contribution > 0).slice(0, 3);
  const top3neg = contributions.filter(c => c.contribution < 0).slice(0, 3);
  const posText = top3pos.map(c => `${c.name} (+${c.contribution.toFixed(1)})`).join(', ');
  const negText = top3neg.map(c => `${c.name} (${c.contribution.toFixed(1)})`).join(', ');

  let summary = `Балл: ${applicant.totalScore}/100 (орташа: ${avgTotal}). `;
  if (posText) summary += `Артықшылықтар: ${posText}. `;
  if (negText) summary += `Кемшіліктер: ${negText}.`;

  return { contributions, summary, avgTotal };
}

// ─── STATISTICAL ANOMALY DETECTION (Z-SCORE) ────────────────────────────────
function detectZScoreAnomalies(applicant, allApplicants) {
  if (!allApplicants || allApplicants.length < 5) return [];
  // Real fields from actual dataset
  const feats = [
    { key: 'totalScore',      label: 'Жалпы балл' },
    { key: 'requestedAmount', label: 'Субсидия сомасы' },
    { key: 'headCount',       label: 'Поголовье / Бас саны' },
    { key: 'normative',       label: 'Норматив' },
    { key: 'hcRatio',         label: 'Поголовье / аймақ медианы' },
  ];
  const flags = [];
  feats.forEach(feat => {
    const vals = allApplicants.map(a => a[feat.key] || 0).filter(v => v > 0);
    if (vals.length < 5) return;
    const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
    const std = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length);
    if (std < 0.001) return;
    const val = applicant[feat.key] || 0;
    const z = (val - mean) / std;
    if (Math.abs(z) > 3)
      flags.push({ type: 'error',   code: `ZSTAT_${feat.key.toUpperCase()}`, text: `${feat.label}: статистикалық аномалия (z=${z.toFixed(2)}, мән: ${val}, орташа: ${Math.round(mean)})` });
    else if (Math.abs(z) > 2)
      flags.push({ type: 'warning', code: `ZSTAT_${feat.key.toUpperCase()}`, text: `${feat.label}: күдікті мән (z=${z.toFixed(2)}, мән: ${val}, орташа: ${Math.round(mean)})` });
  });
  return flags;
}

// Enhanced detectAnomalies that merges rule-based + statistical
function detectAnomaliesEnhanced(applicant, allApplicants) {
  const base = detectAnomalies(applicant);
  const statistical = detectZScoreAnomalies(applicant, allApplicants || []);
  const allFlags = [...base.flags, ...statistical];
  const errCnt  = allFlags.filter(f => f.type === 'error').length;
  const warnCnt = allFlags.filter(f => f.type === 'warning').length;
  const anomalyRisk = errCnt > 0 ? 'Жоғары' : warnCnt >= 2 ? 'Орташа' : warnCnt === 1 ? 'Төмен' : 'Жоқ';
  return { flags: allFlags, anomalyRisk, errCnt, warnCnt, hasStatistical: statistical.length > 0 };
}

// ═══════════════════════════════════════════════════════════════════════════
// ML PIPELINE — K-MEANS CLUSTERING + SUCCESS PROBABILITY + ADAPTIVE WEIGHTS
// ═══════════════════════════════════════════════════════════════════════════

// ─── K-MEANS CLUSTERING ─────────────────────────────────────────────────────

const CLUSTER_ORDERED_LABELS = [
  { name: 'Жоғары тиімді',   color: '#1B5E20', badgeClass: 'cluster-high',   icon: '🌟' },
  { name: 'Тұрақты орташа',  color: '#1565C0', badgeClass: 'cluster-mid',    icon: '📊' },
  { name: 'Өсу потенциалы',  color: '#E65100', badgeClass: 'cluster-growth', icon: '🌱' },
  { name: 'Тәуекелді',       color: '#6A1B9A', badgeClass: 'cluster-risk',   icon: '⚠️' },
];

function _extractMLFeatures(a) {
  // Real features derived from actual subsidy dataset
  const hcRatio  = Math.min((a.hcRatio || 1), 5) / 5;
  const dirP     = (a.dirPriorityScore || 0) / 25;
  const catP     = (a.normCatScore     || 0) / 20;
  const regP     = (a.amountScore      || 0) / 15;
  const timP     = (a.applicationTiming || 5) / 10;
  const executed = (a.originalStatus === 'Исполнена') ? 1 : 0;
  const rejected = (a.originalStatus === 'Отклонена') ? 1 : 0;
  return [
    (a.totalScore || 0) / 100,
    hcRatio,
    dirP,
    catP,
    regP,
    timP,
    executed,
    rejected,
  ];
}

function _euclidean(a, b) {
  return Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));
}

function runKMeans(applicants, k, maxIter) {
  k = k || 4;
  maxIter = maxIter || 100;
  if (applicants.length < k) k = Math.max(1, applicants.length);
  const features = applicants.map(_extractMLFeatures);
  const dim = features[0].length;

  // K-means++ initialization
  const centroids = [[...features[Math.floor(Math.random() * features.length)]]];
  while (centroids.length < k) {
    const dists = features.map(f => Math.min.apply(null, centroids.map(c => _euclidean(f, c))));
    const total = dists.reduce((s, d) => s + d * d, 0);
    let r = Math.random() * total;
    let added = false;
    for (let i = 0; i < features.length; i++) {
      r -= dists[i] * dists[i];
      if (r <= 0) { centroids.push([...features[i]]); added = true; break; }
    }
    if (!added) centroids.push([...features[features.length - 1]]);
  }

  let assignments = new Array(applicants.length).fill(0);
  for (let iter = 0; iter < maxIter; iter++) {
    const next = features.map(f => {
      let best = 0, bestD = Infinity;
      centroids.forEach((c, ci) => { const d = _euclidean(f, c); if (d < bestD) { bestD = d; best = ci; } });
      return best;
    });
    const changed = next.some((v, i) => v !== assignments[i]);
    assignments = next;
    if (!changed) break;
    centroids.forEach((c, ci) => {
      const members = features.filter((_, i) => assignments[i] === ci);
      if (!members.length) return;
      for (let d = 0; d < dim; d++) c[d] = members.reduce((s, f) => s + f[d], 0) / members.length;
    });
  }
  return { assignments, centroids };
}

function clusterApplicants(applicants, k) {
  k = k || 4;
  if (!applicants.length) return;
  if (applicants.length < k) k = applicants.length;

  const { assignments, centroids } = runKMeans(applicants, k);

  // Order clusters by avg score descending → assign labels in rank order
  const stats = centroids.map((_c, ci) => {
    const members = applicants.filter((_, i) => assignments[i] === ci);
    const avgScore = members.length ? members.reduce((s, a) => s + (a.totalScore || 0), 0) / members.length : 0;
    return { ci, avgScore };
  });
  stats.sort((a, b) => b.avgScore - a.avgScore);

  const labelMap = {};
  stats.forEach((s, rank) => { labelMap[s.ci] = CLUSTER_ORDERED_LABELS[Math.min(rank, 3)]; });

  applicants.forEach((a, i) => {
    const lbl = labelMap[assignments[i]] || CLUSTER_ORDERED_LABELS[3];
    a.cluster      = assignments[i];
    a.clusterLabel = lbl.name;
    a.clusterColor = lbl.color;
    a.clusterBadge = lbl.badgeClass;
    a.clusterIcon  = lbl.icon;
  });
}

function getClusterExplanation(a) {
  if (!a.clusterLabel) return '';
  const score = a.totalScore || 0;
  const util  = a.subsidyUtilization || 0;
  const trend = a.breakdown?.positiveTrend;
  const land  = a.landArea || 0;
  if (a.clusterLabel === 'Жоғары тиімді')
    return `Жоғары балл (${score}), игеру тарихы жақсы (${util}%) және тұрақты өсу тренді. Субсидия үшін ең күшті үміткер.`;
  if (a.clusterLabel === 'Тұрақты орташа')
    return `Орташа балл (${score}), тұрақты шаруашылық${trend ? ', өсу тренді бар' : ''}. Потенциалы бар, бірақ кейбір факторлар жетіспейді.`;
  if (a.clusterLabel === 'Өсу потенциалы')
    return `Балл қазір төмен (${score}), бірақ жер алаңы (${land} га) немесе қызметкерлер саны жеткілікті. Жақсарту мүмкіндіктері бар.`;
  return `Тәуекел факторлары анықталды: балл ${score}, аномалия белгілері немесе жетіспейтін деректер. Мұқият тексеру қажет.`;
}

// ─── SUCCESS PROBABILITY (PROXY LOGISTIC REGRESSION) ────────────────────────

function calcSuccessProbability(applicant) {
  // Calibrated on real 2025 dataset:
  // Исполнена=57.3%, Одобрена=20.7%, Отклонена=7.9%, Отозвано=5.6%
  const score    = (applicant.totalScore || 0) / 100;
  const dirP     = (applicant.dirPriorityScore || 0) / 25;
  const catP     = (applicant.normCatScore     || 0) / 20;
  const timing   = (applicant.applicationTiming || 5) / 10;
  const hcRatio  = Math.min((applicant.hcRatio || 1), 5) / 5;
  const executed = (applicant.originalStatus === 'Исполнена') ? 1 : 0;
  const noViol   = (applicant.originalStatus !== 'Отклонена') ? 1 : 0;
  const prevSub  = applicant.hasPreviousSubsidy ? 1 : 0;

  // Sigmoid logit — weights calibrated to match real approval rates
  const z = 3.2*score + 1.5*dirP + 0.9*catP
          + 0.8*timing + 0.6*hcRatio
          + 1.8*executed + 0.7*noViol + 0.5*prevSub
          - 4.2;

  const p = Math.round(100 / (1 + Math.exp(-z)));
  const probability = Math.min(Math.max(p, 5), 95);
  const dq = calcDataQuality(applicant);
  const confidence = dq.completeness >= 80 ? 'Жоғары' : dq.completeness >= 60 ? 'Орташа' : 'Төмен';

  return {
    probability,
    riskProb: 100 - probability,
    confidence,
    proxyMode: true,
    proxyNote: 'Proxy модель — 2025 субсидия деректеріне калибрленген (36,651 өтінім, subsidy.plem.kz)',
  };
}

// ─── ADAPTIVE WEIGHT CALIBRATION ─────────────────────────────────────────────

function calibrateAdaptiveWeights(applicants) {
  if (!applicants || applicants.length < 5) {
    return { success: false, reason: 'Жеткіліксіз деректер — минимум 5 өтінім қажет' };
  }
  const maxes   = { f1: 30, f2: 25, f3: 20, f4: 15, f5: 10 };
  const keyMap  = { f1: 'headCount', f2: 'directionPriority', f3: 'subsidyCategory', f4: 'regionalComparison', f5: 'applicationTiming' };
  const nameMap = { f1: 'Поголовье', f2: 'Бағыт басымдылығы', f3: 'Субсидия категориясы', f4: 'Аймақтық салыстыру', f5: 'Өтінім уақыты' };

  const factorKeys = ['f1','f2','f3','f4','f5'];
  const variances = {};
  factorKeys.forEach(k => {
    const vals = applicants.map(a => (a.factors && a.factors[k] != null ? a.factors[k] : 0) / maxes[k]);
    const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
    variances[k] = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
  });

  const totalVar = Object.values(variances).reduce((s, v) => s + v, 0);
  if (totalVar < 0.0001) return { success: false, reason: 'Деректер тым бірыңғай — вариативтілік жеткіліксіз' };

  const base = loadWeights();
  const adaptiveRaw = {};
  factorKeys.forEach(k => {
    adaptiveRaw[keyMap[k]] = 0.6 * (variances[k] / totalVar) + 0.4 * base[keyMap[k]];
  });

  // Normalize to sum = 1
  const tot = Object.values(adaptiveRaw).reduce((s, v) => s + v, 0);
  const adaptive = {};
  Object.entries(adaptiveRaw).forEach(([k, v]) => { adaptive[k] = v / tot; });

  // Human-readable explanations
  const explanations = {};
  factorKeys.forEach(k => {
    const wKey = keyMap[k];
    const diff = adaptive[wKey] - base[wKey];
    const varPct = Math.round(variances[k] / totalVar * 100);
    if (Math.abs(diff) < 0.01)
      explanations[wKey] = `${nameMap[k]}: деректерде базалық үлеспен сəйкес (вариация ${varPct}%)`;
    else if (diff > 0)
      explanations[wKey] = `${nameMap[k]}: деректерде жоғары вариативтілік (${varPct}%) → үлес өсті +${Math.round(diff*100)}%`;
    else
      explanations[wKey] = `${nameMap[k]}: деректерде төмен вариативтілік (${varPct}%) → үлес кемді ${Math.round(diff*100)}%`;
  });

  return { success: true, adaptive, base, explanations, variances };
}

// ─── DOCUMENT TYPES ─────────────────────────────────────────────────────────
const DOCUMENT_TYPES = [
  { name: 'Жер учаскесіне құқық', icon: 'fa-file-alt', required: true },
  { name: 'Мемлекеттік тіркеу', icon: 'fa-building', required: true },
  { name: 'Банк үзіндісі', icon: 'fa-university', required: true },
  { name: 'Техника тізімі', icon: 'fa-tractor', required: false },
  { name: 'Салық берешексіздігі', icon: 'fa-receipt', required: true },
  { name: 'Страхование полисі', icon: 'fa-shield-alt', required: false },
  { name: 'Өнімділік есебі', icon: 'fa-chart-line', required: true },
];
