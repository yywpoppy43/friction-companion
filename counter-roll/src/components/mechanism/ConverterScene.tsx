'use client';
import { useEffect, useId, useRef, useState } from 'react';

/**
 * Scene 3 · the converter. Corrections arrive from an outside measure and leave marks inside; after
 * enough, the measure moves in; from then on a form calls up the copy. A slider moves the seat.
 * Ported from the reference page's prototype. The flying square is scenery drawn imperatively
 * inside an empty <g ref> per animation frame; React never renders into that group. The marks, the
 * labels, the counters and the seat are React state. Nothing here is a measurement.
 */

const NS = 'http://www.w3.org/2000/svg';
const MARKPOS: readonly (readonly [number, number])[] = [[-40, -30], [30, -45], [-10, -60], [45, 10], [-50, 20], [0, 45], [40, 50], [-30, 55], [60, -20], [-60, -5], [15, -15], [-20, 0]];
const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type Point = readonly [number, number];
interface Flash { color: 'var(--copy)' | 'var(--live)'; at: number }
interface Model {
  corr: number;
  /** the button was pressed: the measure is on its way in */
  movedIn: boolean;
  /** the flight finished: the evaluator is drawn inside */
  inside: boolean;
  fired: number;
  /** slider position 0–100 */
  seat: number;
  selfLabel: string;
  convRead: string;
  convSub: string;
  flash: Flash | null;
}

const initial = (): Model => ({
  corr: 0, movedIn: false, inside: false, fired: 0, seat: 0,
  selfLabel: 'you, early · nothing written yet',
  convRead: 'a correction arrives. it is meant as help.',
  convSub: 'it also answers: what am I?',
  flash: null,
});

/** What the seat says once the measure is inside; nothing before that. */
function seatText(seat: number, movedIn: boolean): Partial<Model> {
  if (!movedIn) return {};
  const mine = seat / 100 > 0.5;
  return {
    convRead: mine ? 'the seat is yours. a miss is information about an act.' : 'the measure runs inside. any miss calls it up.',
    convSub: mine ? '自省 · examine the act' : '自责 · blame the self',
  };
}

