'use strict';

const https = require('https');

const ALEM_KEY   = process.env.ALEM_API_KEY   || '';
const ALEM_URL   = process.env.ALEM_API_URL   || 'https://llm.alem.ai/v1/chat/completions';
const ALEM_MODEL = process.env.ALEM_MODEL     || 'alemllm';
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';

// Alem LLM API-ге сұрау (OpenAI формат)
// Frontend Gemini форматын жібереді → OpenAI-ге конвертация → Gemini форматына қайтарамыз
function proxyAlem(geminiBody) {
  return new Promise((resolve, reject) => {
    const text = geminiBody?.contents?.[0]?.parts?.[0]?.text || '';
    const openAIBody = JSON.stringify({
      model:    ALEM_MODEL,
      messages: [{ role: 'user', content: text }]
    });

    const urlObj = new URL(ALEM_URL);
    const options = {
      hostname: urlObj.hostname,
      path:     urlObj.pathname + urlObj.search,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Authorization':  `Bearer ${ALEM_KEY}`,
        'Content-Length': Buffer.byteLength(openAIBody)
      }
    };

    const req = https.request(options, (apiRes) => {
      let data = '';
      apiRes.on('data', chunk => { data += chunk; });
      apiRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (apiRes.statusCode !== 200) {
            resolve({ status: apiRes.statusCode, body: { error: { message: parsed?.error?.message || 'Alem API қатесі' } } });
            return;
          }
          // OpenAI → Gemini форматы конвертация (frontend өзгертусіз жұмыс жасайды)
          const content = parsed?.choices?.[0]?.message?.content || '';
          resolve({
            status: 200,
            body: { candidates: [{ content: { parts: [{ text: content }] } }] }
          });
        } catch {
          resolve({ status: 500, body: { error: { message: 'JSON parse error' } } });
        }
      });
    });
    req.on('error', reject);
    req.write(openAIBody);
    req.end();
  });
}

// Gemini API-ге https сұрау жіберу (запасной)
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

// ctx = { readBody, json }
async function handleAI(url, req, res, ctx) {
  // ── API: AI Proxy (Alem приоритет, Gemini запасной) ────────────────────────
  if (url.pathname === '/api/gemini' && req.method === 'POST') {
    if (!ALEM_KEY && !GEMINI_KEY) {
      return ctx.json(res, 200, { demo: true });
    }
    const body = await ctx.readBody(req);
    try {
      // Alem LLM — приоритет
      if (ALEM_KEY) {
        const result = await proxyAlem(body);
        if (result.status !== 200) {
          return ctx.json(res, result.status, { error: result.body?.error || { message: 'Alem API қатесі' } });
        }
        return ctx.json(res, 200, result.body);
      }
      // Gemini — запасной
      const result = await proxyGemini(body);
      if (result.status !== 200) {
        return ctx.json(res, result.status, { error: result.body?.error || { message: 'API қатесі' } });
      }
      return ctx.json(res, 200, result.body);
    } catch (err) {
      return ctx.json(res, 500, { error: { message: err.message } });
    }
  }

  // ── API: Check AI status ────────────────────────────────────────────────────
  if (url.pathname === '/api/gemini-status' && req.method === 'GET') {
    return ctx.json(res, 200, { hasKey: !!(ALEM_KEY || GEMINI_KEY), provider: ALEM_KEY ? 'alem' : GEMINI_KEY ? 'gemini' : 'none' });
  }

  return false; // not handled
}

module.exports = { handleAI, proxyAlem, proxyGemini };
