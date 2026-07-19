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


## 14 · v3.1 addendum — everything else the current data licenses

Four additions built into `The_Field_Guide_III.html` (same file, same URL), exhausting
what the two authored faces support without new source material:

- **The nine ways back** (new screen): all nine `destination` arcs, `doorway_short`
  hooks and faculties on one page — the whole map's direction of travel. Pure placement;
  lens strip hidden there because nothing on it is lensed.
- **Find your door by feel** (home, collapsed): the nine authored `trigger` texts as
  browsable entry cards, framed explicitly as *"Not a test. Read, and notice which one
  lands."* No scoring, no verdict — the guardrails' own psychometrics note rules out a
  typing instrument, so recognition-by-reading is the honest ceiling.
- **The whole slide** (spectrum): the nine authored `available` numbers drawn as a
  curve with the current level marked, replacing the single-value meter.
- **If the loop keeps running** (loop, collapsed): the two `contradiction` fields
  verbatim, labeled "The trap — how it defeats itself".

Copy-inventory additions: "The nine ways back", "Every correction on one page — the
whole map's direction of travel", "Not sure which door? Read what sets each one off",
"Not a test. Read, and notice which one lands.", "— what sets it off", "If the loop
keeps running", "The trap — how it defeats itself", "Of themselves, available — the
whole slide", "the one power; only its aim changes". Nothing else.

**What the next steps need from the owner** (recorded so the asks survive sessions):
1. **The symbol's arrows** — each type's integration (growth) and disintegration
   (stress) point from the same primary literature → unlocks real between-type arrows
   on the map and "under pressure, this door borrows that one's pattern" cards.
2. **Pair material** — the tradition's type-combination writings (45 pairs) or an
   owner-authored pairs face (`pairs_data.json`: one cell per pair, tier [STRUCTURE])
   → turns the Loop from adjacency into a true pair engine.
3. **Wings** and **the 27 subtypes** → neighborhoods on the map; a third axis per door.
4. **The Anchor protocol** (the Tool's actual steps, stated at Source_Neuroscience
   precision) → a "do this now" card at the Moment's step 2.
5. **Source_Ledger.md** → specialist attribution panel in the Composition Engine.
6. **Richer lens text** → drop-in replacement; every version re-renders unchanged.


## 15 · v3.2 addendum — the first two research layers wired in

The research pipeline (RESEARCH_PROMPTS.md) returned prompts 1 and 4; both passed
validation with zero material conflicts and entered as two new [STRUCTURE] data faces:

- **`arrows_data.json`** — Directions of Integration/Disintegration (Riso-Hudson).
  Validation performed: all 9 pairs matched an independently hardcoded canon table;
  both circuits re-traced from the data itself (integration 1-7-5-8-2-4 + 9-3-6;
  disintegration 1-4-2-8-5-7 + 9-6-3); no body/science vocabulary; page-level
  citations honestly marked CANNOT VERIFY by the researcher, not fabricated.
- **`wings_data.json`** — the 18 Riso-Hudson wing subtypes. Validation: all 18 names
  matched an independently hardcoded canon list (including "The Maverick" for 8w7 —
  the researcher correctly rejected the widely mis-attributed "The Independent");
  adjacency verified; no body claims; the inflection prose is flagged by the
  researcher as synthesized from the corpus rather than page-pinned — acceptable at
  [STRUCTURE], upgradeable later.

**In the product (Guide 3, type pages, between the spectrum and the neighbors):**
- **"Where it moves"** — two clickable cards per type: "In growth → n · Name" and
  "Under stress → n · Name" with the validated texts; sub-line carries the school's
  asymmetry ("growth is chosen; stress is automatic"). Cards are colored by the
  target door's mode and navigate to it.
- **"The two flavors"** — the type's two wings as static cards colored by the
  neighbor's mode, each with name, inflection text, and contrast line; sub-line
  carries the one-dominant-vs-both-wings school caveat in one clause.

Both sections sit under the type page's existing sourcing line (tradition's account),
so no new register machinery was needed. Data loading: the app now fetch-first loads
four faces and falls back to four embedded snapshots; if the new faces are absent the
sections simply do not render.

Copy-inventory additions: "Where it moves", "Two arrows, one asymmetry — growth is
chosen; stress is automatic.", "In growth →", "Under stress →", "The two flavors",
"A neighbor's color on the core type — one wing usually leads; some schools say you
carry both." Nothing else.

Still pending from the pipeline: prompt 2 (pairs), prompt 3 (anchor protocol),
prompt 5 (subtypes).


