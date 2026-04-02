'use strict';

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

// ctx = { readBody, json }
async function handleAuth(url, req, res, ctx) {
  if (url.pathname === '/api/login' && req.method === 'POST') {
    const body     = await ctx.readBody(req);
    const login    = (body.login    || '').trim();
    const password = (body.password || '').trim();

    if (!login || !password) {
      return ctx.json(res, 400, { ok: false, error: 'Логин немесе пароль бос' });
    }

    const user = USERS.find(u => u.login === login && u.password === password);
    if (user) {
      return ctx.json(res, 200, {
        ok:   true,
        user: { login: user.login, name: user.name, role: user.role }
      });
    } else {
      return ctx.json(res, 401, { ok: false, error: 'Логин немесе пароль қате ❌' });
    }
  }
  return false; // not handled
}

module.exports = { handleAuth, USERS };
