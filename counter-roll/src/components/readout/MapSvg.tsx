import Link from 'next/link';
import type { VerdictCls } from '@model/sort-algorithm.mjs';
import { truncate } from '@/lib/format';

export interface MapPoint { id: string; name: string; copy: number; imp: number; cls: VerdictCls; href?: string }
export interface MapXY { copy: number; imp: number }

/** copy-share runs left→right, imposed-share top→bottom. Layout only; the shares come from the model. */
export const pxOf = (p: MapXY) => ({ cx: 50 + p.copy * 296, cy: 34 + p.imp * 296 });

export function MapSvg({ current, others = [], halo = null, trail = null, ariaLabel }: {
  current?: MapPoint | null;
  others?: MapPoint[];
  /** the converter's share on the current point; draws a copper halo when above 0.3 */
  halo?: number | null;
  trail?: { from: MapXY; to: MapXY } | null;
  ariaLabel?: string;
}) {
  const c = current ? pxOf(current) : null;
  return (
    <svg className="map" viewBox="0 0 380 380" role="img" aria-label={ariaLabel ?? 'A map. Left: holds a form. Right: holds a copy of you. Top: terms yours. Bottom: terms set for you. A halo around the dot shows how much the converter adds.'}>
      <rect x="50" y="34" width="296" height="296" style={{ fill: 'var(--paper-2)', stroke: 'none' }} />
      <line className="axis" x1="198" y1="34" x2="198" y2="330" />
      <line className="axis" x1="50" y1="182" x2="346" y2="182" />
      <rect className="edge" x="50" y="34" width="296" height="296" />
      <text x="56" y="52">trellis</text>
      <text x="340" y="52" textAnchor="end">inner mold</text>
      <text x="56" y="322">agreement · cage</text>
      <text x="340" y="322" textAnchor="end">mold</text>
      <text x="50" y="22">holds a form</text>
      <text x="346" y="22" textAnchor="end">holds a copy of you</text>
      <text transform="rotate(-90 40 182)" x="40" y="182" textAnchor="middle" style={{ fontSize: '10.5px' }}>terms yours ↑ · set for you ↓</text>
      <g>
        {others.map((o) => {
          const p = pxOf(o);
          const inner = (
            <g className="old">
              <circle cx={p.cx} cy={p.cy} r="5" className={`pt ${o.cls}`} />
              {o.copy > 0.72
                ? <text x={p.cx - 8} y={p.cy + 4} textAnchor="end">{truncate(o.name)}</text>
                : <text x={p.cx + 8} y={p.cy + 4}>{truncate(o.name)}</text>}
            </g>
          );
          return o.href ? <Link key={o.id} href={o.href}>{inner}</Link> : <g key={o.id}>{inner}</g>;
        })}
      </g>
      {trail && (() => { const f = pxOf(trail.from), t = pxOf(trail.to); return <path className="trail" d={`M${f.cx} ${f.cy} L${t.cx} ${t.cy}`} />; })()}
      {current && c && (
        <g>
          {halo != null && halo > 0.3 && <circle cx={c.cx} cy={c.cy} r={9 + halo * 4} className="halo" />}
          <circle cx={c.cx} cy={c.cy} r="9" className={`pt ${current.cls}`} />
          {current.copy > 0.6
            ? <text x={c.cx - 13} y={c.cy + 4} textAnchor="end" style={{ fill: 'var(--ink)' }}>{truncate(current.name, 26)}</text>
            : <text x={c.cx + 13} y={c.cy + 4} style={{ fill: 'var(--ink)' }}>{truncate(current.name, 26)}</text>}
        </g>
      )}
    </svg>
  );
}
