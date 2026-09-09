# BUILD ORDER — one node

Supersedes the eight-item list in `BRIEF.md`. Everything else in the brief
stands as written. Thirteen layers, each reviewed before the next.

Part counts are what the generator actually finds in `content-source.md`;
114 blocks in total (112 ids + 2 deposits).

| # | Layer | Source | Parts | Notes |
|---|-------|--------|-------|-------|
| 1 | **Hardware** | §1 | 40 parsed, **25 rendered** | 9 regions, 6 wires, 10 sealed. The geometry test. |
| 2 | **Sources on every part** | `source:` + tags, everywhere | — | Cross-cutting. Every layer after this inherits it. |
| 3 | **Elements** | §2.1–2.2 | 12 | Four pillars as columns, plus the flow diagram. |
| 4 | **Mechanisms** | §8 | 15 | Early by decision: densest section, most of the confirmed findings. |
| 5 | **Weather** | §2.3 | 7 | Decade, year, months. Runs out after November 2026 and says so. |
| 6 | **Convergences** | §5 **and §1.4** | 8 | Seven in §5; `convergence.four-operations` is filed in §1.4. |
| 7 | **Conflicts** | §6 | 5 | Two carry `[hers — pending]`: the answer-owed marker first becomes visible here. |
| 8 | **Gaps** | §7 | 12 | Nine of these are in the unreachable list — see `content-gaps.md`. |
| 9 | **Design** | §9 | 7 | |
| 10 | **Interface** | §4 | 5 | **Populated, not a slot.** Comes after Mechanisms and Design, which its parts point at. |
| 11 | **Isolate across layers** | every `connects to` | — | Needs 1–10 present; 43% of edges touch layers 4, 7, 8 and 9. |
| 12 | **Deposits** | §10 | 2 | Append-only. `whole` (§0) renders here — deposit 001 is attached to it. |
| 13 | **Slots** | §3 | 1 | Software, genuinely empty. The perspective toggle stays parked and disabled. |

Mechanisms at 4 puts it between Elements and Weather, which splits §2 across
layers 3 and 5. That was the explicit instruction and the tradeoff is small;
say so if you'd rather Weather came first.

---

## Standing decisions

**`content-source.md` is never edited or deleted without Poppy's say-so.**
It is the database. Anything wrong in it gets reported, not patched.
`content-gaps.md` is the report, and it is generated — never hand-edited.

**One layer at a time.** Nothing moves to the next until she says so.

**Sources: never invent.** A part whose `source:` names only a conversation
turn shows that turn and no system — 43 of 103 sources have no system. A
claim with no confidence tag shows as untagged. A source recorded once for a
group of parts is shown as inherited, naming the group. No blank is ever
filled with a guess.

**Compound confidence tags are surfaced, not flattened.** Six are declared in
the file; ten forms are in use. `[hers — pending]` renders as a visible marker
that an answer is owed on that part.

**Layer 1 renders 25 parts.** `missing-piece.now` and `integration-circuit`
appear in panels as connections, not as things on the canvas. They get proper
treatment in a later layer.

**Weather is allowed to run out.** No month is extrapolated. When the data
ends the layer says plainly that it needs a new reading. That is the layer
reporting, not a bug.

**Chinese in the Elements layer.** Star names stay parenthetical after the
plain-language label. The classical phrase citations — 土多金埋, 己土濁壬,
水多木漂, 金白水清, 食神制殺, 申子辰, 窮通寶鑑 — render with the plain-language
meaning first and the phrase after it, small. Never the phrase alone, never
the phrase as the label.

**No gate or channel numbers anywhere.** Enforced in the generator, not the
renderer: the appendix is cut before parsing and the build refuses to write if
appendix vocabulary or a gate/channel number reaches the data file.
