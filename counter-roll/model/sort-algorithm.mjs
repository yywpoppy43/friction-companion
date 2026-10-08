/**
 * The Counter-Roll — scoring model.
 * Pure functions. No DOM, no storage. This file is the source of truth for the arithmetic;
 * every screen that shows a number must call these functions rather than re-deriving them.
 *
 * Vocabulary
 *   structure  — any rule, routine, plan, schedule, promise or standard a person lives inside
 *   form       — a structure that holds a shape for an act (when, where, what, how long)
 *   copy       — a structure that holds a picture of the person (who to be, how to feel)
 *   converter  — the person's own reflex that turns a miss into a statement about the self
 *   warranted  — the alarm the structure deserves on its own terms, 0–10
 *   felt       — the alarm the person reports, 0–10
 *   remainder  — felt − warranted − converter share; what neither layer explains
 */

export const WEIGHTS = Object.freeze({
  copyShare: 0.55,
  imposedShare: 0.45,
});

/** Part one: the structure. Seven dimensions, each answered on 2–3 levels. */
export const DIMS = Object.freeze([
  { key: 'object', side: 'copy', w: 0.40, levels: [0, 0.5, 1],
    labels: ['an act, nothing about me', 'an act with a picture of me attached', 'a picture of who I should be'],
    move: 'Hold the act, not the person. Strip the picture of you out of it.' },
  { key: 'miss', side: 'copy', w: 0.30, levels: [0, 0.6, 1],
    labels: ['nothing, I adjust', 'a statement about me', 'their warmth toward me changes'],
    move: 'Make a miss information. If warmth rides on it, that is the mold, not the form.' },
  { key: 'scope', side: 'copy', w: 0.15, levels: [0, 0.5, 1],
    labels: ['one act', 'several areas of my life', 'who I am, everywhere'],
    move: 'Narrow it to one act.' },
  { key: 'reason', side: 'copy', w: 0.15, levels: [0, 1],
    labels: ['the why is visible', '"because."'],
    move: 'Say what it is for, in one sentence.' },
  { key: 'author', side: 'imp', w: 0.55, levels: [0, 0.45, 1],
    labels: ['I set the terms', 'someone else, and I agreed', 'someone else, no agreement'],
    move: 'Restate the terms in your own words. Agree to them or counter them.' },
  { key: 'exit', side: 'imp', w: 0.25, levels: [0, 0.4, 1],
    labels: ['end visible', 'reopenable if I ask', 'no end in sight'],
    move: 'Set the exit before you step in. A date, a count, a condition.' },
  { key: 'grain', side: 'imp', w: 0.20, levels: [0, 1],
    labels: ['rough: a window, a week', 'exact: a minute, a count, a script'],
    move: 'Make it a window, not a minute.' },
]);

/** Part two: the converter. Four questions, answered once per person, versioned when changed. */
export const CONVERTER = Object.freeze([
  { key: 'sentence', w: 0.35, levels: [0, 0.4, 0.75, 1],
    labels: ['"Adjust."', '"I should have."', '"This is what I\'m like."', '"This is what I\'m worth."'] },
  { key: 'speed', w: 0.20, levels: [0, 0.6, 1],
    labels: ['after I have looked at what happened', 'at the same moment as the miss', 'before the act is finished'] },
  { key: 'follow', w: 0.20, levels: [0, 0.4, 0.8, 1],
    labels: ['fix the act, move on', 'replay the miss a few times', 'correct myself harder than the structure asked', 'cut the whole structure'] },
  { key: 'seat', w: 0.25, levels: [0, 0.7, 1],
    labels: ['my own measure of the act', 'how it looks to them', 'what they would say'] },
]);

const clamp01 = (x) => Math.max(0, Math.min(1, x));

/**
 * Weights, as one editable object. The constants above are the first setting; this is the same
 * setting in the shape a weight version is stored in. Every scoring function takes an optional
 * `weights` argument so any stored version can be re-run on any stored answers.
 *
 *   split     — copyShare / imposedShare, sum to one
 *   dims      — one weight per DIMS key; copy-side keys sum to one, imposed-side keys sum to one
 *   converter — one weight per CONVERTER key, sum to one
 */
export const DEFAULT_WEIGHTS = Object.freeze({
  split: Object.freeze({ copyShare: WEIGHTS.copyShare, imposedShare: WEIGHTS.imposedShare }),
  dims: Object.freeze(Object.fromEntries(DIMS.map(d => [d.key, d.w]))),
  converter: Object.freeze(Object.fromEntries(CONVERTER.map(d => [d.key, d.w]))),
});

const WEIGHT_EPS = 0.005;
const near1 = (x) => Math.abs(x - 1) <= WEIGHT_EPS;

/**
 * Checks a weights object. Returns { ok, errors }. Does not throw.
 * Each side must sum to one: the split, the copy dimensions, the imposed dimensions, the converter.
 */
