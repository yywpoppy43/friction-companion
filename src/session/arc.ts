/**
 * The Session Arc — the real-timing scheduler (Build Stage 1, "real timing" fix).
 *
 * The prototype used to run on a compressed clock, so cues cut each other off.
 * This module fixes that by reading the session's timing entirely from
 * PARAMETERS (a {@link SessionArc}) and placing cue moments across the *true*
 * session length. Nothing here is hard-coded to a specific clock: the starting
 * values in {@link DEFAULT_ARC} come straight from the Session Arc design doc and
 * are defaults an operator tunes. Changing the arc is changing a parameter, never
 * touching this code.
 *
 * The four stages are the four {@link FrictionState}s in order (BASELINE →
 * INTENTION → ENCOUNTER → GROWTH) — this build does not reinvent the state
 * machine, it lays those states on a clock. Intensity per moment is read from the
 * engine's own {@link intensityAt} curve model, so the plateau at the wall (the
 * felt event) is a genuine curve value, not a guess.
 *
 * {@link planSchedule} is PURE (no clock, no I/O) and unit-tested in isolation.
 * The server computes the schedule once at session start and hands the ordered
 * {@link CueMoment}[] to the phone client, which executes it and enforces the
 * no-overlap queue against real audio duration.
 */

import type { Millis, Unit } from '../domain/units.ts';
import { clamp01 } from '../domain/units.ts';
import { FrictionState, FRICTION_STATES } from '../domain/friction-state.ts';
import { intensityAt, validateCurve, type IntensityCurve } from '../domain/session.ts';

/** One stage on the clock: a friction state, where it begins, and how many cues. */
export interface StageSpec {
  /** The friction state this stage delivers cues for. */
  state: FrictionState;
  /** Progress in [0,1] at which this stage begins. The first stage must start at 0. */
  startAt: Unit;
  /** How many cue moments to place inside this stage (sparse early, more at the wall). */
  cues: number;
}

/**
 * The full timing design. Every field is a tunable parameter; {@link DEFAULT_ARC}
 * seeds them from the Session Arc doc. A stage's time span runs from its `startAt`
 * to the next stage's `startAt` (the last stage runs to the end of the session).
 */
export interface SessionArc {
  /** True total session length in ms (a real workout, not a compressed demo). */
  lengthMs: Millis;
  /** The four stages, in order, each with a start boundary and a cue count. */
  stages: readonly StageSpec[];
  /**
   * Where the wall lands, as progress in [0,1]. The ENCOUNTER "wedge" cue — the
   * felt event, "lean into the shake" — fires at exactly this point.
   */
  wallAt: Unit;
  /**
   * The window (progress `[from,to]`) the ENCOUNTER cues cluster inside, straddling
   * the wall. Encounter cues land here so the intervention is dense at the wall.
   */
  wallWindow: readonly [Unit, Unit];
  /**
   * Minimum gap between consecutive cue moments (ms). This is the one timing value
   * that is absolute rather than proportional — a spoken cue is a fixed few seconds
   * no matter how long the session is. The client's playback queue enforces it
   * against *real* audio so no cue ever cuts off the one before it; planning honours
   * it too so the schedule never asks for the impossible.
   */
  minGapMs: Millis;
  /**
   * The intensity curve over the session (the engine's own model). Default climbs
   * to a plateau of 1 at the wall, then a recovery tail through GROWTH — mirroring
   * the design doc's intensity line. Intensity shades each generated cue.
   */
  curve: IntensityCurve;
}

/** What kind of moment this is — drives presentation and the felt-event beat. */
export type CueKind = 'anchor' | 'sparse' | 'cluster' | 'wedge' | 'closing';

/** A single scheduled cue moment on the true clock. */
export interface CueMoment {
  /** Zero-based order in the session. */
  index: number;
  /** Offset from session start, in ms. */
  atMs: Millis;
  /** Progress in [0,1] at this moment. */
  progress: Unit;
  /** The friction state to draw a cue for (the stage's state). */
  state: FrictionState;
  /** The moment's role — `wedge` is the one at the wall (the felt event). */
  kind: CueKind;
  /** Intensity at this moment, evaluated from the arc's curve in [0,1]. */
  intensity: Unit;
}

/**
 * Default arc — the Session Arc design doc, verbatim, as tunable parameters.
 *
 * Stage boundaries 0 / 18 / 40 / 80 %, the wall at ~62 %, the ENCOUNTER cluster
 * straddling it, cue counts sparse early and dense at the wall. The example clock
 * is a 30-minute session; an operator sets `lengthMs` to the real class length
 * and every placement scales with it.
 */
