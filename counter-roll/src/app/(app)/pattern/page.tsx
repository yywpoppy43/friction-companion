import type { Metadata } from 'next';
import { requireOwner } from '@/lib/session';
import { loadWorkspace } from '@/db/queries';
import { activeConverter, kOf, patternOf, resolveRun, scoreAll } from '@/lib/compute';
import { PatternScreen } from './PatternScreen';

export const metadata: Metadata = { title: 'Pattern' };

/**
 * Pattern — what the remainder follows across placements: the sentence, the rows behind it, and the
 * mean remainder (gap, while the converter is not set) at each level of each dimension. Every number
 * is pattern() and remainderByLevel() from the model. Runs under whichever weight version and
 * converter the URL names (?w=<id>&c=current); k is the current converter under those weights.
 */
export default async function PatternPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const ownerId = await requireOwner();
  const ws = await loadWorkspace(ownerId);
  const run = resolveRun(ws, sp);
  const weights = run.weightVersion.weights;
  const scored = scoreAll(ws, weights, run.mode);
  const kNow = kOf(activeConverter(ws), weights);
  const { pattern, byLevel } = patternOf(scored, kNow);
  return (
    <PatternScreen
      pattern={pattern}
      byLevel={byLevel}
      count={scored.length}
      kNow={kNow}
      weightVersions={ws.weightVersions}
      currentWeightVersion={run.weightVersion}
      mode={run.mode}
    />
  );
}
