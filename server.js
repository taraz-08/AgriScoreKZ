/**
 * AgriScore KZ — Secure Node.js Server
 * - Нақты логин/пароль тексеру
 * - Gemini API кілті серверде қалады (frontend-те ешқашан көрінбейді)
 * - Статикалық файлдарды береді
 */

'use strict';

// ─── .env оқу (dotenv жоқ болса — өзіміз оқимыз) ──────────────────────────
const fs = require('fs');
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

const http  = require('http');
const https = require('https');

const PORT        = parseInt(process.env.PORT || '3000', 10);
const GEMINI_KEY  = process.env.GEMINI_API_KEY || '';
const APP_DIR     = path.join(__dirname, 'app');

// ─── ПАЙДАЛАНУШЫЛАР ─────────────────────────────────────────────────────────
const USERS = [
  {
    login:    process.env.ADMIN_LOGIN    || 'admin',
    password: process.env.ADMIN_PASSWORD || 'AgriScore2025!',
    name:     'Ахметов А.',
    role:     'Администратор'
  },
  {
    login:    process.env.USER1_LOGIN    || 'analyst',
    password: process.env.USER1_PASSWORD || 'Analyst2025!',
    name:     'Сейітова Г.',
    role:     'Сарапшы'
  },
  {
    login:    process.env.USER2_LOGIN    || 'operator',
    password: process.env.USER2_PASSWORD || 'Operator2025!',
    name:     'Нұрланов М.',
    role:     'Оператор'
  }
];

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

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Gemini API-ге https сұрау жіберу
function proxyGemini(body) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const apiUrl   = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
    const urlObj   = new URL(apiUrl);
    const options  = {
      hostname: urlObj.hostname,
      path:     urlObj.pathname + urlObj.search,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = https.request(options, (apiRes) => {
      let data = '';
      apiRes.on('data', chunk => { data += chunk; });
      apiRes.on('end', () => {
        try { resolve({ status: apiRes.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: apiRes.statusCode, body: { error: { message: 'JSON parse error' } } }); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

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

  // ── API: Login ──────────────────────────────────────────────────────────────
  if (url.pathname === '/api/login' && req.method === 'POST') {
    const body = await readBody(req);
    const login    = (body.login    || '').trim();
    const password = (body.password || '').trim();

    if (!login || !password) {
      return json(res, 400, { ok: false, error: 'Логин немесе пароль бос' });
    }

    const user = USERS.find(u => u.login === login && u.password === password);
    if (user) {
      return json(res, 200, {
        ok:   true,
        user: { login: user.login, name: user.name, role: user.role }
      });
    } else {
      return json(res, 401, { ok: false, error: 'Логин немесе пароль қате ❌' });
    }
  }

  // ── API: Gemini Proxy ───────────────────────────────────────────────────────
  if (url.pathname === '/api/gemini' && req.method === 'POST') {
    // Кілт .env-де орнатылмаған → demo режим
    if (!GEMINI_KEY) {
      return json(res, 200, { demo: true });
    }
    const body = await readBody(req);
    try {
      const result = await proxyGemini(body);
      if (result.status !== 200) {
        return json(res, result.status, { error: result.body?.error || { message: 'API қатесі' } });
      }
      return json(res, 200, result.body);
    } catch (err) {
      return json(res, 500, { error: { message: err.message } });
    }
  }

  // ── API: Check Gemini status ────────────────────────────────────────────────
  if (url.pathname === '/api/gemini-status' && req.method === 'GET') {
    return json(res, 200, { hasKey: !!GEMINI_KEY });
  }

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
  console.log(`  🔑  Gemini API: ${GEMINI_KEY ? '✅ Орнатылды (.env)' : '⚠️  Demo режим (GEMINI_API_KEY бос)'}`);
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
