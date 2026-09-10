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

**Generation.** Four parts generate: the work engine, pressure and drive, will and worth, and mental pressure. Source: `mechanism.pressure-differential` `[firm]` — *three energy sources always running (engine, pressure, will) plus mental pressure that generates its own questions.* **Which of the four is strongest is not grounded** — the source lists them flat. The engine-first default is illustrative (§4). The prototype had every fixed part generating; that was wrong. **Identity, processing, and instinct conduct. They hold and pass. They do not generate.**

**Constancy.** Generation does not slow when the exit is closed. Source: mechanism.pressure-differential — *production is constant and independent of output.*

**Flow.** What's generated moves along the six wires, between connected parts only. Source: the six wire ids (`wire.circling-mind`, `wire.initiate`, `wire.following-convictions`, `wire.perfected-form`, `wire.power`, `wire.transformation`) for the endpoints, and `split` for "connected only". *Load travelling along a wire is a rendering choice — the source says wires connect, never that anything is carried (§4).* Wires: mental pressure ↔ processing; identity ↔ will; identity ↔ engine; identity ↔ instinct; engine ↔ instinct; instinct ↔ pressure.

**Two islands.** The mind (mental pressure + processing) and the body (identity, will, engine, instinct, pressure) are not connected. Nothing crosses. Source: `split`.

**No exit — but not a closed system.** The outlet has zero completed wires; nothing reaches it on its own. Source: `region.throat` — *sixteen possible wires could run into it. She has zero completed.*

**The passive vent.** Pressure is already leaving, and leaving nothing behind. Source: `mechanism.discharge-without-residue` `[firm]` — *she has been discharging — talking, testing with people, working assets… Real discharge; the pressure gets out. But it evaporates.* The machine leaks continuously, so it settles below full instead of pinning. The rate is illustrative (§4); the leak is not a route to the outlet and it deposits nothing.

**Emotion takes no internal load.** It's open, it doesn't generate, and no wire routes to it. Source: `region.emotion`. What it *does* take is the room — *takes in the emotional weather of whoever she's with and amplifies it* — and **this machine has no outside** (`gap.environment`: *Hardware has no outside world*). The machine says so rather than implying emotion is empty. But see §4 — how pressure *reads* through it is a claim worth showing.

**Sealed capacities.** Ten of them, sitting in their regions, attached to nothing — and **full, not empty**. Source: the ten `sealed.*` ids; §1.4's own heading *present as pressure, absent as mechanism*; `convergence.four-operations` `[firm]`. They are visibly real, visibly loaded, and visibly unrouted.

**The reading.** Below ~70% of total capacity: *building.* Above: *frustration.* Source: `not-self` `[firm]` — *frustration is pressure with nowhere to go… This is her gauge*; `mechanism.the-loop` `[firm]` — *frustration comes from accumulation*; *building* is her own word (`mechanism.pressure-differential`). **The labels are grounded; the level cut is illustrative (§4)** — `not-self`'s gauge is about whether pressure is moving, not how much there is, and its "only two causes" are behavioural, never a threshold. Above the line the machine also offers the tagged alternate: pressure with no exit *does not announce itself as pressure. It gets read as depression, flatness, futility* `[arguable]`.

**The deposit.** An external route to the outlet, opened by an agreement whose terms are hers, held by someone with no authority over the work, **on a date she committed to and cannot move**. It drains the body island. It does not drain the mind island — the body reaches the outlet, the mind's bridges are different ones and none is complete. Source: `design.deposit-structure`; `mechanism.autonomy-resolved`; `convergence.deposit-is-yin-fire`; `missing-piece.now` (why the body can reach the outlet at all: the missing capacity *appears in three [routes] — and those three lead from exactly the three functions in the integration circuit*); `split`.

**Refill.** After a deposit, pressure returns at the unchanged rate. No internal closer develops and a deposit adds no wire. Source: `mechanism.pressure-differential` `[firm]` — *Production is constant and independent of output*; `sealed.completion` `[firm]` — *this will not improve… no internal circuit to develop.* **The machine does not say the exit never widens.** Whether the block is structural or seasonal is `conflict.permanent-or-temporary`, and her ruling stands as the marker text there: *"I don't find the permanent-or-season framing useful. It isn't permanent. It isn't a season either."*

## 4. What is illustrative — and must be labeled

These are choices, not claims. They must be visible as assumptions.

