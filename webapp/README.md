# Friction Companion — Stage-1 web app (press Start → hear it)

A single, self-contained web page that lets you **actually feel** the engine: tap
**Start**, do your workout, and hear the cues spoken aloud at the right moments —
Baseline → Intention → Encounter → Growth, looping for each "hard push" (round).

It needs no install, no server, no account, and no network. It uses your
device's **built-in voice** (the same speech your phone uses for navigation), so
it works offline once the page is open.

![setup](screenshot-setup.png) ![running](screenshot-running.png)

## Use it on your phone (easiest)

1. Get `index.html` onto your phone — email it to yourself, drop it in iCloud/
   Drive, or open this repo's file on the phone.
2. Open it in **Safari** (iPhone) or **Chrome** (Android).
3. Put in earbuds, turn the volume up, pick a length and number of hard pushes,
   and tap **Start**. (The first tap is what unlocks the voice on iPhone.)
4. Tap the **1-min taste** button for a quick full run-through.

> Tip: keep the screen on. The app asks to hold a "wake lock" where supported,
> but some phones still dim — set your auto-lock longer for a real session.

## Use it on a laptop

Just open `webapp/index.html` in any modern browser and press Start; it speaks
through the computer's speakers. From this repo you can also serve it:

```bash
npx http-server webapp        # then open the printed http://… URL
```

## How faithful is this to the real engine?

This is a deliberately small **Stage 1**: it reproduces the engine's lifecycle —
the Baseline anchor, the silent "tracking" phase, the tipping-point Encounter,
and the Growth consolidation, looping per round — and speaks a cue at each beat.

The cues baked into the page (`CORPUS` in `index.html`) are **real cues produced
by the engine's live Anthropic generator** (see `npm run session:live` at the
repo root), mirroring how the production engine's default source is a static
corpus. What this MVP does *not* yet include: live per-moment generation, the
biometric trigger (it fires on time, not on your heart rate), and the full
relational cue-selection matrix. Those are the Stage-2/3 upgrades described in
the project README — and the backend already has the seams for them.
