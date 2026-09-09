# BRIEF — one node

An explorer of one person's structure. A whole that can be continuously decomposed into sourced, connected parts, in hideable layers, with isolation and dated deposits.

The subject is one person. The mechanism is what scales: swap the data and it's any person; add a layer and it's their defenses; put two side by side with the interface layer and it's what happens between them.

---

## Read first

- `content-source.md` — the database. Every part, every connection, every source tag. Plain language only. This file is authoritative; the code never contradicts it.
- `explode-prototype.html` — the proof of the central mechanism. Single file, no dependencies. Study how the dial moves wired regions together and lets sealed capacities drift. Keep that behavior exactly; improve everything around it.

## The experience

**First thing seen:** a faint figure with nine parts on it, seven filled and two outlined. A dial along the bottom reads *Assembled* at one end and *Every piece* at the other.

**The dial.** As it moves, the figure fades. Parts that are wired to each other move together and stay close. Parts with no wire drift outward on their own. At the far end there are two clusters with a gap between them, one outlined square floating alone in the gap, one outlined triangle off to the side, and ten small metal pieces scattered around the edges. The caption names what's on screen at each stage.

**Touch any part.** A panel opens: what kind of thing it is, its name, what it is in plain words, what it gives, what it costs, and what it connects to as tappable chips. Every chip opens that part. Every part shows where it came from — which system, and which deposit established it.

**Isolate.** One button. Everything not connected to the selected part fades. For a sealed capacity, a dashed line appears to the region that would complete it.

**Layers.** Toggles that hide whole categories. The thing doesn't change; what's visible does. Toggling off both fixed and fluid leaves only the wires and the loose pieces — the connection map with no bodies.

**Deposits.** Dated entries. Append only. Each attaches to a part and shows in that part's panel in date order. The object grows; it never gets replaced.

## Layers, in build order

1. **Hardware** — nine regions, six wires, ten sealed capacities, the split. *This is the prototype, made real.* Source: content-source §1.
2. **Sources on every part** — each panel shows system and deposit. Source: the `source:` and confidence tags in content-source.
3. **Elements** — a second view of the same person: four pillars as columns, hidden contents revealed by the same dial, and a flow diagram (metal → water → wood buried; earth damming; fire pressing). Source: content-source §2.1–2.2.
4. **Weather** — a timeline: decade, year, this month and the next few. Tap a month: what arrives, what it does. The only layer that changes on its own as time moves. Source: content-source §2.3.
5. **Convergences** — links drawn between a hardware part and an elements part wherever both describe the same thing. Tap a link: both vocabularies side by side. Source: content-source §5.
6. **Isolate across layers** — from any part, follow every `connects to` outward through all layers. Source: the `connects to` fields.
7. **Deposits** — the append-only layer. Source: content-source §10.
8. **Slots** — Software and Interface exist as visible, empty layers. Nothing in them yet. Source: content-source §3–4.

Each layer reviewed before the next. Never all at once.

## Decisions already made

- **Silhouette and constellation are both in — as dial positions.** The figure is the assembled rendering; the constellation is the exploded one. Not a choice; a dial.
- **The perspective toggle is parked.** *As I see myself / as others see me* would be a witnessing instrument. Leave a slot for it in the layers list, disabled, labeled. Do not build it in the seed.
- **Other people's charts are not in this build.** One node only.
- **Phone layout is a real requirement for the build, not for the prototype.** The prototype is laptop-first. The build needs a portrait layout where the figure is large on a phone and the panels stack.

## Rules

- **No gate or channel numbers anywhere in the interface.** None. Plain-language names only. The technical appendix in content-source exists for verification and must never render.
- **Content and code stay separate.** Derive a data file (JSON or a JS module) from content-source.md. The interface reads the data file. Updating a claim means editing content-source and regenerating; it never means touching a component.
- **Deposits are append-only** in the data and in the interface. No edit, no delete.
- **Every claim shows its source and confidence tag** in the panel, quietly, at the bottom.
- **Chinese terms may appear in parentheses** after the plain-language label in the Elements layer. Never as the label itself.

## Visual

- Warm paper. Ink on paper for everything fixed and wired. One metal accent, used only for what is loose — the sealed capacities and the lines to what would complete them. Nothing else gets color.
- One serif family throughout, including controls.
- The dial is the hero. Everything else is quiet.
- Motion only in answer to the dial or a tap.
- Respect reduced-motion. Visible keyboard focus. Every part reachable by keyboard.

## Naming

The working name is *one node*. That's a placeholder for the build. The person it's for names it when it's hers.