## 16 · v3.3 addendum — protocol and subtypes layers wired in

Prompts 3 and 5 returned and passed validation; two more data faces landed:

- **`anchor_protocol_data.json`** — evidence-graded mid-conversation down-regulation
  ([ESTABLISHED]/[MODEL] tiers, meta-analysis/RCT-cited). Validation: 3 steps tiered
  [est, model, est]; the sigh correctly held at MODEL (the Balban 2023 RCT's outcome is
  daily-practice mood, with no acute HRV/heart-rate change — the "fastest way to calm
  down" framing is excluded as inference); power-posing endocrine claims excluded
  (failed replication); no "vagal tone"/"vagus reset" language in any displayed string;
  jaw-unclench and feet-grounding correctly kept out as untested micro-doses.
  **In the product:** the Moment's Anchor step gains a sage-edged "Do this now — the
  same in every body" card with the three instructions, per-step tier chips (solid
  science / a leading model), and the line "Small, real, short-term effects — studied
  as brief practices, not treatments." Shown in all room modes; instructions verbatim;
  mechanism prose stays in the data file, off the reader surface.
- **`subtypes_data.json`** — the 27 instinctual subtypes, both schools kept separate.
  Validation: 27/27; instincts complete per type; exactly one countertype per type;
  the countertype set independently matched the canonical Naranjo/Chestnut scheme
  (1-SX, 2-SP, 3-SP, 4-SP, 5-SX, 6-SX, 7-SO, 8-SO, 9-SO; 3/3/3 distribution); passions
  consistent with the anchor; Riso-Hudson titles honestly CANNOT VERIFY where
  unconfirmed. **In the product:** type pages gain "The three instincts" — three cards
  (Self-preservation / Social / One-to-one (sexual)) with the Naranjo/Chestnut labels
  (parenthetical etymologies stripped from the surface), the countertype chipped, and
  the sub-line "…one runs against the type's usual look ('the countertype'). Teachers
  vary on the labels."

