import type { Metadata } from 'next';
import { requireOwner } from '@/lib/session';
import { loadWorkspace } from '@/db/queries';
import { activeConverter, activeWeightVersion, scoreAll } from '@/lib/compute';
import { WeightsScreen, type PreviewPlacement } from './WeightsScreen';
import './weights.css';

export const metadata: Metadata = { title: 'Weights' };

/** The live preview recomputes this many placements, newest first, and says how many more there are. */
const PREVIEW_CAP = 30;

/**
 * Weights — owner-only. The seven dimension weights, the four converter weights and the split, each
 * side kept at one. Saving makes a new version; stored placements keep their raw answers and are re-run
 * under whichever version is active. The "now" column of the preview is scored here under the active
 * weights, each placement under the converter version recorded when it was made.
 */
export default async function WeightsPage() {
  const ownerId = await requireOwner();
  const ws = await loadWorkspace(ownerId);
  const active = activeWeightVersion(ws);
  const scored = scoreAll(ws, active.weights, 'recorded');
  const preview: PreviewPlacement[] = scored.slice(0, PREVIEW_CAP).map((s) => ({
    id: s.placement.id,
    structure: s.placement.structure,
    createdAt: s.placement.createdAt,
    answers: s.placement.answers,
    felt: s.placement.felt,
    converterAnswers: s.converter?.answers ?? null,
    now: { verdict: s.verdict.kind, cls: s.verdict.cls, warranted: s.score.warranted, remainder: s.score.remainder },
  }));
  return (
    <WeightsScreen
      versions={ws.weightVersions}
      preview={preview}
      more={Math.max(0, scored.length - preview.length)}
      activeConverterAnswers={activeConverter(ws)?.answers ?? null}
    />
  );
}
