'use client';
import { useEffect, useId, useState, useTransition, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EXAMINER_GROUNDS, EXAMINER_LEVELS, type ExaminerTrend, type Ground } from '@model/sort-algorithm.mjs';
import type { Rep } from '@/lib/types';
import { dateShort, f2, levelCls, levelName, signed2, signed0 } from '@/lib/format';
import { deleteRepAction, saveRepAction } from '@/app/(app)/actions';
import { Chips, type ChipOption } from '@/components/ui/Chips';
import { ConfirmButton } from '@/components/ui/ConfirmButton';

/** The grounds as the reference page's #exform words them. Values come from EXAMINER_GROUNDS; only the words live here. */
const GROUND_LABEL: Record<Ground, string> = {
  intention: 'my intention',
  worth: 'my worth',
  building: "what I'm building",
  people: 'the people in it',
  none: 'nothing needed separating',
};

const LEVEL_OPTIONS: readonly ChipOption<number>[] = EXAMINER_LEVELS.map((l) => ({ value: l.value, label: l.label }));
const GROUND_OPTIONS: readonly ChipOption<Ground>[] = EXAMINER_GROUNDS.map((g) => ({ value: g, label: GROUND_LABEL[g] }));

/** A signed whole number for print, as the reference prints the seconds delta: +3, −2, +0. Formatting only. */

/** The rep just saved, kept locally so the readout can show it while the list refreshes. */
interface SavedRep {
  id: string;
  act: string;
  level: number;
  actTranslation: string;
  adjustment: string;
  ground: Ground;
  latencySec: number;
}

/** Elapsed whole seconds since a start stamp. The one measurement this screen takes itself. */
const secondsSince = (start: number): number => Math.round((Date.now() - start) / 1000);

