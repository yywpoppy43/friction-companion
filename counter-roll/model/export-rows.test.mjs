import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreStructure, verdict } from './sort-algorithm.mjs';
import { placementRows, toCsv, csvCell, EXPORT_COLUMNS } from './export-rows.mjs';

const answers = { object: 0, miss: 0, scope: 0, reason: 1, author: 1, exit: 0.4, grain: 1, felt: 6 };
const score = scoreStructure(answers, 0.3);
const p = { id: 'p1', structure: 'a schedule, "handed" to me', createdAt: '2026-10-01T00:00:00.000Z', parentPlacementId: null, answers, felt: 6, converterVersionId: 'c1', weightVersionId: 'w1', k: 0.3, score, verdict: verdict(answers, score) };

test('rows carry raw answers and computed scores side by side', () => {
  const [row] = placementRows([p]);
  assert.equal(row.structure, 'a schedule, "handed" to me');
  assert.equal(row.object, 0); assert.equal(row.reason, 1); assert.equal(row.exit, 0.4);
  assert.equal(row.felt, 6);
  assert.equal(row.k, 0.3);
  assert.equal(row.warranted, Math.round(score.warranted * 1000) / 1000);
  assert.equal(row.verdict, 'Cage');
  assert.equal(row.rung, 0);
  for (const c of EXPORT_COLUMNS) assert.ok(c in row, c);
});

test('csv escapes quotes, commas and newlines and uses the column order', () => {
  assert.equal(csvCell('plain'), 'plain');
  assert.equal(csvCell('a, b'), '"a, b"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell(null), '');
  const csv = toCsv(placementRows([p]));
  const lines = csv.split('\r\n');
  assert.equal(lines[0], EXPORT_COLUMNS.join(','));
  assert.ok(lines[1].startsWith('p1,"a schedule, ""handed"" to me",2026-10-01T00:00:00.000Z,,0,0,0,1,1,0.4,1,6,c1,0.3,w1,'));
  assert.equal(lines.at(-1), '');
});
