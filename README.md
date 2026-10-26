# Mathatised Live Bracket

A public, read-only page with your tournament's championship bracket, for sharing
in Discord. The Mathatised Tournament Platform publishes the bracket here
automatically within a few seconds of every result. Viewers can't change anything.

## One-time setup (about 10 minutes)

### 1. Put this folder on GitHub
1. On github.com, create a new repository (e.g. `mathatised-live-bracket`). It can be private.
2. On the empty repository page click **uploading an existing file**, drag **everything
   inside this folder** (including the `api` and `fonts` folders) into the page and click
   **Commit changes**.

### 2. Deploy it on Vercel
1. On vercel.com: **Add New… → Project**, pick the repository, **Import**.
2. Leave every setting as it is (Framework Preset: *Other*) and click **Deploy**.
3. Note the address Vercel gives you, e.g. `https://mathatised-live-bracket.vercel.app`.

### 3. Add the storage (free)
1. In the Vercel project: **Storage → Create Database → Upstash for Redis** (Marketplace),
   choose the free plan and **Connect** it to this project.
   Vercel adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` to the project by itself.

### 4. Add the publish key
1. In the tournament tool: **Brackets → Public bracket link → Generate**, then **Copy**.
2. In Vercel: **Settings → Environment Variables → Add**: name `PUBLISH_KEY`, value = the
   copied key, all environments, **Save**.
3. **Deployments → ⋯ on the latest deployment → Redeploy** (so the new settings apply).

### 5. Switch it on in the tool
1. **Brackets → Public bracket link**: paste the Vercel address into *Site address*.
2. **Test connection** — it should say *Connected*.
3. **Publish this bracket live**. Share the address in Discord.

From then on everything is automatic: results, schedule changes, new rounds, logos
and colours appear on the page within a few seconds. If the PC is off or offline, the
page keeps showing the last published bracket and catches up when the tool is back.

## Updating the page design
When a new version of the tool changes this site, run `npm run build:site` in the tool's
folder and upload the new files to the repository the same way (Vercel redeploys by itself).

## What's in here
* `index.html`, `app.js`, `app.css`, `fonts/` — the page (polls `/api/bracket` every 5 s).
* `api/bracket.js` — the published bracket (public read, edge-cached for 3 s; writes need the key).
* `api/logo.js` — team and tournament logos (cached for a year; writes need the key).
* Only the bracket is published: team names, logos, seeds, scores and times. No admin or player data.
