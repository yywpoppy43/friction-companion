import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DIMS, CONVERTER, WEIGHTS, DEFAULT_WEIGHTS, scoreStructure, converterStrength, verdict, validateWeights, rebalanceWeights, remainderByLevel, pattern } from './sort-algorithm.mjs';

const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

test('the default weights object is the first setting', () => {
  assert.equal(DEFAULT_WEIGHTS.split.copyShare, WEIGHTS.copyShare);
  assert.equal(DEFAULT_WEIGHTS.split.imposedShare, WEIGHTS.imposedShare);
  for (const d of DIMS) assert.equal(DEFAULT_WEIGHTS.dims[d.key], d.w);
  for (const d of CONVERTER) assert.equal(DEFAULT_WEIGHTS.converter[d.key], d.w);
  assert.ok(validateWeights(DEFAULT_WEIGHTS).ok);
});

test('scoring with the default weights passed explicitly equals scoring with none', () => {
  const a = { object: 0.5, miss: 0.6, scope: 0.5, reason: 0, author: 0.45, exit: 1, grain: 1, felt: 6 };
  const s1 = scoreStructure(a, 0.3), s2 = scoreStructure(a, 0.3, DEFAULT_WEIGHTS);
  for (const key of ['copy', 'imp', 'warranted', 'conv', 'predicted', 'gap', 'remainder']) assert.equal(s1[key], s2[key]);
  assert.equal(converterStrength({ sentence: 0.4, speed: 0.6, follow: 0.4, seat: 0.7 }), converterStrength({ sentence: 0.4, speed: 0.6, follow: 0.4, seat: 0.7 }, DEFAULT_WEIGHTS));
});

test('the five fixtures yield the stated verdicts under default weights, converter not set', () => {
  const fixtures = [
    ['weekly class', { object: 0, miss: 0, scope: 0, reason: 0, author: 0.45, exit: 0, grain: 0 }, 'Trellis'],
    ['daily feelings check-in proposed by a friend', { object: 0.5, miss: 0.6, scope: 0.5, reason: 0, author: 0.45, exit: 1, grain: 1 }, 'Trellis with a mold in it'],
    ["the exam's standard answer", { object: 1, miss: 1, scope: 1, reason: 1, author: 1, exit: 1, grain: 1 }, 'Mold'],
    ['my cold-turkey rule', { object: 1, miss: 0.6, scope: 0.5, reason: 0, author: 0, exit: 1, grain: 1 }, 'Inner mold'],
    ['a schedule handed to me without asking', { object: 0, miss: 0, scope: 0, reason: 1, author: 1, exit: 0.4, grain: 1 }, 'Cage'],
  ];
  for (const [name, answers, kind] of fixtures) {
    const s = scoreStructure({ ...answers, felt: 5 }, null, DEFAULT_WEIGHTS);
    assert.equal(verdict(answers, s).kind, kind, name);
  }
});

test('a new weight version changes the displayed numbers and leaves the answers untouched', () => {
  const answers = Object.freeze({ object: 0, miss: 0, scope: 0, reason: 1, author: 1, exit: 0.4, grain: 1, felt: 6 });
  const before = scoreStructure(answers, null);
  const v2 = {
    split: { copyShare: 0.5, imposedShare: 0.5 },
    dims: { object: 0.4, miss: 0.3, scope: 0.15, reason: 0.15, author: 0.4, exit: 0.4, grain: 0.2 },
    converter: { sentence: 0.35, speed: 0.2, follow: 0.2, seat: 0.25 },
  };
  assert.ok(validateWeights(v2).ok);
  const after = scoreStructure(answers, null, v2);
  assert.notEqual(before.warranted, after.warranted);
  // imposed-share under v2: 0.4×1 + 0.4×0.4 + 0.2×1 = 0.76; copy-share 0.15; warranted = 10 × (0.5×0.15 + 0.5×0.76) = 4.55
  assert.ok(near(after.imp, 0.76));
  assert.ok(near(after.warranted, 4.55));
  assert.deepEqual(answers, { object: 0, miss: 0, scope: 0, reason: 1, author: 1, exit: 0.4, grain: 1, felt: 6 });
  assert.equal(after.weights, v2);
  // the same answers under the first setting again give the first numbers
  assert.equal(scoreStructure(answers, null, DEFAULT_WEIGHTS).warranted, before.warranted);
});

test('converter strength follows the converter weights of the version it is run under', () => {
  const answers = { sentence: 1, speed: 0, follow: 0, seat: 0 };
  assert.ok(near(converterStrength(answers), 0.35));
  const w = { ...DEFAULT_WEIGHTS, converter: { sentence: 0.5, speed: 0.2, follow: 0.1, seat: 0.2 } };
  assert.ok(near(converterStrength(answers, w), 0.5));
});

