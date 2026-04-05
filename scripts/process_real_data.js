'use strict';
/**
 * AgriScore KZ — Real Dataset Processor
 * Input:  bazaX/Выгрузка по выданным субсидиям 2025 год (обезлич) (3).xlsx
 * Output: data/applicants.json  (top 1000 representative records, scored)
 *         data/real_stats.json  (aggregate stats from all 36,651 rows)
 */

const XLSX = require('../node_modules/xlsx');
const fs   = require('fs');
const path = require('path');

// ─── CONSTANTS (mirror of data.js) ──────────────────────────────────────────
const DIR_PRIORITY = {
  'Субсидирование в скотоводстве':                        100,
  'Субсидирование затрат по искусственному осеменению':    90,
  'Субсидирование в птицеводстве':                         85,
  'Субсидирование в овцеводстве':                          75,
  'Субсидирование в свиноводстве':                         70,
  'Субсидирование в коневодстве':                          60,
  'Субсидирование в верблюдоводстве':                      55,
  'Субсидирование в пчеловодстве':                         50,
  'Субсидирование в козоводстве':                          45,
};
const DIR_STATS = {
  'Субсидирование в скотоводстве':                       { medHC:142,  medAmt:1050000  },
  'Субсидирование в овцеводстве':                        { medHC:200,  medAmt:1232000  },
  'Субсидирование в птицеводстве':                       { medHC:12765,medAmt:831120   },
  'Субсидирование в свиноводстве':                       { medHC:221,  medAmt:8400000  },
  'Субсидирование в верблюдоводстве':                    { medHC:28,   medAmt:604656   },
  'Субсидирование в коневодстве':                        { medHC:38,   medAmt:881790   },
  'Субсидирование затрат по искусственному осеменению':  { medHC:549,  medAmt:1120000  },
  'Субсидирование в пчеловодстве':                       { medHC:25502,medAmt:5100400  },
  'Субсидирование в козоводстве':                        { medHC:748,  medAmt:52360000 },
};
const MORTALITY = {
  'Субсидирование в скотоводстве':2.5,'Субсидирование в овцеводстве':3.0,
  'Субсидирование в козоводстве':3.0,'Субсидирование в птицеводстве':7.5,
  'Субсидирование в свиноводстве':4.0,'Субсидирование в коневодстве':2.5,
  'Субсидирование в верблюдоводстве':1.0,'Субсидирование в пчеловодстве':20.0,
  'Субсидирование затрат по искусственному осеменению':2.5,
};
const PASTURE = {
  'Субсидирование в скотоводстве':10,'Субсидирование в овцеводстве':2,
  'Субсидирование в козоводстве':2,'Субсидирование в коневодстве':11,
  'Субсидирование в верблюдоводстве':14,
};

function getSubsidyCategory(normative) {
  if (normative >= 100000) return 'breeding_purchase';
  if (normative >= 15000)  return 'selection_work';
  if (normative >= 5000)   return 'genetic_services';
  if (normative >= 500)    return 'production_premium';
  return 'production_subsidy';
}

