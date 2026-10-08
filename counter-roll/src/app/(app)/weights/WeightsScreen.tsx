'use client';
import { useId, useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  CONVERTER, DEFAULT_WEIGHTS, DIMS,
  converterLabel, converterStrength, rebalanceWeights, scoreStructure, validateWeights, verdict as verdictOf,
  type ConverterAnswers, type ConverterKey, type DimAnswers, type DimKey, type VerdictCls, type VerdictKind, type Weights,
} from '@model/sort-algorithm.mjs';
import type { WeightVersion } from '@/lib/types';
import { activeWeightVersion } from '@/lib/compute';
import { dateShort, f1, f2, signed1 } from '@/lib/format';
import { saveWeightsAction } from '@/app/(app)/actions';

/** One placement as the server scored it under the active weights. The draft column is recomputed here from the same raw answers. */
export interface PreviewPlacement {
  id: string;
  structure: string;
  createdAt: string;
  answers: DimAnswers;
  felt: number;
  /** the converter answers this placement runs under: the version recorded at placement, else the active one; null when none is set */
  converterAnswers: ConverterAnswers | null;
  now: { verdict: VerdictKind; cls: VerdictCls; warranted: number; remainder: number | null };
}

type SplitKey = keyof Weights['split'];

/** The four groups, each kept at one. Keys read off the model so the groups stay in step with it. */
const COPY_KEYS: readonly DimKey[] = DIMS.filter((d) => d.side === 'copy').map((d) => d.key);
const IMP_KEYS: readonly DimKey[] = DIMS.filter((d) => d.side === 'imp').map((d) => d.key);
const CONVERTER_KEYS: readonly ConverterKey[] = CONVERTER.map((q) => q.key);
const SPLIT_KEYS: readonly SplitKey[] = ['copyShare', 'imposedShare'];
const SPLIT_NAMES: Record<SplitKey, string> = { copyShare: 'copy-share', imposedShare: 'imposed-share' };

const cloneWeights = (w: Weights): Weights => ({ split: { ...w.split }, dims: { ...w.dims }, converter: { ...w.converter } });

function sameWeights(a: Weights, b: Weights): boolean {
  return DIMS.every((d) => a.dims[d.key] === b.dims[d.key])
    && CONVERTER.every((q) => a.converter[q.key] === b.converter[q.key])
    && SPLIT_KEYS.every((k) => a.split[k] === b.split[k]);
}

/** The subset of a record that one slider group covers, in the shape rebalanceWeights takes. */
function pick<K extends string>(src: Record<K, number>, keys: readonly K[]): Record<K, number> {
  const out = {} as Record<K, number>;
  for (const k of keys) out[k] = src[k];
  return out;
}

/** Display check only, printed beside each group as "sum 1.00". validateWeights from the model is the authority on whether a side sums to one. */
const sumOf = (xs: readonly number[]): number => xs.reduce((s, x) => s + x, 0);

/** A weight as the reference page prints it: 0.40 → "40". Formatting only. */
const hundredths = (x: number): string => String(Math.round(x * 100));

/** "copy 40·30·15·15 · imposed 55·25·20 · split 55/45 · converter 35·20·20·25" */
function summarize(w: Weights): string {
  const copy = COPY_KEYS.map((k) => hundredths(w.dims[k])).join('·');
  const imposed = IMP_KEYS.map((k) => hundredths(w.dims[k])).join('·');
  const converter = CONVERTER_KEYS.map((k) => hundredths(w.converter[k])).join('·');
  return `copy ${copy} · imposed ${imposed} · split ${hundredths(w.split.copyShare)}/${hundredths(w.split.imposedShare)} · converter ${converter}`;
}

