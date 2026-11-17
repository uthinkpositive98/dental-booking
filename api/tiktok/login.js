// GET /api/tiktok/login  → redirects the user to TikTok's OAuth consent screen
const crypto = require('crypto');
const t = require('../_lib/tiktok');

module.exports = (req, res) => {
  try {
    const state = crypto.randomBytes(16).toString('hex');
    t.addCookie(res, t.cookie(t.STATE_COOKIE, state, 600));
    const url = new URL(t.AUTH_URL);
    url.searchParams.set('client_key', t.env('TIKTOK_CLIENT_KEY'));
    url.searchParams.set('scope', t.SCOPES);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('redirect_uri', t.redirectUri(req));
    url.searchParams.set('state', state);
    res.statusCode = 302;
    res.setHeader('Location', url.toString());
    res.end();
  } catch (e) {
    t.json(res, 500, { error: { code: 'config', message: e.message } });
  }
};
