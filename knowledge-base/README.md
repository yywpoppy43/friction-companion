# The Composition Engine

The runtime interior of the three-axis knowledge base: **Concept × Type × Lens**.

| File | What it is |
|---|---|
| `The_Composition_Engine.html` | The specialist version. One self-contained file — open it straight from the filesystem, or drop this folder on any static host unchanged. No build step, no dependencies beyond the fonts already in use. |
| `The_Field_Guide.html` | The reader-facing version, v1: enter through a type, read its material as a guided journey, switch the language with one control. Same data, same composition rules, phone-friendly, fonts embedded (fully self-contained — no network needed at all). |
| `The_Field_Guide_II.html` | The reader-facing version, v2, built to `FIELD_GUIDE_SPEC.md`: the Moment as a walkable four-step scene with one or two people plugged in (placement of authored text only — nothing generated about the pair), the nine doors as the tradition's 3×3 map, all nine levels as a light-to-dark spectrum with clinical territory marked from level 7 (no diagnostic labels), and per-type centre-sibling contrasts quoted from the sources. Fully self-contained. |
| `The_Field_Guide_III.html` | v3 ("Guide 3"): everything in v2 plus **The Loop**. In two-people mode the Moment inserts a circuit between the Flinch and the Anchor: a drawn diagram where each person's arrow is their authored mode (`moving against` / `moving away` / `moving toward …`), feeding the other's verbatim `filter` — the filter being authored precisely as "how any input gets converted into threat", and the other person's move being the input. Where the sources themselves draw a pair contrast (exactly seven pairs: 5-7, 3-9, 2-3, 3-4, 2-4, 5-6, 6-7), the authored quote surfaces; same-centre pairs get their shared problem line. The circuit's counter-statement is the authored "Not two systems merging — two systems each finding their own ground, together." No pair-specific text is generated anywhere, and there are no compatibility claims — the data contains none, so the product makes none. |
| `grid_data.json` | The authored **Concept × Lens** face: thirteen universal concepts (nine core systems, four relational mechanics), each in five lenses, each carrying its register (`established` / `model`). |
| `types_data.json` | The authored **Concept × Type** face: the nine defenses, field by field. `_meta.parents` is the joint — it maps each type-field to its universal concept. |
| `arrows_data.json` | Validated research face ([STRUCTURE], Riso-Hudson): each type's Direction of Integration (growth) and Disintegration (stress), canon-checked and circuit-verified. Feeds Guide III's "Where it moves". |
| `wings_data.json` | Validated research face ([STRUCTURE], Riso-Hudson): the 18 wing subtypes, names canon-checked. Feeds Guide III's "The two flavors". |
| `anchor_protocol_data.json` | Validated research face (evidence-tiered, meta-analysis/RCT-cited): three mid-conversation down-regulation steps. Feeds Guide III's "Do this now" card at the Anchor step. |
| `subtypes_data.json` | Validated research face ([STRUCTURE], Naranjo/Chestnut with Riso-Hudson divergences preserved): the 27 instinctual subtypes with the canonical countertype set. Feeds Guide III's "The three instincts". |
| `pairs_data.json` | Validated research face ([STRUCTURE], Riso-Hudson/Enneagram Institute): all 45 type combinations — what each brings, where it rubs; repair empty because the source has none. Feeds Guide III's "This pairing" card in the Loop. |

The interior of the cube — *this concept, for this type, in this lens* — is never
authored. Given `(concept, type, lens)` the engine composes the cell at runtime:
the universal statement anchors it, the type supplies the content, the lens supplies
the vocabulary, and every output shows the two source cells that fed it.

Rules the engine enforces:

- **The weaker register always wins.** Type material is the tradition's own account,
  so nothing composed is ever shown as established; if the universal side is a model,
  that caveat rides along too.
- **No composed cell predicts a body.** The scientific lens carries the universal
  physics only; the type contributes what sets it off, never a measured quantity.
- **Centre × mode is a coherence check, never a generator** — nothing is derived from it.
- **Attribution stays out of the output**, and the vertical's clinical range
  (Levels 7–9) is not composed at all.

## Data loading

When served over HTTP the app fetches the two JSON files live, so edits to them are
picked up on reload. Opened from `file://` (where fetch is blocked), it falls back to
an embedded snapshot of the same data; the stamp next to the tabs says which source is
active. After editing either JSON, refresh the snapshot so the two stay in step:

```bash
python3 - <<'EOF'
import re
h = open('The_Composition_Engine.html').read()
for fid, path in (('grid', 'grid_data.json'), ('types', 'types_data.json')):
    j = open(path).read().strip()
    assert re.search(r'</script', j, re.I) is None
    h = re.sub(r'(<script type="application/json" id="%s-embed">).*?(</script>)' % fid,
               lambda m: m.group(1) + j + m.group(2), h, count=1, flags=re.S)
open('The_Composition_Engine.html', 'w').write(h)
EOF
```