export function ExaminerScreen({ reps, trend, k, converterLabel }: {
  /** every rep, oldest first */
  reps: Rep[];
  /** examinerTrend() over the reps, as computed on the server */
  trend: ExaminerTrend;
  /** the active converter's strength under the active weights, or null when the converter is not set */
  k: number | null;
  /** converterLabel(k), or null when the converter is not set */
  converterLabel: string | null;
}) {
  const router = useRouter();
  const actId = useId();
  const wordsId = useId();

  // the form
  const [act, setAct] = useState('');
  const [level, setLevel] = useState<number | null>(null);
  const [words, setWords] = useState('');
  const [actTranslation, setActTranslation] = useState('');
  const [adjustment, setAdjustment] = useState('');
  const [ground, setGround] = useState<Ground | null>(null);

  // the timer: starts when the level is first chosen, stops when "second sentence done" is pressed
  const [start, setStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [stopped, setStopped] = useState<number | null>(null);

  const [last, setLast] = useState<SavedRep | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (start == null || stopped != null) return;
    const t = setInterval(() => setElapsed(secondsSince(start)), 500);
    return () => clearInterval(t);
  }, [start, stopped]);

  const ready = act.trim().length > 0 && level != null && actTranslation.trim().length > 0 && adjustment.trim().length > 0 && ground != null;

  const chooseLevel = (v: number) => {
    setLevel(v);
    if (start == null) { setStart(Date.now()); setElapsed(0); }
  };

  const reset = () => {
    setAct(''); setLevel(null); setWords(''); setActTranslation(''); setAdjustment(''); setGround(null);
    setStart(null); setElapsed(0); setStopped(null);
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending || !ready || level == null || ground == null) return;
    // the press is the measurement; a save that does not go through keeps it for the retry
    const latencySec = stopped ?? (start == null ? 0 : secondsSince(start));
    setStopped(latencySec);
    const input = {
      act: act.trim(),
      verbatim: words.trim() || null,
      level,
      actTranslation: actTranslation.trim(),
      adjustment: adjustment.trim(),
      ground,
      latencySec,
    };
    setMessage(null);
    startTransition(async () => {
      const res = await saveRepAction(input);
      if (res.ok) {
        setLast({ id: res.id, act: input.act, level: input.level, actTranslation: input.actTranslation, adjustment: input.adjustment, ground: input.ground, latencySec });
        reset();
        router.refresh();
      } else {
        setMessage(res.message);
      }
    });
  };

  const remove = (id: string) => {
    setMessage(null);
    setRemoving(id);
    startTransition(async () => {
      const res = await deleteRepAction(id);
      if (res.ok) {
        setLast((l) => (l && l.id === id ? null : l));
        router.refresh();
      } else {
        setMessage(res.message);
      }
      setRemoving(null);
    });
  };

  const timerText = start == null ? '' : `${stopped ?? elapsed}s since the first sentence`;
  const trendLine = trend.ready
    ? `Across ${reps.length} reps: first-sentence level ${trend.level} (${signed2(trend.dLevel)}), seconds to the second sentence ${trend.latency} (${signed0(trend.dLatency)}s).`
    : 'Four reps show a direction.';
  const newestFirst = [...reps].reverse();

  return (
    <section className="screen examiner">
      <header>
        <p className="mono">the practice · uninstalling the converter</p>
        <h2>The first sentence is a reflex. You cannot stop it arriving. You can train a second sentence until it arrives almost as fast.</h2>
        {k == null || converterLabel == null
          ? <p className="mono">converter not set · <Link href="/converter" className="quiet">set it</Link></p>
          : <p className="mono">converter · {converterLabel} · {f2(k)} · <Link href="/converter" className="quiet">re-measure</Link></p>}
      </header>

      <div className="text">
        <p>The sort works on structures. This works on you. Each miss is one rep. Log the first sentence as it came. Translate it so its subject is the act. Name what the miss did not touch. The instrument times the second sentence. Over reps, two things fall: the level of the first sentence, and the seconds before the second one. The converter score in part two of the sort is the baseline; re-answer it monthly and watch it move.</p>
      </div>

      <div className="inst">
        <form className="qgrid" onSubmit={onSubmit} aria-busy={pending}>
          <div className="q">
            <label className="mono" htmlFor={actId}>the miss · what happened to the act</label>
            <input
              type="text"
              maxLength={500}
              id={actId}
              className="text"
              value={act}
              onChange={(e) => setAct(e.target.value)}
              placeholder="forgot to send the thing · skipped the class · snapped at someone"
              autoComplete="off"
            />
          </div>

          <div className="q">
            <div className="lab"><span className="dim">first</span><span className="ask">The first sentence, as it arrived</span></div>
            <Chips name="level" value={level} options={LEVEL_OPTIONS} onChange={chooseLevel} label="The first sentence, as it arrived" />
          </div>

          <div className="q">
            <label className="mono" htmlFor={wordsId}>its words, if you have them</label>
            <input
              type="text"
              maxLength={500}
              id={wordsId}
              className="text"
              value={words}
              onChange={(e) => setWords(e.target.value)}
              placeholder="optional"
              autoComplete="off"
            />
          </div>

          <div className="q">
            <div className="lab"><span className="dim">second</span><span className="ask">Translate. Subject: the act.</span></div>
            <input
              type="text"
              maxLength={500}
              className="text"
              value={actTranslation}
              onChange={(e) => setActTranslation(e.target.value)}
              placeholder="the act: …"
              aria-label="the act"
              autoComplete="off"
            />
            <input
              type="text"
              maxLength={500}
              className="text"
              value={adjustment}
              onChange={(e) => setAdjustment(e.target.value)}
              placeholder="the adjustment: …"
              aria-label="the adjustment"
              autoComplete="off"
            />
          </div>

          <div className="q">
            <div className="lab"><span className="dim">ground</span><span className="ask">What this miss did not touch</span></div>
            <Chips name="ground" value={ground} options={GROUND_OPTIONS} onChange={setGround} label="What this miss did not touch" />
          </div>

          <div className="row">
            <button type="submit" className="btn primary" disabled={!ready || pending}>second sentence done</button>
            <span className="mono tnum">{timerText}</span>
            <Link className="btn" href="/converter">re-measure the converter</Link>
          </div>
          {message && <p className="notice" role="status">{message}</p>}
        </form>
      </div>

      <div className="two">
        <RepChart reps={reps} />
        <div className="verdict" aria-live="polite">
          {last ? (
            <>
              <p className={`kind ${levelCls(last.level)}`}>Second sentence in {last.latencySec}s</p>
              <p className="mono">{last.act}</p>
              <p>First sentence: {levelName(last.level)}. Translated: {last.actTranslation} — {last.adjustment}. Untouched: {last.ground}.</p>
              <p>{trendLine}</p>
            </>
          ) : (
            <>
              <p className="kind mixed">—</p>
              <p>The second sentence has not been timed yet.</p>
              {reps.length > 0 && <p>{trendLine}</p>}
            </>
          )}
        </div>
      </div>

      <div>
        <p className="mono">reps</p>
        <div className="list">
          {newestFirst.length === 0 && <p className="empty">No reps yet.</p>}
          {newestFirst.map((r) => (
            <div key={r.id} className="item">
              <span className="name">{r.act} → {r.actTranslation} / {r.adjustment}</span>
              <span className={`k k-${levelCls(r.level)}`}>{levelName(r.level)}</span>
              <span className="g">{r.latencySec}s</span>
              <span className="g" suppressHydrationWarning>{dateShort(r.createdAt)}</span>
              <ConfirmButton onConfirm={() => remove(r.id)} pending={removing === r.id} />
            </div>
          ))}
        </div>
      </div>

      <div className="text">
        <p>Why this and not insight. Knowing the critic is wrong is a conclusion, and conclusions arrive seconds after a reflex. What beats a reflex is another fast answer, already practiced. People trained to answer their own criticism with a steady, warm voice show less shame and less self-attack within weeks, and the content of the criticism does not have to change for the collapse to stop. What stops it is the second voice and its tone. The two lines on the chart are that voice getting faster and the first voice getting lighter.</p>
        <p>The ground line is the part that didn't come with your corrections. It has to be said now, by you, each rep, until it is already there before the miss. Zengzi's form: a question about an act, an answer, done. No debt.</p>
      </div>
    </section>
  );
}