export function ConverterScene() {
  const seatId = useId();
  const flyerHost = useRef<SVGGElement>(null);
  const rafs = useRef(new Set<number>());
  const busy = useRef(false);
  const [m, setM] = useState<Model>(initial);

  useEffect(() => () => {
    for (const id of rafs.current) cancelAnimationFrame(id);
    rafs.current.clear();
    flyerHost.current?.replaceChildren();
  }, []);

  // the flash on the self circle lasts 420ms, as the prototype's does
  useEffect(() => {
    if (!m.flash) return;
    const t = setTimeout(() => setM((p) => ({ ...p, flash: null })), 420);
    return () => clearTimeout(t);
  }, [m.flash]);

  function fly(from: Point, to: Point, cls: 'cps' | 'fms', done: () => void) {
    const host = flyerHost.current;
    if (!host) return;
    const g = document.createElementNS(NS, 'g');
    const r = document.createElementNS(NS, 'rect');
    for (const [k, v] of Object.entries({ x: '-9', y: '-9', width: '18', height: '18', class: cls })) r.setAttribute(k, v);
    g.appendChild(r);
    g.setAttribute('transform', `translate(${from[0]},${from[1]})`);
    host.appendChild(g);
    const dur = reducedMotion() ? 1 : 650;
    let t0: number | null = null;
    let id = 0;
    const frame = (ts: number) => {
      rafs.current.delete(id);
      if (t0 == null) t0 = ts;
      const p = Math.min(1, (ts - t0) / dur);
      const e = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
      const x = from[0] + (to[0] - from[0]) * e, y = from[1] + (to[1] - from[1]) * e;
      g.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`);
      if (p < 1) { id = requestAnimationFrame(frame); rafs.current.add(id); }
      else { g.remove(); done(); }
    };
    id = requestAnimationFrame(frame);
    rafs.current.add(id);
  }

  function correct() {
    if (busy.current || m.movedIn) return;
    busy.current = true;
    fly([590, 88], [200, 175], 'cps', () => {
      busy.current = false;
      setM((p) => {
        const corr = p.corr + 1;
        return {
          ...p, corr,
          selfLabel: corr < 3 ? 'you, early · a line written' : corr < 6 ? 'you, early · the copy is forming' : 'you · the copy is written. the measure can move in.',
          convRead: corr < 3 ? 'a correction arrives. it is meant as help.' : corr < 6 ? 'each one also answers: what am I?' : 'enough of them, and the room is no longer needed.',
          convSub: corr < 6 ? 'written from outside, by a measure you cannot yet doubt' : 'the measure moves inside',
        };
      });
    });
  }

  function moveIn() {
    if (m.movedIn || m.corr < 6) return;
    setM((p) => ({ ...p, movedIn: true }));
    fly([590, 88], [200, 175], 'cps', () => {
      setM((p) => ({ ...p, inside: true, ...seatText(p.seat, true), selfLabel: 'you · the evaluator is inside now' }));
    });
  }

  function formArrives() {
    if (busy.current) return;
    busy.current = true;
    fly([30, 175], [200, 175], 'fms', () => {
      busy.current = false;
      setM((p) => {
        if (!p.movedIn && p.corr === 0) {
          return { ...p, convRead: 'a form. nothing fires. there is nothing inside to fire.', convSub: 'the act is done or not done. that is all.' };
        }
        const mine = p.seat / 100 > 0.5;
        const at = Date.now();
        if (p.movedIn && !mine) {
          return { ...p, fired: p.fired + 1, flash: { color: 'var(--copy)', at }, convRead: 'a form arrived holding nothing about you. the copy fired anyway.', convSub: 'the structure holds the act. you hold the verdict.' };
        }
        if (p.movedIn) {
          return { ...p, flash: { color: 'var(--live)', at }, convRead: 'a form arrived. the act is examined. "adjust." nothing else.', convSub: 'your measure, aimed at the act' };
        }
        return { ...p, flash: { color: 'var(--copy)', at }, convRead: 'a form arrived. the marks stir, but the measure is still outside.', convSub: 'it fires fully once it has moved in' };
      });
    });
  }

  function reset() {
    for (const id of rafs.current) cancelAnimationFrame(id);
    rafs.current.clear();
    flyerHost.current?.replaceChildren();
    busy.current = false;
    setM(initial());
  }

  function onSeat(value: number) {
    setM((p) => ({ ...p, seat: value, ...seatText(value, p.movedIn) }));
  }

  const mine = m.seat / 100 > 0.5;
  const markCls = mine ? 'lvs' : 'cps';
  const labelCls = mine ? 'lv' : 'cp';
  const written = Math.min(100, Math.round((m.corr / 8) * 100));

  return (
    <section className="scene" id="converter">
      <p className="mono"><b>3</b> · how the copy moved inside</p>
      <h2>The copy moved inside. Now the structure doesn't need to hold one. You supply it.</h2>
      <div className="inst">
        <svg className="stage" viewBox="0 0 760 340" role="img" aria-label="A child, early, with no copy inside. Corrections arrive from an outside measure and each leaves a mark inside. After enough, the measure itself moves inside. From then on a form arriving calls up the inner copy even though the form holds nothing about the person. A slider moves the seat of evaluation back inside and changes what it measures.">
          <text x="200" y="30" className="t" textAnchor="middle">{m.selfLabel}</text>
          <circle cx="200" cy="175" r="100" style={{ fill: 'var(--live-soft)', stroke: m.flash ? m.flash.color : 'var(--live)', strokeWidth: m.flash ? 6 : 2 }} />
          <g>
            {Array.from({ length: m.corr }, (_, i) => {
              const p = MARKPOS[i % MARKPOS.length];
              return p ? <rect key={i} x={200 + p[0] - 7} y={175 + p[1] - 7} width="14" height="14" className={markCls} /> : null;
            })}
          </g>
          <g style={{ opacity: m.inside ? 1 : 0 }}>
            <rect x="160" y="150" width="80" height="50" className={markCls} />
            <text x="200" y="172" textAnchor="middle" className={labelCls}>{mine ? 'my measure' : 'their measure'}</text>
            <text x="200" y="190" textAnchor="middle" className={labelCls}>{mine ? 'of the act' : m.movedIn ? 'inside' : 'outside'}</text>
          </g>
          <g style={{ opacity: m.inside ? 0.25 : 1 }}>
            <rect x="520" y="60" width="140" height="56" className="box" />
            <text x="590" y="83" textAnchor="middle" className="t">their measure</text>
            <text x="590" y="103" textAnchor="middle">outside, in the room</text>
          </g>
          <g ref={flyerHost} />
          <text x="590" y="300" textAnchor="middle" className="t">{m.convRead}</text>
          <text x="590" y="320" textAnchor="middle">{m.convSub}</text>
        </svg>
        <div className="row">
          <button type="button" className="btn copyb" onClick={correct}>a correction arrives</button>
          <button type="button" className="btn" disabled={m.movedIn || m.corr < 6} onClick={moveIn}>the measure moves inside</button>
          <button type="button" className="btn formb" onClick={formArrives}>a form arrives</button>
          <button type="button" className="btn" onClick={reset}>start over</button>
        </div>
        <div className="counters">
          <span>corrections <b className="cp">{m.corr}</b></span>
          <span>copy written <b>{written}%</b></span>
          <span>forms that fired the copy <b className="cp">{m.fired}</b></span>
        </div>
        <div className="slider">
          <label className="mono" htmlFor={seatId}>where the measure sits, and what it measures</label>
          <input type="range" id={seatId} min={0} max={100} value={m.seat} aria-label="Seat of evaluation" onChange={(e) => onSeat(Number(e.target.value))} />
          <div className="ends"><span className="zh">自责 · their measure, blaming the self</span><span className="zh">自省 · my measure, examining the act</span></div>
        </div>
      </div>
      <div className="text">
        <p>A child is corrected before it knows who it is. Each correction is meant as help. Each one also answers a question the child cannot yet answer alone: what am I? The answers pile up into a copy, written from outside, by people whose measure the child has no way to doubt.</p>
        <p>Then the measure moves in. The evaluator no longer needs to be in the room. Any miss, on any form, calls up the copy, and the copy says what it was taught to say. That is why the first option under "object" felt thin to you. A pure form still says something about you, because now the saying is yours. The structure holds the act. You hold the verdict.</p>
        <p>The way out is not to stop evaluating. It is two moves on the slider. Bring the seat of evaluation back inside, so the measure is yours. Then change what it measures: the act, not the self.</p>
      </div>
      <div className="pair">
        <div><span className="zhw">自责</span><p><b>Self-blame.</b> 责 carries 贝, the cowrie shell, money. Its oldest sense is to press for a debt. Self-blame audits the self against a ledger and finds it owing. That ledger is the counter-roll, turned inward.</p></div>
        <div className="ok"><span className="zhw">自省</span><p><b>Self-examination.</b> 省 is to look closely. Zengzi examined himself three times a day, and every question was about an act: was I loyal in counsel, true to my friends, did I practice what I taught. Not one about worth. A look, not a debt.</p></div>
      </div>
      <div className="case">
        <p className="mono">in your case</p>
        <p>Your words: "error, corrected." Corrected a lot, early, before you had a self to defend. The sort you run on structures ends at the door. This one starts after it. The gap in scene five is where it shows up as a number, and the four questions in part two of the sort measure it directly.</p>
      </div>
    </section>
  );
}
