import type { Metadata } from 'next';
import { requireOwner } from '@/lib/session';
import { loadWorkspace } from '@/db/queries';
import { activeWeightVersion } from '@/lib/compute';
import { ConverterScreen } from './ConverterScreen';

export const metadata: Metadata = { title: 'The converter' };

/** Part two · you. The four converter questions, answered once, kept as versions. */
export default async function ConverterPage() {
  const ownerId = await requireOwner();
  const ws = await loadWorkspace(ownerId);
  const weights = activeWeightVersion(ws).weights;
  return <ConverterScreen weights={weights} versions={ws.converterVersions} />;
}
