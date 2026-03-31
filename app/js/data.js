// AgriScore KZ — Data Models, Sample Data Generator, Scoring Algorithm

// ─── REGIONS & DISTRICTS ────────────────────────────────────────────────────
const REGIONS_DATA = {
  'Алматы':    ['Алматы қ.', 'Алакөл', 'Балқаш', 'Еңбекшіқазақ', 'Ескелді', 'Іле', 'Қапшағай', 'Қарасай', 'Қастек', 'Панфилов', 'Райымбек', 'Талғар', 'Ұйғыр'],
  'Шымкент':   ['Шымкент қ.', 'Ордабасы', 'Сайрам', 'Байдібек', 'Созақ', 'Түлкібас', 'Қазығұрт'],
  'Астана':    ['Астана қ.', 'Ақмола ауд.', 'Бурабай', 'Целиноград', 'Шортанды'],
  'Қарағанды': ['Балқаш', 'Жаңаарқа', 'Қарқаралы', 'Нұра', 'Осакаровка', 'Ұлытау', 'Шет'],
  'Ақтөбе':   ['Байғанин', 'Мұғалжар', 'Қобда', 'Ырғыз', 'Темір', 'Хромтау', 'Шалқар'],
  'Қостанай':  ['Алтынсарин', 'Аманкелді', 'Денисов', 'Жітіқара', 'Қамысты', 'Қостанай', 'Меңдіқара', 'Науырзым', 'Сарыкөл', 'Федоров'],
  'Шығыс Қазақстан': ['Алтай', 'Бородулиха', 'Глубокое', 'Зырянов', 'Катон-Қарағай', 'Күршім', 'Өскемен', 'Семей', 'Тарбағатай', 'Ұлан'],
  'Батыс Қазақстан': ['Ақжайық', 'Бөкей Ордасы', 'Бөрлі', 'Жаңақала', 'Сырым', 'Орал', 'Тасқала', 'Шыңғырлау'],
  'Павлодар':  ['Ақсу', 'Баянауыл', 'Екібастұз', 'Железин', 'Лебяжье', 'Май', 'Павлодар', 'Тереңкөл', 'Успен', 'Щербакты'],
  'Солтүстік Қазақстан': ['Айыртау', 'Аққайың', 'Есіл', 'Жамбыл', 'Мағжан Жұмабаев', 'Петропавл', 'Тайынша', 'Тімірязев', 'Уәлиханов', 'Шал ақын'],
};

const REGIONS = Object.keys(REGIONS_DATA);

const PRODUCTION_TYPES = ['Егіншілік', 'Мал шаруашылығы', 'Аралас', 'Бақша'];
const SUBSIDY_TYPES = ['Тыңайтқыш субсидиясы', 'Техника субсидиясы', 'Тұқым субсидиясы', 'Ірі қара мал', 'Жылқы шаруашылығы', 'Сүт өндірісі', 'Жер суландыру'];
const STATUSES = ['Ұсынылды', 'Қаралуда', 'Тексеруде', 'Ұсынылмайды'];

const FIRST_NAMES = ['Асқар', 'Болат', 'Гүлнар', 'Дәурен', 'Еркін', 'Жансая', 'Зарина', 'Ықылас', 'Қанат', 'Ләйлә', 'Мұрат', 'Нұргүл', 'Оразбек', 'Перизат', 'Рустем', 'Сәбит', 'Тоғжан', 'Ұлан', 'Фариза', 'Хасен'];
const LAST_NAMES = ['Ахметов', 'Байқадамов', 'Ғалиев', 'Дүйсенов', 'Есімов', 'Жақсыбеков', 'Зейнелов', 'Ибраев', 'Қасымов', 'Мұхамедов', 'Нұрланов', 'Өтеулиев', 'Рақымов', 'Сейітқалиев', 'Темірбеков', 'Үсенов', 'Хасанов', 'Шәкеров', 'Юсупов', 'Яхияев'];

// ─── SCORING WEIGHTS (default, can be customized) ───────────────────────────
const DEFAULT_WEIGHTS = {
  subsidyHistory: 0.25,
  productivity:   0.30,
  farmProfile:    0.20,
  socialEconomic: 0.15,
  riskAssessment: 0.10
};

