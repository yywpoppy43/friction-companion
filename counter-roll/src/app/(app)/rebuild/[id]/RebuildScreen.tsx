'use client';
import { Fragment, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DIMS, type DimAnswers, type DimKey, type Score, type Verdict, type Weights } from '@model/sort-algorithm.mjs';
import type { Placement, WeightVersion } from '@/lib/types';
import type { ConverterMode } from '@/lib/compute';
import { dateTime, signed1 } from '@/lib/format';
import { placeAction } from '@/app/(app)/actions';
import { RunUnder } from '@/components/ui/RunUnder';
import { PlacementReadout } from '@/components/readout/PlacementReadout';
import type { MapPoint } from '@/components/readout/MapSvg';

interface Linked { id: string; createdAt: string }

/** The same seven answers, or not. */
const sameAnswers = (a: DimAnswers, b: DimAnswers): boolean => DIMS.every((d) => a[d.key] === b[d.key]);

/**
 * Rebuild — the "walk out" view. Every dimension of a placed structure is a row of chips; press one and
 * the dot travels, the equation reprints, the layers change. Nothing is stored until the owner saves,
 * and then the raw answers are stored as a new placement linked to this one.
 */
export function RebuildScreen({ placement, original, k, weights, weightVersions, currentWeightVersion, mode, parent, rebuiltAs, siblings }: {
  placement: Placement;
  /** this placement as stored, scored under the weights and converter the page runs under */
  original: { score: Score; verdict: Verdict };
  /** converter strength under these weights, or null when the converter is not set */
  k: number | null;
  weights: Weights;
  weightVersions: WeightVersion[];
  currentWeightVersion: WeightVersion;
  mode: ConverterMode;
  /** the placement this one was rebuilt from, when there is one */
  parent: Linked | null;
  /** placements rebuilt from this one, newest first */
  rebuiltAs: Linked[];
  /** every other placement, already scored, for the map */
  siblings: MapPoint[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<DimAnswers>(() => ({ ...placement.answers }));
  const [felt, setFelt] = useState(placement.felt);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const dimsChanged = !sameAnswers(draft, placement.answers);
  const dirty = dimsChanged || felt !== placement.felt;

  const answer = (key: DimKey, v: number) => setDraft((prev) => ({ ...prev, [key]: v }));
  const reset = () => { setDraft({ ...placement.answers }); setFelt(placement.felt); setMessage(null); };

  const save = () => {
    if (!dirty || pending) return;
    setMessage(null);
    startTransition(async () => {
      const res = await placeAction({
        name: placement.structure,
        structureId: placement.structureId,
        answers: draft,
        felt,
        parentPlacementId: placement.id,
      });
      if (res.ok) router.push('/log');
      else setMessage(res.message);
    });
  };

  const remainderLine = k == null
    ? `gap ${signed1(original.score.gap)}`
    : `remainder ${signed1(original.score.remainder)}`;

  return (
    <section className="screen">
      <header>
        <p className="mono">rebuild it · change one dimension and watch it move</p>
        <h2>{placement.structure}</h2>
        <p className="mono">
          placed <span suppressHydrationWarning>{dateTime(placement.createdAt)}</span>
          {parent && (
            <>
              {' · rebuilt from '}
              <Link href={'/rebuild/' + parent.id} className="quiet"><span suppressHydrationWarning>{dateTime(parent.createdAt)}</span></Link>
            </>
          )}
        </p>
        {rebuiltAs.length > 0 && (
          <p className="mono">
            rebuilt as:{' '}
            {rebuiltAs.map((c, i) => (
              <Fragment key={c.id}>
                {i > 0 && ', '}
                <Link href={'/rebuild/' + c.id} className="quiet"><span suppressHydrationWarning>{dateTime(c.createdAt)}</span></Link>
              </Fragment>
            ))}
          </p>
        )}
        <RunUnder weightVersions={weightVersions} current={currentWeightVersion} mode={mode} />
        <p className="mono">placed as {original.verdict.kind} · {remainderLine}</p>
      </header>

      <div className="inst" aria-busy={pending}>
        <div className="rebuild">
          {DIMS.map((d) => (
            <div key={d.key} className="rb">
              <span className="dim">{d.key}</span>
              <div className="chips" role="group" aria-label={d.key}>
                {d.levels.map((level, i) => (
                  <button
                    key={level}
                    type="button"
                    className="chip"
                    aria-pressed={draft[d.key] === level}
                    onClick={() => answer(d.key, level)}
                  >
                    {d.labels[i] ?? String(level)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="q felt">
          <div className="lab">
            <span className="dim">felt</span>
            <span className="ask">The alarm as you feel it, <span className="tnum">{felt}</span> of 10</span>
          </div>
          <input type="range" min={0} max={10} step={1} value={felt} onChange={(e) => setFelt(Number(e.target.value))} aria-label="Felt alarm" />
        </div>

        <div className="row">
          <button type="button" className="btn primary" disabled={!dirty || pending} onClick={save}>save as a rebuilt version</button>
          <button type="button" className="btn" disabled={!dirty || pending} onClick={reset}>back to the original</button>
        </div>
        {message && <p className="notice" role="status">{message}</p>}
        <p className="notice">
          <Link href="/log" className="quiet">log</Link>
          {' · '}
          <Link href="/place" className="quiet">place another</Link>
        </p>
      </div>

      <PlacementReadout
        name={placement.structure}
        answers={draft}
        felt={felt}
        k={k}
        weights={weights}
        others={siblings}
        from={dirty ? { copy: original.score.copy, imp: original.score.imp } : null}
      />
    </section>
  );
}
