import type { Score } from '@model/sort-algorithm.mjs';
import { Meterbar } from '@/components/ui/Meterbar';
import { f1, signed1 } from '@/lib/format';

/** The layered gauge: structure (black), converter (copper), felt (teal mark). */
export function Gauge({ score, felt, complete }: { score: Score; felt: number | null; complete: boolean }) {
  const k = score.k;
  const r = score.remainder;
  const sentence = !complete || felt == null
    ? ''
    : k == null
      ? 'Set the converter to split the alarm into layers.'
      : r != null && r > 1.5
        ? `Remainder ${signed1(r)}. A third layer is firing. Check author.`
        : r != null && r < -1.5
          ? `Remainder ${signed1(r)}. Quieter than both layers predict. Something is getting in.`
          : `Remainder ${signed1(r)}. Two layers explain it: the structure, and you.`;
  return (
    <div className="gauge">
      <Meterbar label="structure" tone="ink" fill={score.warranted / 10} second={{ left: score.warranted / 10, width: score.conv / 10 }} mark={felt == null ? null : felt / 10} value={f1(score.predicted)} />
      <p className="eq eq-inline">black: structure <b>{f1(score.warranted)}</b> · <span className="cp">copper: your converter</span> <b>{f1(score.conv)}</b> · <span className="lv">teal mark: felt</span> <b>{felt ?? '—'}</b></p>
      {sentence && <p className="gap">{sentence}</p>}
    </div>
  );
}
