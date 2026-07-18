# The Field Guide, rebuilt — specification

*A complete spec for version 2 of the reader-facing guide. Written to be buildable from scratch
by someone holding only this file plus the two data files and the three source documents.
Version 1 stays live at its own URL; v2 publishes at a new URL for side-by-side comparison.*

---

## 0 · What this product is (the sentence everything else serves)

This knowledge base exists for **one real-world moment**: a hard conversation in which a
person gets triggered — the wall goes up before thinking catches up — and the way back to
real contact with the other person.

Everything in the material is a facet of that moment:

- **Part 3 (the relational mechanics)** is the moment itself, as a four-step sequence:
  The Flinch → The Anchor → The Shift → The Encounter. The data's own metadata calls the two
  type-fields that plug into this sequence — `trigger` (→ The Flinch) and `doorway`
  (→ The Shift) — *"the most product-relevant fields in this document."*
- **Part 2 (the nine types)** answers *why my wall goes up at different things than yours*,
  and *which way each person's way back runs*. Diagnostic only; it prescribes nothing.
- **Part 1 (the core systems)** is the ground floor that keeps it safe and true: the physics
  is the same in every body, so nobody is broken and no body is predicted.
- **The five lenses** speak all of it to five audiences: everyday, psychological, spiritual,
  scientific, product.
- **The guardrails** keep tradition and science in their own registers, permanently.

**The reader** is a curious non-specialist — the owner presenting the idea, or a person who
just got flinched at (or flinched) and wants to understand what happened.

**The one-minute test** (v2's definition of "helpful"): within one minute, a first-time
reader can find (1) what sets *me* off, (2) what to do in the moment, (3) which way *my*
way back runs — and can switch any of it into the language their audience trusts.

## 1 · The structural reveal v2 is built around

Read the authored join (`_meta.parents`) against the four-step sequence and it says
something nobody wrote as a sentence but the structure asserts:

| Step | Type-field that plugs in | So this step is… |
|---|---|---|
| 1 · The Flinch | `trigger` | **different for each of us** — what trips the wall |
| 2 · The Anchor | *(none)* | **the same in every body** — ground is ground |
| 3 · The Shift | `doorway` | **different for each of us** — which way back |
| 4 · The Encounter | *(none)* | **the same in every body** — arrival is shared |

*Where we differ is the way in and the way back; the ground and the arrival are the same
for everyone.* This is derived by reading the authored join — displaying it is placement,
not invention. It becomes the Moment screen's two quiet labels: "different for each of us" /
"the same in every body."

## 2 · Information architecture — four surfaces, one control

```
HOME  (the invitation + the map)
 ├── THE MOMENT      · the four steps, with "who's in the room?" (0, 1, or 2 people)
 ├── THE NINE  ×9    · one door per type: journey + depth + neighbors
 └── THE GROUND FLOOR· the thirteen universals
Global: LANGUAGE switcher (Everyday · Psychology · Spirit · Science · Product),
        persistent across screens; Science shows the standing no-biometrics note once, in the bar.
```

Navigation uses real browser history (pushState per screen) so the phone's back gesture
returns to the previous screen instead of exiting the site. Every screen deep-links via hash.

## 3 · Screen specs

### 3.1 HOME

1. **Hero** — two sentences max: everyone runs a defense; this guide shows each one's moment,
   pattern, and way back, in five languages. One primary button: **"Walk the moment."**
2. **The map of nine doors** — the doors laid out as the 3×3 the tradition itself draws,
   with plain-word axis labels:
   - columns = *the raw feeling underneath*: Anger (body) · Shame (heart) · Fear (head)
   - rows = *how it moves*: Against · Away · Toward
   Each door: number, name, alt name, the way back in quotes (`doorway_short`).
   Phone: collapses to three groups by feeling (anger / shame / fear), keeping the group labels.
   *Rule note:* this is display of the authored table (the KB renders it itself as orientation);
   nothing is generated from it.
3. **Ground floor entry** — one quiet card: "What is true of everyone."

No lens strip on home (nothing on home is lensed). No duplicated eyebrow: the sticky bar is
hidden on home; the page's own header carries the identity once.

### 3.2 THE MOMENT

The four steps as a connected vertical sequence. Per step:

- Step number + name (The Flinch / The Anchor / The Shift / The Encounter)
- The universal statement in the current lens (verbatim from `grid_data.json`
  `relational_mechanics`), gold-anchor styled.
- The quiet structural label: steps 1 & 3 — *"different for each of us"*;
  steps 2 & 4 — *"the same in every body."*
- The Encounter keeps its authored caveat, displayed as a small italic line
  ("The coordination link is real but modest. Syncing and fusion are not established.").

**"Who's in the room?"** — a control above the sequence: *just the idea* (default) ·
*one person* · *two people*. Choosing people = picking doors (type numbers).

- With one person chosen: step 1 gains a labeled block — "What sets it off, for {name}" —
  containing that type's verbatim `trigger`; step 3 gains "The way back, for {name}" —
  verbatim `doorway`. Steps 2 and 4 gain nothing (that is the point, and the label says so).
- With two people: the same two blocks appear twice, stacked, each labeled with its person
  ("For {A}…" / "For {B}…"), visually distinguished by each type's mode edge color.
- **Hard rule:** not one sentence about how the two types interact *with each other* is ever
  shown or generated. The universal text carries the two-person truth; the type texts carry
  each side. Placement only.

### 3.3 A TYPE (one of the nine doors)

Order, top to bottom:

1. **Header** — Type n · centre · mode (plain: "Body / anger · moves against"); name + alt;
   fear/desire rows ("Deep down, the fear" / "What they want most"); the one-power line
   ("{faculty} is the one power here — only its aim changes"); **"The way back:"**
   + `doorway_short` in quotes (no word-count phrasing). Tradition anchors as one small line,
   with **"Ego defense"** as the label (not "Defense").
2. **One sourcing line** (the whole page's honesty, said once — replaces v1's ten buttons):
   *"This story is the tradition's own account — respected, not laboratory science. The gold
   lines are the science, true of everyone; they are what changes when you switch the language."*
3. **The journey** — ten stops, numbered, in the source document's order (triad_relation,
   engine, trigger, filter, wake_up, cost, contradiction, same_energy, doorway, destination),
   with the seven gold universal anchors at each parent concept's first stop (placement
   identical to the source document). The False Narrative's anchor carries its authored
   model caveat as a small italic line at that one anchor only.