- **The specific rates.** Neither the ranking nor the ratios are grounded — the source lists the four sources flat and never compares them. Engine-first is a reading, not a claim. Show all of it as *relative, illustrative* and let it be adjusted.
- **Capacities.** How much each part holds before it swells. Illustrative.
- **The 70% threshold.** The content source says frustration is the signal; it doesn't say at what level. Illustrative, adjustable.
- **The deposit's duration and how fast it drains.** Illustrative. Default slow (§6).
- **The particle rendering.** Whatever the medium — dots, flow, fluid — is a rendering choice, not a claim. So is load travelling along a wire at all, and so is the vent being continuous where the source describes talk as episodic.
- **The vent rate**, and that the vent applies to both islands. Evaporation is not a wire and not a route to the outlet, so it does not cross the split; but the source does not say where it happens. Illustrative.
- **Flat generation rates.** `region.pressure` describes *periods where pressure builds and drives hard, then drops.* The machine runs flat. Illustrative.
- **Uniform wire choice**, and therefore that occupancy follows wire count. Illustrative.
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

- **The date opens it, not the press.** *Make a deposit* sets the terms and commits a date; the date opens the route. It cannot be opened early. Source: `design.deposit-structure` — *a fixed rhythm… Non-negotiable, because a movable rhythm is one the circling mind will move. The date does the closing so she never has to judge that something is complete.* Once open it holds until the timer runs out (default 15 seconds, adjustable). No four-second flash. One lab override lives under *Show assumptions*, labelled *illustrative, not the mechanism*, for inspecting drain behaviour without committing.
- **The route is visibly external.** It is not a wire. It's drawn as scaffolding — attached at the outlet, reaching outward, in the metal accent. It touches nothing in the mind island.
- **What leaves is visible leaving.** Whatever the rendering, she should be able to watch load move from the body parts, through the outlet, out.
- **After it closes, a readout.** *Run 3. Left the body: 41. Still in the mind: 18. Pressure 82% → 34%.* Model runs are numbered **Run 1, Run 2…** — never *Deposit 003*, which is hers: `deposit.001` and `deposit.002` are taken and *her own deposits begin at 002*. Numbers are model units; that's fine. The point is she sees exactly what changed and what didn't.
- **A ledger.** Every deposit recorded, in order. This is the model's version of the deposit layer in the content source; in a later phase (§10) it becomes her real dated entries.

## 7. Inspection — restoring the detail

The prototype's hover was good and its content was thin. Both problems are solved by two levels.

- **Hover:** one line. What the part is, in the content source's plain language. Kept from the prototype.
- **Click:** the panel. The full entry for that part from `data/node.js` — every field, every claim, every confidence tag, the source, and the `connects to` list as tappable chips. **This is where the detail lives.** Nothing from the content source is dropped; it moves one click down.
- **From the panel, isolate.** Dim everything not connected to the selected part. Kept from the first build.
- **Every element of the machine has an id.** The nine regions, six wires, ten sealed capacities, the split, the deposit route. Each maps to a content-source id. The machine is fully inspectable.
- **Confidence tags render**, whole and unflattened. Six are declared in the content source; ten forms are in use: `[firm]`, `[read]`, `[hers]`, `[arguable]`, `[uncertain]`, `[corrected]`, `[hers — pending]`, `[hers + arguable]`, `[hers — bookmarked]`, `[hers — bookmarked as a tool to reuse]`. `[hers — pending]` renders as a visible *answer owed here* marker carrying her own words.

## 8. The split — visible in motion, and on demand

Two ways the split shows.

**In motion:** the mind island generates and circulates and never connects. When a deposit drains the body, the mind stays loaded. The reading says so: *The body drained. The mind did not. Nothing connects them.*

**On demand:** a control that separates the structure — the one idea worth keeping from the first prototypes. When engaged, the parts spread apart; wired parts stay together; the two islands become two visible clusters with a gap; the ten sealed pieces float free. The machine keeps running while separated. This is the diagnostic view.

## 9. Weather — the second layer, as modulation

This is where the elemental chart enters, and it's the strongest reason to layer it in: **the machine is timeless, and weather is what changes its parameters.**

A month selector. Each month adjusts the machine, and every adjustment cites content-source §2.3.

