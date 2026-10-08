import type { DimKey, Score } from '@model/sort-algorithm.mjs';
import { f1, f2, signed1 } from '@/lib/format';

/** The arithmetic, in full, as the reference page prints it. Every value is read off the score object. */
export function Equation({ score, felt, missing = [] }: { score: Score; felt: number | null; missing?: readonly DimKey[] }) {
  const k = score.k;
  const w = score.weights;
  const term = (p: Score['parts'][number]) => (
    <span key={p.key} className={missing.includes(p.key) ? 'dim' : undefined}>{f2(p.w)}×{f2(p.v)}</span>
  );
  const join = (nodes: React.ReactNode[]) => nodes.flatMap((n, i) => (i ? [' + ', n] : [n]));
  const copyParts = score.parts.filter((p) => p.side === 'copy');
  const impParts = score.parts.filter((p) => p.side === 'imp');
  const remCls = score.remainder == null ? '' : score.remainder > 1.5 ? 'cp' : score.remainder < -1.5 ? 'lv' : '';
  return (
    <div className="eq" aria-live="polite">
      <div><span className="cp">copy-share</span> = {join(copyParts.map(term))} = <b>{f2(score.copy)}</b></div>
      <div>imposed-share = {join(impParts.map(term))} = <b>{f2(score.imp)}</b></div>
      <div>warranted = 10 × ({f2(w.split.copyShare)}×{f2(score.copy)} + {f2(w.split.imposedShare)}×{f2(score.imp)}) = <b>{f1(score.warranted)}</b></div>
      {k == null
        ? <div><span className="cp">converter</span> not set · its share is unknown</div>
        : <div><span className="cp">converter</span> adds {f2(k)} × (10 − {f1(score.warranted)}) = <b>{f1(score.conv)}</b></div>}
      {felt == null
        ? <div>felt = <b>—</b></div>
        : <div>felt = <b>{felt}</b>&nbsp;&nbsp; remainder = {felt} − {f1(score.warranted)}{k == null ? '' : ` − ${f1(score.conv)}`} = <b className={remCls}>{signed1(score.remainder)}</b></div>}
    </div>
  );
}

export function ConverterEquation({ answers, weights, k }: { answers: Record<string, number>; weights: Record<string, number>; k: number }) {
  const keys = ['sentence', 'speed', 'follow', 'seat'];
  return (
    <p className="eq eq-inline">converter = {keys.map((key, i) => <span key={key}>{i ? ' + ' : ''}{f2(weights[key] ?? 0)}×{f2(answers[key] ?? 0)}</span>)} = <b>{f2(k)}</b></p>
  );
}
