// GET  /api/event?id=<id>            -> one published event: teams, rosters, stages, matches
//                                       (public, cached at the edge for a few seconds)
// POST /api/event { id, doc }        -> the tournament tool publishes an event (needs the publish key)
// POST /api/event { id, remove: true } -> the event was switched off in the tool

const { redis, authorized, handler, HttpError } = require('./_store');

const ID = /^[A-Za-z0-9_-]{1,64}$/;
// Vercel functions accept and return at most 4.5 MB.
const MAX_BYTES = 4_000_000;

module.exports = handler(['GET', 'POST'], async (req, res) => {
  if (req.method === 'GET') {
    const id = String(req.query.id || '');
    if (!ID.test(id)) throw new HttpError(400, 'invalid_id');
    const doc = await redis('GET', `event:${id}`);
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
  if (!body || typeof body !== 'object' || !ID.test(String(body.id || ''))) throw new HttpError(400, 'invalid_body');
  if (body.remove) {
    await redis('DEL', `event:${body.id}`);
    return res.status(200).json({ ok: true });
  }
  const doc = body.doc;
  if (!doc || doc.v !== 2 || !doc.event || doc.event.id !== body.id || !Array.isArray(doc.stages) || !Array.isArray(doc.teams)) throw new HttpError(400, 'invalid_event');
  const text = JSON.stringify(doc);
  if (text.length > MAX_BYTES) throw new HttpError(413, 'event_too_large');
  await redis('SET', `event:${body.id}`, text);
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ ok: true });
});
