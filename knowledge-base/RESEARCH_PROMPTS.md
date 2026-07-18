# Research Prompts — five expansion layers for the knowledge base

*Five copy-paste prompts, one per research chat. Each is self-contained: it carries the
rules, the fact-checking discipline, and the exact output shape, so the results come back
ready for validation and wiring into the apps.*

---

## How to use this file (read once)

1. **One chat per prompt.** Open a fresh Claude chat, paste ONE prompt, and attach the
   one file named at the top of that prompt. (Prompts 1, 2, 4, 5 need `Source_Enneagram.md`;
   prompt 3 needs `Source_Neuroscience.md`. You already have both files.)
2. **Why attach anything?** The research chat can find facts without context — but it
   cannot match our anchors (type names, numbers, passions, defenses) or our honesty tiers
   without seeing them. One small anchor file prevents silent drift. The output *shape* is
   already embedded in each prompt, so nothing else needs attaching.
3. **Ask for the result as a downloadable markdown file.** Each prompt says this, but if
   the chat forgets, just say: "give me that as a downloadable .md file."
4. **Prompt 2 (the 45 pairs) is big.** The chat may run out of room — the prompt tells it
   to work in batches and keep a checklist. Just keep saying "continue" until the checklist
   shows all 45 done.
5. **Bring every output file back to me.** I will then: cross-check each claim against our
   anchors, verify the internal consistency rules (each prompt states them), reconcile any
   flagged conflicts with you, convert the JSON into our data-file format, and build the
   corresponding layer into the guides. You never need to clean anything yourself.

---

## PROMPT 1 — The arrows of the symbol (integration & disintegration)

**Attach: `Source_Enneagram.md`**

```
You are researching for an existing, rule-bound Enneagram knowledge base. The attached
file is its fixed anchor reference. Follow these rules exactly:

- Your findings must be consistent with the attached anchors (type numbers, names,
  centres, passions, virtues, ego defenses). If any source conflicts with the attached
  file, do NOT resolve it silently — record it in a "Conflicts" section.
- Restate facts in your own words. Never copy paragraphs from sources. For every claim,
  give the exact source (book title + edition + chapter/page where possible, or URL),
  so each claim can enter a source ledger.
- Everything here is the tradition's own account — tier [STRUCTURE]. Never present it as
  science. Make no claims about bodies or biology.
- If you cannot verify something in a primary source, write CANNOT VERIFY. Never fill a
  gap with inference.
- Primary sources to prefer: Riso & Hudson (Personality Types, The Wisdom of the
  Enneagram, Understanding the Enneagram, enneagraminstitute.com), then Naranjo and
  Palmer for cross-checking. Name the school for every claim; where schools disagree,
  present both.

THE TASK: For each of the nine types, establish from the Riso-Hudson literature:
1. Its Direction of Integration (growth / security): which type's healthy qualities it
   takes on, and a 2–4 sentence paraphrased account of what that looks like.
2. Its Direction of Disintegration (stress): which type's average-to-unhealthy qualities
   it takes on under stress, and a 2–4 sentence paraphrased account.
3. Note the exact terminology the school uses (integration/disintegration vs
   security/stress point) and any level-specific nuance Riso-Hudson attach (e.g., that
   movement happens at particular levels of health).

INTERNAL CONSISTENCY CHECK (do this before finishing): the nine integration lines and
nine disintegration lines each trace the enneagram figure's closed circuits
(1-4-2-8-5-7-1 and the 3-6-9 triangle, in opposite directions). Verify your findings
trace these circuits exactly. If they do not, something is wrong — re-check rather than
adjusting to fit.

DELIVERABLE — one downloadable markdown file with three parts:
Part A — research notes, claim by claim, each with its citation.
Part B — one valid JSON code block, exactly this schema (no comments, no trailing commas):
{
  "_meta": { "school": "Riso-Hudson", "terminology": "...", "sources": ["..."] },
  "arrows": [
    { "n": 1, "integration": 0, "disintegration": 0,
      "integration_text": "...", "disintegration_text": "...", "source": "..." }
  ]
}
(9 entries, n = 1..9; integration/disintegration are type numbers.)
Part C — Conflicts & uncertainties (school disagreements, CANNOT VERIFY items).
```

---

## PROMPT 2 — The 45 type pairings

**Attach: `Source_Enneagram.md`**