export const DEFAULT_ARC: SessionArc = {
  lengthMs: 30 * 60_000,
  stages: [
    { state: FrictionState.BASELINE, startAt: 0.0, cues: 1 },
    { state: FrictionState.INTENTION, startAt: 0.18, cues: 2 },
    { state: FrictionState.ENCOUNTER, startAt: 0.4, cues: 3 },
    { state: FrictionState.GROWTH, startAt: 0.8, cues: 2 },
  ],
  wallAt: 0.62,
  wallWindow: [0.46, 0.74],
  minGapMs: 12_000,
  // Climb to the plateau at the wall (0.62), then the recovery tail — the doc's line.
  curve: {
    kind: 'custom',
    points: [
      { at: 0.0, intensity: 0.15 },
      { at: 0.18, intensity: 0.28 },
      { at: 0.4, intensity: 0.6 },
      { at: 0.55, intensity: 0.9 },
      { at: 0.62, intensity: 1.0 },
      { at: 0.7, intensity: 0.95 },
      { at: 0.8, intensity: 0.55 },
      { at: 1.0, intensity: 0.2 },
    ],
  },
};

/** Thrown when a {@link SessionArc} is structurally invalid. */
export class ArcError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ArcError';
  }
}

/** Validate an arc, throwing {@link ArcError} before any placement is attempted. */
export function validateArc(arc: SessionArc): void {
  if (!(arc.lengthMs > 0)) throw new ArcError(`lengthMs must be > 0, got ${arc.lengthMs}`);
  if (arc.stages.length === 0) throw new ArcError('arc must have at least one stage');
  if (arc.stages[0]!.startAt !== 0) throw new ArcError('the first stage must start at 0');

  let prev = -1;
  for (const stage of arc.stages) {
    if (!(stage.startAt >= 0 && stage.startAt <= 1)) {
      throw new ArcError(`stage.startAt must be within [0,1], got ${stage.startAt}`);
    }
    if (stage.startAt <= prev) {
      throw new ArcError('stage.startAt values must be strictly increasing');
    }
    if (!(stage.cues >= 0)) throw new ArcError(`stage.cues must be >= 0, got ${stage.cues}`);
    if (!(FRICTION_STATES as readonly string[]).includes(stage.state)) {
      throw new ArcError(`unknown stage.state ${stage.state}`);
    }
    prev = stage.startAt;
  }

  const [w0, w1] = arc.wallWindow;
  if (!(w0 >= 0 && w1 <= 1 && w0 < w1)) {
    throw new ArcError(`wallWindow must be [from,to] within [0,1] with from<to, got [${w0}, ${w1}]`);
  }
  if (!(arc.wallAt >= w0 && arc.wallAt <= w1)) {
    throw new ArcError(`wallAt (${arc.wallAt}) must lie inside wallWindow [${w0}, ${w1}]`);
  }
  if (!(arc.minGapMs >= 0)) throw new ArcError(`minGapMs must be >= 0, got ${arc.minGapMs}`);
  validateCurve(arc.curve);
}

/** Merge partial overrides over the {@link DEFAULT_ARC}. Operator-tuning entry point. */
export function resolveArc(overrides?: Partial<SessionArc>): SessionArc {
  return { ...DEFAULT_ARC, ...(overrides ?? {}) };
}

/** The time span [startMs, endMs) a stage occupies, from its start to the next stage. */
function stageSpanMs(arc: SessionArc, i: number): { startMs: Millis; endMs: Millis } {
  const stage = arc.stages[i]!;
  const next = arc.stages[i + 1];
  const startMs = stage.startAt * arc.lengthMs;
  const endMs = (next ? next.startAt : 1) * arc.lengthMs;
  return { startMs, endMs };
}

/** Evenly place `count` points across `[startMs, endMs]` inclusive of both ends. */
function spread(startMs: Millis, endMs: Millis, count: number): Millis[] {
  if (count <= 0) return [];
  if (count === 1) return [(startMs + endMs) / 2];
  const step = (endMs - startMs) / (count - 1);
  const out: Millis[] = [];
  for (let i = 0; i < count; i++) out.push(startMs + step * i);
  return out;
}

/**
 * Place `count` cues in the interior of `[startMs, endMs)` by dividing the span
 * into `count + 1` equal parts — cues at k/(count+1) for k = 1..count. This is
 * fully proportional (no absolute lead-in), so the layout is self-similar: it
 * looks identical at any session length and simply scales with it.
 */
function interior(startMs: Millis, endMs: Millis, count: number): Millis[] {
  const out: Millis[] = [];
  for (let k = 1; k <= count; k++) out.push(startMs + ((endMs - startMs) * k) / (count + 1));
  return out;
}

/**
 * Place the ENCOUNTER cues inside the wall window, with exactly one landing on the
 * wall (the wedge). The remaining cues spread across the window; the slot nearest
 * the wall is snapped onto it and flagged.
 */
