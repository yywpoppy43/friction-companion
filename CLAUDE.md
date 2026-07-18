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
| `The_Field_Guide_III.html` | Reader/presenter, v3 ("Guide 3"): everything in v2 plus **The Loop** — in two-people mode the Moment draws the circuit between the two defenses (each one's authored mode-move is the other's filter's input), with the seven source-drawn pair contrasts surfacing. No pair-specific text is ever generated; no compatibility claims. | https://claude.ai/code/artifact/100ea721-39c2-41e0-ab68-558fa3e19246 |

Both compose at runtime from `grid_data.json` (Concept × Lens) and
`types_data.json` (Concept × Type, joined by `_meta.parents`). The interior of
the Concept × Type × Lens cube is never authored. The non-negotiable rules
(weaker register wins; no body predictions; centre × mode generates nothing;
attribution stays in the ledger; the clinical vertical is out of reach) are
documented in `knowledge-base/README.md` and in the comment at the top of each
HTML file — read those before touching anything in that folder.

Artifact hosting blocks outside font/network requests, so artifact copies must
embed fonts as data URIs and carry embedded data snapshots. The repo copies are
canonical.
