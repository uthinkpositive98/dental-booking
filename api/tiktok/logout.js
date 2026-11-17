// POST /api/tiktok/logout  → revokes the token and clears the session cookie
const t = require('../_lib/tiktok');

module.exports = async (req, res) => {
  const s = t.getSession(req);
  if (s) {
    try {
      await fetch(`${t.API}/v2/oauth/revoke/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_key: t.env('TIKTOK_CLIENT_KEY'),
          client_secret: t.env('TIKTOK_CLIENT_SECRET'),
          token: s.access_token,
        }),
      });
    } catch { /* ignore */ }
  }
  t.addCookie(res, t.cookie(t.SESSION_COOKIE, '', 0));
  t.json(res, 200, { ok: true });
};
