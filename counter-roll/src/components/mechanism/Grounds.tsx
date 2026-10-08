import type { ReactNode } from 'react';

/** Grounds: what each dimension stands on. The table from the reference page, every row. Static, server-safe. */

type Tier = 'est' | 'mod' | 'txt';
interface Row { dim: ReactNode; finding: ReactNode; source: string; tier: Tier; tierText: string }

const zh = (s: string) => <span className="zh">{s}</span>;

const ROWS: readonly Row[] = [
  { dim: 'object', finding: 'Control of a child\'s behavior (rules, monitoring) and control of a child\'s inner world (guilt, love withdrawal, shaming) are distinct constructs with opposite outcomes. Structure is not the opposite of autonomy; control is.', source: 'Barber 1996, Child Development; Soenens & Vansteenkiste 2010, Developmental Review; Jang, Reeve & Deci 2010, J. Educational Psychology', tier: 'est', tierText: 'established' },
  { dim: 'miss · warmth', finding: 'Regard made conditional on compliance produces compliance plus resentment, introjected pressure and unstable self-worth. When affection tracks achievement, self-evaluation swings with performance: inflated after success, shame after failure.', source: 'Assor, Roth & Deci 2004, J. Personality; Assor & Tal 2012, J. Adolescence', tier: 'est', tierText: 'established, correlational' },
  { dim: 'miss · verdict', finding: 'Criticism aimed at the person rather than the act leaves children more helpless after setbacks.', source: 'Kamins & Dweck 1999, Developmental Psychology', tier: 'est', tierText: 'established' },
  { dim: 'converter · seat', finding: 'Where a person\'s evaluation sits, inside or outside, is a named variable. Conditions of worth, taken in from others, move it outside. Growth moves it back inside.', source: 'Rogers 1951, 1959: locus of evaluation, conditions of worth', tier: 'mod', tierText: 'theory, clinical' },
  { dim: 'converter · sentence', finding: 'Self-criticism has measurable forms: a self felt as inadequate, a self that is hated, and a self that is reassured. The first two predict depression and shame.', source: 'Gilbert, Clarke, Hempel, Miles & Irons 2004, British J. Clinical Psychology', tier: 'est', tierText: 'established measure' },
  { dim: 'converter · speed', finding: 'The brain\'s error signal within a tenth of a second of a mistake is larger in anxious and perfectionistic people. The grading is reflex-fast.', source: 'Hajcak and colleagues; Weinberg et al. 2012', tier: 'mod', tierText: 'model, applied here' },
  { dim: 'two childhoods · the second channel', finding: 'One added sentence beside critical comments, saying they came with high expectations and belief the student could meet them, more than doubled revision rates among students who trusted school least. Content unchanged.', source: 'Yeager et al. 2014, J. Experimental Psychology: General', tier: 'est', tierText: 'established' },
  { dim: 'two childhoods · the swing', finding: 'Adolescents whose mothers\' warmth tracked achievement showed self-aggrandizement after success and shame after failure, and rigid over-investment.', source: 'Assor & Tal 2012, J. Adolescence', tier: 'est', tierText: 'established, correlational' },
  { dim: 'two childhoods · contingent worth', finding: 'Self-worth staked on outcomes is unstable by construction: it rises and falls with each result in the staked domain. Secure worth is not contingent.', source: 'Crocker & Wolfe 2001, Psychological Review; Kernis 2003', tier: 'est', tierText: 'established' },
  { dim: 'two childhoods · the child', finding: 'Young children\'s self-evaluations are global and built from adults\' evaluations; the ability to hold self and act apart develops later.', source: 'Harter, The Construction of the Self', tier: 'mod', tierText: 'developmental model' },
  { dim: 'examiner · the second voice', finding: 'Training a warm, steady inner voice that answers one\'s own criticism reduced shame, self-criticism and depression in highly self-critical people within weeks.', source: 'Gilbert & Procter 2006, Clinical Psychology & Psychotherapy', tier: 'est', tierText: 'established, small samples' },
  { dim: 'examiner · tone over content', finding: 'In two-chair work, the contempt in the self-critical voice, more than its content, predicted the collapse of the self that received it.', source: 'Whelton & Greenberg 2005, Personality and Individual Differences', tier: 'est', tierText: 'established' },
  { dim: zh('自责'), finding: <>{zh('说文：责，求也。从贝。')}The oldest sense is to demand what is owed; {zh('债')}, debt, is its later derivative. Self-blame is a debt audit.</>, source: 'Shuowen Jiezi', tier: 'txt', tierText: 'text' },
  { dim: 'scope · exit', finding: 'Reactance scales with the importance of the freedom, the share of freedoms threatened, and the implication for other freedoms.', source: 'Brehm 1966; Steindl et al. 2015, Zeitschrift für Psychologie', tier: 'est', tierText: 'established' },
  { dim: 'reason · author', finding: 'A rationale, acknowledgment of the person\'s view, and a sense of choice move a regulation from imposed toward owned.', source: 'Deci, Eghrari, Patrick & Leone 1994; Ryan & Deci 2000', tier: 'est', tierText: 'established' },
  { dim: 'grain', finding: 'Putting leisure at an exact time lowers expected and actual enjoyment. Rough scheduling ("this afternoon") does not. Thirteen studies.', source: 'Tonietto & Malkoc 2016, J. Marketing Research', tier: 'est', tierText: 'established' },
  { dim: 'the flat line', finding: 'Anxious systems overgeneralize a learned alarm: the response gradient from threat to safe cue flattens. Discrimination training sharpens it.', source: 'Lissek et al. 2014, Biological Psychiatry; Dunsmoor & Paz 2015', tier: 'mod', tierText: 'model, applied here' },
  { dim: 'the rungs', finding: 'Regulation moves from external, to introjected (a swallowed should), to identified, to integrated.', source: 'Ryan & Deci 2000, American Psychologist', tier: 'est', tierText: 'established' },
  { dim: 'want vs have-to', finding: 'Goals held as wants are reached with less effort; the same goals held as have-tos feel like obstacles.', source: 'Milyavskaya, Inzlicht, Hope & Koestner 2015, JPSP', tier: 'est', tierText: 'established' },
  { dim: <>{zh('自省')} · {zh('自责')}</>, finding: <>{zh('吾日三省吾身')}. Three daily questions, each about an act. The tradition's self-examination is aimed at conduct, not at worth.</>, source: 'Analects 1.4', tier: 'txt', tierText: 'text' },
  { dim: 'the fourth rung', finding: <>{zh('从心所欲，不逾矩')}. The square stays. The heart stops colliding with it.</>, source: 'Analects 2.4', tier: 'txt', tierText: 'text' },
  { dim: 'the weights', finding: '40 · 30 · 15 · 15, 55 · 25 · 20, the 55/45 split, and 35 · 25 · 20 · 20 for the converter are a first setting. Nothing here fixes them.', source: 'this instrument', tier: 'mod', tierText: 'to be tuned' },
];

export function Grounds() {
  return (
    <section className="scene" id="grounds">
      <p className="mono">grounds</p>
      <h2>What each dimension stands on.</h2>
      <div className="tbl">
        <table>
          <thead>
            <tr><th>Dimension</th><th>Finding</th><th>Source</th><th>Tier</th></tr>
          </thead>
          <tbody>
            {ROWS.map((r, i) => (
              <tr key={i}>
                <td>{r.dim}</td>
                <td>{r.finding}</td>
                <td>{r.source}</td>
                <td className={`tier ${r.tier}`}>{r.tierText}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
