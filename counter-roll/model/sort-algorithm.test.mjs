import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DIMS, CONVERTER, EXAMINER_LEVELS, scoreStructure, converterStrength, converterLabel, verdict, pattern, examinerTrend } from './sort-algorithm.mjs';

const near = (a, b, eps = 0.05) => Math.abs(a - b) <= eps;

test('weights sum to one on each side', () => {
  const copy = DIMS.filter(d => d.side === 'copy').reduce((s, d) => s + d.w, 0);
  const imp = DIMS.filter(d => d.side === 'imp').reduce((s, d) => s + d.w, 0);
  const conv = CONVERTER.reduce((s, d) => s + d.w, 0);
  assert.ok(near(copy, 1) && near(imp, 1) && near(conv, 1));
});

test('a pure form you authored, with an examiner converter, warrants nothing and feels nothing', () => {
  const k = converterStrength({ sentence: 0, speed: 0, follow: 0, seat: 0 });
  const a = { object: 0, miss: 0, scope: 0, reason: 0, author: 0, exit: 0, grain: 0, felt: 0 };
  const s = scoreStructure(a, k);
  assert.equal(s.warranted, 0);
  assert.equal(s.conv, 0);
  assert.equal(s.remainder, 0);
  const v = verdict(a, s);
  assert.equal(v.kind, 'Trellis');
  assert.equal(v.rung, 3);
});

test('a copy of you imposed by someone else is a mold near full alarm', () => {
  const a = { object: 1, miss: 1, scope: 1, reason: 1, author: 1, exit: 1, grain: 1, felt: 10 };
  const s = scoreStructure(a, null);
  assert.equal(s.copy, 1); assert.equal(s.imp, 1);
  assert.equal(s.warranted, 10);
  assert.equal(verdict(a, s).kind, 'Mold');
});

test('your own standard, held against yourself, is an inner mold on rung two', () => {
  const a = { object: 1, miss: 0.6, scope: 0.5, reason: 0, author: 0, exit: 1, grain: 1, felt: 7 };
  const s = scoreStructure(a, null);
  const v = verdict(a, s);
  assert.equal(v.kind, 'Inner mold');
  assert.equal(v.rung, 1);
  assert.match(v.text, /No end in sight/);
});

test('a form imposed without agreement is a cage, not a mold', () => {
  const a = { object: 0, miss: 0, scope: 0, reason: 1, author: 1, exit: 0.4, grain: 1, felt: 6 };
  const s = scoreStructure(a, null);
  assert.equal(verdict(a, s).kind, 'Cage');
});

test('the converter adds its share of the room above warranted, and explains a felt alarm on a pure form', () => {
  const k = converterStrength({ sentence: 0.75, speed: 0.6, follow: 0.8, seat: 0.7 }); // 0.2625+0.12+0.16+0.175 = 0.7175
  assert.ok(near(k, 0.7175, 0.001));
  assert.equal(converterLabel(k), 'the verdict');
  const a = { object: 0, miss: 0, scope: 0, reason: 0, author: 0.45, exit: 0, grain: 0, felt: 8 };
  const s = scoreStructure(a, k);
  // warranted = 10 * 0.45 * 0.55*0.45 = 10*(0 + 0.45*0.2475) = 1.11375
  assert.ok(near(s.warranted, 1.114, 0.01));
  assert.ok(near(s.conv, k * (10 - s.warranted), 0.001));
  assert.ok(Math.abs(s.remainder) < 1.5, 'the converter should explain most of an 8 on a pure agreed form');
  assert.match(verdict(a, s).text, /converter/);
});

test('pattern names the knot: converter explains forms', () => {
  const k = 0.7;
  const mk = (answers) => ({ answers, score: scoreStructure(answers, k) });
  const ps = [
    mk({ object: 0, miss: 0, scope: 0, reason: 0, author: 0.45, exit: 0, grain: 0, felt: 7 }),
    mk({ object: 0, miss: 0, scope: 0, reason: 0, author: 0, exit: 0, grain: 1, felt: 7 }),
    mk({ object: 1, miss: 1, scope: 1, reason: 1, author: 1, exit: 1, grain: 1, felt: 10 }),
  ];
  const p = pattern(ps, k);
  assert.equal(p.ready, true);
  assert.equal(p.knot, 'converter');
});

test('pattern names two knots when a remainder rides on authorship', () => {
  const k = 0.2;
  const mk = (answers) => ({ answers, score: scoreStructure(answers, k) });
  const ps = [
    mk({ object: 0, miss: 0, scope: 0, reason: 0, author: 1, exit: 0, grain: 0, felt: 9 }),
    mk({ object: 0, miss: 0, scope: 0, reason: 0, author: 0.45, exit: 0, grain: 0, felt: 8 }),
    mk({ object: 0, miss: 0, scope: 0, reason: 0, author: 0, exit: 0, grain: 0, felt: 2 }),
  ];
  const p = pattern(ps, k);
  assert.equal(p.knot, 'converter+authorship');
});

test('fewer than three placements is not a pattern', () => {
  assert.equal(pattern([], null).ready, false);
});

test('examiner levels match the converter sentence levels', () => {
  assert.deepEqual(EXAMINER_LEVELS.map(l => l.value), CONVERTER[0].levels);
});

test('examiner trend: level and latency both falling reads as falling', () => {
  const reps = [
    { level: 1, latencySec: 90 }, { level: 0.75, latencySec: 70 },
    { level: 0.4, latencySec: 30 }, { level: 0, latencySec: 12 },
  ];
  const t = examinerTrend(reps);
  assert.equal(t.ready, true);
  assert.equal(t.level, 'falling');
  assert.equal(t.latency, 'falling');
});

test('examiner trend: fewer than four reps is not a trend', () => {
  assert.equal(examinerTrend([{ level: 1, latencySec: 10 }]).ready, false);
});

test('a missing answer throws instead of guessing', () => {
  assert.throws(() => scoreStructure({ object: 0 }, null));
  assert.throws(() => converterStrength({ sentence: 0 }));
});
