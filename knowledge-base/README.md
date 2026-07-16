# The Composition Engine

The runtime interior of the three-axis knowledge base: **Concept × Type × Lens**.

| File | What it is |
|---|---|
| `The_Composition_Engine.html` | The deliverable. One self-contained file — open it straight from the filesystem, or drop this folder on any static host unchanged. No build step, no dependencies beyond the fonts already in use. |
| `grid_data.json` | The authored **Concept × Lens** face: thirteen universal concepts (nine core systems, four relational mechanics), each in five lenses, each carrying its register (`established` / `model`). |
| `types_data.json` | The authored **Concept × Type** face: the nine defenses, field by field. `_meta.parents` is the joint — it maps each type-field to its universal concept. |

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
