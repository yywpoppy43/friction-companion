import { currentOwner } from '@/lib/session';
import { buildExport, stem, unauthorized } from '../rows';
import { kOf } from '@/lib/compute';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** GET /api/export/json — everything: versions, structures, placements as rows, reps. Pretty-printed. */
export async function GET(): Promise<Response> {
  const ownerId = await currentOwner();
  if (!ownerId) return unauthorized();
  const { ws, weights, rows, exportedAt } = await buildExport(ownerId);
  const body = JSON.stringify({
    exportedAt,
    activeWeightVersion: weights,
    weightVersions: ws.weightVersions,
    // k under the active weights, like every other number in the file; kAtCreation is what the weights of its day gave
    converterVersions: ws.converterVersions.map((v) => ({ id: v.id, answers: v.answers, createdAt: v.createdAt, k: kOf(v, weights.weights), kAtCreation: v.k })),
    structures: ws.structures,
    placements: rows,
    reps: ws.reps,
  }, null, 2);
  return new Response(body, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${stem(exportedAt)}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}
