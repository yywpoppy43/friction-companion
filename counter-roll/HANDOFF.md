# The Counter-Roll — build brief

You are building a small personal instrument for one owner, later possibly for more people. It has two instruments and one person-model. The sort places any structure in a person's life (a rule, a routine, a plan, a promise, a standard) on a map and splits the alarm the person feels into three measured layers. The examiner logs each miss as one rep and times the second sentence. Both read from and write to the same person-model: the converter. Everything is kept over time and the pattern across entries is shown. The scoring model already exists and is tested. Your job is the product around it.

Working title: The Counter-Roll. Two files sit beside this brief and are the source of truth for all arithmetic:

- `sort-algorithm.mjs` — the model. Import it. Do not re-derive any number in UI code.
- `sort-algorithm.test.mjs` — thirteen passing tests. Keep them passing. Add tests for anything you add.

A reference page exists with the current interactive version of every scene and instrument. It is a single HTML file the owner will provide. Treat its wording, vocabulary, tokens and interaction design as the spec for look and feel; treat its JavaScript as a prototype to be replaced by components that import the model file.

## The model in one paragraph

A structure is control to the degree it holds a copy of the person rather than a form for an act, and to the degree its terms were set for the person rather than by them. Seven dimensions measure the structure (`DIMS`), producing copy-share and imposed-share and a warranted alarm on a 0–10 scale. Four questions measure the person's converter (`CONVERTER`): the reflex that turns a miss into a statement about the self. The converter adds its share of the room above the warranted alarm. The person reports the felt alarm. Felt minus warranted minus the converter's share is the remainder: what neither layer explains. Across placements, `pattern()` names which knot the remainder follows.

## Non-negotiables

1. Every number on screen is produced by `sort-algorithm.mjs`. The arithmetic is shown next to every verdict, in full, as the current page does.
2. The instrument asks. It never tells. No streaks, points, badges, nudges, or re-engagement loops. A missed day is not a state the app has.
3. A miss cannot be failed. There is no red state for the person. Red is reserved for the copy/correction concept in the diagrams.
4. Weights are editable by the owner and versioned. Changing weights recomputes all displays live; stored placements keep their raw answers so any version of the weights can be re-run on them. Never store only computed scores.
5. Plain language. Short sentences. The vocabulary is fixed: form, copy, converter, warranted, felt, remainder, trellis, mold, inner mold, cage, rung. No clinical labels on screen.
6. Chinese characters appear exactly where the current page uses them (自责 / 自省, 从心所欲不逾矩, 矩) with the plain English beside them. Nowhere else.

## Phase 1 — the instrument, single owner

Screens:

1. **Converter** — the four `CONVERTER` questions, answered once, editable later. Each edit creates a new converter version with a timestamp; placements record which version was active. Shows strength `k`, its label, and the arithmetic.
2. **Place** — name the structure, answer the seven `DIMS` questions, set felt (0–10). Live: the map dot moves as answers change; the equation prints; the layered gauge shows structure (black), converter (copper), felt (teal mark). Verdict, rung, and "what moves it" appear once all seven are answered.
3. **Rebuild** — for any placed structure, toggle each dimension and watch the dot travel and the layers change. This is the "walk out" view. Save a rebuilt version as a new placement linked to the original.
4. **Log** — every placement, newest first, with verdict and remainder. A structure placed more than once shows its remainder over time as a small line. The one measure that matters over months is this line falling for the same structure.
5. **Pattern** — `pattern()` output: the sentence plus the rows, and a per-dimension breakdown of mean remainder by level. Visible once three placements exist.
6. **Weights** — owner-only. Sliders for the seven dimension weights, the four converter weights, and the 55/45 split, constrained to sum to one per side. Save as a version. Everything recomputes.
7. **Examiner** — log a miss: the act (text), the first sentence's level (`EXAMINER_LEVELS`), its words (optional), the translation (two fields: the act, the adjustment), what the miss did not touch (`EXAMINER_GROUNDS`). A timer starts when the level is chosen and stops on "second sentence done"; the elapsed seconds are the latency. Shows `examinerTrend()` once four reps exist: two lines, level and latency, over reps. A link re-opens the Converter screen to re-measure.
8. **Mechanism** — the explanatory scenes from the reference page, ported as interactive components: the door, the taste, the converter, two childhoods, the rope, the way out, grounds. These are the "why" the instruments rest on. Same tokens, same words. They are not onboarding and must not gate the instruments.

