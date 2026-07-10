# Friction Companion — Stage-1 live app (press Start → hear live cues)

Tap **Start**, do your workout, and hear the engine coach you through the wall —
out loud, with **live-generated cues** and **real session timing**. It uses your
device's **built-in voice** (free, offline once loaded); the cue *text* is
generated fresh each session by the engine.

> **Running a live demo for other people?** Follow the step-by-step
> [`RUN_DEMO.md`](../RUN_DEMO.md) at the repo root — written for a
> non-technical operator (key setup, one command, phone, next-person reset).

Two ways to run a session:

- **Build a stack** — tap the four stage cards (Baseline / Intention /
  Encounter / Growth) in any order, repeats allowed. Each queued piece runs as
  an equal block of the chosen per-piece length (default 1:15), speaks its own
  live cue at the block start, then holds silently. Numbered chips show the
  order; tap a chip to remove it.
- **Full session** — the canonical single pass: stages spaced across the true
  length you pick, with the Encounter near the break (~86%).

After **DONE**, one tap — **“Next person — run again”** — replays the same
stack with freshly generated cues; **Edit stack** returns to the picker with
the queue kept.

![setup](screenshot-setup.png) ![running](screenshot-running.png)

## Architecture (two parts)

```
  phone browser  ──POST /api/cue {stage}──▶  webapp/server.ts  ──▶  AnthropicCueGenerator
  (index.html)   ◀──── {cue text, tone} ────  (holds the key)        (the engine's live
   speaks it aloud, on real timing                                    generator)
```

- **`server.ts`** holds `ANTHROPIC_API_KEY` **server-side** and exposes
  `POST /api/cue` that runs the engine's real generator to produce one live,
  in-voice cue for a stage. The key is **never** sent to the browser. If
  generation fails (no key / flaky network) it returns the engine's hand-authored
  **safe-default** cue for that stage, so a stage is never silent.
- **`index.html`** bakes in **no cues at all**. On Start it fetches each stage's
  cue live from the server and speaks it. Stages run on the **true length** you
  pick — Baseline and Intention up front, a long silent "work" stretch, the
  **Encounter at the break** (~86% in), then Growth — and **no cue begins before
  the previous one finishes speaking**.

## Run it

Live cues need the key. Create a `.env` file next to `package.json` containing
`ANTHROPIC_API_KEY=sk-ant-...` — **the server auto-loads it itself**, so no
exported environment variables are needed (an already-exported variable still
wins if present). Then from the repo root:

```bash
npm run serve:app          # prints a localhost URL and your LAN URL(s)
```

- **On this machine:** open the printed `http://localhost:8787`.
- **On your phone (same Wi-Fi):** open the printed `http://<your-LAN-ip>:8787`.
  Earbuds in, volume up, tap **Start** (the first tap unlocks the voice on iPhone).

Without a key the app still runs end-to-end, but every cue is the safe-default
line for its stage (identical each time) — set the key to hear live, varied cues.

> Open it **through the server URL**, not as a `file://` — the page calls the
> server for every cue.

## Verify it

```bash
npm run verify:app         # starts the server, drives two sessions in headless Chromium
```

Checks: no key material in the page; the 10-minute schedule spaces the four
stages with the Encounter near the break; two consecutive sessions run in
lifecycle order with **no overlapping speech**; — when a key is present — the
two sessions' wording **differs** (proof of live generation, not a baked batch);
and a stack queued in arbitrary order (with a repeated stage) plays in exactly
that order with no overlap.
Requires Playwright (`npm i -D playwright && npx playwright install chromium`).

## Operator calibration (optional)

Open the app with `?operator=1` to reveal an **Operator calibration** box that
participants never see on the plain URL. Paste a four-line read of the person —
`CORE` / `STRONG` / `ABSENT` / `FAULT LINES`. It's sent with each cue request and
appended to the model's system prompt as a CALIBRATION section that shapes the
cue's **form** only (a "grinds-through" system gets subtracting cues; a
"no-breath-channel" system gets one move, not a sequence). The profile is
**never spoken**: the same guard that blocks internal vocabulary also rejects any
transcript that quotes the profile verbatim, or the "fault line" label. Blank box
→ behaviour is identical to before.

![operator calibration panel](screenshot-operator.png)

## The ENCOUNTER default is ESCAPE

The wall is, by default, the *quit-negotiation*: with no live condition detection,
ENCOUNTER cues target the `ESCAPE` condition — hold-not-push language ("Stay.",
"Don't answer it.", "Let it shake."), reframes that reattribute the present
sensation ("the shake is the muscle working"), never a demand for more.

## Safety

A high-priority prompt rule (and a matching note in `RUN_DEMO.md`): if the person
signals **sharp pain, joint pain, dizziness, or numbness**, the only cue is to
stop and reset — the hold applies to burn and shake, never to pain.

## What this MVP still isn't (Stage 2/3)

It fires on **time**, not on your heart rate; and it uses the browser's built-in
voice, not a premium one; live per-moment **condition detection** (which would let
it pick VELOCITY/RESOURCE/ALIGNMENT/TENSION/ESCAPE from the body in the moment,
and regenerate mid-stage on a change) is not wired yet. Those upgrades ride on
seams the backend already has (biometric trigger, swappable TTS, the relational
cue matrix). See the project README.
