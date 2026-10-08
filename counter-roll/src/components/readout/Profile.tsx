import type { Score } from '@model/sort-algorithm.mjs';
import { f1, f2 } from '@/lib/format';

export function Profile({ score }: { score: Score }) {
  return (
    <div className="profile" aria-label="Dimension profile">
      {score.parts.map((p) => (
        <div key={p.key} className={`pr${p.side === 'imp' ? ' imp' : ''}`}>
          <span>{p.key}</span>
          <div className="track"><div className="fill" style={{ width: `${p.v * 100}%` }} /></div>
          <span className="val">{f1(p.v)}</span>
        </div>
      ))}
      {score.k != null && (
        <div className="pr conv">
          <span>converter</span>
          <div className="track"><div className="fill" style={{ width: `${score.k * 100}%` }} /></div>
          <span className="val">{f2(score.k)}</span>
        </div>
      )}
    </div>
  );
}
