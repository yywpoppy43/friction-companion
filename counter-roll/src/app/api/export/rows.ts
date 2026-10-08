import 'server-only';
import { ensureOwner, loadWorkspace } from '@/db/queries';
import { activeWeightVersion, scoreAll } from '@/lib/compute';
import { placementRows, type ExportRow } from '@model/export-rows.mjs';
import type { WeightVersion, Workspace } from '@/lib/types';

export interface ExportSet { ws: Workspace; weights: WeightVersion; rows: ExportRow[]; exportedAt: string }

/**
 * Everything both export routes share: the workspace, the active weight version, and every placement
 * laid out as a flat row with its raw answers and the scores under those weights. Each placement runs
 * under the converter version recorded when it was made. No arithmetic here: scoreAll and placementRows do it.
 */
export async function buildExport(ownerId: string): Promise<ExportSet> {
  await ensureOwner(ownerId);
  const ws = await loadWorkspace(ownerId);
  const weights = activeWeightVersion(ws);
  const scored = scoreAll(ws, weights.weights, 'recorded');
  const rows = placementRows(scored.map((s) => ({
    id: s.placement.id,
    structure: s.placement.structure,
    createdAt: s.placement.createdAt,
    parentPlacementId: s.placement.parentPlacementId,
    answers: s.placement.answers,
    felt: s.placement.felt,
    converterVersionId: s.placement.converterVersionId,
    weightVersionId: s.placement.weightVersionId,
    runConverterVersionId: s.converter?.id ?? null,
    runWeightVersionId: weights.id,
    k: s.k,
    score: s.score,
    verdict: s.verdict,
  })));
  return { ws, weights, rows, exportedAt: new Date().toISOString() };
}

/** "counter-roll-2026-10-08" — the date part of an ISO stamp. */
export const stem = (exportedAt: string): string => `counter-roll-${exportedAt.slice(0, 10)}`;

export const unauthorized = (): Response => Response.json({ error: 'not signed in' }, { status: 401 });
