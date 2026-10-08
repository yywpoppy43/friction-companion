import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLegacy, locatePayloads, isoFromMillis, LEGACY_KEYS } from './legacy-import.mjs';

const SORT = [
  { id: '1717000000000', name: 'weekly class', a: { name: 'weekly class', felt: 3, object: 0, miss: 0, scope: 0, reason: 0, author: 0.45, exit: 0, grain: 0, complete: true }, sc: { copy: 0, imp: 0.2475, warranted: 1.11, conv: 0, predicted: 1.11, gap: 1.89, remainder: 1.89 }, kind: 'Trellis', cls: 'form' },
  { id: '1717000100000', name: 'my cold-turkey rule', a: { name: 'my cold-turkey rule', felt: 8, object: 1, miss: 0.6, scope: 0.5, reason: 0, author: 0, exit: 1, grain: 1, complete: true }, sc: {}, kind: 'Inner mold', cls: 'copy' },
];
const CONV = { c1: 0.75, c2: 0.6, c3: 0.8, c4: 0.7, complete: true };
const EXAM = [
  { id: '1717000200000', ts: 1717000200000, act: 'skipped the class', verb: '', level: 0.75, act2: 'the class was skipped once', adj: 'go Thursday', ground: 'worth', lat: 41 },
  { id: '1717000300000', ts: 1717000300000, act: 'forgot to send the thing', verb: 'typical', level: 0.4, act2: 'the file was not sent', adj: 'send it now', ground: 'intention', lat: 12 },
];

test('the full bundle keyed by the storage keys imports placements, converter and reps', () => {
  const bundle = { [LEGACY_KEYS.sort]: SORT, [LEGACY_KEYS.converter]: CONV, [LEGACY_KEYS.examiner]: EXAM };
  const r = parseLegacy(JSON.stringify(bundle));
  assert.deepEqual(r.warnings, []);
  assert.deepEqual(r.converter, { answers: { sentence: 0.75, speed: 0.6, follow: 0.8, seat: 0.7 } });
  assert.equal(r.placements.length, 2);
  assert.equal(r.placements[0].name, 'weekly class');
  assert.deepEqual(r.placements[0].answers, { object: 0, miss: 0, scope: 0, reason: 0, author: 0.45, exit: 0, grain: 0 });
  assert.equal(r.placements[0].felt, 3);
  assert.equal(r.placements[0].createdAt, new Date(1717000000000).toISOString());
  assert.equal(r.placements[0].legacyId, '1717000000000');
  assert.ok(!('sc' in r.placements[0]), 'computed scores are not carried over');
  assert.equal(r.reps.length, 2);
  assert.equal(r.reps[1].verbatim, 'typical');
  assert.equal(r.reps[0].verbatim, null);
  assert.equal(r.reps[0].actTranslation, 'the class was skipped once');
  assert.equal(r.reps[0].adjustment, 'go Thursday');
  assert.equal(r.reps[0].latencySec, 41);
  assert.equal(r.reps[0].createdAt, new Date(1717000200000).toISOString());
});

test('a localStorage dump with each value still a JSON string also imports', () => {
  const dump = { [LEGACY_KEYS.sort]: JSON.stringify(SORT), [LEGACY_KEYS.converter]: JSON.stringify(CONV), [LEGACY_KEYS.examiner]: JSON.stringify(EXAM) };
  const r = parseLegacy(dump);
  assert.equal(r.placements.length, 2);
  assert.equal(r.reps.length, 2);
  assert.ok(r.converter);
});

test('short keys and bare payloads are located', () => {
  assert.equal(parseLegacy({ sort: SORT }).placements.length, 2);
  assert.equal(parseLegacy(SORT).placements.length, 2);
  assert.equal(parseLegacy(EXAM).reps.length, 2);
  assert.deepEqual(parseLegacy(CONV).converter.answers, { sentence: 0.75, speed: 0.6, follow: 0.8, seat: 0.7 });
  const loc = locatePayloads({ converter: CONV });
  assert.equal(loc.converter, CONV);
  assert.equal(loc.sort, null);
});

test('bad answers are skipped with a warning instead of guessed', () => {
  const r = parseLegacy({ sort: [
    { id: '1717000000000', name: 'ok', a: { felt: 5, object: 0, miss: 0, scope: 0, reason: 0, author: 0, exit: 0, grain: 0 } },
    { id: '1717000000001', name: 'off-level', a: { felt: 5, object: 0.3, miss: 0, scope: 0, reason: 0, author: 0, exit: 0, grain: 0 } },
    { id: '1717000000002', name: 'missing', a: { felt: 5, object: 0, miss: 0, scope: 0, reason: 0, author: 0, exit: 0 } },
    { id: '1717000000003', name: 'felt out of range', a: { felt: 12, object: 0, miss: 0, scope: 0, reason: 0, author: 0, exit: 0, grain: 0 } },
    { id: '1717000000004', a: { felt: 5, object: 0, miss: 0, scope: 0, reason: 0, author: 0, exit: 0, grain: 0 } },
  ], examiner: [
    { id: '1717000000005', act: 'x', level: 0.5, act2: 'a', adj: 'b', ground: 'worth', lat: 3 },
    { id: '1717000000006', act: 'y', level: 0, act2: 'a', adj: 'b', ground: 'elsewhere', lat: 3 },
    { id: '1717000000007', act: 'z', level: 0, act2: 'a', adj: 'b', ground: 'none', lat: -4 },
  ], converter: { c1: 0.75, c2: 0.6, c3: 0.8 } });
  assert.equal(r.placements.length, 1);
  assert.equal(r.placements[0].name, 'ok');
  assert.equal(r.reps.length, 1);
  assert.equal(r.reps[0].latencySec, 0, 'a negative latency is floored at zero');
  assert.equal(r.converter, null);
  assert.equal(r.warnings.length, 7);
});

test('placements come back in time order', () => {
  const r = parseLegacy({ sort: [SORT[1], SORT[0]] });
  assert.equal(r.placements[0].name, 'weekly class');
});

test('empty input and non-JSON throw plain errors', () => {
  assert.throws(() => parseLegacy('   '), /nothing to import/);
  assert.throws(() => parseLegacy('{not json'));
  assert.equal(isoFromMillis('abc'), null);
  assert.equal(isoFromMillis(12), null);
  assert.equal(isoFromMillis('1717000000000'), new Date(1717000000000).toISOString());
});
