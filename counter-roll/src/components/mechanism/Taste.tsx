'use client';
import { useState } from 'react';
import { Meterbar } from '@/components/ui/Meterbar';

/**
 * Scene 2 · the taste. A fusion meter, four servings, and the alarm's response curve.
 * Ported from the reference page's prototype. The curve is scenery for the diagram: it draws how
 * one volume becomes two as fusion drops. It is not an instrument number and nothing is stored.
 */

const clamp = (x: number) => Math.max(0, Math.min(100, x));

/** The response curve from copy (left) to form (right) at a given fusion, as the prototype's drawGrad draws it. */
function curve(fusion: number): string {
  const f = fusion / 100;
  const pts: string[] = [];
  for (let i = 0; i <= 20; i++) {
    const x = i / 20;
    const a = Math.max(0.05, 1 - (1 - f) * Math.pow(x, 1.6));
    pts.push(`${i ? 'L' : 'M'}${(40 + 300 * x).toFixed(1)} ${(200 - 152 * a).toFixed(1)}`);
  }
  return pts.join(' ');
}

export function Taste() {
  const [fusion, setFusion] = useState(100);
  const [alone, setAlone] = useState(0);
  const [bad, setBad] = useState(0);

  const serveTogether = () => setFusion((v) => clamp(v + 15));
  const serveAlone = () => { setFusion((v) => clamp(v - 6)); setAlone((n) => n + 1); };
  const serveBad = () => { setFusion((v) => clamp(v + 12)); setBad((n) => n + 1); };
  const reset = () => { setFusion(100); setAlone(0); setBad(0); };

  const f = fusion / 100;
  const stroke = f > 0.66 ? 'var(--copy)' : f > 0.33 ? 'var(--form)' : 'var(--live)';
  const caption = f > 0.85 ? 'one volume for everything' : f > 0.5 ? 'the line begins to drop at the form end' : f > 0.2 ? 'two volumes. the door is sorting.' : 'sized. full for a copy, quiet for a form.';
  const readout = fusion >= 95 ? 'Fully fused. Every form tastes like correction.'
    : fusion >= 60 ? 'Still fused. A form alone registers, but barely.'
      : fusion >= 30 ? 'Loosening. Some forms pass as forms.'
        : fusion > 5 ? 'Mostly untied. A bad serving still sets you back two steps.'
          : 'Untied. Forms taste like forms. Copies still fire. That is the point.';

  return (
    <section className="scene" id="taste">
      <p className="mono"><b>2</b> · how the door lost its sort</p>
      <h2>Served together long enough, two things store as one taste. Then the alarm has one volume.</h2>
      <div className="inst">
        <div className="two">
          <div style={{ display: 'grid', gap: 14 }}>
            <Meterbar label="fusion" tone="copy" fill={fusion / 100} value={String(Math.round(fusion))} />
            <div className="row">
              <button type="button" className="btn copyb" onClick={serveTogether}>serve form + correction</button>
              <button type="button" className="btn formb" onClick={serveAlone}>serve a form alone</button>
              <button type="button" className="btn" onClick={serveBad}>one bad serving</button>
              <button type="button" className="btn" onClick={reset}>start over</button>
            </div>
            <div className="counters">
              <span>reps alone <b className="fm">{alone}</b></span>
              <span>bad servings <b className="cp">{bad}</b></span>
            </div>
            <p className="readout" aria-live="polite">{readout}</p>
          </div>
          <svg className="stage" viewBox="0 0 360 260" role="img" aria-label="The alarm's response curve. Fused: flat at full volume from copy to form. Unfused: full for a copy, near zero for a form.">
            <text x="20" y="22" className="t">how loud the alarm fires</text>
            <line className="grid" x1="40" y1="200" x2="340" y2="200" />
            <line className="grid" x1="40" y1="200" x2="40" y2="40" />
            <text x="40" y="222" className="cp">a copy of you</text>
            <text x="340" y="222" className="fm" textAnchor="end">a form</text>
            <text x="46" y="48">full</text>
            <text x="46" y="196">quiet</text>
            <path className="thin dash" d="M40 48 L340 48" style={{ opacity: 0.5 }} />
            <path className="lvk" d={curve(fusion)} style={{ stroke }} />
            <text x="190" y="250" textAnchor="middle">{caption}</text>
          </svg>
        </div>
      </div>
      <div className="text">
        <p>Eat a dish once with the flu and the dish tastes wrong for years. The body files the pair, not the parts. A childhood of forms served with correction files form and correction as one. That is the flat line: an alarm that cannot tell a copy from a form fires the same for both.</p>
        <p>The pair comes apart the way it formed. A form served alone, small, with nothing bad after, lowers the fusion a step. One bad serving raises it two steps. That asymmetry is why cold turkey can't do this. The unfusing is reps, and a single mold in the middle of the reps sets you back further than a rep moves you forward.</p>
      </div>
    </section>
  );
}
