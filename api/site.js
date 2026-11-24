// GET  /api/site  -> the list of published events (public, cached at the edge for a few seconds)
// POST /api/site  -> the tournament tool publishes the list (needs the publish key)
//                    { ping: true } only checks the key and the storage.

const { redis, authorized, handler, HttpError } = require('./_store');

const KEY = 'site:index';
const MAX_BYTES = 1_000_000;

module.exports = handler(['GET', 'POST'], async (req, res) => {
  if (req.method === 'GET') {
    const doc = await redis('GET', KEY);
    if (!doc) {
      res.setHeader('Cache-Control', 'public, s-maxage=5');
      return res.status(404).json({ ok: false, error: 'not_published' });
    }
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
  if (body.v !== 2 || !Array.isArray(body.events)) throw new HttpError(400, 'invalid_index');
  const text = JSON.stringify(body);
  if (text.length > MAX_BYTES) throw new HttpError(413, 'index_too_large');
  await redis('SET', KEY, text);
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ ok: true });
});