export function validateWeights(weights) {
  const errors = [];
  if (!weights || typeof weights !== 'object') return { ok: false, errors: ['weights missing'] };
  const { split, dims, converter } = weights;
  const num = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;
  if (!split || !num(split.copyShare) || !num(split.imposedShare)) errors.push('split: copyShare and imposedShare must be numbers in 0–1');
  else if (!near1(split.copyShare + split.imposedShare)) errors.push('split: copyShare + imposedShare must sum to one');
  if (!dims || typeof dims !== 'object') errors.push('dims missing');
  else {
    for (const d of DIMS) if (!num(dims[d.key])) errors.push(`dims.${d.key}: must be a number in 0–1`);
    const copy = DIMS.filter(d => d.side === 'copy').reduce((s, d) => s + (num(dims[d.key]) ? dims[d.key] : 0), 0);
    const imp = DIMS.filter(d => d.side === 'imp').reduce((s, d) => s + (num(dims[d.key]) ? dims[d.key] : 0), 0);
    if (!near1(copy)) errors.push('dims: copy-side weights (object, miss, scope, reason) must sum to one');
    if (!near1(imp)) errors.push('dims: imposed-side weights (author, exit, grain) must sum to one');
  }
  if (!converter || typeof converter !== 'object') errors.push('converter missing');
  else {
    for (const d of CONVERTER) if (!num(converter[d.key])) errors.push(`converter.${d.key}: must be a number in 0–1`);
    const sum = CONVERTER.reduce((s, d) => s + (num(converter[d.key]) ? converter[d.key] : 0), 0);
    if (!near1(sum)) errors.push('converter: weights must sum to one');
  }
  return { ok: errors.length === 0, errors };
}

/**
 * Sets one weight in a group and rescales the others so the group still sums to one.
 * `group` is a plain object of key → weight (e.g. the copy-side dims, or weights.converter).
 * Returns a new object; the input is not changed. Values are rounded to three places.
 */
export function rebalanceWeights(group, key, value) {
  if (!(key in group)) throw new Error(`weight key unknown: ${key}`);
  const keys = Object.keys(group);
  const v = clamp01(value);
  const others = keys.filter(k => k !== key);
  const rest = 1 - v;
  const otherSum = others.reduce((s, k) => s + group[k], 0);
  const out = {};
  for (const k of others) out[k] = otherSum > 0 ? group[k] / otherSum * rest : rest / others.length;
  out[key] = v;
  // round, then put any rounding dust on the changed key so the sum stays exactly one
  for (const k of keys) out[k] = Math.round(out[k] * 1000) / 1000;
  const sum = keys.reduce((s, k) => s + out[k], 0);
  out[key] = Math.round((out[key] + (1 - sum)) * 1000) / 1000;
  return out;
}

/** @param {Record<string, number>} answers  values from CONVERTER[i].levels  @returns {number} 0–1 */
export function converterStrength(answers, weights = DEFAULT_WEIGHTS) {
  let k = 0;
  for (const d of CONVERTER) {
    if (answers[d.key] == null) throw new Error(`converter answer missing: ${d.key}`);
    const w = weights.converter[d.key];
    if (w == null) throw new Error(`converter weight missing: ${d.key}`);
    k += w * answers[d.key];
  }
  return clamp01(k);
}

export function converterLabel(k) {
  if (k < 0.25) return 'the examiner';
  if (k < 0.5) return 'the should';
  if (k < 0.75) return 'the verdict';
  return 'the sentence on worth';
}

/**
 * @param {Record<string, number>} answers  values from DIMS[i].levels, plus `felt` 0–10
 * @param {number|null} k  converter strength, or null when not set
 * @param {typeof DEFAULT_WEIGHTS} weights  a weight version; defaults to the first setting
 */
export function scoreStructure(answers, k = null, weights = DEFAULT_WEIGHTS) {
  let copy = 0, imp = 0;
  const parts = [];
  for (const d of DIMS) {
    const v = answers[d.key];
    if (v == null) throw new Error(`structure answer missing: ${d.key}`);
    const w = weights.dims[d.key];
    if (w == null) throw new Error(`structure weight missing: ${d.key}`);
    const c = w * v;
    if (d.side === 'copy') copy += c; else imp += c;
    parts.push({ key: d.key, side: d.side, v, w, contribution: c, move: d.move });
  }
  copy = clamp01(copy); imp = clamp01(imp);
  const warranted = 10 * (weights.split.copyShare * copy + weights.split.imposedShare * imp);
  const conv = k == null ? 0 : k * (10 - warranted);
  const predicted = warranted + conv;
  const felt = answers.felt;
  return {
    copy, imp, warranted, conv, predicted, k, weights,
    gap: felt == null ? null : felt - warranted,
    remainder: felt == null ? null : felt - predicted,
    parts,
    hot: parts.filter(p => p.v >= 0.4).sort((a, b) => b.contribution - a.contribution),
  };
}

