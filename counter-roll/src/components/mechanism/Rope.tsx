'use client';
import { useState } from 'react';

/**
 * Scene 5 · the rope. A copy on the left with its own direction; a figure on the right tied to it.
 * Obey and rebel keep the rope taut; free lets it go slack. The second slider is the cost: force with no bed spreads.
 * The geometry here is pixel scenery for the diagram (the prototype's drawRope and drawKept), not an instrument number.
 */

const f = (n: number) => n.toFixed(1);

function rope(value: number) {
  const v = value / 100;
  const cx = 580;
  const cy = 125;
  let angle: number;
  let label: 'obey' | 'rebel' | 'free';
  let sub: string;
  let slack: number;
  if (v < 0.5) {
    const t = v / 0.5;
    angle = Math.PI * t;
    label = t < 0.5 ? 'obey' : 'rebel';
    sub = t < 0.5 ? 'the copy decides. you follow.' : 'the copy decides. you invert it. still tied.';
    slack = 0;
  } else {
    const u = (v - 0.5) / 0.5;
    angle = Math.PI - u * (Math.PI * 0.75);
    label = u < 0.5 ? 'rebel' : 'free';
    sub = u < 0.5 ? 'the copy decides. you invert it. still tied.' : 'the copy is one input. you decide. rope slack.';
    slack = u;
  }
  const len = 48;
  const ux = Math.cos(-angle);
  const uy = Math.sin(-angle);
  const ex = cx + ux * len;
  const ey = cy + uy * len;
  const px = -uy;
  const py = ux;
  const sag = 70 * slack;
  return {
    arrowD: `M${f(cx + ux * 22)} ${f(cy + uy * 22)} L${f(ex)} ${f(ey)}`,
    headD: `M${f(ex - ux * 12 + px * 7)} ${f(ey - uy * 12 + py * 7)} L${f(ex + ux * 2)} ${f(ey + uy * 2)} L${f(ex - ux * 12 - px * 7)} ${f(ey - uy * 12 - py * 7)} Z`,
    ropeD: `M190 125 Q375 ${125 + sag} ${cx - 22} 125`,
    dash: slack > 0.5 ? '4 6' : undefined,
    ropeLabel: slack > 0.5 ? 'slack' : 'taut',
    ropeLabelY: 112 + sag / 2,
    label,
    sub,
    col: label === 'free' ? 'var(--live)' : label === 'rebel' ? 'var(--copy)' : 'var(--ink)',
  };
}

function kept(value: number) {
  const k = value / 100;
  return {
    pools: 1 - k * 0.95,
    bed: Math.min(1, k * 1.4),
    channel: 2 + 16 * k,
    arriving: Math.round(k * 100),
  };
}

export function Rope() {
  const [pos, setPos] = useState(0);
  const [forms, setForms] = useState(0);
  const r = rope(pos);
  const k = kept(forms);

  return (
    <section className="scene" id="rope">
      <p className="mono"><b>5</b> · the paradox</p>
      <h2>Hating the copy is a rope to the copy. Cutting every form is a flood.</h2>
      <div className="inst">
        <svg className="stage" id="ropeStage" viewBox="0 0 760 250" role="img" aria-label="A copy on the left with its own direction. A figure on the right tied to it by a rope. Obey: the rope is taut and the figure moves the copy's way. Rebel: taut, and the figure moves exactly opposite. Free: the rope goes slack and the figure moves its own way.">
          <rect className="box" x="60" y="95" width="130" height="60" />
          <text className="t" x="125" y="121" textAnchor="middle">the copy</text>
          <path className="ink" d="M100 142 L146 142" /><path d="M144 136 L156 142 L144 148 Z" style={{ fill: 'var(--ink)', stroke: 'none' }} />
          <path id="ropePath" className="thin" d={r.ropeD} style={{ strokeDasharray: r.dash }} />
          <circle className="box" id="figure" cx="580" cy="125" r="22" />
          <path id="figArrow" className="ink" d={r.arrowD} style={{ strokeWidth: 2.6, stroke: r.col }} />
          <path id="figHead" d={r.headD} style={{ fill: r.col, stroke: 'none' }} />
          <text id="ropeLabel" x="375" y={r.ropeLabelY} textAnchor="middle">{r.ropeLabel}</text>
          <text id="posLabel" className="t" x="580" y="190" textAnchor="middle">{r.label}</text>
          <text id="posSub" x="580" y="210" textAnchor="middle">{r.sub}</text>
        </svg>
        <div className="slider">
          <input type="range" id="posSlider" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label="Position toward the copy" />
          <div className="ends"><span>obey</span><span>rebel</span><span>free</span></div>
        </div>
        <div className="two" style={{ marginTop: 6 }}>
          <div className="slider">
            <label className="mono" htmlFor="formsKept">forms kept in your life</label>
            <input type="range" id="formsKept" min={0} max={100} value={forms} onChange={(e) => setForms(Number(e.target.value))} aria-label="Share of forms kept" />
            <div className="ends"><span>none · absolute freedom</span><span>all</span></div>
          </div>
          <svg className="stage" viewBox="0 0 360 200" role="img" aria-label="Water from one source. With no forms it spreads into pools. With forms it runs between banks to a mouth.">
            <circle className="lvf" cx="180" cy="22" r="8" />
            <g id="pools" style={{ opacity: k.pools }}>
              <ellipse className="lvs" cx="60" cy="120" rx="38" ry="16" />
              <ellipse className="lvs" cx="300" cy="110" rx="40" ry="16" />
              <ellipse className="lvs" cx="120" cy="170" rx="42" ry="16" />
              <ellipse className="lvs" cx="250" cy="172" rx="40" ry="15" />
              <path className="lvk" d="M180 30 C140 60 100 90 70 112" style={{ strokeWidth: 4 }} />
              <path className="lvk" d="M180 30 C220 60 260 85 290 104" style={{ strokeWidth: 4 }} />
              <path className="lvk" d="M180 30 C170 80 150 130 128 160" style={{ strokeWidth: 4 }} />
              <path className="lvk" d="M180 30 C200 80 230 130 248 162" style={{ strokeWidth: 4 }} />
            </g>
            <g id="bed" style={{ opacity: k.bed }}>
              <path className="fmk" d="M150 36 C146 90 148 140 154 180" />
              <path className="fmk" d="M210 36 C214 90 212 140 206 180" />
              <path className="lvk" id="bedChannel" d="M180 30 L180 178" style={{ strokeWidth: k.channel }} />
              <path className="lvf" d="M166 180 L194 180 L202 196 L158 196 Z" />
            </g>
            <text x="180" y="10" textAnchor="middle" id="arrive" style={{ fontSize: 12, fill: 'var(--ink)' }}>force arriving: {k.arriving}%</text>
          </svg>
        </div>
      </div>
      <div className="text">
        <p>Three positions toward any copy. Obey: it decides, you follow. Rebel: it decides, you invert. Free: it is one input, and you decide. Drag to rebel and look at the rope. Still taut. The figure's direction is still set by the copy, just mirrored. That is why reverse psychology works on people who hate control.</p>
        <p>The second slider is the cost. Rebel long enough and every form goes out with the copies. Force with no bed does not stop. It spreads. The generation never fails. The arriving does. And the inner copy from scene three is untouched by any of it, because it was never outside.</p>
      </div>
    </section>
  );
}
