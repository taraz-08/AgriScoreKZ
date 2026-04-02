/**
 * AgriScore KZ — Secure Node.js Server (entry point)
 * - Нақты логин/пароль тексеру
 * - Gemini API кілті серверде (.env) — frontend-те ешқашан көрінбейді
 * - Статикалық файлдарды береді
 */

'use strict';

// ─── .env оқу (dotenv жоқ болса — өзіміз оқимыз) ──────────────────────────
const fs   = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const http = require('http');

const PORT    = parseInt(process.env.PORT || '3000', 10);
const APP_DIR = path.join(__dirname, 'app');

// ─── MIME TYPES ──────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico':  'image/x-icon',
  '.svg':  'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
};

// ─── ROUTE MODULES ───────────────────────────────────────────────────────────
const { readBody, json }   = require('./lib/helpers');
const { handleAuth, USERS } = require('./routes/auth');
const { handleAI }          = require('./routes/ai');
const { handleData }        = require('./routes/data');

// Shared context passed to every route handler
const ctx = { readBody, json };

// ─── SERVER ──────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── Route dispatching ───────────────────────────────────────────────────────
  if (await handleAuth(url, req, res, ctx) !== false) return;
  if (await handleAI(url, req, res, ctx)   !== false) return;
  if (await handleData(url, req, res, ctx) !== false) return;

  // ── Static files ────────────────────────────────────────────────────────────
  let filePath = path.join(APP_DIR, url.pathname === '/' ? 'index.html' : url.pathname);

  // Path traversal қорғау
  if (!filePath.startsWith(APP_DIR)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('\n' + '═'.repeat(50));
  console.log('  🌾  AgriScore KZ — Сервер іске қосылды');
  console.log('═'.repeat(50));
  console.log(`  📡  http://localhost:${PORT}`);
  const ALEM_KEY   = process.env.ALEM_API_KEY   || '';
  const GEMINI_KEY = process.env.GEMINI_API_KEY  || '';
  console.log(`  🤖  AI Provider: ${ALEM_KEY ? '✅ Alem LLM (alemllm)' : GEMINI_KEY ? '✅ Google Gemini 2.5 Flash' : '⚠️  Demo режим (API кілт жоқ)'}`);
  console.log('');
  console.log('  👤  Тіркелгілер (.env файлынан):');
  USERS.forEach(u => {
    console.log(`       ${u.login} / ${u.password}   [${u.role}]`);
  });
  console.log('═'.repeat(50) + '\n');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} бос емес! Басқа порт көрсетіңіз: PORT=3001 node server.js`);
  } else {
    console.error('Сервер қатесі:', err.message);
  }
  process.exit(1);
});
