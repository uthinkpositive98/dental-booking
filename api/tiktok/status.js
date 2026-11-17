// POST /api/tiktok/status  { publish_id }  → current processing status of a post
const t = require('../_lib/tiktok');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return t.json(res, 405, { error: { message: 'POST only' } });
  const s = t.requireSession(req, res);
  if (!s) return;
  const b = await t.readJson(req).catch(() => ({}));
  if (!b.publish_id) return t.json(res, 400, { error: { message: 'publish_id is required' } });
  const r = await t.tiktokFetch('/v2/post/publish/status/fetch/', s.access_token, { body: { publish_id: b.publish_id } });
  t.json(res, 200, { ...(r.data.data || {}), error: r.data.error });
};
