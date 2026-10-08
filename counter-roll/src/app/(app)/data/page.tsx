import type { Metadata } from 'next';
import { requireOwner } from '@/lib/session';
import { loadWorkspace } from '@/db/queries';
import { DataScreen } from './DataScreen';
import './data.css';

export const metadata: Metadata = { title: 'Data' };

/**
 * Data — carry over, take out. Import brings the reference page's browser entries in as raw answers;
 * export hands back every placement with its raw answers and the scores under the active weights.
 * The page only counts; the import goes through importLegacyAction, the export through /api/export.
 */
export default async function DataPage() {
  const ownerId = await requireOwner();
  const ws = await loadWorkspace(ownerId);
  return (
    <DataScreen
      counts={{
        placements: ws.placements.length,
        reps: ws.reps.length,
        converterVersions: ws.converterVersions.length,
        weightVersions: ws.weightVersions.length,
      }}
    />
  );
}