- **August 2026** — *filled.* Generation multiplier up (the water frame completed). No route. Wood pushed deeper: the sealed body operations visibly recede. Source: elements.august.
- **September 2026** — *binds.* The forging fire arrives: a deposit route, when opened, holds longer — structure is supported (`convergence.deposit-is-yin-fire` `[firm]`). It does **not** drain better; the month is *Strong, defining, clarifying. Not draining.* Flow belongs to October: *Build in the binding month. Flow in the clashing one.* The combinations bind, and the pivot one is `[arguable]` — *the pivot the month turns on*; her reframe `[hers]` is that *binding is not failure. It's a container.* What locks is the wood in the storehouses — the four sealed body operations, not all ten. Her element is at peak; that generation peaks with it is an inference `[arguable]`. Source: `elements.september`, `elements.wood-buried`, `convergence.four-operations`.
- **October 2026** — *cracks.* The Dog clashes the Dragons. A route opens on its own for a period, without a deposit — the storehouses release. **The drainage is not clean:** the month's stem is still resource and still dams water. What's released is the wood and water inside them `[corrected]` — not yin fire; that is supplied by the month's own branch `[arguable]`. Source: `elements.october`, `elements.dragons`. `[uncertain]` visible, and *hold as a condition to watch for, not a schedule.*
- **November 2026** — *first sprout.* Source: elements.november, `[read]`.
- **The decade** — a persistent modifier, on for every month the machine can model: resource damming output. It *muddies… not blocks*, so it degrades output rather than zeroing it, and it *ends: roughly 2029* `[uncertain]` — so "always on" is not "permanent". Source: `elements.decade`. A second persistent modifier over these months, `elements.year-2026` `[read]`, is not yet used.

When a month runs out of content, the layer says so: *No monthly reading past November 2026 (it ends about December 7). This layer needs a new deposit.* There is no December block — the last month is `elements.november`. At the year level `elements.decade` does carry reads for 2027 and 2028 `[read]` and the decade turn `[uncertain]`, so a year selector past 2026 has content at lower confidence where a month selector has none. That's the layer honestly reporting staleness, not a bug.

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

1. **The machine core.** Generation from the four generators, flow on six wires, two islands, no completed exit, **the passive vent**, pressure reading, sealed capacities visible and full, **the empty *next deposit* slot on the timeline** — the mechanism visible before it is live. Time controls (§5). *Show assumptions* (§4). Hover only.
2. **The three routes.** The deposit, slowed, held, external, opened by its committed date, with readout and ledger (§6) — built as a *comparison*, because the comparison is the point: **talk** vents and leaves nothing (`mechanism.discharge-without-residue`), **starting** relieves and adds an unfinished thing (`mechanism.the-loop`, `sealed.begin-experience`), **the deposit** leaves a residue. Same relief, three different afterwards.
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

---

## 16. Rulings — September 10, 2026

Her decisions on the spec-versus-source contradictions, recorded here because §5 of
this file wins where documents disagree and these change what it says. Numbering is
from the review that produced them.

1. **The mind and the deposit — answered, `[hers]`.** *"When something of mine goes
   out, the mental circling stops. Not reduces — stops. The stuck feeling and the
   flatness go with it, immediately. The longer I was isolated before the exit, the
   stronger that relief."* So: the mind's load stays structurally undrained — no wire.
   But the mind's **circulation rate is coupled to total pressure**: when pressure
   drops, the circling quiets, and the reading says so. *"Nothing connects them"* is
   dropped as a flat claim. Added to `content-source.md` under `split`; it partly
   answers the `[read]` claim there.
2. **The exit is not closed.** Phase 1 gets the passive vent. Phase 2 becomes the
   comparison of three routes (§14).
3. **"Never widens" — behaviour kept, word dropped.** No internal closer develops;
   deposits add no wire; that is `[firm]` and renders. The `[hers — pending]` marker
   on `conflict.permanent-or-temporary` carries her words verbatim: *"I don't find
   the permanent-or-season framing useful. It isn't permanent. It isn't a season
   either. It's not a question I have an answer to from this angle, and I'm not sure
   it has value asked this way."*
4. **The path to the outlet** is `missing-piece.now`. The identity-to-outlet path is
   grounded; the mind's bridges are different ones, which is why it doesn't drain.
5. **The deposit is a date, not a button.** The button sets terms and commits a date;
   the date opens the route; it cannot be opened early.
6. **September binds. October flows, and not cleanly.**
7–19. Accepted as reviewed and folded into §3, §4, §6, §7 and §9 above: engine-first
   is illustrative; sealed capacities full and stuck; frustration labels grounded and
   the level cut illustrative, with flatness as the tagged alternate; emotion takes no
   *internal* load and the machine has no outside; weather tags as listed; year-level
   reads after November at lower confidence; model runs numbered *Run 1, Run 2*, never
   *Deposit 003*; flat rates listed as an assumption; section numbers re-cited to ids.
   From the prototype: a drain must not zero every particle's dwell — load leaves
   progressively.

**Method note.** The review behind these rulings ran four citation verifiers and three
of six hunting lenses to completion; the adversarial refutation stage and the
completeness critic did not run (session limit). The findings are one careful reading
plus three independent readers, not refuter-tested.
