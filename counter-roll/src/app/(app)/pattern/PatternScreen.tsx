'use client';
import Link from 'next/link';
import { DIMS, type DimKey, type LevelCell, type Pattern } from '@model/sort-algorithm.mjs';
import type { WeightVersion } from '@/lib/types';
import type { ConverterMode } from '@/lib/compute';
import { signed1 } from '@/lib/format';
import { RunUnder } from '@/components/ui/RunUnder';

/**
 * Pattern — the sentence pattern() names, the six rows behind it, and the per-dimension breakdown.
 * Nothing is computed here: the rows and cells arrive from the model and are only printed.
 * While the converter is not set the model measures the gap, not the remainder, and the labels say so.
 */
export function PatternScreen({ pattern, byLevel, count, kNow, weightVersions, currentWeightVersion, mode }: {
  pattern: Pattern;
  byLevel: Record<DimKey, LevelCell[]>;
  /** placements scored, under the run's weights and converter mode */
  count: number;
  /** strength of the current converter under these weights, or null when the converter is not set */
  kNow: number | null;
  weightVersions: WeightVersion[];
  currentWeightVersion: WeightVersion;
  mode: ConverterMode;
}) {
  const term = kNow == null ? 'gap' : 'remainder';

  return (
    <section className="screen">
      <header>
        <p className="mono">pattern across {count} placements</p>
        <h2>Pattern</h2>
      </header>

      <RunUnder weightVersions={weightVersions} current={currentWeightVersion} mode={mode} />

      {!pattern.ready ? (
        <p className="notice">
          Visible once three placements exist. {count} so far.{' '}
          <Link className="quiet" href="/place">place one</Link>
        </p>
      ) : (
        <>
          <div className="pattern">
            <p className="big">{pattern.sentence}</p>
            <div className="rows">
              <div>mean gap on forms, before the converter <b>{signed1(pattern.rows.gapForms)}</b></div>
              <div>mean remainder on forms, after the converter <b>{signed1(pattern.rows.remainderForms)}</b></div>
              <div>{term}, terms mine <b>{signed1(pattern.rows.byMine)}</b></div>
              <div>{term}, terms theirs <b>{signed1(pattern.rows.byTheirs)}</b></div>
              <div>{term}, rough grain <b>{signed1(pattern.rows.byRough)}</b></div>
              <div>{term}, exact grain <b>{signed1(pattern.rows.byExact)}</b></div>
            </div>
            <p className="mono">knot · {pattern.knot}</p>
          </div>

          <div className="breakdown">
            <p className="mono">by dimension · mean {term} at each level</p>
            {DIMS.map((d) => (
              <div key={d.key} className="bd">
                <span className="mono">{d.key}</span>
                <div className="cells">
                  {byLevel[d.key].map((cell) => (
                    <div key={String(cell.level)} className="cell">
                      <span className="mono">{cell.label}</span>
                      <b>{cell.mean == null ? '—' : signed1(cell.mean)}</b>
                      <span className="n">{cell.n} placed</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text">
            <p>
              The remainder is the instrument. Felt, minus warranted, minus the converter’s share. Near zero means
              the two layers explain the alarm: the structure and you. Large and positive on forms set by others
              means a third thing is running, and that thing is authorship. The pattern box tells the layers apart
              after three placements.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
