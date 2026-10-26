// Shared helpers for the public bracket site: a tiny Upstash Redis REST client
// (no dependencies) and the publish-key check. Files starting with "_" are not
// exposed as endpoints by Vercel.

const crypto = require('node:crypto');

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';

class HttpError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

async function call(path, body) {
  if (!REDIS_URL || !REDIS_TOKEN) throw new HttpError(503, 'storage_not_configured');
  const r = await fetch(REDIS_URL.replace(/\/$/, '') + path, {
    method: 'POST',
    headers: { authorization: `Bearer ${REDIS_TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new HttpError(502, `storage_error: ${j.error || r.status}`);
  return j;
}

/** One Redis command, e.g. redis('GET', 'key'). */
async function redis(...command) {
  return (await call('', command)).result;
}

/** Several commands in one request; returns their results in order. */
async function pipeline(commands) {
  const out = await call('/pipeline', commands);
  return out.map((x) => x.result);
}

/** The tool sends "Authorization: Bearer <PUBLISH_KEY>"; compared in constant time. */
function authorized(req) {
  const key = process.env.PUBLISH_KEY || '';
  const given = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (key.length < 16 || given.length !== key.length) return false;
  return crypto.timingSafeEqual(Buffer.from(given), Buffer.from(key));
}

/** Wraps a handler: JSON errors, and only the listed methods. */
function handler(methods, fn) {
  return async (req, res) => {
    try {
      if (!methods.includes(req.method)) throw new HttpError(405, 'method_not_allowed');
      await fn(req, res);
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500;
      res.setHeader('Cache-Control', 'no-store');
      res.status(status).json({ ok: false, error: e instanceof HttpError ? e.code : 'server_error' });
    }
  };
}

module.exports = { redis, pipeline, authorized, handler, HttpError };
