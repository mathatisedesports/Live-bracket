# Mathatised Live Bracket — public tournament site

A public, read-only site for your tournaments, for sharing in Discord. It lists every
event you switch on in the tool (live, upcoming and past), and for each event shows:

* **Overview** —  format, the path through the stages and who went through, live now, up next, latest results.
* **Matches** — every match, filterable by stage, team and live / upcoming / results; click one for the score of every game.
* **Teams** — every team with its roster (players, substitutes, staff) and its matches and run through the tournament.
* **Each stage** — group tables with qualification colours, two-legged ties with the aggregate, and the bracket.

The Mathatised Tournament Platform publishes everything here automatically within a few
seconds of every change. Viewers can't change anything.

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
1. In the tournament tool: **Public Site → Generate**, then **Copy**.
2. In Vercel: **Settings → Environment Variables → Add**: name `PUBLISH_KEY`, value = the
   copied key, all environments, **Save**.
3. **Deployments → ⋯ on the latest deployment → Redeploy** (so the new settings apply).

### 5. Switch it on in the tool
1. **Public Site**: paste the Vercel address into *Site address*.
2. **Test connection** — it should say *Connected*.
3. **Start publishing**, then switch on the events to show under *Events on the site*.
   Share the address in Discord (each event also has its own link: *Copy link*).

From then on everything is automatic: results, schedules, teams, rosters, new stages,
logos and colours appear within a few seconds. Switching an event off removes it from
the site. If the PC is off or offline, the site keeps showing the last published state
and catches up when the tool is back.

## Updating the site
When a new version of the tool changes this site, run `npm run build:site` in the tool's
folder and upload the new files to the repository the same way (Vercel redeploys by itself).

## What's in here
* `index.html`, `app.js`, `app.css`, `fonts/` — the site (polls `/api/site` and `/api/event` every few seconds).
* `api/site.js` — the list of published events (public read, edge-cached for 3 s; writes need the key).
* `api/event.js` — one event: teams, rosters, stages and matches (public read, edge-cached for 3 s; writes need the key).
* `api/logo.js` — team, tournament and player images (cached for a year; writes need the key).
* What is published: tournament and stage details, teams (no MMR), players' gamer name,
  country, role and photo only, matches and scores. No admin data, real names, player IDs,
  ranks, MMR, socials of players or private notes.
* `api/bracket.js` from older versions is no longer used; you can delete it from the repository.
