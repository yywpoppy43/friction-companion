# SPEC — the machine

A running model of one person's structure. Not a diagram, not an index. A machine with a fault: generation constant, exit closed, pressure accumulating — and the one thing that drains it.

This replaces BRIEF.md. Where they disagree, this wins.

---

## 0. Read this first

- `content-source.md` is the database. Every part of the machine maps to an id in it. The machine never says anything the content source doesn't say. Never edit it.
- `data/node.js` and `build/derive.mjs` from the first build are good — keep them. They're the inspection layer's data.
- `the-machine.html` is a sketch of the core mechanism. Study its behavior; discard its code. It has one modeling error, corrected in §3.
- `explode-prototype.html` and `one-node-v2.html` are superseded. Their one idea worth keeping — the dial that separates the structure and shows the split — appears in §8.
- The interface built as "layer 1" is superseded. Don't extend it.

## 1. What this is

A person's structure, running in time.

Four parts generate constantly, at their own rates, whether or not anything can leave. Six wires carry what's generated between the parts that are connected. The one part that could send anything out into the world has nothing connected to it. So it circulates and accumulates. Pressure rises. Past a threshold, the reading changes from *building* to *frustration* — the actual claim from the content source, running.

Then there's one thing that drains it: a deposit. An external route, opened by a promise held by someone else. It empties the body. It does not empty the mind, because nothing connects them. It closes on its own. It refills at the same rate.

That's the whole object. Everything else is inspection and control.

## 2. Why this shape

Not from the anatomy demo. From the material.

The content source states one structure three independent ways: abundant generation with no completed exit (§5 convergence.no-exit), four sealed body operations (§1.4 convergence.four-operations), wood buried under earth (§2.2 elements.wood-buried). Every one of those is a description of a pressure system. A pressure system is a thing that runs. So the honest rendering of it is one that runs.

A chart can't show what happens over time. This can. That's the only reason it exists.

## 3. The running model — grounded behaviors

Each behavior below cites its source. The machine may not do anything not on this list without labeling it illustrative (§4).

**Generation.** Four parts generate: the work engine (strongest), pressure and drive, will and worth, and mental pressure. Source: content-source §1.2 — these are the three motors plus the mental pressure center. The prototype had every fixed part generating; that was wrong. **Identity, processing, and instinct conduct. They hold and pass. They do not generate.**

**Constancy.** Generation does not slow when the exit is closed. Source: mechanism.pressure-differential — *production is constant and independent of output.*

**Flow.** What's generated moves along the six wires, between connected parts only. Source: §1.3. Wires: mental pressure ↔ processing; identity ↔ will; identity ↔ engine; identity ↔ instinct; engine ↔ instinct; instinct ↔ pressure.

**Two islands.** The mind (mental pressure + processing) and the body (identity, will, engine, instinct, pressure) are not connected. Nothing crosses. Source: `split`.

**No exit.** The outlet has zero completed wires. Nothing reaches it on its own. Source: region.throat — *sixteen possible wires in, zero completed.*

**Emotion takes no load.** It's open. It doesn't generate and nothing routes to it. Source: region.emotion. But see §4 — how pressure *reads* through it is a claim worth showing.

**Sealed capacities.** Ten of them, sitting in their regions, carrying no load, attached to nothing. Source: §1.4. They are visibly real and visibly unrouted.

**The reading.** Below ~70% of total capacity: *building.* Above: *frustration.* Source: `not-self` — frustration as the signal, and only two causes.

**The deposit.** An external route to the outlet, opened by an agreement held by someone with no authority over the work. It drains the body island. It does not drain the mind island. It closes on its own. Source: design.deposit-structure; mechanism.autonomy-resolved; `split`.

**Refill.** After a deposit, pressure returns at the unchanged rate. The exit never widens. Source: mechanism.pressure-differential — *frequency of discharge, not quality of output.*

## 4. What is illustrative — and must be labeled

These are choices, not claims. They must be visible as assumptions.

