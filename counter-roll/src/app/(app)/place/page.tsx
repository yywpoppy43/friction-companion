import type { Metadata } from 'next';
import { requireOwner } from '@/lib/session';
import { loadWorkspace } from '@/db/queries';
import { activeConverter, activeWeightVersion, kOf, scoreAll } from '@/lib/compute';
import type { MapPoint } from '@/components/readout/MapSvg';
import { PlaceScreen } from './PlaceScreen';

export const metadata: Metadata = { title: 'Place' };

/**
 * Place — name a structure, answer the seven, set felt. The readout computes live in the client;
 * placing stores the raw answers. Earlier placements are drawn on the map under the active weights,
 * each under the converter version recorded when it was made.
 */
export default async function PlacePage() {
  const ownerId = await requireOwner();
  const ws = await loadWorkspace(ownerId);
  const weights = activeWeightVersion(ws).weights;
  const k = kOf(activeConverter(ws), weights);
  const scored = scoreAll(ws, weights, 'recorded');
  const others: MapPoint[] = scored.map((s) => ({
    id: s.placement.id,
    name: s.placement.structure,
    copy: s.score.copy,
    imp: s.score.imp,
    cls: s.verdict.cls,
    href: '/rebuild/' + s.placement.id,
  }));
  const structureNames = ws.structures.map((s) => s.name);
  return <PlaceScreen weights={weights} k={k} others={others} structureNames={structureNames} />;
}
