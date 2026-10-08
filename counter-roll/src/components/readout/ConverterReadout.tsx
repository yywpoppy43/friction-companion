import { converterStrength, converterLabel, type ConverterAnswers, type Weights } from '@model/sort-algorithm.mjs';
import { ConverterEquation } from './Equation';
import { f2 } from '@/lib/format';

/** Strength k, its label, the arithmetic, and the one-paragraph reading. Words from the reference page. */
export function ConverterReadout({ answers, weights }: { answers: ConverterAnswers | null; weights: Weights }) {
  if (!answers) {
    return <div className="kread"><p>Answer the four. They describe you, not a structure, so they are asked once and kept.</p></div>;
  }
  const k = converterStrength(answers, weights);
  const expl = k < 0.25
    ? 'Misses arrive as information about acts. The seat is yours. The gap you feel on forms will be the structure’s, or authorship’s.'
    : k < 0.5
      ? 'A should runs after each miss. Introjected standard, rung two, light. It will add a quarter of the remaining room to every alarm.'
      : k < 0.75
        ? 'The miss becomes a statement about you. Rung two, heavy. On pure forms this adds most of what you feel.'
        : 'The miss is a sentence on worth. Every form will fire near full regardless of what it holds. Move the seat before anything else.';
  return (
    <div className="kread">
      <p className="kv">{converterLabel(k)} · {f2(k)}</p>
      <ConverterEquation answers={answers} weights={weights.converter} k={k} />
      <p>{expl}</p>
    </div>
  );
}