- **The specific rates.** Which generator is strongest is grounded (the engine). The numeric ratios are not. Show them as *relative, illustrative* and let them be adjusted.
- **Capacities.** How much each part holds before it swells. Illustrative.
- **The 70% threshold.** The content source says frustration is the signal; it doesn't say at what level. Illustrative, adjustable.
- **The deposit's duration and how fast it drains.** Illustrative. Default slow (§6).
- **The particle rendering.** Whatever the medium — dots, flow, fluid — is a rendering choice, not a claim.
- **How pressure reads through emotion.** The content source says pressure with no exit reads as mood rather than as pressure (region.emotion, `[arguable]`). Showing this — for example, emotion's color shifting as total pressure rises even though it holds no load — is a strong idea and an *arguable* claim. If built, it carries the `[arguable]` tag visibly.

**Rule:** a small control, always available — *Show assumptions.* When on, every illustrative parameter is visible with its current value and the word *illustrative*. When off, the machine just runs.

## 5. Time — the controls

This is the most important interaction change from the prototype. She could not stop it, could not slow it, and the deposit was over before she could see what happened.

- **Pause / resume.**
- **Speed.** ¼×, 1×, 4×. Default 1×, tuned so pressure reaches the frustration threshold in roughly 60–90 seconds from empty.
- **Step.** Advance a fixed interval (default 5 seconds of model time) while paused.
- **Hold at.** A pressure level she sets. The machine runs until it reaches it, then pauses itself. She inspects. Then resumes.
- **Scrub.** A timeline of the last few minutes. Dragging it back shows the state at that moment. Pressure, loads, what was where.
- **Reset** to empty.

All of these are keyboard-reachable.

## 6. The deposit — slowed down and legible

The deposit is the one action. It has to be understood, not just seen.

- **Opening it holds.** Pressing *Make a deposit* opens the route and it stays open until she closes it, or until a visible timer runs out (default 15 seconds, adjustable). No four-second flash.
- **The route is visibly external.** It is not a wire. It's drawn as scaffolding — attached at the outlet, reaching outward, in the metal accent. It touches nothing in the mind island.
- **What leaves is visible leaving.** Whatever the rendering, she should be able to watch load move from the body parts, through the outlet, out.
- **After it closes, a readout.** *Deposit 003. Left the body: 41. Still in the mind: 18. Pressure 82% → 34%.* Numbers are model units; that's fine. The point is she sees exactly what changed and what didn't.
- **A ledger.** Every deposit recorded, in order. This is the model's version of the deposit layer in the content source; in a later phase (§10) it becomes her real dated entries.

## 7. Inspection — restoring the detail

The prototype's hover was good and its content was thin. Both problems are solved by two levels.

- **Hover:** one line. What the part is, in the content source's plain language. Kept from the prototype.
- **Click:** the panel. The full entry for that part from `data/node.js` — every field, every claim, every confidence tag, the source, and the `connects to` list as tappable chips. **This is where the detail lives.** Nothing from the content source is dropped; it moves one click down.
- **From the panel, isolate.** Dim everything not connected to the selected part. Kept from the first build.
- **Every element of the machine has an id.** The nine regions, six wires, ten sealed capacities, the split, the deposit route. Each maps to a content-source id. The machine is fully inspectable.
- **Confidence tags render.** `[firm]`, `[read]`, `[hers]`, `[arguable]`, `[uncertain]`, `[corrected]` — and `[hers — pending]` as a visible *answer owed here* marker.

## 8. The split — visible in motion, and on demand

Two ways the split shows.

**In motion:** the mind island generates and circulates and never connects. When a deposit drains the body, the mind stays loaded. The reading says so: *The body drained. The mind did not. Nothing connects them.*

**On demand:** a control that separates the structure — the one idea worth keeping from the first prototypes. When engaged, the parts spread apart; wired parts stay together; the two islands become two visible clusters with a gap; the ten sealed pieces float free. The machine keeps running while separated. This is the diagnostic view.

## 9. Weather — the second layer, as modulation

This is where the elemental chart enters, and it's the strongest reason to layer it in: **the machine is timeless, and weather is what changes its parameters.**

A month selector. Each month adjusts the machine, and every adjustment cites content-source §2.3.

