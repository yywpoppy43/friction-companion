/** Display formatting only. No arithmetic beyond rounding for print. */
export const f1 = (x: number | null | undefined): string => (x == null ? '—' : x.toFixed(1));
export const f2 = (x: number | null | undefined): string => (x == null ? '—' : x.toFixed(2));
export const signed1 = (x: number | null | undefined): string => (x == null ? '—' : (x >= 0 ? '+' : '') + x.toFixed(1));
export const signed2 = (x: number | null | undefined): string => (x == null ? '—' : (x >= 0 ? '+' : '') + x.toFixed(2));
export const pct = (x: number): string => Math.round(x * 100) + '%';

const LEVEL_NAME: Record<string, string> = { '0': 'adjust', '0.4': 'should', '0.75': 'what I’m like', '1': 'what I’m worth' };
export const levelName = (level: number): string => LEVEL_NAME[String(level)] ?? String(level);
export const levelCls = (level: number): 'copy' | 'mixed' | 'form' => (level >= 0.75 ? 'copy' : level >= 0.4 ? 'mixed' : 'form');

export function dateShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
export function dateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
export const truncate = (s: string, n = 14): string => (s.length > n ? s.slice(0, n - 1) + '…' : s);
