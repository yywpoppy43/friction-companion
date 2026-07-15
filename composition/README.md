# The Composition Engine

The interior of the Concept × Pattern × Lens cube, composed at runtime from its two authored faces. Nobody writes the interior — that is the whole product.

## What this is

- `grid_data.json` — **Face A**, the Master Translation Grid: 13 concepts × 5 lenses, pattern collapsed to universal.
- `matrix_data.json` — **Face B**, the Archetype Matrix: 9 patterns × 14 layers, lens collapsed. `_meta.grid_concepts` maps each layer to its parent concept(s) in the grid.
- `index.html` — the engine. Given `(concept, pattern, lens)` it returns the composed cell: the universal statement anchors, the lens supplies the vocabulary and audience, the pattern supplies the content. Neither is discarded, and both source cells stay visible under every output.

## The rules the engine enforces

- **Tier inheritance** — `[ESTABLISHED]` > `[STRUCTURE]` > `[MODEL]`. A composed cell inherits the **weakest** tier of its inputs, never the strongest, and the tier selects the grammar: *research shows* / *in Enneagram theory* / *we model this as*. Untagged content counts as `[MODEL]`.
- **Deterministic composition** — every sentence in a composed cell is either verbatim source text from one of the two faces or fixed connective grammar from the engine. The engine can name, frame, and order; it cannot claim. There is no free generation anywhere.
- **The observable filter** — the engine's own vocabulary is scanned for biometric terms at load (part of the self-check). Somatic tells stay observable: visible from across a room, no instrument.
- **The 3×3 as a check, never a generator** — at load the engine verifies every pattern's anchor against the canonical center × mode grid; it derives nothing from it.
- **Honest gaps** — two concepts (The Mental Loop, The Healing) have no matrix layers rolling up to them. Their pattern axis renders as universal-only; nothing is invented to fill it.

## Guardrails

`Source_Enneagram.md` (the fixed pattern anchors) and `Source_Neuroscience.md` (the precision ceiling for any body/brain claim) ship alongside and are rendered in the **Guardrails & self-check** drawer, together with the constraints carried in `matrix_data.json`'s `_meta` and the results of the load-time self-check.

## Running it

- **Static host** — deploy this folder unchanged; `index.html` fetches the two JSON files sitting next to it.
- **Filesystem** — open `index.html` directly; browsers block `fetch()` under `file://`, so the page offers a picker/drop zone for the two JSON files and then runs fully local.
- **Locally with a server** — `python3 -m http.server` in this folder.

No build step, no dependencies beyond the two Google-font families already used by the reference document.

## Internal

This is an internal tool. Pattern numbers, type names, and tier tags appear here so the team can trace and audit compositions; they never appear in anything a person outside the team reads.