- **August 2026** — *filled.* Generation multiplier up (the water frame completed). No route. Wood pushed deeper: the sealed body operations visibly recede. Source: elements.august.
- **September 2026** — *binds.* The forging fire arrives: a deposit route, when opened, holds longer and drains more cleanly (structure is supported). But all three combinations bind: the sealed pieces are locked, not released. Generation at peak (metal at its seat). Source: elements.september.
- **October 2026** — *cracks.* The Dog clashes the Dragons. A route opens on its own for a period, without a deposit — the storehouses release. What's released is the wood and water inside them, plus the month's own yin fire. Source: elements.october. `[uncertain]` tag visible.
- **November 2026** — *first sprout.* Source: elements.november, `[read]`.
- **The decade** — a persistent modifier, always on: resource damming output. Source: elements.decade.

When a month runs out of content, the layer says so: *No reading past December 2026. This layer needs a new deposit.* That's the layer honestly reporting staleness, not a bug.

This is the layering doing real work. Hardware says here is the machine. Elements say here is what this month does to it.

## 10. Later layers

Each becomes an inspectable dimension of the running machine, never a separate screen.

- **Mechanisms (§8 of content source)** — the findings that explain the machine's behavior. Surfaced in the reading and in panels. *The loop*, *supersession*, *discharge without residue*, *uncalibrated drift* — each one attaches to the part of the machine it describes.
- **Design (§9)** — the remedies. The deposit structure is already the core action. The container spec, the environment, the watch list — inspectable.
- **Convergences, Conflicts, Gaps (§5–7)** — inspectable from any part they touch. Conflicts show `[hers — pending]` where her answer is owed.
- **Interface (§4)** — her work. Populated, five parts. Attached to the deposit mechanic, because the content source says the deposit *is* calibration (interface.thesis-running).
- **Deposits (§10)** — her real dated entries, append-only, attached to parts. The ledger from §6 becomes this.
- **Software** — an empty, visible slot.

## 11. Honesty rules

- Every behavior is either grounded (cites a content-source id) or illustrative (labeled). No third category.
- *Show assumptions* is always available.
- The machine never states a number as a fact about her. Model units are model units.
- `[arguable]` and `[uncertain]` claims render with their tags wherever they're shown.
- When the model can't say something — a month with no reading, a part with no source — it says it can't. It never fills the gap.
- No gate or channel numbers anywhere in the interface. Plain language only. The appendix in the content source never renders.

## 12. Visual and interaction

- Warm paper. Ink for what's fixed and wired. One metal accent, only for what's loose or external — the sealed capacities and the deposit route. A second accent, used only for the frustration state.
- One serif family throughout, including controls.
- The machine is the hero. Controls are quiet.
- Motion is the model running. No decorative motion.
- Reduced-motion respected: the model still runs, without particle animation, showing state.
- Phone: a real portrait layout. The figure large. Controls below. Panel as a sheet.

## 13. Rendering freedom

Claude Code chooses the medium: 2D canvas, SVG, or WebGL/3D. Constraints:

- Opens from a file. No server, no build step required to view.
- Runs on a phone.
- 3D is welcome if it serves legibility — if depth makes the two islands, the gap, and the external route clearer. Not for spectacle.
- Whatever the medium, every part remains individually addressable and inspectable.

## 14. Build order

One phase at a time. Reviewed before the next.

1. **The machine core.** Generation from the four generators, flow on six wires, two islands, no exit, pressure reading, sealed capacities visible. Time controls (§5). *Show assumptions* (§4). Hover only.
2. **The deposit.** Slowed, held, external, with readout and ledger (§6).
3. **Inspection.** Click → full panel from `data/node.js`. Isolate. Tags (§7).
4. **The split on demand.** The separate control (§8).
5. **Weather.** The month selector and modulation (§9).
6. **Later layers** as inspectable dimensions (§10), one at a time.
7. **Her deposits.** The ledger becomes real, persisted, append-only.

## 15. Before building anything

Read this file, `content-source.md`, and `the-machine.html`. Then reply with:

1. The behaviors you'll implement in phase 1, each with its content-source id.
2. The illustrative parameters and their defaults.
3. Your choice of medium and why.
4. Anything in this spec that contradicts the content source.

Stop and wait.
