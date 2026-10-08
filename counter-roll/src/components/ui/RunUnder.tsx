'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { WeightVersion } from '@/lib/types';
import { dateShort } from '@/lib/format';

/**
 * Lets the owner re-run a screen under any weight version, and under the converter as recorded or as it is now.
 * Writes ?w=<id>&c=current into the URL; pages read it with resolveRun().
 */
export function RunUnder({ weightVersions, current, mode, showConverter = true }: {
  weightVersions: WeightVersion[];
  current: WeightVersion;
  mode: 'recorded' | 'current';
  showConverter?: boolean;
}) {
  const router = useRouter(), path = usePathname(), sp = useSearchParams();
  const active = weightVersions.at(-1);
  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(sp.toString());
    if (value == null) next.delete(key); else next.set(key, value);
    const qs = next.toString();
    router.replace(qs ? `${path}?${qs}` : path, { scroll: false });
  };
  const label = (v: WeightVersion, i: number) => `v${i + 1} · ${dateShort(v.createdAt)}${v.note ? ` · ${v.note}` : ''}${v.id === active?.id ? ' · active' : ''}`;
  return (
    <div className="rununder" role="group" aria-label="Run under">
      <label>weights
        <select className="text" value={current.id} onChange={(e) => set('w', e.target.value === active?.id ? null : e.target.value)} style={{ marginLeft: 8 }}>
          {weightVersions.map((v, i) => <option key={v.id} value={v.id}>{label(v, i)}</option>)}
        </select>
      </label>
      {showConverter && (
        <label>converter
          <select className="text" value={mode} onChange={(e) => set('c', e.target.value === 'current' ? 'current' : null)} style={{ marginLeft: 8 }}>
            <option value="recorded">as recorded at placement</option>
            <option value="current">as it is now</option>
          </select>
        </label>
      )}
    </div>
  );
}
