# The Counter-Roll

A small personal instrument for one owner. Two instruments and one person-model:

- **The sort** places any structure in a person's life (a rule, a routine, a plan, a promise, a standard) on a map and splits the alarm the person feels into three measured layers: what the structure warrants, what the person's converter adds, and the remainder.
- **The examiner** logs each miss as one rep and times the second sentence.
- **The converter** is the person-model both instruments read from and write to.

The scoring model lives in [`model/sort-algorithm.mjs`](model/sort-algorithm.mjs). Every number on screen comes from it. The brief is [`HANDOFF.md`](HANDOFF.md); the single-file prototype it replaces is in [`reference/`](reference/).

## Screens

| route | screen |
|---|---|
| `/converter` | the four converter questions; each save is a new version |
| `/place` | name a structure, answer the seven dimensions, set felt; live map, equation, gauge, verdict |
| `/rebuild/[id]` | toggle each dimension of a placed structure and watch the dot travel; save as a rebuilt version linked to the original |
| `/log` | every placement, newest first; remainder over time per structure; re-run under any weight version |
| `/pattern` | `pattern()` across placements, plus mean remainder by level per dimension (three placements needed) |
| `/weights` | owner-only sliders for the weights, saved as versions; everything recomputes |
| `/examiner` | log a miss, time the second sentence, see the trend after four reps |
| `/data` | import the old page's browser storage; export JSON and CSV |
| `/mechanism` | the explanatory scenes from the reference page |

## Run it locally

```sh
cd counter-roll
npm install
cp .env.example .env.local     # set OWNER_PASSCODE and AUTH_SECRET
npm run dev                    # http://localhost:3000
```

The database defaults to a SQLite file at `data/local.db`, created and migrated on first request.

```sh
npm test            # model tests (node --test)
npm run typecheck   # next typegen + tsc
npm run build
```

End-to-end acceptance (needs Playwright and a Chromium; run against a server with an empty database):

```sh
OWNER_PASSCODE=... BASE=http://localhost:3000 node e2e/acceptance.cjs
```

It places the five fixtures from the brief and checks their verdicts, exercises every screen at 390px wide, and fails on any horizontal overflow or banned wording (streaks, points, praise, prompts to come back).

## Data

Tables: `owners`, `converter_versions`, `weight_versions`, `structures`, `placements`, `reps`. Every table carries `owner_id`. Placements and reps store raw answers only; scores are computed on read under the weight version asked for (the active one by default). Schema: [`src/db/schema.ts`](src/db/schema.ts). Migrations: [`drizzle/`](drizzle/), generated with `npm run db:generate` and applied automatically when the app starts (also `npm run db:migrate`).

### Import from the old page

On `/data`, copy the snippet shown there, run it in the browser console of the old single-file page, and paste the result. It reads the three keys the page kept (`counter-roll-sort-v3`, `counter-roll-converter-v1`, `counter-roll-examiner-v1`). The import is repeatable; entries already present are skipped.

### Export

`/api/export/json` (everything, with raw answers and scores under the active weights) and `/api/export/csv` (one row per placement).

## Deploy on Vercel

1. Import the repository in Vercel and set **Root Directory** to `counter-roll`. Preview deployments then run on every push.
2. Create a [Turso](https://turso.tech) database (SQLite-compatible, hosted) and set:
   - `DATABASE_URL` = `libsql://<name>-<org>.turso.io`
   - `DATABASE_AUTH_TOKEN` = the database token
   - `OWNER_PASSCODE` = the passcode the owner types on `/login`
   - `AUTH_SECRET` = a long random string (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `NEXT_PUBLIC_TIME_ZONE` = the owner's IANA time zone (optional; dates print in UTC without it)
3. Deploy. Migrations run on the first request. A separate Turso database for previews is a good idea once the app is in daily use.

Any Postgres-backed setup is a schema swap in `src/db/schema.ts` and `drizzle.config.ts`; the app code only talks to Drizzle.

## Auth

Single owner, passcode, signed HttpOnly cookie (90 days). `src/proxy.ts` guards every route except `/login`. The owner id is on every table so a second person is a migration, not a rewrite.

## Fonts and tokens

Instrument Serif (headings), IBM Plex Sans (body), IBM Plex Mono (labels, arithmetic) are self-hosted through `next/font`. Noto Serif SC (the Chinese) loads as a Google Fonts stylesheet so only the slices in use are fetched. Tokens are CSS custom properties in `src/app/globals.css`, light and dark.