```
You are researching for an existing, rule-bound Enneagram knowledge base. The attached
file is its fixed anchor reference. Follow these rules exactly:

- Consistency with the attached anchors is mandatory (type numbers, names, centres,
  passions, virtues, ego defenses). Flag conflicts; never resolve them silently.
- PARAPHRASE ONLY. This matters doubly here: the canonical pair material is published
  and copyrighted. Restate the findings in fresh words; never copy sentences. Cite the
  exact source page/URL for every pair.
- Everything is the tradition's own account — tier [STRUCTURE]. No science claims, no
  compatibility scores, no rankings of pairs (the tradition itself does not rank).
- CANNOT VERIFY beats invention, always.
- Primary source: the Riso-Hudson type-combination material (The Enneagram Institute's
  relationship-combination pages). Note explicitly that this is one school's account.

THE TASK: For all 45 combinations (36 cross-type pairs plus the 9 same-type "double"
pairs), establish from the Riso-Hudson combination material:
1. What each side characteristically brings to the relationship (paraphrased).
2. The characteristic trouble spots — where friction typically arises between these two
   patterns (paraphrased).
3. If the source states what helps or repairs this pairing, capture that too.

WORK IN BATCHES: do 9 pairs per response if space is tight. Maintain a running checklist
table of all 45 pairs (done / pending) at the top of your working notes, and continue
when asked until all 45 are done.

DELIVERABLE — one downloadable markdown file (assembled across batches) with:
Part A — the checklist table (all 45 rows, all marked done) + per-pair research notes
with citations.
Part B — one valid JSON code block, exactly this schema:
{
  "_meta": { "school": "Riso-Hudson / Enneagram Institute", "tier": "structure",
             "sources": ["..."] },
  "pairs": [
    { "a": 1, "b": 1, "brings": "...", "trouble": "...", "repair": "...", "source": "..." }
  ]
}
(45 entries; a <= b always; "repair" may be "" if the source is silent — never invented.)
Part C — Conflicts & uncertainties.
```

---

## PROMPT 3 — The Anchor protocol (evidence-grade, body-based)

**Attach: `Source_Neuroscience.md`**

```
You are researching for an existing, rule-bound knowledge base about difficult
conversations. The attached file is its neuroscience guardrail: every body/brain claim
in the product must be stated at the precision that file demonstrates, and never beyond.
Follow these rules exactly:

- Tier every claim: [ESTABLISHED] (peer-reviewed, state as fact), [MODEL] (real and
  useful, framed as a model), or [DO NOT STATE] (did not survive scrutiny — listed only
  so we know to keep it out). Match the attached file's calibration style.
- Cite the actual literature per claim (authors, journal, year). Meta-analyses and RCTs
  outrank single studies; say which you are citing.
- Explicitly EXCLUDED, per the attached guardrail: polyvagal theory's evolutionary/
  anatomical story as fact, "nervous systems syncing," limbic resonance, "vagus nerve
  reset" language, and any claim tying a personality type to any body measure.
- Restate in your own words; exact source pointers per claim; CANNOT VERIFY over filling.

THE TASK: Compile the evidence for brief, unobtrusive physiological down-regulation
techniques a person could use MID-CONVERSATION (seconds to ~2 minutes, seated or
standing, without leaving the room or closing their eyes). Cover at least:
1. Slow-paced breathing (including the resonance range around ~5–6 breaths/min):
   what is established about its effect on vagally-mediated HRV and state anxiety?
2. Extended-exhale breathing and the "physiological sigh" (double inhale + long exhale):
   what does the trial evidence actually show, at what strength?
3. Posture/grounding (feet, seat, stance): what, if anything, is established vs merely
   plausible?
4. Brief muscle release (e.g., unclenching jaw/shoulders): evidence grade?
5. For each technique: typical dose (duration/repetitions), expected effect size in
   plain terms, and the honest limits of the evidence.

DELIVERABLE — one downloadable markdown file with:
Part A — research notes per technique, each claim tiered and cited.
Part B — one valid JSON code block, exactly this schema:
{
  "anchor_protocol": {
    "steps": [
      { "instruction": "...", "why": "...", "tier": "established", "dose": "...",
        "source": "..." }
    ],
    "caveats": ["..."],
    "do_not_state": ["..."]
  }
}
("tier" is "established" or "model" only — anything else goes in "do_not_state".)
Part C — Conflicts & uncertainties.
```

---

## PROMPT 4 — The wings

