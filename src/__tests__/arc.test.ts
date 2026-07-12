import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_ARC,
  planSchedule,
  validateArc,
  resolveArc,
  toPublicArc,
  ArcError,
  type SessionArc,
} from '../session/arc.ts';
import { FrictionState } from '../domain/friction-state.ts';

test('DEFAULT_ARC is valid and mirrors the design doc boundaries', () => {
  validateArc(DEFAULT_ARC);
  assert.deepEqual(
    DEFAULT_ARC.stages.map((s) => [s.state, s.startAt]),
    [
      [FrictionState.BASELINE, 0.0],
      [FrictionState.INTENTION, 0.18],
      [FrictionState.ENCOUNTER, 0.4],
      [FrictionState.GROWTH, 0.8],
    ],
  );
  assert.equal(DEFAULT_ARC.wallAt, 0.62);
});

test('schedule places every stage across the true session length', () => {
  const schedule = planSchedule(DEFAULT_ARC);
  const total = DEFAULT_ARC.stages.reduce((n, s) => n + s.cues, 0);
  assert.equal(schedule.length, total);

  // Every configured state is represented, in stage order.
  const statesInOrder = schedule.map((m) => m.state);
  const firstIndexOf = (s: FrictionState) => statesInOrder.indexOf(s);
  assert.ok(firstIndexOf(FrictionState.BASELINE) < firstIndexOf(FrictionState.INTENTION));
  assert.ok(firstIndexOf(FrictionState.INTENTION) < firstIndexOf(FrictionState.ENCOUNTER));
  assert.ok(firstIndexOf(FrictionState.ENCOUNTER) < firstIndexOf(FrictionState.GROWTH));

  // Nothing lands before 0 or after the session end.
  for (const m of schedule) {
    assert.ok(m.atMs >= 0 && m.atMs <= DEFAULT_ARC.lengthMs, `moment ${m.index} in range`);
  }
});

test('the wedge lands exactly on the wall and is the felt-event peak', () => {
  const schedule = planSchedule(DEFAULT_ARC);
  const wedges = schedule.filter((m) => m.kind === 'wedge');
  assert.equal(wedges.length, 1, 'exactly one wedge');
  const wedge = wedges[0]!;
  assert.equal(wedge.state, FrictionState.ENCOUNTER);
  assert.equal(wedge.atMs, Math.round(DEFAULT_ARC.wallAt * DEFAULT_ARC.lengthMs));
  // Intensity plateaus at 1 at the wall — the plateau is the felt event.
  assert.equal(wedge.intensity, 1);
});

test('encounter cues all cluster inside the wall window', () => {
  const schedule = planSchedule(DEFAULT_ARC);
  const [w0, w1] = DEFAULT_ARC.wallWindow;
  const encounters = schedule.filter((m) => m.state === FrictionState.ENCOUNTER);
  assert.equal(encounters.length, 3);
  for (const m of encounters) {
    assert.ok(
      m.progress >= w0 - 1e-9 && m.progress <= w1 + 1e-9,
      `encounter at ${m.progress} within [${w0}, ${w1}]`,
    );
  }
});

test('consecutive moments always respect the minimum gap (no cue can overlap)', () => {
  const schedule = planSchedule(DEFAULT_ARC);
  for (let i = 1; i < schedule.length; i++) {
    const gap = schedule[i]!.atMs - schedule[i - 1]!.atMs;
    assert.ok(
      gap >= DEFAULT_ARC.minGapMs - 1, // allow 1ms rounding
      `gap ${gap} >= minGap ${DEFAULT_ARC.minGapMs} between ${i - 1} and ${i}`,
    );
  }
});

test('min-gap enforcement never drifts the wedge off the wall', () => {
  // A cramped window with several cues forces the gap-enforcer to shuffle; the
  // wedge must still land precisely on the wall.
  const arc: SessionArc = resolveArc({
    lengthMs: 60_000,
    stages: [
      { state: FrictionState.BASELINE, startAt: 0, cues: 1 },
      { state: FrictionState.INTENTION, startAt: 0.18, cues: 2 },
      { state: FrictionState.ENCOUNTER, startAt: 0.4, cues: 5 },
      { state: FrictionState.GROWTH, startAt: 0.8, cues: 2 },
    ],
    wallWindow: [0.5, 0.72],
    wallAt: 0.62,
    minGapMs: 2_000,
  });
  const schedule = planSchedule(arc);
  const wedge = schedule.find((m) => m.kind === 'wedge')!;
  assert.equal(wedge.atMs, Math.round(arc.wallAt * arc.lengthMs));
  for (let i = 1; i < schedule.length; i++) {
    assert.ok(schedule[i]!.atMs - schedule[i - 1]!.atMs >= arc.minGapMs - 1);
  }
});

test('placement scales with session length (it is proportional, not hard-coded)', () => {
  const short = planSchedule(resolveArc({ lengthMs: 20 * 60_000 }));
  const long = planSchedule(resolveArc({ lengthMs: 40 * 60_000 }));
  assert.equal(short.length, long.length);
  // Same proportional layout: progress values match; absolute times double.
  for (let i = 0; i < short.length; i++) {
    assert.ok(Math.abs(short[i]!.progress - long[i]!.progress) < 1e-6, `moment ${i} same progress`);
    assert.ok(Math.abs(long[i]!.atMs - short[i]!.atMs * 2) <= 2, `moment ${i} time scales`);
  }
});

test('changing a parameter changes the arc — no code touched', () => {
  const moved = planSchedule(resolveArc({ wallAt: 0.55, wallWindow: [0.45, 0.65] }));
  const wedge = moved.find((m) => m.kind === 'wedge')!;
  assert.equal(wedge.progress > 0.54 && wedge.progress < 0.56, true);
});

test('validateArc rejects structurally invalid arcs', () => {
  assert.throws(() => validateArc(resolveArc({ lengthMs: 0 })), ArcError);
  assert.throws(
    () => validateArc(resolveArc({ wallAt: 0.9, wallWindow: [0.4, 0.7] })),
    ArcError,
    'wall outside window',
  );
  assert.throws(
    () =>
      validateArc(
        resolveArc({
          stages: [
            { state: FrictionState.INTENTION, startAt: 0.1, cues: 1 }, // first must start at 0
          ],
        }),
      ),
    ArcError,
  );
});

test('toPublicArc exposes only client-safe fields', () => {
  const pub = toPublicArc(DEFAULT_ARC);
  assert.deepEqual(Object.keys(pub).sort(), ['lengthMs', 'minGapMs', 'stages', 'wallAt']);
  for (const s of pub.stages) assert.deepEqual(Object.keys(s).sort(), ['startAt', 'state']);
});