**Open decision recorded for the owner (from prompt 3's findings):** the authored
Anchor cell in `grid_data.json` (scientific lens) says slow breathing and posture
"raise vagal tone." The research's precision bar says the defensible phrasing is
"raise vagally-mediated HRV / cardiac vagal activity" (the acute rise may be partly a
respiratory artifact; Grossman 1993/2024, Eckberg 2003). Changing an authored face is
the owner's call; until decided, the shipped protocol card avoids the phrase entirely.

**Transparency note:** the subtypes file references correcting "the anchor's
provisional hypothesis" — no such hypothesis exists in `Source_Enneagram.md`; it
appears to have originated in that research chat's own session. Since the delivered
countertype set matches the primary sources independently, this affects nothing.

Copy-inventory additions: "Do this now — the same in every body", "Small, real,
short-term effects — studied as brief practices, not treatments.", "The three
instincts", the instincts sub-line, "the countertype", "Self-preservation", "Social",
"One-to-one (sexual)".

Pipeline: ✅ arrows · ✅ wings · ✅ protocol · ✅ subtypes · ⏳ pairs (prompt 2).


## 17 · v3.4 addendum — the pairs layer and the precision fix; pipeline complete

**`pairs_data.json`** — the Riso-Hudson/Enneagram Institute 45-combination matrix.
Validation: 45/45 combinations present (36 cross + 9 same-type doubles, a ≤ b);
brings/trouble substantive and paraphrased with per-pair URLs; `repair` empty in all
45 **by design** — the source's pages have no repair section, and the researcher
refused to invent one (the two flagged word-hits, "score-keeping" and "they feel
doomed", are behavioral descriptions, not verdicts); no compatibility scores, no
rankings, no body claims. **In the product:** in the Moment's two-people mode, a
"This pairing" card (node "&") follows the Loop — "{A} with {B} — the tradition's own
account", then "What each brings" and "Where it rubs" verbatim from the face; a
"What helps" block renders only if repair content ever lands. Same-type pairs work.

**Recorded for later (owner decision, not blocking):** explicit repair guidance
exists in a different school (David Daniels' 45-combination material). If wanted, it
would enter as a clearly-tagged second-school field (`repair_daniels`), never merged
silently into the Riso-Hudson account.

**Precision fix applied (owner approved):** the authored Anchor cell (scientific
lens) now reads "Slow breathing and posture raise **vagally-mediated heart-rate
variability**, bringing prefrontal regulation back online" (was "raise vagal tone").
Fixed in `grid_data.json` and re-embedded in all four HTML deliverables and all four
live artifacts. The owner's upstream Architecture document still carries the old
phrasing in its own text and is the owner's to update.

Copy-inventory additions: "This pairing", "— the tradition's own account.",
"What each brings", "Where it rubs", "What helps".

**Pipeline complete:** ✅ arrows · ✅ wings · ✅ protocol · ✅ subtypes · ✅ pairs.
All five research layers validated and live. 113 automated checks pass.


## 18 · v3.5 addendum — sync with the upstream data revision (owner changelog, 2026-07-19)

The owner's parallel session revised the two authored faces and the presentation rules.
Applied to Guide 3 (in place, same URL, per instruction); the Composition Engine and
Field Guides I/II keep their earlier embedded snapshots as historical versions.

**Data (new canonical `grid_data.json` / `types_data.json`):**
- `anchor.mode` now carries the sourced Riso-Hudson gloss, uniform per group
  ("Assertive — insists or demands" / "Compliant — does what is expected" /
  "Withdrawn — moves away from engagement"); `_meta.fields.mode` documents it.
- "The Core Truth" → **"The Baseline"** (name only); the `_meta.parents` join was
  updated upstream to match — verified, no orphan.
- The False Narrative's scientific cell rewritten to an established mechanism
  ("expectation shapes what is registered"); **zero model-tier cells remain**.
  Model-rendering branches kept as dead code per instruction, and the suite now
  asserts they never fire.
- **Reconciliation:** the new grid was cut from a base predating the owner-approved
  vagal precision fix (spec §17); the fix was **re-applied on top** ("raise
  vagally-mediated heart-rate variability"). The owner's in-session decision
  outranks the stale copy; recorded here.

**Presentation (per changelog §2):**
- Type pages regrouped into the **seven movements**: 01 Who they are (anchor block) ·
  02 How it runs (triad_relation, engine) · 03 What sets it off (trigger, mishearing) ·
  04 What it costs · 05 Why it can drop (contradiction, same_energy) · 06 Which way
  out (doorway, destination) · 07 How far it goes (the vertical).
- `wake_up` renders **inside the vertical at Level 4** (with the Core Motivation gold
  line), not in the mechanism list — journey anchors are now six, the seventh lives
  at the wake-up block.
- "the filter" relabeled **"the mishearing"** everywhere (journey card, Loop blocks).
- 3×3 axis labels: columns "the feeling each type manages", rows "the strategy to
  get what it needs"; row headers now display the full sourced `anchor.mode` strings
  (data-driven); no explanatory essay.
- Spectrum: nine **discrete stops** (clickable), three zone bands (Healthy 1–3 /
  Average 4–6 / Unhealthy 7–9), **one** permanent marker — "the wake-up call" at
  3→4 — the zone chip's "clinical territory" suffix removed (the zone band and the
  Level-7+ flag carry it), default landing stays Level 4.
- Loop arrows and door mode lines now carry the sourced glosses verbatim (no
  appended definitions, per changelog §1a).

130 automated checks pass, including new assertions that the dead model branch
never fires and that the movement order matches the changelog.


## 19 · The Field Kit — the practical layer (new deliverable), and the qualitative vertical

**Post-integration audit (owner-requested re-check):** all seven data faces re-verified
in one pass — 13 concepts, zero model tiers, Baseline rename with intact join, vagal
precision fix present; nine types with uniform sourced mode glosses and full levels;
arrows 9/9 canon with closed circuits; wings 18/18 adjacent with canonical names;
subtypes 27/27 with the canonical countertype set; pairs 45/45 with no invented repair;
protocol tiers [est, model, est]; Guide III embeds byte-identical to canonical. The only
scanner hits were the guardrails quoting banned phrases in order to ban them. CLEAN.

**The qualitative vertical (owner critique, applied to Guide III):** the `available`
numbers are the tradition's picture, not measurements — a plotted curve with percent
labels dressed qualitative material as quantitative. Replaced with an ordinal fade:
nine constant-size dots whose presence fades level by level, current level ringed —
no numbers, no percentages, no plotted values anywhere. Suite asserts the absence.

**`The_Field_Kit.html`** — new deliverable, own URL. The library explains; the kit is
for the conversation itself. Everyday language only (no lens switcher — by design; the
five-language library remains the Guide). Three jobs over a you(+them) picker:
- **Before — Brief me:** a pocket card: your/their tripwires (trimmed, expandable to
  verbatim), ways back as vectors, the pairing's rub and brings, the three ground
  steps with evidence chips and the not-a-treatment line.
- **During — Steady me:** four full-width steps — Ground (a working breath pacer at
  the validated dose: ~4s in / ~6s out × 3, reduced-motion safe, plus the upright
  line), Name it (universal Flinch + your trigger), The turn (universal Shift + your
  doorway), Return (universal Encounter + trimmed caveat).
- **After — Walk it back:** the same authored material as ordered recognition prompts
  (question labels are UI copy; content verbatim), closing on the authored
  "Not two systems merging…" line.
Reads grid/types/protocol/pairs faces (fetch-first, embedded fallback); fonts embedded.
No generated claims; prescriptive framing limited to the owner-sanctioned protocol.
28 automated checks pass (flows, pacer, verbatim expansion, honesty lines, phone,
offline, zero rendered vagus/vagal-tone language).

Copy-inventory additions (kit): job names and descriptions, "Who's in the room?",
"You"/"Them (optional)"/"just me", "The brief —", "Trimmed for scanning; every block
opens to the full text, word for word.", row labels (Your/Their tripwires, Your/Their
way back, Where it rubs, What each brings, Ground any time), "Read in full"/"Show
less", steady step names (Ground/Name it/The turn/Return) and pacer strings, walk-back
question labels, and the footer. Nothing else.

## 20 · The Mix — the resonance walk (new deliverable, own name and URL)

Owner: "I want to mix the fourth choice, Resonance Walk … rather than ask them
questions … how do they actually handle it in real life? That is from real data …
I think I want you to build it first before I can decide."

**What it is.** `The_Mix.html` — the honest alternative to a typing quiz. A quiz
self-report fails here by construction: the thing it would measure is a defense, and
a defense hides best from its owner. So The Mix never types anyone. Twelve forced
choices produce a **reading order** ("start reading here"), never a verdict.

**The four moves (design law, shown to the walker on the home screen):**
1. **Moves, not adjectives** — the owner's "real life" principle. Cards are the
   authored `trigger` (tripwires), `filter` (the mishearing), `engine` (the strategy)
   and `cost` (the price) fields: concrete moments and moves, never trait adjectives.
2. **The forced choice** — two cards at a time, both plausible, neither flattering;
   no "neither" button, by design and said so.
3. **The wince** — three rounds ask which card you'd *least* want true; recoil is
   treated as evidence, disclosed as such.
4. **The mirror** — optional second pass by someone who knows the walker; the two
   walks are compared, and divergence is framed as the most useful page, not an error.
   Mirror wince asks it straight ("Which do you most see them paying?") — the
   informant has no recoil to read, so observation replaces it.

**The deck (equal-exposure law).** Nine scene rounds pair commonly-confused
neighbours in one closed cycle — 1-8, 8-3, 3-7, 7-2, 2-9, 9-6, 6-5, 5-4, 4-1 — so both
cards are live options. Each type appears in **exactly two scene rounds**, with a
**different field each time** (edge 3-colouring: trigger/filter/engine repeating), and
in **exactly one wince round** (its centre triad: 8-9-1, 2-3-4, 5-6-7, on `cost`).
Every pick weighs the same. No type can lead through exposure, and no card repeats.
Card order within a round is shuffled per pass.

**Blindness.** During the walk: no type names or numbers anywhere, and no mode
colours — the walk is deliberately colourless; the mode edges return only at the
reveal. One disclosed transformation, the only one ever applied to authored text:
pattern names *inside* a card are masked as ‹this pattern› / ‹another pattern›
(visibly a redaction — mono, dotted underline). Seven cards carry masks (9 tokens
total). The receipt at the end lifts every mask: all twelve rounds, who was chosen
over whom, by name.

**Scoring and display.** A pick = one mark to that card's type; marks render as dots
(each dot literally one choice), never digits, never percentages. Bands by count:
"Start reading here" (max), "Then these" (rest > 0), "Further off, today" (0). Ties
share the top band ("start with whichever stings"). Provenance phrases under each row
name the walker's actual choices. Every row links into Guide 3's chapter
(`#s=type&t=N`). Nothing is stored — no localStorage, no network send; closing the
page forgets the walk (stated in the footer and on the home screen).

**Copy inventory (the Mix; everything else on screen is authored data):** eyebrow
"twelve choices · a few minutes", title/subline, lede, "How it stays honest — the
four moves" + four move texts + mask note, "Walk it", "cards drawn verbatim · nothing
generated", phase labels "the moment"/"the wince", field keys (the tripwires / the
mishearing / the strategy underneath / the price), four stems + self/mirror question
pairs, "The recoil is the data.", "tap the closer one — closer is enough", back
labels, mirror chip "the mirror — answering about them", result eyebrow/heading/lede,
band labels, tie note, provenance phrases (self and mirror), "Read the chapter →",
receipt labels and row template, mirror block heading/text/buttons, compare
eyebrow/heading/lede/legend, the two gap callouts, "Start over", footer.

**Verification.** 109 automated checks (verify_mix.mjs): deck reconstructed from the
driven UI matches the design (fields order, type slots, equal exposure), mask counts
per round [0,0,0,0,0,0,0,3,3,1,0,0], blind rule (no names, no "Type N", no capitalized
number-words, no stray asterisks) on every round, tap targets, wince question
variants, scoring/bands/dots/receipt/links, mirror flow + both gap callouts on the
right rows, back-gesture history, fetch-blocked and file:// embed fallback, embedded
fonts, nothing stored, no "%" anywhere.

**Live:** https://claude.ai/code/artifact/1bb8ef18-f28a-4de1-8138-a8724206a13d

## 21 · The Daniels repair layer — second school wired in (2026-07-19)

The prompt-6 research returned: all 45 pairings covered by a single genuinely
Daniels-authored source (his Relationship Matrix; anchors and passions matched the
canon exactly; no compatibility scores anywhere — Daniels refuses ranking outright).
Validation before merge: 45/45 keys `a<=b`, non-empty, screened for ranking/score/
percentage and body-claim language — clean. Merged into `pairs_data.json` as
`repair_daniels` with `_meta.second_school` recording school, source, tier
([STRUCTURE]) and the never-blend rule. The Riso-Hudson `repair` field stays empty —
that school still has none, and the two accounts are never mixed.

Guide 3's pairing card now shows it as a visibly separate block: "What helps — a
second school", clay-labelled, divided from the Riso-Hudson material, with the
provenance line "David Daniels' account — a different teacher than the lines above,
kept separate on purpose. He refuses to say which types belong together: any two
people doing this work get along." Guide 3 suite: 132 checks pass (the old
"no repair section" guard now asserts the sharper rule: first-school repair still
absent, Daniels block present and labelled, no ranking language).

