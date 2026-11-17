// POST /api/tiktok/init  → Direct Post: initialise a video post (FILE_UPLOAD) and get an upload_url
const t = require('../_lib/tiktok');

const PRIVACY = ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'FOLLOWER_OF_CREATOR', 'SELF_ONLY'];
const MB = 1024 * 1024;

// TikTok rules: videos <5MB go as one chunk of the whole file; chunks are otherwise 5–64MB,
// total_chunk_count = floor(size / chunk_size) and the last chunk absorbs the remainder.
function chunking(size) {
  const chunk = 10 * MB;
  if (size < chunk) return { chunk_size: size, total_chunk_count: 1 };
  return { chunk_size: chunk, total_chunk_count: Math.floor(size / chunk) };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return t.json(res, 405, { error: { message: 'POST only' } });
  const s = t.requireSession(req, res);
  if (!s) return;

  let b;
  try { b = await t.readJson(req); } catch { return t.json(res, 400, { error: { message: 'Invalid JSON' } }); }

  const size = Number(b.video_size);
  if (!size || size <= 0) return t.json(res, 400, { error: { message: 'video_size is required' } });
  if (!PRIVACY.includes(b.privacy_level)) return t.json(res, 400, { error: { message: 'Please choose a privacy level' } });
  if (b.consent !== true) return t.json(res, 400, { error: { message: 'User consent is required before posting' } });
  if (b.brand_content_toggle && b.privacy_level === 'SELF_ONLY') {
    return t.json(res, 400, { error: { message: 'Branded content cannot be private' } });
  }

  const { chunk_size, total_chunk_count } = chunking(size);
  const body = {
    post_info: {
      title: String(b.title || '').slice(0, 2200),
      privacy_level: b.privacy_level,
      disable_comment: !b.allow_comment,
      disable_duet: !b.allow_duet,
      disable_stitch: !b.allow_stitch,
      brand_content_toggle: !!b.brand_content_toggle,
      brand_organic_toggle: !!b.brand_organic_toggle,
    },
    source_info: { source: 'FILE_UPLOAD', video_size: size, chunk_size, total_chunk_count },
  };

  const r = await t.tiktokFetch('/v2/post/publish/video/init/', s.access_token, { body });
  const err = r.data.error || {};
  if (err.code && err.code !== 'ok') return t.json(res, 400, { error: err });
  t.json(res, 200, { ...r.data.data, chunk_size, total_chunk_count });
};
