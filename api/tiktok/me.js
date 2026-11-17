// GET /api/tiktok/me  → connected account (user.info.basic) + latest creator info for Direct Post
const t = require('../_lib/tiktok');

module.exports = async (req, res) => {
  const s = t.getSession(req);
  if (!s) return t.json(res, 200, { connected: false });

  const [user, creator] = await Promise.all([
    t.tiktokFetch('/v2/user/info/?fields=open_id,avatar_url,display_name', s.access_token, { method: 'GET' }),
    t.tiktokFetch('/v2/post/publish/creator_info/query/', s.access_token),
  ]);

  if (user.status === 401 || (user.data.error && user.data.error.code === 'access_token_invalid')) {
    t.addCookie(res, t.cookie(t.SESSION_COOKIE, '', 0));
    return t.json(res, 200, { connected: false });
  }

  t.json(res, 200, {
    connected: true,
    scope: s.scope,
    user: (user.data && user.data.data && user.data.data.user) || null,
    creator: (creator.data && creator.data.data) || null,
    creator_error: creator.data && creator.data.error && creator.data.error.code !== 'ok' ? creator.data.error : null,
  });
};
