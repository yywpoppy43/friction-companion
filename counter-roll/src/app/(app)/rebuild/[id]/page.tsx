import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireOwner } from '@/lib/session';
import { loadWorkspace } from '@/db/queries';
import { converterFor, kOf, resolveRun, scoreAll, scorePlacement } from '@/lib/compute';
import type { MapPoint } from '@/components/readout/MapSvg';
import { RebuildScreen } from './RebuildScreen';

export const metadata: Metadata = { title: 'Rebuild' };

/**
 * Rebuild — one placed structure, with every dimension open to change. The dot travels and the layers
 * recompute live in the client; saving stores the new raw answers as a placement linked to this one.
 * Runs under whichever weight version and converter the URL names (?w=<id>&c=current).
 */
export default async function RebuildPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const ownerId = await requireOwner();
  const ws = await loadWorkspace(ownerId);
  const placement = ws.placements.find((p) => p.id === id);
  if (!placement) notFound();

  const run = resolveRun(ws, sp);
  const weights = run.weightVersion.weights;
  const converter = converterFor(placement, ws, run.mode);
  const k = kOf(converter, weights);
  const original = scorePlacement(placement, weights, converter);

  const parent = ws.placements.find((p) => p.id === placement.parentPlacementId) ?? null;
  const children = ws.placements.filter((p) => p.parentPlacementId === placement.id);

  const siblings: MapPoint[] = scoreAll(ws, weights, run.mode)
    .filter((s) => s.placement.id !== placement.id)
    .map((s) => ({
      id: s.placement.id,
      name: s.placement.structure,
      copy: s.score.copy,
      imp: s.score.imp,
      cls: s.verdict.cls,
      href: '/rebuild/' + s.placement.id,
    }));

  return (
    <RebuildScreen
      key={placement.id}
      placement={placement}
      original={{ score: original.score, verdict: original.verdict }}
      k={k}
      weights={weights}
      weightVersions={ws.weightVersions}
      currentWeightVersion={run.weightVersion}
      mode={run.mode}
      parent={parent ? { id: parent.id, createdAt: parent.createdAt } : null}
      rebuiltAs={children.map((c) => ({ id: c.id, createdAt: c.createdAt }))}
      siblings={siblings}
    />
  );
}
