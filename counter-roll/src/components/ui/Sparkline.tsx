/** A small line of one measure over entries. Values are given; nothing is computed here but pixel positions. */
export function Sparkline({ values, labels = [], zeroLine = true, ariaLabel, min, max }: {
  values: (number | null)[];
  labels?: string[];
  zeroLine?: boolean;
  ariaLabel: string;
  min?: number;
  max?: number;
}) {
  const W = 280, H = 84, L = 30, R = 10, T = 10, B = 18;
  const nums = values.filter((v): v is number => v != null);
  if (nums.length === 0) return null;
  const lo = Math.min(min ?? 0, ...nums), hi = Math.max(max ?? 0, ...nums);
  const span = hi - lo || 1;
  const x = (i: number) => (values.length === 1 ? (L + W - R) / 2 : L + ((W - L - R) * i) / (values.length - 1));
  const y = (v: number) => T + (H - T - B) * (1 - (v - lo) / span);
  const d = values.map((v, i) => (v == null ? null : `${x(i).toFixed(1)} ${y(v).toFixed(1)}`)).filter(Boolean).map((p, i) => (i ? 'L' : 'M') + p).join(' ');
  return (
    <svg className="spark" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
      {zeroLine && lo <= 0 && hi >= 0 && <line className="zero" x1={L} x2={W - R} y1={y(0)} y2={y(0)} />}
      <text x={L - 4} y={y(hi) + 3} textAnchor="end">{hi.toFixed(1)}</text>
      <text x={L - 4} y={y(lo) + 3} textAnchor="end">{lo.toFixed(1)}</text>
      {values.length > 1 && <path className="line" d={d} />}
      {values.map((v, i) => (v == null ? null : <circle key={i} cx={x(i)} cy={y(v)} r="3" />))}
      {labels[0] && <text x={L} y={H - 4}>{labels[0]}</text>}
      {labels.length > 1 && <text x={W - R} y={H - 4} textAnchor="end">{labels[labels.length - 1]}</text>}
    </svg>
  );
}