Data:

- Tables: `owners`, `converter_versions` (owner, answers JSON, k, created_at), `weight_versions` (owner, weights JSON, created_at), `structures` (owner, name, created_at), `placements` (owner, structure_id, answers JSON, felt, converter_version_id, weight_version_id, parent_placement_id nullable, created_at), `reps` (owner, act, verbatim nullable, level, act_translation, adjustment, ground, latency_sec, converter_version_id, created_at). Computed scores are derived, never the only stored form.
- Import: accept the JSON that the current page keeps in the browser under `counter-roll-sort-v3`, `counter-roll-converter-v1` and `counter-roll-examiner-v1`, so existing entries carry over.
- Export: JSON and CSV of all placements with raw answers and computed scores under the active weights.

Stack and deploy:

- Next.js with TypeScript, App Router, no CSS framework; design tokens as CSS custom properties (paper, ink, copper, teal, gold, light and dark). Fonts: Instrument Serif for headings, IBM Plex Sans for body, IBM Plex Mono for labels and arithmetic, Noto Serif SC for the Chinese.
- Database: Postgres through the hosting provider's managed option, or SQLite-compatible hosted storage if simpler; either is fine for a single owner. Use a migration tool from day one.
- Auth: single owner for phase 1, a passcode or magic link. Build the owner id into every table now so multi-user is a migration, not a rewrite.
- Deploy to Vercel with preview deployments on every push. The owner tests from a phone; every screen must work at 390px wide.

Acceptance:

- `node --test` passes, including new tests for import, weight versioning, and recompute.
- Placing the five fixtures below yields the stated verdicts under default weights.
- Re-running an old placement under a new weight version changes its displayed numbers and leaves its stored answers untouched.
- No screen contains a streak, a score for the person, or a prompt to come back.

Fixtures (default weights, converter not set):

| structure | object | miss | scope | reason | author | exit | grain | verdict |
|---|---|---|---|---|---|---|---|---|
| weekly class | 0 | 0 | 0 | 0 | 0.45 | 0 | 0 | Trellis |
| daily feelings check-in proposed by a friend | 0.5 | 0.6 | 0.5 | 0 | 0.45 | 1 | 1 | Trellis with a mold in it |
| the exam's standard answer | 1 | 1 | 1 | 1 | 1 | 1 | 1 | Mold |
| my cold-turkey rule | 1 | 0.6 | 0.5 | 0 | 0 | 1 | 1 | Inner mold |
| a schedule handed to me without asking | 0 | 0 | 0 | 1 | 1 | 0.4 | 1 | Cage |

## Phase 2 — once phase 1 is in daily use

1. **One-sentence placement.** The person types one sentence describing a structure. A model call proposes the seven answers with a one-line reason each. The person edits before placing. Proposed answers are marked as proposed until confirmed. Use the Anthropic API server-side; never ship the key to the client.
2. **The witness.** A weekly summary, generated server-side, of what was placed, what moved, and which knot the pattern names. Delivered as a page the person opens, not a notification.
3. **Rough-grain prompt.** An optional, owner-enabled, once-a-week question: "Anything to place?" Yes or no are both complete answers. No follow-up if no.
4. **Second person.** Invite one other person. Their converter, placements and pattern are theirs alone; the owner sees nothing of them unless they share a placement by link.

## What not to build

- No coaching text beyond the verdict strings in the model file.
- No body or breath instructions anywhere.
- No gamification, no reminders by default, no social feed.
- No chart that the model file cannot produce the numbers for.

## Build order

Scaffold → tokens and type → import the model file and wire tests into CI → Converter screen → Place screen with live map, equation and gauge → Examiner → Log → Pattern → Rebuild → Weights with versioning → import/export → Mechanism scenes → deploy preview → owner test on phone → phase 2 once phase 1 is in daily use.

Ship a preview after the Place screen works. Everything after it is added to a running app, not to a plan.
