// GET  /api/logo?h=<hash>          -> a team/tournament logo (cached for a year: the hash is its content)
// POST /api/logo { check: [hash] } -> which of these logos the site does not have yet
// POST /api/logo { hash, mime, data } -> store one logo (base64), needs the publish key

const { redis, pipeline, authorized, handler, HttpError } = require('./_store');

const HASH = /^[a-f0-9]{16,64}$/;
const MAX_BYTES = 3_000_000;

module.exports = handler(['GET', 'POST'], async (req, res) => {
  if (req.method === 'GET') {
    const h = String(req.query.h || '');
    if (!HASH.test(h)) throw new HttpError(400, 'invalid_hash');
    const raw = await redis('GET', `logo:${h}`);
    if (!raw) throw new HttpError(404, 'not_found');
    const { mime, data } = JSON.parse(raw);
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // SVG logos are allowed but can never run anything, even when opened directly.
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox");
    return res.status(200).send(Buffer.from(data, 'base64'));
  }

  if (!authorized(req)) throw new HttpError(401, 'bad_publish_key');
  const body = req.body || {};
  if (Array.isArray(body.check)) {
    const hashes = body.check.filter((h) => HASH.test(String(h))).slice(0, 200);
    const exists = hashes.length ? await pipeline(hashes.map((h) => ['EXISTS', `logo:${h}`])) : [];
    return res.status(200).json({ ok: true, missing: hashes.filter((_, i) => !exists[i]) });
  }
  const { hash, mime, data } = body;
  if (!HASH.test(String(hash))) throw new HttpError(400, 'invalid_hash');
  if (!/^image\/(png|jpeg|webp|gif|svg\+xml)$/.test(String(mime))) throw new HttpError(400, 'unsupported_image');
  if (typeof data !== 'string' || data.length * 0.75 > MAX_BYTES) throw new HttpError(413, 'logo_too_large');
  await redis('SET', `logo:${hash}`, JSON.stringify({ mime, data }), 'NX');
  return res.status(200).json({ ok: true });
});