## 22 · The Mix II — the owner's voice ruling and the rewrite

Owner feedback on The Mix v1 (2026-07-19): verbatim source paragraphs fail as
choice cards — "so stiff, it's not really an answer that can be true"; third-person
"they" text confuses a first-person walk ("the 'you' and 'they' get all mixed up");
"I would definitely not keep this version… but the shape of it, the idea of it, is
interesting." And the capability question answered: the rewrite is in-house work —
no outside research needed.

**The ruling this build follows.** The Source Ledger's copyright rule is the
licence: *"Everything in the base is the tradition's finding restated in our
language."* So The Mix II keeps v1's architecture unchanged (same cycle, same
3-colouring, same equal-exposure law, wince triads, mirror, reading-order-never-
verdict, colourless walk, no storage) and replaces every card with a **restatement
of exactly one authored line**, written short (2–3 sentences) and in the right
voice: `self` ("I…") for the walker's pass, `other` ("they…") for the mirror pass —
the cards literally switch voice when the phone changes hands. One card, one source
line, nothing invented. The masks are gone because restated cards contain no type
names; the walker still chooses blind.

**Governance.** The deck constant in `The_Mix_II.html` is the copy inventory:
27 cards × 2 voices, each keyed `{t, f}` to its source field (trigger / filter /
engine / cost). Faithfulness rule: every sentence in a card must map to a sentence
of its source line; no claim appears in a card that is not in the line. The receipt
now names the source line behind every choice ("restated from its trigger line")
and points to the full originals in Guide 3.

**Stems (ours, voice-neutral so both passes share them):** tripwires "Everyone has
tripwires — the moments that snag." · mishearing "A remark arrives out of nowhere —
a note on the work, a pause, a tone." · engine "Zoom out. Underneath a normal month,
a strategy is running." · price "Every defense charges a price. Here are three."
Questions per pass as in the FIELDS constant.

**Verification.** 155 automated checks (verify_mix2.mjs): deck slots and equal
exposure reconstructed from the driven UI; per-round voice checks (self cards free
of their/them/themselves, mirror cards free of I/my/me, quoted speech excluded);
blind rule; card length bounds (80–420 chars); wince variants; scoring, bands,
choice-dots, provenance, receipt source-lines; mirror flow and both gap callouts;
history back-gesture; fonts; file:// with zero page errors; nothing stored; no
percentages; home no longer claims "verbatim".

**Live:** https://claude.ai/code/artifact/ad8fa52d-e2a2-4152-9845-8b620d58aaed
(The Mix v1 stays at its URL as the superseded first build, per the versioning rule.)
