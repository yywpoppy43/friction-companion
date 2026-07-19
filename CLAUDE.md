# Working in this repo

## Who you're working with

The repository owner is not a technical person. Communicate accordingly:

- Structure every reply with a `## Start here` section at the top in simple,
  non-technical language, and end with a short `## What I did, in plain words`
  summary. Technical detail goes in between, clearly skippable.
- Whenever you build or change anything the owner can look at (a page, an app,
  a document), publish it as an artifact and **send the link proactively** —
  never make the owner ask for it.
- When the owner asks for a new or different version of something, **keep the
  existing artifact and its URL untouched** and publish the new version at a
  new URL, so versions can be compared side by side. Never overwrite or retire
  an old version unless explicitly told to.
- When the owner asks for "the app" or "the code", produce two files and send
  both: a short plain-language explainer (no code), and a full review bundle
  (explainer + complete code + data) that can be handed to another Claude chat
  for review.

## The knowledge-base deliverables (`knowledge-base/`)

Two versions of the same product, same data, same rules — different audiences.
Keep them side by side; neither replaces the other.

| File | Audience | Live link |
|---|---|---|
| `The_Composition_Engine.html` | Specialist: three selectors, source cells, registers, grid sheets | https://claude.ai/code/artifact/84553294-5b0f-4265-8904-933d68e7cbb9 |
| `The_Field_Guide.html` | Reader/presenter, v1: enter through a type, guided journey, language switcher, phone-friendly | https://claude.ai/code/artifact/c2f36d0d-6a64-4ba5-9461-7299a3fc1ae1 |
| `The_Field_Guide_II.html` | Reader/presenter, v2 (built to `FIELD_GUIDE_SPEC.md`): the Moment with who's-in-the-room (0/1/2 people), 3×3 door map, nine-level spectrum with the clinical edge marked, centre-sibling contrasts | https://claude.ai/code/artifact/5bfca5bd-ec99-4992-a2f7-13bbd8ce66c1 |
| `The_Field_Kit.html` | Practical layer: Before/During/After a hard conversation — pocket brief, breath-pacer steady mode, walk-it-back prompts. Everyday language only. | https://claude.ai/code/artifact/ae7ffb4d-bdc2-4314-ab98-4390f62b746e |
| `The_Field_Guide_III.html` | Reader/presenter, v3 ("Guide 3"): everything in v2 plus **The Loop** — in two-people mode the Moment draws the circuit between the two defenses (each one's authored mode-move is the other's filter's input), with the seven source-drawn pair contrasts surfacing. No pair-specific text is ever generated; no compatibility claims. | https://claude.ai/code/artifact/100ea721-39c2-41e0-ab68-558fa3e19246 |
| `The_Mix.html` | The resonance walk, first build (spec §20) — superseded by The Mix II after the owner's voice ruling ("verbatim cards are too stiff; they/you gets mixed up"); kept per the versioning rule. | https://claude.ai/code/artifact/1bb8ef18-f28a-4de1-8138-a8724206a13d |
| `The_Mix_II.html` | The resonance walk, second build (spec §22): same architecture — twelve blind choices, equal exposure, wince, mirror, **reading order never a verdict**, nothing stored — but every card is now a short restatement of exactly one authored line, first-person for the walker, third-person for the mirror pass; the receipt names each card's source line. | https://claude.ai/code/artifact/ad8fa52d-e2a2-4152-9845-8b620d58aaed |

Both compose at runtime from `grid_data.json` (Concept × Lens) and
`types_data.json` (Concept × Type, joined by `_meta.parents`). Guide III additionally
reads `arrows_data.json`, `wings_data.json`, `anchor_protocol_data.json`,
`subtypes_data.json` and `pairs_data.json` — all five validated faces from the
`knowledge-base/RESEARCH_PROMPTS.md` pipeline, now complete — the pairs face now also
carries `repair_daniels`, the validated David Daniels second-school layer (spec §21),
shown in Guide III as a separately-labeled block, never blended. The Mix reads the
types face only; The Mix II is self-contained (its cards are spec-governed
restatements, one source line each — spec §22). `knowledge-base/Source_Ledger.md` (owner's attribution record, with a
build-side addendum) is committed as the future data behind the Composition Engine's
sources panel — attribution stays in a panel, never in spoken output. The authored faces were
revised upstream 2026-07-19 ("The Baseline" rename, sourced mode glosses, zero
model-tier cells, seven-movement type-page order — see FIELD_GUIDE_SPEC.md §18);
Guide III is synced; the CE and Guides I/II embed earlier snapshots as historical
versions. The "vagal tone"
precision fix is applied everywhere (spec §17); one deferred owner option is recorded
there (second-school repair content for the pairs face). The interior of
the Concept × Type × Lens cube is never authored. The non-negotiable rules
(weaker register wins; no body predictions; centre × mode generates nothing;
attribution stays in the ledger; the clinical vertical is out of reach) are
documented in `knowledge-base/README.md` and in the comment at the top of each
HTML file — read those before touching anything in that folder.

Artifact hosting blocks outside font/network requests, so artifact copies must
embed fonts as data URIs and carry embedded data snapshots. The repo copies are
canonical.