4. **"How deep does it go?"** — collapsed by default. When opened: levels 1–6 verbatim,
   each rendered as *what gave way* (the `shift` line, prominent — the data calls it "the
   recognition handle"), then the level text, then the aim ("{faculty}, aimed {aim}").
   After level 6, the **edge card**: *"Beyond here, the tradition describes three further
   levels. That range is clinical territory — outside this guide's reach."* No level 7–9
   text, no disorder names in this product.
5. **"Same problem, different strategy"** — the type's two centre-siblings, each as a door
   link with its authored one-line strategy quoted from its `triad_relation` (e.g. Body:
   the Eight *expresses*, the Nine *represses*, the One *sublimates*). Where the sources
   draw a named contrast, one extra line, quoted:
   - 5 ↔ 7 — "The Seven is the near-exact opposite of the Five." (Type 7, triad_relation)
   - 3 ↔ 9 — "Where the Three wants to be outstanding in their role, the Nine does not want
     to stand out." (Type 9, wake_up)
   No other pairings exist in the sources; none are shown.
6. **Next door** — cycles n → n+1, 9 → 1. Plus "All nine" and "The moment" links.

### 3.4 THE GROUND FLOOR

As v1 (13 concepts, lens-aware, plain tier chips "solid science" / "a leading model"),
with these changes:

- Caveats are displayed with editor-facing imperatives trimmed: the Shared Connection caveat
  ends at "…are not established" (the "— do not say them" tail is an authoring instruction,
  not reader content).
- "This one comes alive differently in each type" becomes a working link into the doors.
- The four relational mechanics keep their order and gain a "walk the moment" link.

## 4 · The relations layer — authored, verified, and its proof

Everything in §3.3(5) and the 3×3 map rests on explicit source text. Verified quotes:

**Body / anger** — 8: "The Eight **expresses** the aggression at full volume — and represses
something else entirely." · 9: "The Nine **represses** it — specifically, they have repressed
the ability to assert the self…" · 1: "The One **sublimates** it — … redirected into a quest
for perfection." (each type's `triad_relation`; cross-checked with Source_Enneagram:
"8 externalizes anger; 1 internalizes it as resentment; 9 numbs/falls asleep to it.")