test('validateWeights names each side that does not sum to one', () => {
  const bad = {
    split: { copyShare: 0.6, imposedShare: 0.6 },
    dims: { object: 0.5, miss: 0.3, scope: 0.15, reason: 0.15, author: 0.55, exit: 0.25, grain: 0.1 },
    converter: { sentence: 0.35, speed: 0.2, follow: 0.2, seat: 0.25 },
  };
  const r = validateWeights(bad);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some(e => e.startsWith('split')));
  assert.ok(r.errors.some(e => e.includes('copy-side')));
  assert.ok(r.errors.some(e => e.includes('imposed-side')));
  assert.ok(!r.errors.some(e => e.startsWith('converter')));
  assert.equal(validateWeights(null).ok, false);
  assert.equal(validateWeights({ ...DEFAULT_WEIGHTS, dims: { ...DEFAULT_WEIGHTS.dims, grain: -0.2, exit: 0.65 } }).ok, false);
  assert.equal(validateWeights({ ...DEFAULT_WEIGHTS, converter: { sentence: 0.35, speed: 0.2, follow: 0.2 } }).ok, false);
});

test('rebalanceWeights sets one weight and rescales the rest so the group still sums to one', () => {
  const copy = { object: 0.4, miss: 0.3, scope: 0.15, reason: 0.15 };
  const r = rebalanceWeights(copy, 'object', 0.7);
  assert.equal(r.object, 0.7);
  assert.ok(near(r.miss + r.scope + r.reason, 0.3, 1e-9));
  assert.ok(near(Object.values(r).reduce((a, b) => a + b, 0), 1, 1e-9));
  // proportions among the others are kept: miss was 2× scope
  assert.ok(near(r.miss / r.scope, 2, 0.01));
  // the input is not changed
  assert.deepEqual(copy, { object: 0.4, miss: 0.3, scope: 0.15, reason: 0.15 });
  // when the others are all zero the rest is shared equally
  const z = rebalanceWeights({ a: 1, b: 0, c: 0 }, 'a', 0.4);
  assert.ok(near(z.b, 0.3) && near(z.c, 0.3));
  // values are clamped to 0–1
  assert.equal(rebalanceWeights(copy, 'object', 1.4).object, 1);
  assert.throws(() => rebalanceWeights(copy, 'nope', 0.5));
});

test('remainderByLevel gives a mean per dimension level, and n 0 with mean null where nothing sits', () => {
  const k = 0.5;
  const mk = (answers) => ({ answers, score: scoreStructure(answers, k) });
  const ps = [
    mk({ object: 0, miss: 0, scope: 0, reason: 0, author: 0, exit: 0, grain: 0, felt: 5 }),
    mk({ object: 0, miss: 0, scope: 0, reason: 0, author: 0, exit: 0, grain: 0, felt: 7 }),
    mk({ object: 1, miss: 1, scope: 1, reason: 1, author: 1, exit: 1, grain: 1, felt: 10 }),
  ];
  const b = remainderByLevel(ps, k);
  assert.deepEqual(Object.keys(b), DIMS.map(d => d.key));
  assert.equal(b.object.length, 3);
  assert.equal(b.object[0].n, 2);
  assert.ok(near(b.object[0].mean, (ps[0].score.remainder + ps[1].score.remainder) / 2));
  assert.equal(b.object[1].n, 0);
  assert.equal(b.object[1].mean, null);
  assert.equal(b.object[2].n, 1);
  assert.equal(b.object[0].label, DIMS[0].labels[0]);
  // with no converter the breakdown is of the gap
  const g = remainderByLevel(ps.map(p => ({ answers: p.answers, score: scoreStructure(p.answers, null) })), null);
  assert.ok(near(g.grain[0].mean, (ps[0].score.gap + ps[1].score.gap) / 2));
});

test('pattern still runs on scores produced under another weight version', () => {
  const v2 = { ...DEFAULT_WEIGHTS, split: { copyShare: 0.5, imposedShare: 0.5 } };
  const k = 0.7;
  const mk = (answers) => ({ answers, score: scoreStructure(answers, k, v2) });
  const p = pattern([
    mk({ object: 0, miss: 0, scope: 0, reason: 0, author: 0.45, exit: 0, grain: 0, felt: 7 }),
    mk({ object: 0, miss: 0, scope: 0, reason: 0, author: 0, exit: 0, grain: 1, felt: 7 }),
    mk({ object: 1, miss: 1, scope: 1, reason: 1, author: 1, exit: 1, grain: 1, felt: 10 }),
  ], k);
  assert.equal(p.ready, true);
  assert.equal(p.knot, 'converter');
});
