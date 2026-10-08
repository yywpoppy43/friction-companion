'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CONVERTER, converterLabel, converterStrength, type ConverterAnswers, type ConverterKey, type Weights } from '@model/sort-algorithm.mjs';
import type { ConverterVersion } from '@/lib/types';
import { activeConverter, kOf } from '@/lib/compute';
import { dateShort, f2 } from '@/lib/format';
import { saveConverterAction } from '@/app/(app)/actions';
import { Chips } from '@/components/ui/Chips';
import { Sparkline } from '@/components/ui/Sparkline';
import { ConverterReadout } from '@/components/readout/ConverterReadout';

/** The questions as the reference page's #convform asks them. Values come from CONVERTER[i].levels; only the words live here. */
const ASK: Record<ConverterKey, string> = {
  sentence: 'When you miss a form, the first sentence in your head is',
  speed: 'It arrives',
  follow: 'What you do next',
  seat: 'The measure you grade against is',
};
const OPTION_TEXT: Record<ConverterKey, readonly string[]> = {
  sentence: ['"Adjust."', '"I should have."', '"This is what I\'m like."', '"This is what I\'m worth."'],
  speed: ['after I\'ve looked at what happened', 'at the same moment as the miss', 'before the act is finished. I\'m already grading.'],
  follow: ['fix the act, move on', 'replay the miss a few times', 'correct myself harder than the structure asked', 'cut the whole structure'],
  seat: ['my own measure of the act', 'how it looks to them', 'what they would say'],
};

type Draft = Partial<ConverterAnswers>;

/** All four answers, or null while any is missing. */
function completeAnswers(draft: Draft): ConverterAnswers | null {
  const out = {} as ConverterAnswers;
  for (const q of CONVERTER) {
    const v = draft[q.key];
    if (v == null) return null;
    out[q.key] = v;
  }
  return out;
}

function sameAnswers(a: ConverterAnswers, b: ConverterAnswers): boolean {
  return CONVERTER.every((q) => a[q.key] === b[q.key]);
}

export function ConverterScreen({ weights, versions }: { weights: Weights; versions: ConverterVersion[] }) {
  const router = useRouter();
  const active = activeConverter({ converterVersions: versions });
  const [draft, setDraft] = useState<Draft>(() => (active ? { ...active.answers } : {}));
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const answers = completeAnswers(draft);
  const differs = answers != null && (!active || !sameAnswers(answers, active.answers));
  const shown = answers ?? active?.answers ?? null;

  const answer = (key: ConverterKey, v: number) => {
    setDraft((d) => { const next = { ...d }; next[key] = v; return next; });
  };

  const save = () => {
    if (!answers || !differs) return;
    setNotice(null);
    startTransition(async () => {
      const res = await saveConverterAction(answers);
      if (!res.ok) { setNotice(res.message); return; }
      setNotice(`saved · version ${versions.length + 1} · k ${f2(converterStrength(answers, weights))}`);
      router.refresh();
    });
  };

  const newestFirst = [...versions].reverse();

  return (
    <section className="screen">
      <header>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <p className="mono">part two · you</p>
          <span className="mono" role="status">{active ? 'set' : 'not set'}</span>
        </div>
        <h2>The converter</h2>
        <p>Part two measures you: four questions on the converter, answered once and kept.</p>
        <p className="notice">
          <Link className="quiet" href="/examiner">the examiner</Link>
          {' · '}
          <Link className="quiet" href="/place">place a structure</Link>
        </p>
      </header>

      <div className="inst">
        <div className="qgrid">
          {CONVERTER.map((q) => (
            <div key={q.key} className="q">
              <div className="lab"><span className="dim">{q.key}</span><span className="ask">{ASK[q.key]}</span></div>
              <Chips
                name={q.key}
                value={draft[q.key] ?? null}
                options={q.levels.map((level, i) => ({ value: level, label: OPTION_TEXT[q.key][i] ?? q.labels[i] ?? f2(level) }))}
                onChange={(v) => answer(q.key, v)}
                label={ASK[q.key]}
              />
            </div>
          ))}
        </div>

        <ConverterReadout answers={shown} weights={weights} />

        <div className="row">
          <button type="button" className="btn primary" disabled={pending || !differs} onClick={save}>save as a new version</button>
          {notice && <p className="notice" role="status">{notice}</p>}
        </div>
      </div>

      {versions.length > 0 && (
        <div style={{ display: 'grid', gap: 12 }}>
          <p className="mono">versions</p>
          {versions.length >= 2 && (
            <Sparkline
              values={versions.map((v) => kOf(v, weights))}
              labels={['v1', `v${versions.length}`]}
              ariaLabel="converter strength over versions"
              min={0}
              max={1}
              zeroLine={false}
            />
          )}
          <div className="versions">
            {newestFirst.map((v, i) => {
              const n = versions.length - i;
              const k = kOf(v, weights);
              return (
                <div key={v.id} className="version">
                  <span>
                    v{n} · <span suppressHydrationWarning>{dateShort(v.createdAt)}</span> · {k == null ? '—' : converterLabel(k)} · k <b>{f2(k)}</b>
                  </span>
                  {active && v.id === active.id && <span className="on">active</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
