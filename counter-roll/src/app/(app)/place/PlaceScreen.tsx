'use client';
import { useId, useState, useTransition, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DIMS, converterLabel, type DimAnswers, type DimKey, type Weights } from '@model/sort-algorithm.mjs';
import { placeAction } from '@/app/(app)/actions';
import { fillAnswers } from '@/lib/compute';
import { f2 } from '@/lib/format';
import { Chips, type ChipOption } from '@/components/ui/Chips';
import { PlacementReadout } from '@/components/readout/PlacementReadout';
import type { MapPoint } from '@/components/readout/MapSvg';

/**
 * The seven questions as the reference page's sort form words them. Only the words live here;
 * the values of each option come from DIMS[i].levels, in the same order.
 */
const ASKS: Record<DimKey, { ask: string; options: readonly string[] }> = {
  object: {
    ask: 'What does it hold?',
    options: [
      'an act at a time and place, an amount. Nothing about who I am.',
      'an act, with a picture of who I am attached to it',
      'a picture of who I should be or how I should feel. No act in it.',
    ],
  },
  miss: {
    ask: "When it's missed, what does the structure do?",
    options: [
      "nothing. I adjust and it's over.",
      'it treats the miss as a statement about me',
      "someone's warmth toward me rises or falls with it. How they treat me changes, not only what they think.",
    ],
  },
  scope: {
    ask: 'How much of you does it claim?',
    options: ['one act', 'several areas of my life', 'who I am, everywhere'],
  },
  reason: {
    ask: 'Is the why visible?',
    options: ["yes, I can say what it's for", 'no. "because."'],
  },
  author: {
    ask: 'Who set the terms?',
    options: ['I did', 'someone else, and I agreed', 'someone else. no agreement.'],
  },
  exit: {
    ask: 'Can you see the end?',
    options: ['yes. I know when and how it ends.', 'it can be reopened if I ask', 'no end in sight'],
  },
  grain: {
    ask: 'How fine is the prescription?',
    options: ['rough: a window, a week, "this month"', 'exact: a minute, a count, a script'],
  },
};

const NAME_PLACEHOLDER = 'a weekly class · a daily check-in · a deadline I set · my rule about X';
const FELT_DEFAULT = 5;

/** A weight as the reference paragraph prints it: 0.40 → "40". Formatting only. */
const inHundredths = (x: number): string => String(Math.round(x * 100));

export function PlaceScreen({ weights, k, others, structureNames }: {
  weights: Weights;
  /** the active converter's strength under these weights, or null when the converter is not set */
  k: number | null;
  /** every earlier placement, already scored, for the map */
  others: MapPoint[];
  /** names already in use, offered as suggestions */
  structureNames: string[];
}) {
  const router = useRouter();
  const nameId = useId();
  const listId = useId();
  const [name, setName] = useState('');
  const [draft, setDraft] = useState<Partial<DimAnswers>>({});
  const [felt, setFelt] = useState(FELT_DEFAULT);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filled = fillAnswers(draft);
  const trimmed = name.trim();
  const canPlace = trimmed.length > 0 && filled.complete;

  const answer = (key: DimKey, v: number) => setDraft((prev) => { const next = { ...prev }; next[key] = v; return next; });
  const clear = () => { setName(''); setDraft({}); setFelt(FELT_DEFAULT); setMessage(null); };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canPlace || pending) return;
    setMessage(null);
    startTransition(async () => {
      const res = await placeAction({ name: trimmed, answers: filled.answers, felt });
      if (res.ok) router.push('/rebuild/' + res.id);
      else setMessage(res.message);
    });
  };

  const { dims, split, converter } = weights;

  return (
    <section className="screen">
      <header>
        <p className="mono">part one · the structure</p>
        <h2>Place one</h2>
        {k == null
          ? <p className="notice">converter not set · <Link href="/converter" className="quiet">set it</Link> to split the alarm into layers</p>
          : <p className="notice">converter · {converterLabel(k)} · {f2(k)} · <Link href="/converter" className="quiet">re-measure</Link></p>}
      </header>

      <div className="inst">
        <form className="qgrid" onSubmit={onSubmit} aria-busy={pending}>
          <div className="q">
            <label className="mono" htmlFor={nameId}>the structure</label>
            <input
              type="text"
              id={nameId}
              className="text"
              list={listId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={NAME_PLACEHOLDER}
              maxLength={200}
            />
            <datalist id={listId}>
              {structureNames.map((n) => <option key={n} value={n} />)}
            </datalist>
          </div>

          {DIMS.map((d) => {
            const words = ASKS[d.key];
            const options: ChipOption<number>[] = d.levels.map((level, i) => ({
              value: level,
              label: words.options[i] ?? d.labels[i] ?? String(level),
            }));
            return (
              <div key={d.key} className="q">
                <div className="lab"><span className="dim">{d.key}</span><span className="ask">{words.ask}</span></div>
                <Chips name={d.key} value={draft[d.key]} options={options} onChange={(v) => answer(d.key, v)} label={words.ask} />
              </div>
            );
          })}

          <div className="q felt">
            <div className="lab">
              <span className="dim">felt</span>
              <span className="ask">The alarm as you feel it, <span className="tnum">{felt}</span> of 10</span>
            </div>
            <input type="range" min={0} max={10} step={1} value={felt} onChange={(e) => setFelt(Number(e.target.value))} aria-label="Felt alarm" />
          </div>

          <div className="row">
            <button type="submit" className="btn primary" disabled={!canPlace || pending}>place it</button>
            <button type="button" className="btn" onClick={clear} disabled={pending}>clear</button>
          </div>
          {message && <p className="notice" role="status">{message}</p>}
        </form>
      </div>

      <PlacementReadout name={trimmed ? name : '—'} answers={draft} felt={felt} k={k} weights={weights} others={others} />

      <div className="text">
        <p>
          The arithmetic is open on purpose. Copy-share is object at {inHundredths(dims.object)}, miss at {inHundredths(dims.miss)},
          scope at {inHundredths(dims.scope)}, reason at {inHundredths(dims.reason)}. Imposed-share is author at {inHundredths(dims.author)},
          exit at {inHundredths(dims.exit)}, grain at {inHundredths(dims.grain)}. Warranted alarm is {inHundredths(split.copyShare)} percent
          copy-share and {inHundredths(split.imposedShare)} percent imposed-share, on a scale of ten. The converter is sentence
          at {inHundredths(converter.sentence)}, seat at {inHundredths(converter.seat)}, speed at {inHundredths(converter.speed)}, follow
          at {inHundredths(converter.follow)}, and it adds its share of whatever room is left above the warranted alarm. Those weights are
          a first setting. Your placements will say whether they hold.
        </p>
        <p>
          The remainder is the instrument. Felt, minus warranted, minus the converter's share. Near zero means the two layers explain
          the alarm: the structure and you. Large and positive on forms set by others means a third thing is running, and that thing is
          authorship. The pattern box tells the layers apart after three placements.
        </p>
      </div>
    </section>
  );
}
