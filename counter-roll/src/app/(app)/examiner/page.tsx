import type { Metadata } from 'next';
import { requireOwner } from '@/lib/session';
import { loadWorkspace } from '@/db/queries';
import { activeConverter, activeWeightVersion, kOf, trendOf } from '@/lib/compute';
import { converterLabel } from '@model/sort-algorithm.mjs';
import { ExaminerScreen } from './ExaminerScreen';
import './examiner.css';

export const metadata: Metadata = { title: 'The examiner' };

/**
 * Examiner — one rep per miss. The form stores the raw answers and the measured latency; the direction
 * across reps comes from examinerTrend() on the server, under the reps as stored. The converter line at
 * the top is the baseline the reps are measured against, under the active weights.
 */
export default async function ExaminerPage() {
  const ownerId = await requireOwner();
  const ws = await loadWorkspace(ownerId);
  const reps = ws.reps; // oldest first
  const converter = activeConverter(ws);
  const weights = activeWeightVersion(ws).weights;
  const k = kOf(converter, weights);
  const trend = trendOf(reps);
  return <ExaminerScreen reps={reps} trend={trend} k={k} converterLabel={k == null ? null : converterLabel(k)} />;
}
