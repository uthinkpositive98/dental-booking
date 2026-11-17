// PUT /api/tiktok/upload  → relays ONE chunk to TikTok's upload_url.
// Used as a fallback for small videos (<4MB) if the browser cannot PUT to TikTok directly.
// (Vercel limits function request bodies to ~4.5MB.)
const t = require('../_lib/tiktok');

module.exports = async (req, res) => {
  if (req.method !== 'PUT') return t.json(res, 405, { error: { message: 'PUT only' } });
  if (!t.requireSession(req, res)) return;

  const target = req.headers['x-upload-url'];
  let u;
  try { u = new URL(target); } catch { return t.json(res, 400, { error: { message: 'Bad upload url' } }); }
  if (u.protocol !== 'https:' || !/(^|\.)tiktokapis\.com$/.test(u.hostname)) {
    return t.json(res, 400, { error: { message: 'Upload url must be a TikTok url' } });
  }

  const chunks = [];
  for await (const c of req) chunks.push(c);
  const data = Buffer.concat(chunks);

  const r = await fetch(u.toString(), {
    method: 'PUT',
    headers: {
      'Content-Type': req.headers['content-type'] || 'video/mp4',
      'Content-Length': String(data.length),
      'Content-Range': req.headers['x-content-range'],
    },
    body: data,
  });
  t.json(res, r.ok ? 200 : r.status, { status: r.status, body: await r.text().catch(() => '') });
};

module.exports.config = { api: { bodyParser: false } };
