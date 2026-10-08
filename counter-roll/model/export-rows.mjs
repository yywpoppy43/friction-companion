/**
 * The Counter-Roll — export rows. Pure functions.
 * Takes placements that already carry their computed score and verdict (from sort-algorithm.mjs)
 * and lays them out as flat rows for JSON and CSV. No arithmetic here.
 */
import { DIMS } from './sort-algorithm.mjs';

export const EXPORT_COLUMNS = Object.freeze([
  'placement_id', 'structure', 'created_at', 'parent_placement_id',
  ...DIMS.map(d => d.key), 'felt',
  'converter_version_id', 'k', 'weight_version_id',
  'copy_share', 'imposed_share', 'warranted', 'converter_share', 'predicted', 'gap', 'remainder',
  'verdict', 'rung',
]);

const r3 = (x) => (x == null ? null : Math.round(x * 1000) / 1000);

/**
 * @param {Array<{ id: string, structure: string, createdAt: string, parentPlacementId: string|null, answers: Record<string, number>, felt: number,
 *                 converterVersionId: string|null, weightVersionId: string|null, k: number|null, score: any, verdict: { kind: string, rung: number } }>} placements
 */
export function placementRows(placements) {
  return placements.map(p => {
    const row = {
      placement_id: p.id,
      structure: p.structure,
      created_at: p.createdAt,
      parent_placement_id: p.parentPlacementId ?? null,
    };
    for (const d of DIMS) row[d.key] = p.answers[d.key];
    row.felt = p.felt;
    row.converter_version_id = p.converterVersionId ?? null;
    row.k = r3(p.k);
    row.weight_version_id = p.weightVersionId ?? null;
    row.copy_share = r3(p.score.copy);
    row.imposed_share = r3(p.score.imp);
    row.warranted = r3(p.score.warranted);
    row.converter_share = r3(p.score.conv);
    row.predicted = r3(p.score.predicted);
    row.gap = r3(p.score.gap);
    row.remainder = r3(p.score.remainder);
    row.verdict = p.verdict.kind;
    row.rung = p.verdict.rung;
    return row;
  });
}

export function csvCell(v) {
  if (v == null) return '';
  const s = String(v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export function toCsv(rows, columns = EXPORT_COLUMNS) {
  const lines = [columns.map(csvCell).join(',')];
  for (const row of rows) lines.push(columns.map(c => csvCell(row[c])).join(','));
  return lines.join('\r\n') + '\r\n';
}
