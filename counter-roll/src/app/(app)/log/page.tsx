import type { Metadata } from 'next';
import { requireOwner } from '@/lib/session';
import { loadWorkspace } from '@/db/queries';
import { activeConverter, activeWeightVersion, kOf, resolveRun, scoreAll } from '@/lib/compute';
import { LogScreen, type LogEntry } from './LogScreen';
import './log.css';

export const metadata: Metadata = { title: 'Log' };

/**
 * Log — every placement, newest first, with its verdict and remainder, and the remainder over time
 * for any structure placed more than once. The RunUnder selector (?w=<id>&c=current) picks the weight
 * version and the converter the stored answers are re-run under; the answers themselves never change.
 */
export default async function LogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ownerId = await requireOwner();
  const ws = await loadWorkspace(ownerId);
  const sp = await searchParams;
  const run = resolveRun(ws, sp);
  const weights = run.weightVersion.weights;
  const scored = scoreAll(ws, weights, run.mode);
  const kNow = kOf(activeConverter(ws), weights);
  const entries: LogEntry[] = scored.map((s) => ({ placement: s.placement, k: s.k, score: s.score, verdict: s.verdict }));
  return (
    <LogScreen
      entries={entries}
      weightVersions={ws.weightVersions}
      runWeightVersion={run.weightVersion}
      mode={run.mode}
      kNow={kNow}
      activeWeightVersionId={activeWeightVersion(ws).id}
    />
  );
}
