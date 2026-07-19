# Upstream fix — paste this to the database chat

*One sentence in the authored data needs a precision correction. It was found by our
separate neuroscience research pass and already applied in the apps; the master database
and the master document still carry the old wording. Optional attachment: the
anchor-protocol research file (the prompt-3 result) if you want the chat to see the full
evidence — the prompt below is self-contained either way.*

---

Copy-paste from here:

```
A precision correction to one sentence in our knowledge base, confirmed by our
separate neuroscience research pass. Apply it exactly; change nothing else.

WHERE (two places):
1. grid_data.json → relational_mechanics → "The Anchor" → the "scientific" cell.
2. The master document "The Architecture of Human Reality" → Part 3 → The Anchor →
   the Scientific line.

REPLACE EXACTLY:
OLD: "Slow breathing and posture raise vagal tone, bringing prefrontal regulation
back online."
NEW: "Slow breathing and posture raise vagally-mediated heart-rate variability,
bringing prefrontal regulation back online."

WHY (one paragraph, for the record): slow breathing reliably raises heart-rate
variability *while it is being done* (meta-analyses: Laborde et al., Neuroscience &
Biobehavioral Reviews, 2022; Chen et al., Mindfulness, 2023), but that acute rise may
be substantially a respiratory sinus-arrhythmia artifact of the breathing mechanics
rather than proof of raised tonic vagal outflow (Grossman & Kollai 1993; Grossman
2024; Eckberg, J Physiol, 2003 — "the respiratory gate"). So "raises vagal tone"
overstates what is proven; "raises vagally-mediated heart-rate variability" is the
defensible phrasing. Our neuroscience guardrail's own discipline: state each claim at
the precision the evidence permits, never beyond.

SCOPE GUARD — do NOT change these:
- "The Baseline" scientific cell ("Homeostasis — a rest-and-restore baseline, indexed
  by vagal tone (heart-rate variability)...") stays AS IS. That is the resting-state
  INDEX usage, which the evidence supports. Only the Anchor's claim that breathing
  *raises* vagal tone changes.
- No other cell, no other wording, no re-phrasings anywhere else.
```

*Status on our side: the corrected sentence is already live in all deliverables and in
the canonical `grid_data.json` in this repo. This prompt exists so the other
workstream's database and the master document stop re-introducing the old wording.*
