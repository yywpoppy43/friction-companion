'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * Scene 4 · two childhoods. Two meters: the self as ground, and skill at the act.
 * Corrections raise skill in both modes; in the first they also eat the ground, in the second the ground holds.
 * The arithmetic here is scenery for a diagram (the prototype's drawGround), not an instrument number.
 */

type Mode = 'A' | 'B';
type SentenceKey = 'wrong' | 'adjusts' | 'worthUp' | 'steady' | 'zize' | 'zixing';

interface G {
  mode: Mode;
  ground: number;
  skill: number;
  corr: number;
  succ: number;
  miss: number;
  inflated: boolean;
  read: string;
  sentence: SentenceKey | null;
}

const READ_MODE: Record<Mode, string> = {
  A: 'Corrections arrive about the person. Warmth rides on them.',
  B: 'Corrections arrive about the act. The ground is confirmed each time.',
};

const START: G = { mode: 'A', ground: 100, skill: 0, corr: 0, succ: 0, miss: 0, inflated: false, read: READ_MODE.A, sentence: null };

function correction(g: G): G {
  const corr = g.corr + 1;
  const skill = g.skill + 7;
  if (g.mode === 'A') {
    return { ...g, corr, skill, ground: g.ground - (g.inflated ? 12 : 7), inflated: false, read: `Correction ${corr}. The act improves. The ground is charged for it.`, sentence: 'wrong' };
  }
  return { ...g, corr, skill, read: `Correction ${corr}. The act improves. The ground is confirmed.`, sentence: 'adjusts' };
}

function success(g: G): G {
  const succ = g.succ + 1;
  if (g.mode === 'A') {
    return { ...g, succ, ground: Math.min(140, Math.max(g.ground, 100) + 30), inflated: true, read: 'A success. The ground inflates past steady. It is still the variable.', sentence: 'worthUp' };
  }
  return { ...g, succ, read: 'A success. The act landed. The ground does not move, because it was never the thing being measured.', sentence: 'steady' };
}

function missAlone(g: G): G {
  const miss = g.miss + 1;
  if (g.mode === 'A') {
    return { ...g, miss, ground: g.ground - (g.inflated ? 35 : 15), inflated: false, read: 'A miss, alone. No one is in the room. The ground drops anyway. That drop is the converter.', sentence: 'zize' };
  }
  return { ...g, miss, read: 'A miss, alone. The act is examined. The ground does not move.', sentence: 'zixing' };
}

/** Pixel geometry and colour for the two meters. 140 fills the 220px column; 100 is the steady line. */
function meters(ground: number, skill: number) {
  const g = Math.max(0, Math.min(140, ground));
  const px = 220 * (g / 140);
  const sk = Math.max(0, Math.min(100, skill));
  const sp = 220 * (sk / 140);
  return {
    g: Math.round(g),
    groundH: px.toFixed(1),
    groundY: (260 - px).toFixed(1),
    groundFill: g < 60 ? 'var(--copy)' : g > 105 ? 'var(--form)' : 'var(--live)',
    sk: Math.round(sk),
    skillH: sp.toFixed(1),
    skillY: (260 - sp).toFixed(1),
    state: g > 105 ? 'inflated' : g < 60 ? 'collapsing' : g < 90 ? 'eroding' : 'steady',
    stateCls: g > 105 ? 'fm' : g < 90 ? 'cp' : 'lv',
  };
}

function reducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function Sentence({ k }: { k: SentenceKey | null }) {
  switch (k) {
    case 'wrong': return <>"what is wrong with you" · learned: I am wrong</>;
    case 'adjusts': return <>"you can do better, and I know you can" · learned: the act adjusts</>;
    case 'worthUp': return <>worth up with the result · it will come down with the next one</>;
    case 'steady': return <>steady · the result is about the act</>;
    case 'zize': return <><span className="zh">自责</span> · a debt pressed on the self, by the self</>;
    case 'zixing': return <><span className="zh">自省</span> · a look at the act. "adjust."</>;
    default: return null;
  }
}

export function Ground() {
  const [g, setG] = useState<G>(START);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef(0);

  useEffect(() => () => { if (timer.current != null) clearTimeout(timer.current); }, []);

  function tick() {
    timer.current = null;
    if (pending.current <= 0) return;
    pending.current -= 1;
    setG(correction);
    if (pending.current > 0) timer.current = setTimeout(tick, reducedMotion() ? 0 : 140);
  }
  function tenCorrections() {
    pending.current += 10;
    if (timer.current == null) tick();
  }
  function stopRun() {
    pending.current = 0;
    if (timer.current != null) { clearTimeout(timer.current); timer.current = null; }
  }
  function setMode(mode: Mode) {
    setG((s) => ({ ...s, mode, read: READ_MODE[mode], sentence: null }));
  }
  function reset() {
    stopRun();
    setG((s) => ({ ...START, mode: s.mode, read: 'Nothing has arrived yet.' }));
  }

  const m = meters(g.ground, g.skill);

  return (
    <section className="scene" id="ground">
      <p className="mono"><b>4</b> · judgment or examination · the mechanism</p>
      <h2>The same correction teaches the act either way. The difference is what it makes the variable: the act, or you.</h2>
      <div className="inst">
        <div className="row" role="group" aria-label="How corrections arrive">
          <button type="button" className="btn copyb" id="modeA" aria-pressed={g.mode === 'A'} onClick={() => setMode('A')}>about the person · warmth rides on it</button>
          <button type="button" className="btn liveb" id="modeB" aria-pressed={g.mode === 'B'} onClick={() => setMode('B')}>about the act · the ground confirmed</button>
        </div>
        <div className="two">
          <svg className="stage" id="groundStage" viewBox="0 0 360 300" role="img" aria-label="A figure with two meters: the self as ground, and skill at the act. Corrections raise skill in both modes. In the first mode they also eat the ground; in the second the ground holds.">
            <text x="20" y="24" className="t">the self as ground</text>
            <rect x="20" y="40" width="130" height="220" style={{ fill: 'var(--paper)', stroke: 'var(--rule)', strokeWidth: 1 }} />
            <rect id="groundFill" x="20" y={m.groundY} width="130" height={m.groundH} style={{ fill: m.groundFill, opacity: 0.85 }} />
            <line x1="12" y1="40" x2="158" y2="40" style={{ stroke: 'var(--ink-2)', strokeDasharray: '3 3' }} />
            <text x="162" y="44" style={{ fontSize: 11 }}>steady · 100</text>
            <text id="groundNum" x="85" y="286" textAnchor="middle" className="t">{m.g}</text>
            <text x="220" y="24" className="t">skill at the act</text>
            <rect x="220" y="40" width="60" height="220" style={{ fill: 'var(--paper)', stroke: 'var(--rule)', strokeWidth: 1 }} />
            <rect id="skillFill" x="220" y={m.skillY} width="60" height={m.skillH} style={{ fill: 'var(--form)' }} />
            <text id="skillNum" x="250" y="286" textAnchor="middle" className="t">{m.sk}</text>
            <text id="groundState" x="320" y="150" textAnchor="middle" className={m.stateCls} style={{ fontSize: 12 }}>{m.state}</text>
          </svg>
          <div style={{ display: 'grid', gap: 12 }}>
            <div className="row">
              <button type="button" className="btn" id="tenCorr" onClick={tenCorrections}>ten corrections</button>
              <button type="button" className="btn" id="oneSuccess" onClick={() => setG(success)}>a success</button>
              <button type="button" className="btn" id="missAlone" onClick={() => setG(missAlone)}>a miss, alone, years later</button>
              <button type="button" className="btn" id="groundReset" onClick={reset}>start over</button>
            </div>
            <div className="counters">
              <span>corrections <b id="gCorr">{g.corr}</b></span>
              <span>successes <b id="gSucc">{g.succ}</b></span>
              <span>misses alone <b id="gMiss">{g.miss}</b></span>
            </div>
            <p className="readout" id="groundRead" aria-live="polite">{g.read}</p>
            <p className="mono" id="groundSentence"><Sentence k={g.sentence} /></p>
          </div>
        </div>
      </div>
      <div className="text">
        <p>Run ten corrections in each mode and compare. Skill rises the same in both. The intention behind the correction is the same in both: they want you better. The difference is the second channel. "You can do better, and I know you can" leaves the ground where it was. "What's wrong with you" moves the ground into the variable column. From then on every miss re-opens the question the child cannot yet answer, and the self is graded alongside the act.</p>
        <p>Press "a success" in the first mode. The ground inflates past steady. Press a correction after it. It crashes below where it started. That swing is measured in adolescents whose parents' warmth tracked their grades: inflated after success, shame after failure, both faces of one unstable worth. Then press "a miss, alone, years later." No one is in the room. In the first mode the ground still drops. That drop, with no one present, is the converter. In the second mode the act adjusts and the ground does not move. That is examination without collapse.</p>
        <p>Confidence, in this picture, is not a feeling. It is the ground staying put while the act is corrected. A child who had it confirmed can be corrected a thousand times and keep it. A child who didn't has to grow it later, by hand, one miss at a time.</p>
      </div>
      <div className="case">
        <p className="mono">in your case</p>
        <p>Your observation is the mechanism. "You can do better" with the value confirmed, against pure criticism from good intention: same act channel, opposite second channel. A young child cannot tell which one is arriving. The body files both as "you." The examiner in scene seven is the by-hand version of the confirmation that didn't come with the corrections.</p>
      </div>
    </section>
  );
}