**Heart / shame** — 3's triad_relation names both siblings: "Where the Two denies hostility
and the Four routes it indirectly, the Three is directly hostile."

**Head / fear** — 6's triad_relation names both siblings: "Where the Five displaces it and
the Seven outruns it, the Six is conscious of it."

**Named contrasts** — 5↔7 and 3↔9 only (quotes above). An exhaustive search of all nine
types' twelve fields found no other explicit type-to-type references.

**Considered and cut:** a "nine dissolutions" arc list (passion→virtue) — already present
as journey stop 10 per type; a separate module would duplicate it.

## 5 · Rules → where they live in v2

| Non-negotiable rule | Where it is enforced |
|---|---|
| Weaker register wins; tradition never dressed as science | One sourcing line per type page (§3.3-2) + footer; tier chips on ground floor; model caveat at the False Narrative anchor |
| Never predict a body | Science-lens standing note in the bar (once); all type text verbatim; no generated claims anywhere |
| Centre × mode is a coherence check, never a generator | The 3×3 appears as *navigation layout* only; no content is derived from cell position |
| Attribution stays in the ledger | No "according to" anywhere; footer notes the tradition/science split without citations |
| Levels 7–9 clinical | Levels capped at 6; edge card carries the boundary, not the content; no disorder names |
| Never author the interior | Every displayed sentence is source text or a §8 inventory string; the join (`_meta.parents`) is the only bridge |

## 6 · Interaction & platform

- Language switcher: 5 pills, persists across screens, re-voices only universal lines.
- History: pushState per screen change; back gesture = previous screen; hash deep links
  restore screen + door(s) + language.
- Fully self-contained single file: fonts embedded (data URIs), data embedded with
  fetch-first for served copies. No network required.
- Phone-first: single column; 3×3 map degrades to grouped list; no horizontal page scroll;
  ≥40px tap targets; lens strip edge-fade hint when scrollable.
- `prefers-reduced-motion` respected; visible keyboard focus; sane heading order.

## 7 · Visual system