function scoreApplicant(a) {
  const W = { hc:0.33, dir:0.28, cat:0.22, reg:0.17 };
  const dir = a.direction || '';
  const ds  = DIR_STATS[dir] || { medHC:100, medAmt:1000000 };

  // F1: head count scale (max 30)
  const hcRatio  = a.headCount / Math.max(ds.medHC, 1);
  const hcBase   = Math.min(30, Math.round(Math.log10(Math.max(hcRatio,0.01)+1)*28));
  const mortality= MORTALITY[dir] ?? 3;
  const f1 = Math.min(30, Math.max(0, hcBase + Math.round((5-mortality)*0.3)));

  // F2: direction priority (max 25)
  const f2 = Math.round(((DIR_PRIORITY[dir]||50)/100)*25);

  // F3: subsidy category (max 20)
  const catScores = { breeding_purchase:20,selection_work:16,genetic_services:12,production_premium:8,production_subsidy:5 };
  const f3 = catScores[a.subsidyCategory] || 8;

  // F4: regional comparison (max 15)
  const amtRatio = a.requestedAmount / Math.max(ds.medAmt, 1);
  const f4 = Math.min(15, Math.max(0, Math.round(Math.sqrt(amtRatio)*10)));

  const rawScore = f1*W.hc + f2*W.dir + f3*W.cat + f4*W.reg;
  const maxScore = 30*W.hc + 25*W.dir + 20*W.cat + 15*W.reg;
  const totalScore = Math.min(100, Math.max(0, Math.round(rawScore/maxScore*100)));
  const riskLevel  = totalScore>70?'Төмен':totalScore>50?'Орташа':'Жоғары';
  const recommendation = totalScore>=65?'Ұсынылды':totalScore>=50?'Тексеруде':'Ұсынылмайды';

  // Simple success probability
  const executed = a.originalStatus==='Исполнена'?1:0;
  const noViol   = a.originalStatus!=='Отклонена'?1:0;
  const z = 3.2*(totalScore/100)+1.5*(f2/25)+0.9*(f3/20)+0.6*(hcRatio/5)+1.8*executed+0.7*noViol-3.8;
  const prob = Math.min(95, Math.max(5, Math.round(100/(1+Math.exp(-z)))));

  return { totalScore, hybridScore:totalScore, riskLevel, recommendation,
    factors:{f1,f2,f3,f4}, headCount:a.headCount, hcRatio:Math.round(hcRatio*100)/100,
    successProb:{ probability:prob, confidence:'Орташа', proxyMode:true } };
}

// ─── MAIN PROCESSING ─────────────────────────────────────────────────────────
console.log('📂 Reading Excel...');
const wb   = XLSX.readFile(path.join(__dirname,'../bazaX/Выгрузка по выданным субсидиям 2025 год (обезлич) (3).xlsx'));
const ws   = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, {header:1, defval:''});
const dataRows = rows.slice(5).filter(r => r[6] && r[7]); // skip 5 header rows, require appNum + direction

console.log(`✅ Loaded ${dataRows.length} rows`);

// ─── PARSE & SCORE ALL ───────────────────────────────────────────────────────
const allApplicants = [];
const regionStats   = {};
const dirStats      = {};
const statusStats   = {};
let totalAmount     = 0;

dataRows.forEach((r, idx) => {
  const normative      = parseFloat(r[10]) || 0;
  const requestedAmount= parseFloat(r[11]) || 0;
  const headCount      = normative > 0 ? Math.round(requestedAmount / normative) : 0;
  const direction      = String(r[7]).trim();
  const region         = String(r[4]).trim();
  const district       = String(r[12]).trim() || String(r[5]).trim();
  const appNum         = String(r[6]).trim();
  const originalStatus = String(r[9]).trim();
  const subsidyType    = String(r[8]).trim();

  // Parse date "21.01.2025 11:15:40" → "21.01.2025"
  const rawDate = String(r[1]).trim();
  const applicationDate = rawDate.includes(' ') ? rawDate.split(' ')[0] : rawDate;

  const subsidyCategory = getSubsidyCategory(normative);

  const raw = {
    id: `REAL-${String(idx+1).padStart(5,'0')}`,
    appNum, applicationDate, region, district,
    direction, subsidyType, subsidyCategory,
    normative, requestedAmount, headCount,
    originalStatus,
    productionType: direction,
    amount: requestedAmount,
    entityType: 'ЖТ',
    employees: Math.max(1, Math.round(headCount * 0.05)),
    annualRevenue: Math.round(requestedAmount * (2 + Math.random() * 3)),
    netProfit: Math.round(requestedAmount * (0.15 + Math.random() * 0.3)),
    hasPreviousSubsidy: originalStatus === 'Исполнена',
    pastureArea: PASTURE[direction]
      ? Math.round(headCount * PASTURE[direction] * (0.8 + Math.random() * 0.6))
      : 0,
  };

  const scored = scoreApplicant(raw);
  const applicant = { ...raw, ...scored };

  allApplicants.push(applicant);

  // Aggregate stats
  regionStats[region] = (regionStats[region]||0) + 1;
  dirStats[direction] = (dirStats[direction]||0) + 1;
  statusStats[originalStatus] = (statusStats[originalStatus]||0) + 1;
  totalAmount += requestedAmount;
});

