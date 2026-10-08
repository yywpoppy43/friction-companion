import { currentOwner } from '@/lib/session';
import { buildExport, stem, unauthorized } from '../rows';

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
    converterVersions: ws.converterVersions,
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