// ─── SCORING ALGORITHM ──────────────────────────────────────────────────────
function calculateScore(applicant, weights = null) {
  const w = weights || loadWeights();

  // Factor 1: Subsidy History (max 25 raw pts → *0.25 = max 6.25 contribution)
  let f1 = 0;
  if (applicant.hasPreviousSubsidy)   f1 += 10;
  if (applicant.usedFullSubsidy)      f1 += 8;
  if (applicant.reportsOnTime)        f1 += 7;
  if (applicant.noViolations)         f1 += 5;
  const factor1 = (f1 / 30) * 25 * w.subsidyHistory;

  // Factor 2: Productivity (max 30 raw pts → *0.30 = max 9 contribution)
  let f2 = 0;
  if (applicant.aboveAvgYield)        f2 += 12;
  if (applicant.positiveTrend)        f2 += 10;
  if (applicant.costEfficient)        f2 += 8;
  const factor2 = (f2 / 30) * 30 * w.productivity;

  // Factor 3: Farm Profile (max 20 raw pts → *0.20 = max 4 contribution)
  let f3 = 0;
  const area = applicant.landArea || 0;
  if (area >= 50 && area <= 1000)     f3 += 8;
  if ((applicant.equipmentCount||0) > 5) f3 += 7;
  if (applicant.hasIrrigation)        f3 += 5;
  const factor3 = (f3 / 20) * 20 * w.farmProfile;

  // Factor 4: Socio-Economic (max 15 raw pts → *0.15 = max 2.25 contribution)
  let f4 = 0;
  if ((applicant.employees||0) > 10)  f4 += 6;
  if (applicant.isRural)              f4 += 5;
  if (applicant.isMinorityRegion)     f4 += 4;
  const factor4 = (f4 / 15) * 15 * w.socialEconomic;

  // Factor 5: Risk Assessment (max 10 raw pts → *0.10 = max 1 contribution)
  let f5 = 0;
  if (applicant.cleanCreditHistory)   f5 += 4;
  if (applicant.noTaxDebt)            f5 += 4;
  if (applicant.noLegalDisputes)      f5 += 2;
  const factor5 = (f5 / 10) * 10 * w.riskAssessment;

  // Normalize to 0-100
  const rawTotal = factor1 + factor2 + factor3 + factor4 + factor5;
  const maxPossible = 25 * w.subsidyHistory + 30 * w.productivity + 20 * w.farmProfile + 15 * w.socialEconomic + 10 * w.riskAssessment;
  const totalScore = Math.round((rawTotal / maxPossible) * 100);

  const riskLevel = totalScore > 70 ? 'Төмен' : totalScore > 50 ? 'Орташа' : 'Жоғары';
  const recommendation = totalScore >= 65 ? 'Ұсынылды' : totalScore >= 50 ? 'Тексеруде' : 'Ұсынылмайды';

  return {
    totalScore,
    riskLevel,
    recommendation,
    factors: {
      f1: Math.round((f1 / 30) * 25),
      f2: Math.round((f2 / 30) * 30),
      f3: Math.round((f3 / 20) * 20),
      f4: Math.round((f4 / 15) * 15),
      f5: Math.round((f5 / 10) * 10),
    },
    breakdown: {
      hasPreviousSubsidy: applicant.hasPreviousSubsidy,
      usedFullSubsidy: applicant.usedFullSubsidy,
      reportsOnTime: applicant.reportsOnTime,
      noViolations: applicant.noViolations,
      aboveAvgYield: applicant.aboveAvgYield,
      positiveTrend: applicant.positiveTrend,
      costEfficient: applicant.costEfficient,
      landAreaOk: area >= 50 && area <= 1000,
      equipmentOk: (applicant.equipmentCount||0) > 5,
      hasIrrigation: applicant.hasIrrigation,
      manyEmployees: (applicant.employees||0) > 10,
      isRural: applicant.isRural,
      isMinorityRegion: applicant.isMinorityRegion,
      cleanCreditHistory: applicant.cleanCreditHistory,
      noTaxDebt: applicant.noTaxDebt,
      noLegalDisputes: applicant.noLegalDisputes,
    }
  };
}

