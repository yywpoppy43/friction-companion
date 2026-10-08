/**
 * Thin glue between stored records and the model. No arithmetic lives here: every number comes from
 * sort-algorithm.mjs. This file only decides which converter version and which weight version a
 * placement is run under.
 */
import {
  converterStrength, scoreStructure, verdict, pattern, remainderByLevel, examinerTrend,
  type Weights, type Score, type Verdict, type DimAnswers,
} from '@model/sort-algorithm.mjs';
import type { ConverterVersion, Placement, Rep, WeightVersion, Workspace } from './types';

/** recorded: the converter version active when the placement was made (falling back to the current one when none was). current: the latest version for everything. */
export type ConverterMode = 'recorded' | 'current';

export function activeConverter(ws: Pick<Workspace, 'converterVersions'>): ConverterVersion | null {
  return ws.converterVersions.at(-1) ?? null;
}
export function activeWeightVersion(ws: Pick<Workspace, 'weightVersions'>): WeightVersion {
  const v = ws.weightVersions.at(-1);
  if (!v) throw new Error('no weight version: ensureOwner was not run');
  return v;
}

/** Converter strength of a version under a weight version (the stored k was computed under the weights of its day). */
export function kOf(version: ConverterVersion | null, weights: Weights): number | null {
  return version ? converterStrength(version.answers, weights) : null;
}

export function converterFor(p: Placement, ws: Pick<Workspace, 'converterVersions'>, mode: ConverterMode): ConverterVersion | null {
  const current = activeConverter(ws);
  if (mode === 'current') return current;
  const recorded = p.converterVersionId ? ws.converterVersions.find(v => v.id === p.converterVersionId) ?? null : null;
  return recorded ?? current;
}

export interface Scored {
  placement: Placement;
  converter: ConverterVersion | null;
  k: number | null;
  score: Score;
  verdict: Verdict;
}

export function scorePlacement(p: Placement, weights: Weights, converter: ConverterVersion | null): Scored {
  const k = kOf(converter, weights);
  const score = scoreStructure({ ...p.answers, felt: p.felt }, k, weights);
  return { placement: p, converter, k, score, verdict: verdict(p.answers, score) };
}

export function scoreAll(ws: Workspace, weights: Weights, mode: ConverterMode): Scored[] {
  return ws.placements.map(p => scorePlacement(p, weights, converterFor(p, ws, mode)));
}

/** pattern() over scored placements. k is the current converter's strength under the same weights. */
export function patternOf(scored: Scored[], kCurrent: number | null) {
  const input = scored.map(s => ({ answers: { ...s.placement.answers, felt: s.placement.felt }, score: s.score }));
  return { pattern: pattern(input, kCurrent), byLevel: remainderByLevel(input, kCurrent) };
}

export function trendOf(reps: Rep[]) {
  return examinerTrend(reps.map(r => ({ level: r.level, latencySec: r.latencySec })));
}

/** Answers as a complete record, with unanswered dimensions at 0 for the live preview; `complete` says whether all seven are in. */
export function fillAnswers(partial: Partial<DimAnswers>): { answers: DimAnswers; complete: boolean; missing: (keyof DimAnswers)[] } {
  const keys: (keyof DimAnswers)[] = ['object', 'miss', 'scope', 'reason', 'author', 'exit', 'grain'];
  const answers = {} as DimAnswers;
  const missing: (keyof DimAnswers)[] = [];
  for (const k of keys) { const v = partial[k]; if (v == null) { missing.push(k); answers[k] = 0; } else answers[k] = v; }
  return { answers, complete: missing.length === 0, missing };
}

/** Which weight version and which converter a screen runs under, read from the URL (?w=<id>&c=current). */
export interface RunUnder { weightVersion: WeightVersion; mode: ConverterMode }
export function resolveRun(ws: Workspace, params: { w?: string | string[]; c?: string | string[] } | undefined): RunUnder {
  const w = Array.isArray(params?.w) ? params?.w[0] : params?.w;
  const c = Array.isArray(params?.c) ? params?.c[0] : params?.c;
  const weightVersion = (w && ws.weightVersions.find(v => v.id === w)) || activeWeightVersion(ws);
  return { weightVersion, mode: c === 'current' ? 'current' : 'recorded' };
}
