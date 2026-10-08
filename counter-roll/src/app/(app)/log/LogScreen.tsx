'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Score, Verdict } from '@model/sort-algorithm.mjs';
import type { Placement, WeightVersion } from '@/lib/types';
import type { ConverterMode } from '@/lib/compute';
import { dateShort, signed1 } from '@/lib/format';
import { deletePlacementAction } from '@/app/(app)/actions';
import { MapSvg, type MapPoint } from '@/components/readout/MapSvg';
import { RunUnder } from '@/components/ui/RunUnder';
import { ConfirmButton } from '@/components/ui/ConfirmButton';
import { Sparkline } from '@/components/ui/Sparkline';

/** One placement as scored on the server under the run's weights and converter. Plain data only. */
export interface LogEntry {
  placement: Placement;
  /** converter strength this placement was run under, or null when no converter is set */
  k: number | null;
  score: Score;
  verdict: Verdict;
}

/** One structure placed more than once, its entries oldest → newest. */
interface Series { structureId: string; name: string; entries: LogEntry[] }

/** The measure a placement leaves unexplained: the remainder when a converter is set, the gap when not. Read off the score. */
const unexplained = (e: LogEntry): number | null => (e.k == null ? e.score.gap : e.score.remainder);

/** Groups entries (newest first) by structure. Groups keep the order of their latest placement; inside, oldest → newest. */
function seriesOf(entries: LogEntry[]): Series[] {
  const byId = new Map<string, Series>();
  for (const e of entries) {
    const id = e.placement.structureId;
    const s = byId.get(id);
    if (s) s.entries.push(e);
    else byId.set(id, { structureId: id, name: e.placement.structure, entries: [e] });
  }
  return [...byId.values()]
    .filter((s) => s.entries.length > 1)
    .map((s) => ({ ...s, entries: [...s.entries].sort((a, b) => a.placement.createdAt.localeCompare(b.placement.createdAt)) }));
}

export function LogScreen({ entries, weightVersions, runWeightVersion, mode, kNow, activeWeightVersionId }: {
  /** every placement, newest first, scored under the run */
  entries: LogEntry[];
  weightVersions: WeightVersion[];
  /** the weight version the numbers are run under */
  runWeightVersion: WeightVersion;
  /** the converter as recorded at each placement, or as it is now */
  mode: ConverterMode;
  /** the active converter's strength under the run's weights; null when the converter is not set */
  kNow: number | null;
  activeWeightVersionId: string;
}) {
  const router = useRouter();
  const [removing, setRemoving] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const remove = (id: string) => {
    setMessage(null);
    setRemoving(id);
    startTransition(async () => {
      const res = await deletePlacementAction(id);
      if (res.ok) router.refresh();
      else setMessage(res.message);
      setRemoving(null);
    });
  };

  // what is shown, in words
  const versionIndex = weightVersions.findIndex((v) => v.id === runWeightVersion.id);
  const versionName = versionIndex >= 0 ? `v${versionIndex + 1}` : 'v?';
  const isActive = runWeightVersion.id === activeWeightVersionId;
  const converterSet = kNow != null;
  const measure = converterSet ? 'remainder' : 'gap';
  const fellBack = mode === 'recorded' && entries.some((e) => e.placement.converterVersionId == null);
  const converterWords = !converterSet
    ? 'converter not set'
    : mode === 'current' ? 'converter as it is now' : 'converter as recorded at placement' + (fellBack ? ', as it is now where none was recorded' : '');
  const rerun = !isActive || mode === 'current';

  const points: MapPoint[] = entries.map((e) => ({
    id: e.placement.id,
    name: e.placement.structure,
    copy: e.score.copy,
    imp: e.score.imp,
    cls: e.verdict.cls,
    href: '/rebuild/' + e.placement.id,
  }));

  const series = seriesOf(entries);

  return (
    <section className="screen log">
      <header>
        <p className="mono">placed</p>
        <h2>Log</h2>
        <RunUnder weightVersions={weightVersions} current={runWeightVersion} mode={mode} />
        <p className="notice">
          numbers under weights {versionName} ({dateShort(runWeightVersion.createdAt)}{isActive ? ', active' : ''}) · {converterWords}
          {rerun ? ' · answers as stored, numbers re-run' : ''}
        </p>
      </header>

      {entries.length > 0 && (
        <MapSvg
          others={points}
          ariaLabel="Every placement on one map. Left: holds a form. Right: holds a copy of you. Top: terms yours. Bottom: terms set for you. Each dot opens its rebuild."
        />
      )}

      <div className="list">
        {entries.length === 0 && (
          <p className="empty">
            Nothing placed yet. Three placements show a pattern. <Link href="/place" className="quiet">Place one</Link>
          </p>
        )}
        {entries.map((e) => {
          const p = e.placement;
          const rebuilt = p.parentPlacementId != null;
          return (
            <div key={p.id} className="item">
              <span className="name" title={rebuilt ? 'rebuilt from an earlier placement' : undefined}>
                {rebuilt ? '↳ ' : ''}{p.structure}
              </span>
              <span className={`k k-${e.verdict.cls}`}>{e.verdict.kind}</span>
              <span className="g">{e.k == null ? 'gap' : 'rem'} {signed1(unexplained(e))}</span>
              <span className="g">{dateShort(p.createdAt)}</span>
              <span className="acts">
                <Link className="act" href={`/rebuild/${p.id}`}>rebuild</Link>
                <ConfirmButton onConfirm={() => remove(p.id)} pending={pending && removing === p.id} />
              </span>
            </div>
          );
        })}
      </div>
      {message && <p className="notice" role="status">{message}</p>}

      {entries.length > 0 && (
        <div className="overtime">
          <p className="mono">over time · {measure} by structure</p>
          {!converterSet && <p className="notice">converter not set · the line shows the gap: felt minus warranted</p>}
          {series.length === 0 && (
            <p className="notice">A structure placed more than once shows its {measure} over time here.</p>
          )}
          {series.map((s) => {
            // one line, one measure: if any placement in the group was run without a converter, the whole line shows the gap
            const lineShowsGap = s.entries.some((e) => e.k == null);
            const values = s.entries.map((e) => (lineShowsGap ? e.score.gap : e.score.remainder));
            const lineMeasure = lineShowsGap ? 'gap' : 'remainder';
            const first = s.entries.at(0), last = s.entries.at(-1);
            const labels = first && last ? [dateShort(first.placement.createdAt), dateShort(last.placement.createdAt)] : [];
            return (
              <div key={s.structureId} className="series">
                <div className="lab">
                  <span className="name">{s.name}</span>
                  <span className="mono">{s.entries.length} placements · {lineMeasure}</span>
                </div>
                <Sparkline values={values} labels={labels} ariaLabel={`${lineMeasure} over time for ${s.name}`} />
                <p className="eq eq-inline tnum">{values.map(signed1).join(' · ')}</p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