/** Quadrant verdict and rung. rung: 0 imposed · 1 swallowed · 2 chosen · 3 yours */
export function verdict(answers, score) {
  const mine = answers.author === 0, imposed = answers.author === 1;
  let out;
  if (score.copy < 0.35) {
    out = imposed
      ? { kind: 'Cage', cls: 'mixed', rung: 0, text: 'A form you never agreed to. The form may be fine. The terms aren’t yours. Author them or leave.' }
      : { kind: 'Trellis', cls: 'form', rung: mine ? 3 : 2, text: 'It holds a shape, not you. Keep it. The miss is where a trellis turns; watch that one dimension.' };
  } else if (score.copy < 0.65) {
    out = { kind: 'Trellis with a mold in it', cls: 'mixed', rung: mine ? 2 : 1, text: 'The form is usable. Something in it holds a picture of you. Take that out and keep the rest.' };
  } else if (mine) {
    out = { kind: 'Inner mold', cls: 'copy', rung: 1, text: 'A copy of you, held by you. Replace the copy with a form: not who to be, but what goes out, and when.' };
  } else {
    out = { kind: 'Mold', cls: 'copy', rung: 0, text: 'A copy of you, held by someone else. There is nothing in it to tune. Decline the terms.' };
  }
  if (answers.exit === 1) out.text += ' No end in sight. Without an exit even a trellis becomes a dam.';
  if (score.k != null && score.copy < 0.35 && score.conv > 2.5) out.text += ' Most of what you feel here is the converter, not the structure.';
  return out;
}

/** The examiner: one rep per miss. Levels of the first sentence match CONVERTER[0].levels. */
export const EXAMINER_LEVELS = Object.freeze([
  { value: 0, label: '"Adjust."' },
  { value: 0.4, label: '"I should have."' },
  { value: 0.75, label: '"This is what I\'m like."' },
  { value: 1, label: '"This is what I\'m worth."' },
]);

export const EXAMINER_GROUNDS = Object.freeze(['intention', 'worth', 'building', 'people', 'none']);

const mean = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;

/**
 * Direction across reps. Each rep: { level, latencySec, ts }.
 * Compares the second half of the reps with the first half.
 */
export function examinerTrend(reps) {
  if (reps.length < 4) return { ready: false };
  const half = Math.floor(reps.length / 2);
  const a = reps.slice(0, half), b = reps.slice(half);
  const dLevel = mean(b.map(r => r.level)) - mean(a.map(r => r.level));
  const dLatency = mean(b.map(r => r.latencySec)) - mean(a.map(r => r.latencySec));
  const dir = (d, eps) => (d <= -eps ? 'falling' : d >= eps ? 'rising' : 'flat');
  return { ready: true, dLevel, dLatency, level: dir(dLevel, 0.1), latency: dir(dLatency, 2) };
}

/**
 * Reads the pattern across placements. Each placement: { answers, score }.
 * Returns the sentence the page shows, plus the rows behind it.
 */
export function pattern(placements, k = null) {
  if (placements.length < 3) return { ready: false, rows: {}, sentence: null };
  const val = (p) => (k == null ? p.score.gap : p.score.remainder);
  const forms = placements.filter(p => p.answers.object === 0);
  const rows = {
    gapForms: mean(forms.map(p => p.score.gap)),
    remainderForms: k == null ? null : mean(forms.map(p => p.score.remainder)),
    byMine: mean(placements.filter(p => p.answers.author === 0).map(val)),
    byTheirs: mean(placements.filter(p => p.answers.author > 0).map(val)),
    byRough: mean(placements.filter(p => p.answers.grain === 0).map(val)),
    byExact: mean(placements.filter(p => p.answers.grain === 1).map(val)),
  };
  let sentence, knot;
  if (rows.gapForms == null) { sentence = 'No pure form placed yet.'; knot = 'unknown'; }
  else if (rows.gapForms <= 1.5) { sentence = 'Forms are sized. The alarm is not the knot on these placements.'; knot = 'none'; }
  else if (k == null) { sentence = 'Forms fire above what they warrant. Set the converter to see how much of it is you.'; knot = 'flat-line'; }
  else if (rows.remainderForms != null && Math.abs(rows.remainderForms) <= 1.5) { sentence = 'The converter explains the gap on forms. The knot is self-judgment.'; knot = 'converter'; }
  else if (rows.byTheirs != null && rows.byMine != null && rows.byTheirs - rows.byMine > 1.5) { sentence = 'A remainder stays after the converter and rides on who set the terms. Two knots: self-judgment and authorship.'; knot = 'converter+authorship'; }
  else { sentence = 'A remainder stays after the converter and does not follow authorship. Look at grain and exit.'; knot = 'other'; }
  return { ready: true, rows, sentence, knot };
}

/**
 * Per-dimension breakdown: for each dimension and each of its levels, the mean of what the
 * placements at that level leave unexplained (remainder when the converter is set, gap when not)
 * and how many placements sit there. Same inputs as pattern(). Levels with no placements have n 0
 * and mean null.
 */
export function remainderByLevel(placements, k = null) {
  const val = (p) => (k == null ? p.score.gap : p.score.remainder);
  const out = {};
  for (const d of DIMS) {
    out[d.key] = d.levels.map((level, i) => {
      const at = placements.filter(p => p.answers[d.key] === level);
      return { level, label: d.labels[i], n: at.length, mean: mean(at.map(val)) };
    });
  }
  return out;
}
