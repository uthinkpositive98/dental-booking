// Shared helpers for the TikTok integration (Vercel serverless functions).
// Files/folders starting with "_" inside /api are NOT exposed as endpoints.
const crypto = require('crypto');

const API = 'https://open.tiktokapis.com';
const AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/';
const SCOPES = 'user.info.basic,video.publish,video.upload';
const SESSION_COOKIE = 'tt_session';
const STATE_COOKIE = 'tt_state';

function env(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name}`);
  return v;
}

function baseUrl(req) {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${req.headers['x-forwarded-host'] || req.headers.host}`;
}

function redirectUri(req) {
  return process.env.TIKTOK_REDIRECT_URI || `${baseUrl(req)}/api/tiktok/callback`;
}

// ── cookies ──
function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

function cookie(name, value, maxAgeSec) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSec}`;
}

function addCookie(res, c) {
  const prev = res.getHeader('Set-Cookie');
  res.setHeader('Set-Cookie', prev ? [].concat(prev, c) : [c]);
}

// ── encrypted session (AES-256-GCM, key derived from SESSION_SECRET or client secret) ──
function key() {
  const secret = process.env.SESSION_SECRET || env('TIKTOK_CLIENT_SECRET');
  return crypto.createHash('sha256').update(secret).digest();
}

function seal(obj) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), enc]).toString('base64url');
}

function unseal(str) {
  try {
    const buf = Buffer.from(str, 'base64url');
    const d = crypto.createDecipheriv('aes-256-gcm', key(), buf.subarray(0, 12));
    d.setAuthTag(buf.subarray(12, 28));
    const json = Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getSession(req) {
  const raw = parseCookies(req)[SESSION_COOKIE];
  if (!raw) return null;
  const s = unseal(raw);
  if (!s || !s.access_token || (s.expires_at && Date.now() > s.expires_at)) return null;
  return s;
}

// ── HTTP helpers ──
function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}

async function tiktokFetch(path, accessToken, opts = {}) {
  const r = await fetch(API + path, {
    method: opts.method || 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: opts.body === undefined ? (opts.method === 'GET' ? undefined : '{}') : JSON.stringify(opts.body),
  });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
}

function requireSession(req, res) {
  const s = getSession(req);
  if (!s) {
    json(res, 401, { error: { code: 'not_logged_in', message: 'Please log in with TikTok first.' } });
    return null;
  }
  return s;
}

module.exports = {
  API, AUTH_URL, SCOPES, SESSION_COOKIE, STATE_COOKIE,
  env, baseUrl, redirectUri, parseCookies, cookie, addCookie,
  seal, unseal, getSession, json, readJson, tiktokFetch, requireSession,
};