function Slider({ id, name, value, onChange }: { id: string; name: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="slider">
      <label className="mono" htmlFor={id}>{name} · <span className="tnum">{f2(value)}</span></label>
      <input type="range" id={id} min={0} max={1} step={0.01} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

function Group({ title, sum, children }: { title: string; sum: number; children: ReactNode }) {
  return (
    <div className="inst">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <p className="mono">{title}</p>
        <span className="mono tnum">sum {f2(sum)}</span>
      </div>
      {children}
    </div>
  );
}

export function WeightsScreen({ versions, preview, more, activeConverterAnswers }: {
  /** every weight version, oldest first; the last is active */
  versions: WeightVersion[];
  /** placements, newest first, scored under the active weights; capped by the page */
  preview: PreviewPlacement[];
  /** how many placements the cap left out */
  more: number;
  /** the active converter's answers, or null when the converter is not set */
  activeConverterAnswers: ConverterAnswers | null;
}) {
  const router = useRouter();
  const idBase = useId();
  const active = activeWeightVersion({ weightVersions: versions });
  const [draft, setDraft] = useState<Weights>(() => cloneWeights(active.weights));
  const [note, setNote] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const check = validateWeights(draft);
  const unchanged = sameWeights(draft, active.weights);
  const canSave = check.ok && !unchanged && !pending;

  // every change goes through the model's rebalance so the group it belongs to stays at one
  const setDim = (keys: readonly DimKey[], key: DimKey, value: number) =>
    setDraft((d) => ({ ...d, dims: { ...d.dims, ...rebalanceWeights(pick(d.dims, keys), key, value) } }));
  const setConverter = (key: ConverterKey, value: number) =>
    setDraft((d) => ({ ...d, converter: rebalanceWeights(d.converter, key, value) }));
  const setSplit = (key: SplitKey, value: number) =>
    setDraft((d) => ({ ...d, split: rebalanceWeights(d.split, key, value) }));

  const load = (w: Weights) => { setDraft(cloneWeights(w)); setNotice(null); };

  const save = () => {
    if (!canSave) return;
    setNotice(null);
    startTransition(async () => {
      const res = await saveWeightsAction(draft, note.trim() || null);
      if (!res.ok) { setNotice(res.message); return; }
      setNotice(`saved as v${versions.length + 1}`);
      setNote('');
      router.refresh();
    });
  };

  // the preview: the same raw answers, re-run under the draft
  const kDraftNow = activeConverterAnswers ? converterStrength(activeConverterAnswers, draft) : null;
  const rows = preview.map((p) => {
    const kDraft = p.converterAnswers ? converterStrength(p.converterAnswers, draft) : null;
    const score = scoreStructure({ ...p.answers, felt: p.felt }, kDraft, draft);
    return { p, score, verdict: verdictOf(p.answers, score) };
  });

  const newestFirst = [...versions].reverse();
  const sliderId = (group: string, key: string) => `${idBase}-${group}-${key}`;

  return (
    <section className="screen weights">
      <header>
        <p className="mono">owner · the weights</p>
        <h2>Weights</h2>
        <p>
          The weights are a first setting. Your placements will say whether they hold. Each side sums to one: move one weight and
          the others in its group rescale. Saving makes a version. Placements keep their answers and are re-run under it.
        </p>
      </header>

      <div className="two">
        <Group title="copy-share" sum={sumOf(COPY_KEYS.map((k) => draft.dims[k]))}>
          {COPY_KEYS.map((k) => (
            <Slider key={k} id={sliderId('copy', k)} name={k} value={draft.dims[k]} onChange={(v) => setDim(COPY_KEYS, k, v)} />
          ))}
        </Group>
        <Group title="imposed-share" sum={sumOf(IMP_KEYS.map((k) => draft.dims[k]))}>
          {IMP_KEYS.map((k) => (
            <Slider key={k} id={sliderId('imposed', k)} name={k} value={draft.dims[k]} onChange={(v) => setDim(IMP_KEYS, k, v)} />
          ))}
        </Group>
        <Group title="the converter" sum={sumOf(CONVERTER_KEYS.map((k) => draft.converter[k]))}>
          {CONVERTER_KEYS.map((k) => (
            <Slider key={k} id={sliderId('converter', k)} name={k} value={draft.converter[k]} onChange={(v) => setConverter(k, v)} />
          ))}
        </Group>
        <Group title="the split" sum={sumOf(SPLIT_KEYS.map((k) => draft.split[k]))}>
          {SPLIT_KEYS.map((k) => (
            <Slider key={k} id={sliderId('split', k)} name={SPLIT_NAMES[k]} value={draft.split[k]} onChange={(v) => setSplit(k, v)} />
          ))}
        </Group>
      </div>

      <div className="inst">
        <p className="mono">draft · {unchanged ? 'same as the active version' : 'differs from the active version'}</p>
        <p className="draftline">{summarize(draft)}</p>
        <div className="q">
          <label className="mono" htmlFor={`${idBase}-note`}>note</label>
          <input
            type="text"
            id={`${idBase}-note`}
            className="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={80}
            placeholder="what changed, in a few words"
          />
        </div>
        <div className="row">
          <button type="button" className="btn primary" disabled={!canSave} onClick={save}>save as a version</button>
          <button type="button" className="btn" disabled={pending} onClick={() => load(DEFAULT_WEIGHTS)}>reset to first setting</button>
          <button type="button" className="btn" disabled={pending || unchanged} onClick={() => load(active.weights)}>back to active</button>
        </div>
        {!check.ok && check.errors.map((e) => <p key={e} className="notice" role="status">{e}</p>)}
        {notice && <p className="notice" role="status">{notice}</p>}
      </div>

      <div className="inst">
        <p className="mono">under this draft · every placement recomputed</p>
        {kDraftNow != null && (
          <p className="mono">converter under this draft · {converterLabel(kDraftNow)} · <b className="tnum">{f2(kDraftNow)}</b></p>
        )}
        {rows.length === 0 ? (
          <p className="notice">Nothing placed yet. The draft will recompute every placement here.</p>
        ) : (
          <>
            <div className="list preview" aria-label="Every placement, now and under the draft">
              {rows.map(({ p, score, verdict }) => (
                <div key={p.id} className="pv">
                  <div className="pvhead">
                    <span className="name">{p.structure}</span>
                    <span className="mono when" suppressHydrationWarning>{dateShort(p.createdAt)}</span>
                  </div>
                  <div className="pvrow"><span className="mono">verdict</span><span><span className={`k-${p.now.cls}`}>{p.now.verdict}</span> → <b className={`k-${verdict.cls}`}>{verdict.kind}</b></span></div>
                  <div className="pvrow"><span className="mono">warranted</span><span className="tnum">{f1(p.now.warranted)} → <b>{f1(score.warranted)}</b></span></div>
                  <div className="pvrow"><span className="mono">remainder</span><span className="tnum">{signed1(p.now.remainder)} → <b>{signed1(score.remainder)}</b></span></div>
                </div>
              ))}
            </div>
            {more > 0 && <p className="notice">{more} more, not shown. They recompute the same way.</p>}
          </>
        )}
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        <p className="mono">versions</p>
        <div className="versions">
          {newestFirst.map((v, i) => {
            const n = versions.length - i;
            return (
              <div key={v.id} className="version">
                <span>
                  v<b>{n}</b> · <span suppressHydrationWarning>{dateShort(v.createdAt)}</span>{v.note ? ` · ${v.note}` : ''}
                </span>
                {v.id === active.id && <span className="on">active</span>}
                <button type="button" className="linklike" onClick={() => load(v.weights)}>load into draft</button>
                <span className="summary">{summarize(v.weights)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