**Attach: `Source_Enneagram.md`**

```
You are researching for an existing, rule-bound Enneagram knowledge base. The attached
file is its fixed anchor reference. Same rules as always:

- Consistency with the attached anchors; flag conflicts, never silently resolve.
- Paraphrase only; exact source per claim; tier [STRUCTURE]; no science claims;
  CANNOT VERIFY over invention.
- Primary source: Riso & Hudson (they named the 18 wing subtypes). Note where other
  schools treat wings differently (e.g., the view that everyone has both wings).

THE TASK: For each of the 18 wing combinations (1w9, 1w2, 2w1, 2w3, ... 9w8, 9w1):
1. The Riso-Hudson name for that wing subtype (e.g., their published two-word epithets).
2. A 2–4 sentence paraphrased account of how the wing inflects the core type — what it
   adds, softens, or sharpens relative to the core type alone.
3. One line on how it differs from the same type's other wing.
4. Note the school-level caveat: whether wings are one-dominant or both-present differs
   by author — present the Riso-Hudson position and name at least one dissenting school.

DELIVERABLE — one downloadable markdown file with:
Part A — research notes with citations, organized by type.
Part B — one valid JSON code block, exactly this schema:
{
  "_meta": { "school": "Riso-Hudson", "wing_theory_note": "...", "sources": ["..."] },
  "wings": [
    { "n": 1, "wing": 9, "name": "...", "text": "...", "contrast": "...", "source": "..." }
  ]
}
(18 entries.)
Part C — Conflicts & uncertainties.
```

---

## PROMPT 5 — The 27 instinctual subtypes

**Attach: `Source_Enneagram.md`**

```
You are researching for an existing, rule-bound Enneagram knowledge base. The attached
file is its fixed anchor reference. Same rules as always:

- Consistency with the attached anchors; flag conflicts, never silently resolve.
- Paraphrase only; exact source per claim; tier [STRUCTURE]; no science claims;
  CANNOT VERIFY over invention.
- Two schools matter here and they genuinely differ: Riso-Hudson's "instinctual
  variants" and the Naranjo/Chestnut subtype tradition (with its named subtypes and
  countertypes). Present BOTH where they differ, clearly labeled — do not blend them
  into one account.

THE TASK: For each of the 27 combinations (9 types × the three instincts:
self-preservation, social, sexual/one-to-one):
1. The subtype's traditional name/label where one exists (Naranjo/Chestnut naming),
   plus the Riso-Hudson characterization of the same combination.
2. A 2–4 sentence paraphrased account of how the instinct redirects the type's passion.
3. Mark which subtype is the COUNTERTYPE for each type (the one that runs against the
   type's usual appearance), per the Naranjo/Chestnut tradition.
4. One-line note on where the two schools describe this combination differently.

DELIVERABLE — one downloadable markdown file with:
Part A — research notes with citations, organized by type.
Part B — one valid JSON code block, exactly this schema:
{
  "_meta": { "schools": ["Riso-Hudson", "Naranjo/Chestnut"], "sources": ["..."] },
  "subtypes": [
    { "n": 1, "instinct": "self-preservation", "label": "...", "text": "...",
      "countertype": false, "school_note": "...", "source": "..." }
  ]
}
(27 entries; instinct is "self-preservation" | "social" | "sexual".)
Part C — Conflicts & uncertainties.
```

---

## What happens when the results come back

Hand me each output file. For each one I will:

1. **Validate** — parse the JSON, check every anchor against `Source_Enneagram.md`,
   run the internal-consistency rules (the arrows' closed circuits; 45/45 pairs; 18
   wings; 27 subtypes; tier discipline in the protocol), and read Part C.
2. **Reconcile** — anything flagged as a conflict or CANNOT VERIFY comes back to you as
   a short decision list, never silently chosen.
3. **Wire** — convert into our data-file format (new files beside `grid_data.json` and
   `types_data.json`; the existing two are never modified by this), and build the layer:
   arrows on the map and stress/growth cards (prompt 1), the real pair engine in the
   Loop (prompt 2), the "do this now" card at the Moment's Anchor step (prompt 3),
   wing shading on the doors (prompt 4), the third axis per door (prompt 5).

The tier rules travel with the data: everything from prompts 1, 2, 4, 5 enters as the
tradition's account and can never display as science; prompt 3's material enters at
exactly the evidence precision it arrives with.
