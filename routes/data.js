'use strict';

const fs   = require('fs');
const path = require('path');

const DATA_DIR  = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'applicants.json');
const AUDIT_FILE = path.join(DATA_DIR, 'audit.json');

// ─── SERVER-SIDE DATA STORE ───────────────────────────────────────────────────
let store    = { applicants: [], shortlist: [], reviews: {}, synced: null };
let auditLog = [];

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadStore() {
  ensureDataDir();
  try { if (fs.existsSync(DATA_FILE))  store    = JSON.parse(fs.readFileSync(DATA_FILE,  'utf8')); } catch {}
  try { if (fs.existsSync(AUDIT_FILE)) auditLog = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8')); } catch {}
}

function saveStore() {
  ensureDataDir();
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(store)); } catch {}
}

function saveAudit() {
  ensureDataDir();
  try { fs.writeFileSync(AUDIT_FILE, JSON.stringify(auditLog.slice(-500))); } catch {}
}

function addAudit(action, user, data) {
  auditLog.push({ ts: new Date().toISOString(), action, user: user || 'system', ...data });
  saveAudit();
}

loadStore();

// ctx = { readBody, json }
async function handleData(url, req, res, ctx) {
  // ── API: Sync (frontend → server) ──────────────────────────────────────────
  if (url.pathname === '/api/sync' && req.method === 'POST') {
    const body = await ctx.readBody(req);
    const user = JSON.parse(req.headers['x-user'] || '{}');
    if (body.applicants) { store.applicants = body.applicants; store.synced = new Date().toISOString(); saveStore(); addAudit('sync', user.login, { count: body.applicants.length }); }
    if (body.shortlist)  { store.shortlist = body.shortlist; saveStore(); }
    if (body.reviews)    { store.reviews = body.reviews; saveStore(); }
    return ctx.json(res, 200, { ok: true, synced: store.synced });
  }

  // ── API: Applicants ─────────────────────────────────────────────────────────
  if (url.pathname === '/api/applicants' && req.method === 'GET') {
    const q       = url.searchParams.get('q')       || '';
    const region  = url.searchParams.get('region')  || '';
    const cluster = url.searchParams.get('cluster') || '';
    const status  = url.searchParams.get('status')  || '';
    const page    = parseInt(url.searchParams.get('page')  || '1');
    const limit   = parseInt(url.searchParams.get('limit') || '50');
    let data = store.applicants;
    if (q)       data = data.filter(a => (a.name||'').toLowerCase().includes(q.toLowerCase()) || (a.iin||'').includes(q));
    if (region)  data = data.filter(a => a.region === region);
    if (cluster) data = data.filter(a => a.clusterLabel === cluster);
    if (status)  data = data.filter(a => a.recommendation === status);
    const total = data.length;
    const items = data.slice((page - 1) * limit, page * limit);
    return ctx.json(res, 200, { total, page, limit, items });
  }

  // ── API: Single Applicant ───────────────────────────────────────────────────
  if (url.pathname.startsWith('/api/applicant/') && req.method === 'GET') {
    const id = url.pathname.split('/')[3];
    const a  = store.applicants.find(x => x.id === id);
    if (!a) return ctx.json(res, 404, { error: 'Табылмады' });
    return ctx.json(res, 200, { ...a, review: store.reviews[id] || { status: 'pending' } });
  }

  // ── API: Review (Human-in-the-loop) ────────────────────────────────────────
  if (url.pathname === '/api/review' && req.method === 'POST') {
    const body = await ctx.readBody(req);
    const user = JSON.parse(req.headers['x-user'] || '{}');
    const { id, status, comment, overrideReason } = body;
    if (!id || !status) return ctx.json(res, 400, { error: 'id және status міндетті' });
    const applicant = store.applicants.find(a => a.id === id);
    store.reviews[id] = {
      status, comment: comment || '', overrideReason: overrideReason || '',
      reviewedBy: user.name || user.login || 'Пайдаланушы',
      reviewedAt: new Date().toISOString(),
      aiScore:           applicant?.hybridScore       || applicant?.totalScore,
      aiRecommendation:  applicant?.hybridRecommendation || applicant?.recommendation,
    };
    saveStore();
    addAudit('review', user.login, { id, status, aiScore: store.reviews[id].aiScore, humanDecision: status });
    return ctx.json(res, 200, { ok: true, review: store.reviews[id] });
  }

  // ── API: Shortlist ──────────────────────────────────────────────────────────
  if (url.pathname === '/api/shortlist' && req.method === 'GET') {
    return ctx.json(res, 200, { items: store.shortlist, total: store.shortlist.length });
  }

  // ── API: Analytics ──────────────────────────────────────────────────────────
  if (url.pathname === '/api/analytics' && req.method === 'GET') {
    const apps = store.applicants;
    if (!apps.length) return ctx.json(res, 200, { total: 0 });
    const avgScore  = Math.round(apps.reduce((s, a) => s + (a.hybridScore || a.totalScore || 0), 0) / apps.length);
    const avgProb   = Math.round(apps.reduce((s, a) => s + (a.successProb?.probability || 0), 0) / apps.length);
    const byCluster = {};
    const byRegion  = {};
    apps.forEach(a => {
      byCluster[a.clusterLabel || '—'] = (byCluster[a.clusterLabel || '—'] || 0) + 1;
      byRegion[a.region        || '—'] = (byRegion[a.region        || '—'] || 0) + 1;
    });
    return ctx.json(res, 200, {
      total: apps.length, avgScore, avgProb,
      byCluster, byRegion,
      shortlisted: store.shortlist.length,
      reviewed:    Object.keys(store.reviews).length
    });
  }

  // ── API: Audit Log ──────────────────────────────────────────────────────────
  if (url.pathname === '/api/audit' && req.method === 'GET') {
    const limit = parseInt(url.searchParams.get('limit') || '100');
    return ctx.json(res, 200, { items: auditLog.slice(-limit).reverse(), total: auditLog.length });
  }

  return false; // not handled
}

module.exports = { handleData, store, loadStore, saveStore, addAudit };
