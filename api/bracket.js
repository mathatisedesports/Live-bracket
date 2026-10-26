// GET  /api/bracket  -> the published bracket (public, cached at the edge for a few seconds)
// POST /api/bracket  -> the tournament tool publishes a new bracket (needs the publish key)
//                       { ping: true } only checks the key and the storage.

const { redis, authorized, handler, HttpError } = require('./_store');

const KEY = 'bracket:doc';
const MAX_BYTES = 2_000_000;

module.exports = handler(['GET', 'POST'], async (req, res) => {
  if (req.method === 'GET') {
    const doc = await redis('GET', KEY);
    if (!doc) {
      res.setHeader('Cache-Control', 'public, s-maxage=5');
      return res.status(404).json({ ok: false, error: 'not_published' });
    }
    // Every viewer polls; the edge answers most of them, so storage is read about once every few seconds.
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3, stale-while-revalidate=30');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).send(doc);
  }

  if (!authorized(req)) throw new HttpError(401, 'bad_publish_key');
  const body = req.body;
  if (!body || typeof body !== 'object') throw new HttpError(400, 'invalid_body');
  if (body.ping) {
    await redis('PING');
    return res.status(200).json({ ok: true });
  }
  if (body.v !== 1 || !body.stage || !Array.isArray(body.stage.rounds)) throw new HttpError(400, 'invalid_bracket');
  const text = JSON.stringify(body);
  if (text.length > MAX_BYTES) throw new HttpError(413, 'bracket_too_large');
  await redis('SET', KEY, text);
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ ok: true });
});
