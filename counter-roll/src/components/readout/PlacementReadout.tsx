import { scoreStructure, verdict as verdictOf, type DimAnswers, type Weights } from '@model/sort-algorithm.mjs';
import { fillAnswers } from '@/lib/compute';
import { MapSvg, type MapPoint, type MapXY } from './MapSvg';
import { Equation } from './Equation';
import { Profile } from './Profile';
import { Gauge } from './Gauge';
import { VerdictBlock } from './VerdictBlock';

/**
 * The whole readout for one set of answers: map, profile, verdict, equation, gauge.
 * Place, Rebuild and the Weights preview all draw this. Unanswered dimensions sit at 0 and are dimmed
 * in the equation; the verdict appears once all seven are in.
 */
export function PlacementReadout({ name, answers, felt, k, weights, others = [], from = null, placeholder, mapId = 'current' }: {
  name: string;
  answers: Partial<DimAnswers>;
  felt: number | null;
  k: number | null;
  weights: Weights;
  others?: MapPoint[];
  /** draw a dotted trail from this earlier position to the current one */
  from?: MapXY | null;
  placeholder?: string;
  mapId?: string;
}) {
  const filled = fillAnswers(answers);
  const score = scoreStructure({ ...filled.answers, felt }, k, weights);
  const v = filled.complete ? verdictOf(filled.answers, score) : null;
  const current: MapPoint | null = filled.complete ? { id: mapId, name, copy: score.copy, imp: score.imp, cls: v!.cls } : null;
  return (
    <>
      <div className="calc">
        <div style={{ display: 'grid', gap: 18 }}>
          <MapSvg current={current} others={others} halo={k != null ? score.conv : null} trail={from && current ? { from, to: current } : null} />
          <Profile score={score} />
        </div>
        <VerdictBlock verdict={v} name={name} score={filled.complete ? score : null} placeholder={placeholder} />
      </div>
      <div className="two">
        <Equation score={score} felt={felt} missing={filled.missing} />
        <Gauge score={score} felt={felt} complete={filled.complete} />
      </div>
    </>
  );
}