function loadWeights() {
  try {
    const saved = localStorage.getItem('agri_weights');
    return saved ? JSON.parse(saved) : DEFAULT_WEIGHTS;
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

// ─── SAMPLE DATA GENERATOR ──────────────────────────────────────────────────
function generateSampleApplicants(count = 50) {
  const applicants = [];
  for (let i = 0; i < count; i++) {
    const region = rndItem(REGIONS);
    const districts = REGIONS_DATA[region];
    const district = rndItem(districts);
    const firstName = rndItem(FIRST_NAMES);
    const lastName = rndItem(LAST_NAMES);
    const prodType = rndItem(PRODUCTION_TYPES);
    const subType = rndItem(SUBSIDY_TYPES);
    const landArea = rnd(10, 2000);
    const employees = rnd(1, 80);
    const hasPrev = rndBool(0.7);

    const raw = {
      id: `APP-${String(i + 1).padStart(4, '0')}`,
      iin: rndIIN(),
      bin: rndBool(0.6) ? rndIIN() : null,
      name: `${lastName} ${firstName.charAt(0)}.`,
      fullName: `${lastName} ${firstName}`,
      region,
      district,
      productionType: prodType,
      subsidyType: subType,
      requestedAmount: rnd(1, 15) * 1_000_000,
      landArea,
      landOwned: Math.floor(landArea * Math.random()),
      landLeased: Math.floor(landArea * Math.random() * 0.5),
      employees,
      equipmentCount: rnd(0, 30),
      hasIrrigation: rndBool(0.35),
      hasPreviousSubsidy: hasPrev,
      usedFullSubsidy: hasPrev && rndBool(0.65),
      reportsOnTime: rndBool(0.72),
      noViolations: rndBool(0.80),
      aboveAvgYield: rndBool(0.55),
      positiveTrend: rndBool(0.50),
      costEfficient: rndBool(0.60),
      isRural: rndBool(0.75),
      isMinorityRegion: rndBool(0.25),
      cleanCreditHistory: rndBool(0.78),
      noTaxDebt: rndBool(0.82),
      noLegalDisputes: rndBool(0.88),
      annualRevenue: rnd(5, 200) * 1_000_000,
      netProfit: rnd(1, 50) * 1_000_000,
      livestock: prodType !== 'Егіншілік' ? rnd(10, 500) : 0,
      productivity: rnd(15, 85),
      applicationDate: rndDate(300),
      registrationDate: rndDate(3650),
      entityType: rndBool(0.6) ? 'ЖШС' : 'ЖК',
      mainCrops: prodType === 'Мал шаруашылығы' ? [] : [rndItem(['Бидай', 'Арпа', 'Жүгері', 'Күнбағыс', 'Қызылша', 'Соя'])],
      subsidyHistory: generateSubsidyHistory(hasPrev),
    };

    const scored = calculateScore(raw);
    applicants.push({ ...raw, ...scored });
  }

  // Sort by score descending and assign ranks
  applicants.sort((a, b) => b.totalScore - a.totalScore);
  applicants.forEach((a, i) => a.rank = i + 1);
  return applicants;
}

function generateSubsidyHistory(hasPrev) {
  if (!hasPrev) return [];
  const count = rnd(1, 5);
  const history = [];
  for (let i = 0; i < count; i++) {
    const year = 2020 + i;
    const amount = rnd(1, 12) * 1_000_000;
    const utilization = rnd(60, 100);
    history.push({
      year,
      amount,
      utilization,
      type: rndItem(SUBSIDY_TYPES),
      status: utilization >= 90 ? 'Толық игерілді' : 'Ішінара игерілді'
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
    this.applicants.forEach(a => {
      const scored = calculateScore(a, this.scoringWeights);
      Object.assign(a, scored);
    });
    this.applicants.sort((a, b) => b.totalScore - a.totalScore);
    this.applicants.forEach((a, i) => a.rank = i + 1);
    // Run ML pipeline after scoring
    clusterApplicants(this.applicants);
    this.applicants.forEach(a => { a.successProb = calcSuccessProbability(a); });
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
  name:           [/атауы|наим|name|аты/i],
  region:         [/облыс|обл|region|обл/i],
  district:       [/аудан|район|district/i],
  subsidyType:    [/субсидия.*түрі|вид.*суб|subsidy.*type/i],
  requestedAmount:[/сомасы|сумма|amount/i],
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

function buildApplicantFromRow(row, headers, columnMap, rowIdx) {
  const get = field => {
    const m = columnMap[field];
    return m ? row[m.index] : undefined;
  };

  const iin = get('iin') || rndIIN();
  const name = get('name') || `Өтінімдер ${rowIdx}`;
  const region = get('region') || rndItem(REGIONS);
  const districts = REGIONS_DATA[region] || ['Аудан'];
  const district = get('district') || rndItem(districts);
  const landArea = parseFloat(get('landArea')) || rnd(10, 500);
  const requestedAmount = parseFloat(String(get('requestedAmount')||'').replace(/\s/g,'')) || rnd(1,10)*1_000_000;

  const raw = {
    id: `IMP-${String(rowIdx).padStart(4,'0')}`,
    iin: String(iin), bin: null, name: String(name), fullName: String(name),
    region, district,
    productionType: get('productionType') || rndItem(PRODUCTION_TYPES),
    subsidyType: get('subsidyType') || rndItem(SUBSIDY_TYPES),
    requestedAmount, landArea,
    landOwned: Math.floor(landArea * 0.6), landLeased: Math.floor(landArea * 0.4),
    employees: rnd(1, 50), equipmentCount: rnd(0, 20),
    hasIrrigation: rndBool(0.3), hasPreviousSubsidy: rndBool(0.6),
    usedFullSubsidy: rndBool(0.6), reportsOnTime: rndBool(0.7),
    noViolations: rndBool(0.8), aboveAvgYield: rndBool(0.5),
    positiveTrend: rndBool(0.5), costEfficient: rndBool(0.6),
    isRural: rndBool(0.7), isMinorityRegion: rndBool(0.2),
    cleanCreditHistory: rndBool(0.8), noTaxDebt: rndBool(0.8), noLegalDisputes: rndBool(0.9),
    annualRevenue: rnd(5, 100)*1_000_000, netProfit: rnd(1,30)*1_000_000,
    livestock: rnd(0, 200), productivity: parseFloat(get('productivity')) || rnd(20, 80),
    applicationDate: rndDate(200), registrationDate: rndDate(3000),
    entityType: rndBool(0.6) ? 'ЖШС' : 'ЖК', mainCrops: [],
    subsidyHistory: generateSubsidyHistory(rndBool(0.6)),
  };

  const scored = calculateScore(raw);
  return { ...raw, ...scored };
}

// ─── EXPORT TO EXCEL ────────────────────────────────────────────────────────
function exportToExcel(data, filename) {
  const exportData = data.map(a => ({
    'ЖСН': a.iin,
    'Атауы': a.name,
    'Облыс': a.region,
    'Аудан': a.district,
    'Өндіріс түрі': a.productionType,
    'Субсидия түрі': a.subsidyType,
    'Сұралған сома (₸)': a.requestedAmount,
    'Жер алаңы (га)': a.landArea,
    'Балл': a.totalScore,
    'Тәуекел': a.riskLevel,
    'Мәртебе': a.recommendation,
    'Өтінім күні': a.applicationDate,
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

// ─── ANOMALY DETECTION ──────────────────────────────────────────────────────
function detectAnomalies(applicant) {
  const all = AppState.applicants;
  const flags = [];

  // 1. Productivity vs score mismatch
  if ((applicant.productivity||0) > 80 && (applicant.totalScore||0) < 45) {
    flags.push({ type:'warning', code:'PROD_SCORE_MISMATCH', text:'Өнімділік жоғары бірақ жалпы балл төмен — деректер сәйкессіздігі' });
  }

  // 2. Productivity outlier (top 5% vs mean)
  if (all.length > 5) {
    const avg = all.reduce((s,a) => s + (a.productivity||0), 0) / all.length;
    if ((applicant.productivity||0) > avg * 1.9) {
      flags.push({ type:'warning', code:'HIGH_PROD_OUTLIER', text:`Өнімділік аймақтық орташадан 90%+ жоғары (${applicant.productivity}% vs ${Math.round(avg)}%) — тексеру ұсынылады` });
    }
  }

  // 3. Missing critical fields
  const critical = [['iin','ЖСН'],['name','Атауы'],['region','Облыс'],['landArea','Жер алаңы'],['productionType','Өндіріс түрі']];
  const missing = critical.filter(([k]) => !applicant[k]);
  if (missing.length > 0) {
    flags.push({ type:'error', code:'MISSING_FIELDS', text:`Міндетті өрістер жоқ: ${missing.map(m=>m[1]).join(', ')}` });
  }

  // 4. Subsidy used but reports late
  if (applicant.hasPreviousSubsidy && applicant.usedFullSubsidy && !applicant.reportsOnTime) {
    flags.push({ type:'warning', code:'REPORT_INCONSISTENCY', text:'Субсидия игерілді бірақ есептер уақытылы тапсырылмаған — сәйкессіздік' });
  }

  // 5. Large land, minimal equipment
  if ((applicant.landArea||0) > 600 && (applicant.equipmentCount||0) < 2) {
    flags.push({ type:'warning', code:'LAND_EQUIP_MISMATCH', text:`Үлкен жер алаңы (${applicant.landArea} га) бірақ техника өте аз (${applicant.equipmentCount||0} бірлік)` });
  }

  // 6. Amount vs land ratio
  if ((applicant.requestedAmount||0) > 12_000_000 && (applicant.landArea||0) < 30) {
    flags.push({ type:'error', code:'AMOUNT_LAND_RATIO', text:`Сұралған сома (${formatMoney(applicant.requestedAmount)}) жер алаңына сай емес (${applicant.landArea} га)` });
  }

  // 7. Revenue vs request ratio
  if ((applicant.annualRevenue||0) < 500_000 && (applicant.requestedAmount||0) > 5_000_000) {
    flags.push({ type:'warning', code:'REVENUE_REQUEST_MISMATCH', text:`Жылдық айналым (${formatMoney(applicant.annualRevenue)}) сұралған сомадан күрт төмен` });
  }

  // 8. Near-duplicate IIN (first 8 digits match another applicant)
  const dups = all.filter(a => a.id !== applicant.id && a.iin && applicant.iin && a.iin.slice(0,9) === applicant.iin.slice(0,9));
  if (dups.length > 0) {
    flags.push({ type:'error', code:'POSSIBLE_DUPLICATE', text:`Ұқсас ЖСН анықталды: ${dups[0].name} (${dups[0].iin}) — мүмкін дубликат` });
  }

  // 9. Sudden jump in subsidy utilization
  const hist = applicant.subsidyHistory || [];
  if (hist.length >= 2) {
    const sorted = [...hist].sort((a,b) => a.year - b.year);
    const lastTwo = sorted.slice(-2);
    if (lastTwo[0].utilization < 50 && lastTwo[1].utilization > 95) {
      flags.push({ type:'warning', code:'UTILIZATION_JUMP', text:`Субсидия игерілуі күрт өскен: ${lastTwo[0].utilization}% → ${lastTwo[1].utilization}% — тексеру қажет` });
    }
  }

  const errCnt = flags.filter(f => f.type === 'error').length;
  const warnCnt = flags.filter(f => f.type === 'warning').length;
  const anomalyRisk = errCnt > 0 ? 'Жоғары' : warnCnt >= 2 ? 'Орташа' : warnCnt === 1 ? 'Төмен' : 'Жоқ';

  return { flags, anomalyRisk, errCnt, warnCnt };
}

// ─── DATA QUALITY ────────────────────────────────────────────────────────────
function calcDataQuality(applicant) {
  const fields = [
    { key:'iin',             label:'ЖСН',              required:true },
    { key:'name',            label:'Атауы',             required:true },
    { key:'region',          label:'Облыс',             required:true },
    { key:'district',        label:'Аудан',             required:true },
    { key:'landArea',        label:'Жер алаңы',         required:true },
    { key:'productionType',  label:'Өндіріс түрі',      required:true },
    { key:'subsidyType',     label:'Субсидия түрі',     required:true },
    { key:'requestedAmount', label:'Сұралған сома',     required:true },
    { key:'applicationDate', label:'Өтінім күні',       required:true },
    { key:'employees',       label:'Қызметкерлер',      required:false },
    { key:'equipmentCount',  label:'Техника саны',      required:false },
    { key:'annualRevenue',   label:'Жылдық айналым',    required:false },
    { key:'netProfit',       label:'Таза пайда',        required:false },
    { key:'productivity',    label:'Өнімділік %',       required:false },
    { key:'hasPreviousSubsidy', label:'Субсидия тарихы', required:false },
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
  const modified = { ...applicant, ...changes };
  const result = calculateScore(modified);
  const threshold = parseInt(localStorage.getItem('agri_threshold') || '65');
  const wasIn = (applicant.totalScore || 0) >= threshold;
  const nowIn = result.totalScore >= threshold;
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
  return [
    (a.totalScore || 0) / 100,
    Math.min((a.yield || a.productivity || 0) / 60, 1),
    Math.min((a.landArea || 0) / 800, 1),
    (a.subsidyUtilization || 0) / 100,
    Math.min((a.employees || 0) / 40, 1),
    a.hasPreviousSubsidy ? 1 : 0,
    a.breakdown?.positiveTrend ? 1 : 0,
    a.breakdown?.noViolations ? 1 : 0,
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
  const stats = centroids.map((c, ci) => {
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
  const score    = (applicant.totalScore || 0) / 100;
  const util     = (applicant.subsidyUtilization || 0) / 100;
  const credit   = (applicant.creditScore || 50) / 100;
  const noViol   = applicant.breakdown?.noViolations ? 1 : 0;
  const trend    = applicant.breakdown?.positiveTrend ? 1 : 0;
  const hasPrev  = applicant.hasPreviousSubsidy ? 1 : 0;
  const noTax    = applicant.breakdown?.noTaxDebt ? 1 : 0;
  const noLegal  = applicant.breakdown?.noLegalDisputes ? 1 : 0;
  const costEff  = applicant.breakdown?.costEfficient ? 1 : 0;
  const aboveAvg = applicant.breakdown?.aboveAvgYield ? 1 : 0;

  // Calibrated sigmoid weights (domain-expert priors)
  const z = 2.8*score + 1.9*util + 1.1*credit
          + 0.7*noViol + 0.7*trend + 0.6*hasPrev
          + 0.5*noTax + 0.4*noLegal + 0.4*costEff + 0.3*aboveAvg
          - 4.5;

  const p = Math.round(100 / (1 + Math.exp(-z)));
  const probability = Math.min(Math.max(p, 5), 95);
  const dq = calcDataQuality(applicant);
  const confidence = dq.completeness >= 80 ? 'Жоғары' : dq.completeness >= 60 ? 'Орташа' : 'Төмен';

  return {
    probability,
    riskProb: 100 - probability,
    confidence,
    proxyMode: true,
    proxyNote: 'Proxy модель — нақты тарихи деректер жоқ кезде скор, тарих және тәуекел белгілеріне негізделген bolжам',
  };
}

// ─── ADAPTIVE WEIGHT CALIBRATION ─────────────────────────────────────────────

function calibrateAdaptiveWeights(applicants) {
  if (!applicants || applicants.length < 5) {
    return { success: false, reason: 'Жеткіліксіз деректер — минимум 5 өтінім қажет' };
  }
  const maxes   = { f1: 25, f2: 30, f3: 20, f4: 15, f5: 10 };
  const keyMap  = { f1: 'subsidyHistory', f2: 'productivity', f3: 'farmProfile', f4: 'socialEconomic', f5: 'riskAssessment' };
  const nameMap = { f1: 'Субсидия тарихы', f2: 'Өнімділік', f3: 'Шаруашылық профилі', f4: 'Әлеуметтік-эконом.', f5: 'Тәуекел бағасы' };

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
