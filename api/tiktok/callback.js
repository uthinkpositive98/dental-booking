// GET /api/tiktok/callback?code=...&state=...  → exchanges the code for an access token
const t = require('../_lib/tiktok');

function back(res, query) {
  res.statusCode = 302;
  res.setHeader('Location', `/tiktok/${query ? '?' + query : ''}`);
  res.end();
}

module.exports = async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const err = url.searchParams.get('error');
  const savedState = t.parseCookies(req)[t.STATE_COOKIE];
  t.addCookie(res, t.cookie(t.STATE_COOKIE, '', 0));

  if (err) return back(res, 'error=' + encodeURIComponent(url.searchParams.get('error_description') || err));
  if (!code || !state || state !== savedState) return back(res, 'error=' + encodeURIComponent('Invalid login state. Please try again.'));

  try {
    const r = await fetch(`${t.API}/v2/oauth/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cache-Control': 'no-cache' },
      body: new URLSearchParams({
        client_key: t.env('TIKTOK_CLIENT_KEY'),
        client_secret: t.env('TIKTOK_CLIENT_SECRET'),
        code,
        grant_type: 'authorization_code',
        redirect_uri: t.redirectUri(req),
      }),
    });
    const tok = await r.json();
    if (!tok.access_token) {
      return back(res, 'error=' + encodeURIComponent(tok.error_description || tok.error || 'Token exchange failed'));
    }
    const session = {
      access_token: tok.access_token,
      refresh_token: tok.refresh_token,
      open_id: tok.open_id,
      scope: tok.scope,
      expires_at: Date.now() + (tok.expires_in || 86400) * 1000,
    };
    t.addCookie(res, t.cookie(t.SESSION_COOKIE, t.seal(session), tok.expires_in || 86400));
    back(res, 'connected=1');
  } catch (e) {
    back(res, 'error=' + encodeURIComponent(e.message));
  }
};