console.log(`🧮 Scored ${allApplicants.length} applicants`);

// ─── SORT & RANK ─────────────────────────────────────────────────────────────
allApplicants.sort((a,b) => b.totalScore - a.totalScore);
allApplicants.forEach((a,i) => a.rank = i+1);

// ─── REAL STATS (full 36,651) ─────────────────────────────────────────────────
const avgScore = Math.round(allApplicants.reduce((s,a)=>s+a.totalScore,0)/allApplicants.length);
const recommended = allApplicants.filter(a=>a.recommendation==='Ұсынылды').length;
const review      = allApplicants.filter(a=>a.recommendation==='Тексеруде').length;
const rejected    = allApplicants.filter(a=>a.recommendation==='Ұсынылмайды').length;
const high70      = allApplicants.filter(a=>a.totalScore>=70).length;
const mid50       = allApplicants.filter(a=>a.totalScore>=50&&a.totalScore<70).length;
const low50       = allApplicants.filter(a=>a.totalScore<50).length;

const realStats = {
  generated: new Date().toISOString(),
  source: 'Выгрузка по выданным субсидиям 2025 год (обезлич).xlsx — subsidy.plem.kz',
  total: allApplicants.length,
  totalAmount,
  avgScore,
  recommended, review, rejected,
  scoreDistribution: { high70, mid50, low50 },
  byStatus: statusStats,
  byDirection: dirStats,
  byRegion: regionStats,
  topRegions: Object.entries(regionStats).sort((a,b)=>b[1]-a[1]).slice(0,10)
    .map(([region,count])=>({ region, count })),
  topDirections: Object.entries(dirStats).sort((a,b)=>b[1]-a[1])
    .map(([direction,count])=>({ direction, count })),
};

fs.writeFileSync(
  path.join(__dirname,'../data/real_stats.json'),
  JSON.stringify(realStats, null, 2),
  'utf8'
);
console.log('✅ Saved data/real_stats.json');

// ─── SELECT REPRESENTATIVE 1000 APPLICANTS ────────────────────────────────────
// Strategy: take top 400, middle 300, bottom 150, + 150 random from various directions
const top400    = allApplicants.slice(0, 400);
const mid300    = allApplicants.slice(Math.floor(allApplicants.length*0.4), Math.floor(allApplicants.length*0.4)+300);
const bottom150 = allApplicants.slice(-150);
const picked    = new Set([...top400,...mid300,...bottom150].map(a=>a.id));
// Fill remaining 150 from different directions/regions for diversity
const remaining = allApplicants.filter(a=>!picked.has(a.id));
const extra150 = [];
const dirSeen = {};
for (const a of remaining) {
  if (extra150.length >= 150) break;
  if (!dirSeen[a.direction] || dirSeen[a.direction] < 20) {
    extra150.push(a);
    dirSeen[a.direction] = (dirSeen[a.direction]||0) + 1;
  }
}

const selected = [...top400, ...mid300, ...bottom150, ...extra150];
// Re-sort and re-rank
selected.sort((a,b) => b.totalScore - a.totalScore);
selected.forEach((a,i) => a.rank = i+1);

console.log(`📋 Selected ${selected.length} representative applicants`);

// ─── SAVE ─────────────────────────────────────────────────────────────────────
fs.writeFileSync(
  path.join(__dirname,'../data/applicants.json'),
  JSON.stringify(selected, null, 2),
  'utf8'
);
console.log('✅ Saved data/applicants.json');
console.log('');
console.log('📊 SUMMARY:');
console.log(`   Total processed:   ${allApplicants.length.toLocaleString()}`);
console.log(`   Saved to demo:     ${selected.length}`);
console.log(`   Avg score:         ${avgScore}`);
console.log(`   Recommended:       ${recommended} (${Math.round(recommended/allApplicants.length*100)}%)`);
console.log(`   Total amount:      ${(totalAmount/1e9).toFixed(2)} млрд ₸`);
console.log(`   Directions:        ${Object.keys(dirStats).length}`);
console.log(`   Regions:           ${Object.keys(regionStats).length}`);