Unchanged identity (it is the product family's identity, not a default): cream field
`#f2e8cf`, surface `#faf4e4`, ink `#2b2216`, mid `#6f6047`, gold `#96650f` (universal/anchor),
sage `#4a6634` + clay `#8f4c2c` (mode edges: gold=against, sage=away, clay=toward).
Spectral (300 display / 400 body / 500 emphasis / italic voice); JetBrains Mono for
wayfinding labels only. Single-theme by choice. Body text ≥1.05rem, ≤66ch.

## 8 · Copy inventory — every non-source string the app may show

*The anti-flood discipline: if a string is not in this list and not source text, it does not
ship.* Wayfinding: "Walk the moment", "Enter through a door", "What is true of everyone",
"All nine", "Next door", "The moment", "Held in {language-name}". Axis labels: "the raw
feeling underneath", "how it moves", "Anger/Shame/Fear", "Against/Away/Toward". Moment
labels: "different for each of us", "the same in every body", "Who's in the room?",
"Just the idea / One person / Two people", "What sets it off, for {name}", "The way back,
for {name}". Type page: "Deep down, the fear", "What they want most", "The way back:",
"{faculty} is the one power here — only its aim changes", "Ego defense", the one sourcing
line (§3.3-2), "How deep does it go?", "What gave way", "{faculty}, aimed…", the edge-card
sentence (§3.3-4), "Same problem, different strategy". Ground floor: "solid science",
"a leading model", "See it for each type", "Walk the moment". Science bar note (verbatim
from v1). Journey stop titles and sub-lines (ten, as v1). Footer (as v1, updated). Lens
names + one-line descriptions (five, as v1). Nothing else.

## 9 · Anti-goals

- No generated text about type-pairs or any interaction between two chosen types.
- No level 7–9 content; no clinical/disorder vocabulary anywhere in this product.
- No per-card disclaimers; honesty is said once per surface, well.
- No new metaphors, no invented relations, no "insights" beyond §4's quoted material.
- No dark mode, no animation set pieces, no slider theatrics on the levels.

## 10 · Carried-in fixes from the v1 audit

1. Next door cycles correctly (n+1, wrap 9→1). 2. "Four words or fewer" phrasing removed.
3. Caveat imperative tails trimmed on reader surfaces. 4. Phone back gesture navigates
in-app (pushState). 5. Home identity said once. 6. Science note deduplicated (bar only).
7. "Ego defense" label. 8. Universals→door links tappable. 9. Lens strip scroll hint.

## 11 · Acceptance checklist

**Purpose (new — the one-minute test):** from a cold load, a tester can reach (a) their
type's trigger, (b) the Anchor step, (c) their type's doorway, each within three taps; and
can switch all three into any lens without losing their place.

**Rules:** no rendering path shows composed/type material as established; Science lens
always carries the standing note; the two-people view never emits pair-specific prose;
levels stop at 6 with the boundary card; no disorder names; caveat tails trimmed;
3×3 position never generates content.

**Regression:** ten stops per type; seven gold anchors at the documented stops; lens switch
changes only universal lines; next-door cycle correct on all nine; back gesture returns to
previous screen on phone; deep links restore state; no horizontal scroll at 390px; fonts
render with zero network; no console errors.

## 12 · Decisions — RESOLVED by the owner (2026-07-17)

- **D1 — The Moment with "who's in the room?"** → **YES**, built. 0/1/2 people; person
  blocks are placement of authored `trigger`/`doorway` text only; nothing generated
  about the pair.
- **D2 — The vertical** → **AMENDED by the owner: all NINE levels, as a spectrum,
  one level at a time** (not a grid, not capped at 6). Built as a slider on a
  light-to-dark band (the reference document's own idiom — the page loses light as the
  level deepens); levels 7–9 show their authored text with a standing flag
  ("Clinical territory — outside this guide's reach; the guide shows the shape of the
  slide here; it does not interpret it") and **no diagnostic labels** (`clinical_at_9`
  is never displayed in this product). This matches the internal reference's own
  presentation of the vertical, with the reader-facing safeguard kept.
- **D3 — Home doors as the 3×3 map** → **YES**, built; collapses to
  centre-grouped list on phones.

Implemented as `The_Field_Guide_II.html` (v2), published at its own URL per the house
rule; v1 and the Composition Engine keep their URLs, all three side by side.

## 13 · v3 addendum — The Loop (owner request: "show how they interact")

Implemented as `The_Field_Guide_III.html` ("Guide 3"), keeping everything in v2.

**The honest boundary, stated first.** The sources contain no authored content about
specific pairs beyond seven sentences (below). Therefore v3 builds no compatibility
model, no scores, no "when an X meets a Y" prose — that would be fabrication.

**What the data does license — the circuit.** The `filter` field is authored as
*"how ANY input gets converted into threat"*; in a two-person room, the other person's
move IS the input. Each type's move under friction is authored in `anchor.mode`
(*moving against / moving away / moving toward the standard/people/support*). So the
interaction composes as a feedback loop of verbatim parts:
A's mode-move → B's filter → B's mode-move → A's filter → …
The wiring is the universal Flinch physics; every node is source text. v3 draws it:
two nodes, two arrows (solid gold = against, sage pointing out of the field = away,
dashed clay = toward), each labelled with its authored mode phrase, above the two
verbatim filters. One inventoried bridge line, used once: *"Each one's defense is the
other's input."* The panel closes with the authored counter-statement from Shared
Connection: *"Not two systems merging — two systems each finding their own ground,
together."* The loop appears only when both people are chosen, between the Flinch and
the Anchor; the geometry is left to speak — the engine never names the combined pattern.

**The seven authored pair contrasts** (the only pair-specific content that exists;
surfaced verbatim when the pair is chosen): 5-7 (Type 7 triad_relation), 3-9 (Type 9
wake_up), 2-3 / 3-4 / 2-4 (Type 3 triad_relation names all three Heart types),
5-6 / 6-7 (Type 6 triad_relation names all three Head types). Same-centre pairs with
no cross-quote (the Body pairs) show the shared problem sentence instead. Person
blocks additionally carry the authored raw feeling (*underneath, anger/shame/fear*).

**Copy-inventory additions (v3):** "The loop", "two people" (chip), "Each one's
defense is the other's input.", "The filter — how input becomes threat", "underneath,",
"The tradition itself draws this contrast". Nothing else was added.
