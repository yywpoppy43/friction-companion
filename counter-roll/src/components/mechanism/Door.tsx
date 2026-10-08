'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * Scene 1 · the door. Forms and copies travel toward one door; the alarm fires per arrival.
 * Ported from the reference page's prototype. The moving items are scenery: they are drawn
 * imperatively inside an empty <g ref> on each animation frame, as the prototype does, and React
 * never renders into that group. The counters, the ring and the alarm text are React state.
 * Nothing here is a measurement; the per-item randomness is only where an item starts.
 */

type ItemType = 'form' | 'copy';
interface Item { el: SVGGElement; type: ItemType; x: number; y: number }
interface Counts { forms: number; copies: number; alarms: number; spent: number }

const NS = 'http://www.w3.org/2000/svg';
const MIX: readonly ItemType[] = ['form', 'form', 'copy', 'form', 'form', 'form', 'copy', 'form', 'form', 'copy'];
const ZERO: Counts = { forms: 0, copies: 0, alarms: 0, spent: 0 };

function sv<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string>): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}
const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function Door() {
  const itemsHost = useRef<SVGGElement>(null);
  const items = useRef<Item[]>([]);
  const sortedRef = useRef(false);
  const running = useRef(false);
  const last = useRef<number | null>(null);
  const raf = useRef<number | null>(null);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const ringTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [sorted, setSorted] = useState(false);
  const [counts, setCounts] = useState<Counts>(ZERO);
  /** size of the alarm the last arrival fired, 0–1; null while resting */
  const [alarm, setAlarm] = useState<number | null>(null);

  useEffect(() => () => {
    if (raf.current != null) cancelAnimationFrame(raf.current);
    for (const t of timers.current) clearTimeout(t);
    timers.current.clear();
    if (ringTimer.current) clearTimeout(ringTimer.current);
    for (const it of items.current) it.el.remove();
    items.current = [];
    running.current = false;
  }, []);

  function makeItem(host: SVGGElement, type: ItemType): Item {
    const g = sv('g', {});
    if (type === 'form') {
      g.appendChild(sv('rect', { x: '-11', y: '-11', width: '22', height: '22', class: 'fms' }));
    } else {
      g.appendChild(sv('rect', { x: '-11', y: '-11', width: '22', height: '22', class: 'cpf' }));
      g.appendChild(sv('circle', { cx: '0', cy: '-4', r: '3', style: 'fill:var(--paper-2);stroke:none' }));
      g.appendChild(sv('rect', { x: '-4.5', y: '0.5', width: '9', height: '8', rx: '2', style: 'fill:var(--paper-2);stroke:none' }));
    }
    g.setAttribute('transform', 'translate(10,150)');
    host.appendChild(g);
    return { el: g, type, x: 10, y: 150 - 40 + Math.random() * 80 };
  }

  function fire(size: number) {
    setAlarm(size);
    if (ringTimer.current) clearTimeout(ringTimer.current);
    ringTimer.current = setTimeout(() => { ringTimer.current = null; setAlarm(null); }, 420);
  }

  function arrive(it: Item) {
    const size = sortedRef.current ? (it.type === 'form' ? 0.08 : 1) : 1;
    setCounts((c) => ({
      forms: c.forms + (it.type === 'form' ? 1 : 0),
      copies: c.copies + (it.type === 'copy' ? 1 : 0),
      alarms: c.alarms + (size > 0.85 ? 1 : 0),
      spent: c.spent + Math.round(size * 10),
    }));
    fire(size);
  }

  function step(ts: number) {
    raf.current = null;
    if (items.current.length === 0) { running.current = false; return; }
    if (last.current == null) last.current = ts;
    const dt = Math.min(50, ts - last.current);
    last.current = ts;
    const speed = reducedMotion() ? 1.2 : 0.22;
    items.current = items.current.filter((it) => {
      it.x += speed * dt;
      const yy = 150 + (it.y - 150) * Math.max(0, 1 - it.x / 360);
      it.el.setAttribute('transform', `translate(${it.x.toFixed(1)},${yy.toFixed(1)})`);
      if (it.x >= 372) { arrive(it); it.el.remove(); return false; }
      return true;
    });
    raf.current = requestAnimationFrame(step);
  }

  function send(type: ItemType) {
    const host = itemsHost.current;
    if (!host) return;
    items.current.push(makeItem(host, type));
    if (!running.current) {
      running.current = true;
      last.current = null;
      raf.current = requestAnimationFrame(step);
    }
  }

  function sendMix() {
    MIX.forEach((type, i) => {
      const t = setTimeout(() => { timers.current.delete(t); send(type); }, i * 260);
      timers.current.add(t);
    });
  }

  function setDoor(next: boolean) {
    sortedRef.current = next;
    setSorted(next);
  }

  const ringR = alarm == null ? 6 : 6 + 52 * alarm;
  const ringOpacity = alarm != null && alarm > 0.15 ? 0.95 : 0.25;
  const alarmText = alarm == null ? 'resting' : alarm > 0.85 ? 'FULL' : alarm > 0.15 ? 'sized' : 'quiet';
  const alarmCls = alarm == null ? undefined : alarm > 0.85 ? 'cp' : alarm > 0.15 ? 'fm' : undefined;

  return (
    <section className="scene" id="door">
      <p className="mono"><b>1</b> · how it starts</p>
      <h2>One door. One alarm. Everything that says "do this" trips it.</h2>
      <div className="inst">
        <svg className="stage" viewBox="0 0 760 300" role="img" aria-label="Forms and copies travel toward a door. The alarm at the door fires at full size for every one of them.">
          <text x="20" y="28" className="t">arriving</text>
          <text x="400" y="28" className="t" textAnchor="middle">the door</text>
          <text x="640" y="28" className="t" textAnchor="middle">the alarm</text>
          <line className="grid" x1="20" y1="150" x2="370" y2="150" />
          <g ref={itemsHost} />
          <rect className="box" x="370" y="70" width="60" height="170" />
          <rect x="376" y="76" width="48" height="158" style={{ fill: 'var(--paper-2)', stroke: 'none' }} />
          <circle cx="414" cy="158" r="3.5" style={{ fill: 'var(--ink)', stroke: 'none' }} />
          <circle className="alarm-ring" cx="640" cy="150" r={ringR} style={{ opacity: ringOpacity }} />
          <circle cx="640" cy="150" r="58" style={{ fill: 'none', stroke: 'var(--rule)', strokeWidth: 1, strokeDasharray: '3 4' }} />
          <text x="640" y="236" textAnchor="middle" className={alarmCls} aria-live="polite">{alarmText}</text>
          <g transform="translate(20,262)">
            <rect className="fms" x="0" y="0" width="22" height="22" /><text x="30" y="16" className="fm">a form · when, where, what</text>
            <rect className="cpf" x="250" y="0" width="22" height="22" /><circle cx="261" cy="7" r="3" style={{ fill: 'var(--paper-2)', stroke: 'none' }} /><rect x="256.5" y="11.5" width="9" height="8" rx="2" style={{ fill: 'var(--paper-2)', stroke: 'none' }} /><text x="280" y="16" className="cp">a copy of you · who to be</text>
          </g>
        </svg>
        <div className="row">
          <button type="button" className="btn formb" onClick={() => send('form')}>send a form</button>
          <button type="button" className="btn copyb" onClick={() => send('copy')}>send a copy</button>
          <button type="button" className="btn" onClick={sendMix}>send ten, mixed</button>
          <span style={{ flex: 1 }} />
          <button type="button" className="btn" aria-pressed={!sorted} onClick={() => setDoor(false)}>door as it is</button>
          <button type="button" className="btn" aria-pressed={sorted} onClick={() => setDoor(true)}>a door that sorts</button>
        </div>
        <div className="counters">
          <span>forms sent <b className="fm">{counts.forms}</b></span>
          <span>copies sent <b className="cp">{counts.copies}</b></span>
          <span>full alarms <b>{counts.alarms}</b></span>
          <span>force spent <b>{counts.spent}</b></span>
        </div>
      </div>
      <div className="text">
        <p>A form holds a shape for an act: when, where, what, how long. A copy holds a picture of you: who to be, how to feel. Both arrive as "do this." A door that can't tell them apart fires at full size for each. Watch the count: every form costs as much as a copy.</p>
        <p>Switch to a door that sorts. Same traffic. The alarm fires for copies and stays quiet for forms. Nothing was let in that shouldn't be. The cost drops by the share of traffic that was forms. In most lives, that share is most of it.</p>
      </div>
    </section>
  );
}