function planEncounter(arc: SessionArc): { atMs: Millis; kind: CueKind }[] {
  const stageIndex = arc.stages.findIndex((s) => s.state === FrictionState.ENCOUNTER);
  const count = stageIndex >= 0 ? arc.stages[stageIndex]!.cues : 0;
  const wallMs = arc.wallAt * arc.lengthMs;
  if (count <= 0) return [];
  if (count === 1) return [{ atMs: wallMs, kind: 'wedge' }];

  const [w0, w1] = arc.wallWindow;
  const slots = spread(w0 * arc.lengthMs, w1 * arc.lengthMs, count);

  // Snap the slot closest to the wall onto the wall exactly, and mark it the wedge.
  let wedgeSlot = 0;
  for (let i = 1; i < slots.length; i++) {
    if (Math.abs(slots[i]! - wallMs) < Math.abs(slots[wedgeSlot]! - wallMs)) wedgeSlot = i;
  }
  return slots.map((atMs, i) =>
    i === wedgeSlot ? { atMs: wallMs, kind: 'wedge' as CueKind } : { atMs, kind: 'cluster' as CueKind },
  );
}

/** The non-encounter role for a stage's cues, given its state. */
function stageKind(state: FrictionState): CueKind {
  if (state === FrictionState.BASELINE) return 'anchor';
  if (state === FrictionState.GROWTH) return 'closing';
  return 'sparse';
}

/**
 * Guarantee every adjacent pair is at least `minGapMs` apart, in place, on an
 * already time-sorted list. The wedge is the anchor: we sweep OUTWARD from it —
 * pushing later moments forward and pulling earlier moments backward — so the
 * wall never drifts and the sweep only ever moves a moment away from the wedge.
 * Because each pass moves times monotonically in one direction, the sort order is
 * preserved and no re-sort is needed. With no wedge, a plain forward pass runs.
 */
function enforceMinGap(
  raw: { atMs: Millis; kind: CueKind }[],
  minGapMs: Millis,
  lengthMs: Millis,
): void {
  if (raw.length < 2) return;
  const wedge = raw.findIndex((m) => m.kind === 'wedge');

  if (wedge < 0) {
    for (let i = 1; i < raw.length; i++) {
      const minAt = raw[i - 1]!.atMs + minGapMs;
      if (raw[i]!.atMs < minAt) raw[i]!.atMs = Math.min(minAt, lengthMs);
    }
    return;
  }

  // Forward of the wedge: each moment must sit at least minGap after its predecessor.
  for (let i = wedge + 1; i < raw.length; i++) {
    const minAt = raw[i - 1]!.atMs + minGapMs;
    if (raw[i]!.atMs < minAt) raw[i]!.atMs = Math.min(minAt, lengthMs);
  }
  // Backward of the wedge: each moment must sit at least minGap before its successor.
  for (let i = wedge - 1; i >= 0; i--) {
    const maxAt = raw[i + 1]!.atMs - minGapMs;
    if (raw[i]!.atMs > maxAt) raw[i]!.atMs = Math.max(0, maxAt);
  }
}

/**
 * Plan the ordered cue schedule for a session from its arc — the whole real-timing
 * fix in one pure function.
 *
 * Guarantees:
 *   - the four stages are placed across the TRUE session length (everything scales
 *     with `lengthMs`);
 *   - the ENCOUNTER cues land inside the wall window, with the wedge exactly on the
 *     wall;
 *   - consecutive moments are at least `minGapMs` apart (later moments are pushed
 *     back if needed — the wedge is held on the wall and its neighbours give way),
 *     so the plan never asks two cues to overlap;
 *   - each moment carries its curve intensity, so the plateau at the wall is real.
 */
export function planSchedule(arc: SessionArc): CueMoment[] {
  validateArc(arc);

  const raw: { atMs: Millis; state: FrictionState; kind: CueKind }[] = [];

  arc.stages.forEach((stage, i) => {
    if (stage.state === FrictionState.ENCOUNTER) {
      for (const m of planEncounter(arc)) raw.push({ atMs: m.atMs, state: stage.state, kind: m.kind });
      return;
    }
    if (stage.cues <= 0) return;
    const { startMs, endMs } = stageSpanMs(arc, i);
    for (const atMs of interior(startMs, endMs, stage.cues)) {
      raw.push({ atMs, state: stage.state, kind: stageKind(stage.state) });
    }
  });

  raw.sort((a, b) => a.atMs - b.atMs);
  enforceMinGap(raw, arc.minGapMs, arc.lengthMs);

  return raw.map((m, index) => {
    const progress = clamp01(m.atMs / arc.lengthMs);
    return {
      index,
      atMs: Math.round(m.atMs),
      progress,
      state: m.state,
      kind: m.kind,
      intensity: intensityAt(arc.curve, progress),
    };
  });
}

/** A compact, client-safe view of the arc (no internal fields to leak). */
export interface PublicArc {
  lengthMs: Millis;
  wallAt: Unit;
  minGapMs: Millis;
  stages: { state: FrictionState; startAt: Unit }[];
}

/** Project an arc down to the fields the phone client needs. */
export function toPublicArc(arc: SessionArc): PublicArc {
  return {
    lengthMs: arc.lengthMs,
    wallAt: arc.wallAt,
    minGapMs: arc.minGapMs,
    stages: arc.stages.map((s) => ({ state: s.state, startAt: s.startAt })),
  };
}
