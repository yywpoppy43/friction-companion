import type { Score, Verdict } from '@model/sort-algorithm.mjs';
import { f1, f2 } from '@/lib/format';

export const RUNGS: readonly [string, string][] = [['imposed', 'their copy, outside'], ['swallowed', 'their copy, inside'], ['chosen', 'a form you endorse'], ['yours', 'form = want']];

export function Ladder({ rung }: { rung: number }) {
  return (
    <div className="ladder" aria-label="Rung">
      {RUNGS.map(([name, sub], i) => (
        <div key={name} className={i === rung ? 'on' : undefined} aria-current={i === rung ? 'step' : undefined}>{name}<small>{sub}</small></div>
      ))}
    </div>
  );
}

/** Verdict, rung and "what moves it". Shown once all seven are answered. */
export function VerdictBlock({ verdict, name, score, placeholder }: { verdict: Verdict | null; name?: string; score: Score | null; placeholder?: string }) {
  if (!verdict || !score) {
    return (
      <div className="verdict">
        <p className="kind mixed">—</p>
        <p>{placeholder ?? 'Answer the eight and the position computes here, with the arithmetic.'}</p>
      </div>
    );
  }
  const k = score.k;
  const moves: { dim: string; text: string }[] = [];
  if (k != null && score.conv >= 2) moves.push({ dim: `converter −${f1(score.conv)}`, text: 'Move the seat. Grade the act, not the self. This is the biggest lever on this structure.' });
  for (const p of score.hot) moves.push({ dim: `${p.key} −${f2(p.contribution)}`, text: p.move });
  return (
    <div className="verdict">
      <p className={`kind ${verdict.cls}`}>{verdict.kind}</p>
      {name && name !== '—' ? <p className="mono">{name}</p> : null}
      <p>{verdict.text}</p>
      <Ladder rung={verdict.rung} />
      {moves.length > 0 && (
        <div className="moves">
          <p className="mono">what moves it</p>
          {moves.map((m) => (
            <div key={m.dim} className="mv"><span className="dim">{m.dim}</span><span>{m.text}</span></div>
          ))}
        </div>
      )}
    </div>
  );
}
