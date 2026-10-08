export function Meterbar({ label, tone, fill, second, mark, value }: {
  label: string;
  tone: 'copy' | 'live' | 'form' | 'ink';
  /** 0–1 share of the track */
  fill: number;
  /** a second fill, copper, starting where the first ends: { left, width } as 0–1 shares */
  second?: { left: number; width: number } | null;
  /** a teal mark at this 0–1 position */
  mark?: number | null;
  value: string;
}) {
  const pct = (x: number) => `${Math.max(0, Math.min(100, x * 100))}%`;
  return (
    <div className={`meterbar ${tone}`}>
      <span>{label}</span>
      <div className="track">
        <div className="fill" style={{ width: pct(fill) }} />
        {second && <div className="fill second" style={{ left: pct(second.left), width: pct(second.width) }} />}
        {mark != null && <div className="mark" style={{ left: pct(mark) }} />}
      </div>
      <span className="val">{value}</span>
    </div>
  );
}