/**
 * Two lines over reps in time order, as the reference page's #exChart. Pixel mapping only: the level is
 * the stored answer, the seconds are the stored measurement. A single rep draws as a short dash.
 */
function RepChart({ reps }: { reps: Rep[] }) {
  const n = reps.length;
  const first = reps[0];
  const maxLat = Math.max(30, ...reps.map((r) => r.latencySec));
  const xOf = (i: number) => (n === 1 ? 200 : 40 + (320 * i) / (n - 1));
  const yLevel = (level: number) => 180 - 130 * level;
  const yLat = (lat: number) => 180 - 130 * Math.min(1, lat / maxLat);
  const pathOf = (y: (r: Rep) => number): string => {
    if (!first) return '';
    if (n === 1) { const yy = y(first).toFixed(1); return `M196 ${yy} L204 ${yy}`; }
    return reps.map((r, i) => `${i ? 'L' : 'M'}${xOf(i).toFixed(1)} ${y(r).toFixed(1)}`).join(' ');
  };
  return (
    <svg className="stage" viewBox="0 0 380 220" role="img" aria-label="Two lines over reps: the level of the first sentence, and the seconds until the second sentence.">
      <text x="20" y="22" className="t">over reps</text>
      <line className="grid" x1="40" y1="180" x2="360" y2="180" />
      <line className="grid" x1="40" y1="180" x2="40" y2="40" />
      <text x="44" y="46" className="cp" style={{ fontSize: '11px' }}>first sentence · level</text>
      <text x="44" y="60" className="lv" style={{ fontSize: '11px' }}>second sentence · seconds</text>
      {n > 0 && <path className="lvk" style={{ stroke: 'var(--copy)' }} d={pathOf((r) => yLevel(r.level))} />}
      {n > 0 && <path className="lvk" d={pathOf((r) => yLat(r.latencySec))} />}
      {n === 0 && <text x="200" y="120" textAnchor="middle">no reps yet</text>}
    </svg>
  );
}
