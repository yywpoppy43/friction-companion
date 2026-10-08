import { currentOwner } from '@/lib/session';
import { toCsv } from '@model/export-rows.mjs';
import { buildExport, stem, unauthorized } from '../rows';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** GET /api/export/csv — one row per placement: raw answers and the scores under the active weights. */
export async function GET(): Promise<Response> {
  const ownerId = await currentOwner();
  if (!ownerId) return unauthorized();
  const { rows, exportedAt } = await buildExport(ownerId);
  return new Response(toCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${stem(exportedAt)}-placements.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
