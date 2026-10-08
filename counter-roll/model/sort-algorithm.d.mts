/** Type declarations for sort-algorithm.mjs. The .mjs is the source of truth; keep these in step with it. */

export type DimKey = 'object' | 'miss' | 'scope' | 'reason' | 'author' | 'exit' | 'grain';
export type ConverterKey = 'sentence' | 'speed' | 'follow' | 'seat';
export type Side = 'copy' | 'imp';

export interface Dim {
  readonly key: DimKey;
  readonly side: Side;
  readonly w: number;
  readonly levels: readonly number[];
  readonly labels: readonly string[];
  readonly move: string;
}
export interface ConverterQuestion {
  readonly key: ConverterKey;
  readonly w: number;
  readonly levels: readonly number[];
  readonly labels: readonly string[];
}

export const WEIGHTS: { readonly copyShare: number; readonly imposedShare: number };
export const DIMS: readonly Dim[];
export const CONVERTER: readonly ConverterQuestion[];

export interface Weights {
  split: { copyShare: number; imposedShare: number };
  dims: Record<DimKey, number>;
  converter: Record<ConverterKey, number>;
}
export const DEFAULT_WEIGHTS: Weights;

export type DimAnswers = Record<DimKey, number>;
export type StructureAnswers = DimAnswers & { felt?: number | null };
export type ConverterAnswers = Record<ConverterKey, number>;

export function converterStrength(answers: ConverterAnswers, weights?: Weights): number;
export function converterLabel(k: number): 'the examiner' | 'the should' | 'the verdict' | 'the sentence on worth';

export interface ScorePart {
  key: DimKey;
  side: Side;
  v: number;
  w: number;
  contribution: number;
  move: string;
}
export interface Score {
  copy: number;
  imp: number;
  warranted: number;
  conv: number;
  predicted: number;
  k: number | null;
  weights: Weights;
  gap: number | null;
  remainder: number | null;
  parts: ScorePart[];
  hot: ScorePart[];
}
export function scoreStructure(answers: StructureAnswers, k?: number | null, weights?: Weights): Score;

export type VerdictKind = 'Trellis' | 'Trellis with a mold in it' | 'Inner mold' | 'Mold' | 'Cage';
export type VerdictCls = 'form' | 'mixed' | 'copy';
export type Rung = 0 | 1 | 2 | 3;
export interface Verdict { kind: VerdictKind; cls: VerdictCls; rung: Rung; text: string }
export function verdict(answers: DimAnswers, score: Score): Verdict;

export interface ExaminerLevel { readonly value: number; readonly label: string }
export const EXAMINER_LEVELS: readonly ExaminerLevel[];
export type Ground = 'intention' | 'worth' | 'building' | 'people' | 'none';
export const EXAMINER_GROUNDS: readonly Ground[];

export type Direction = 'falling' | 'rising' | 'flat';
export interface RepInput { level: number; latencySec: number }
export type ExaminerTrend =
  | { ready: false }
  | { ready: true; dLevel: number; dLatency: number; level: Direction; latency: Direction };
export function examinerTrend(reps: RepInput[]): ExaminerTrend;

export interface PlacementInput { answers: StructureAnswers; score: Score }
export interface PatternRows {
  gapForms: number | null;
  remainderForms: number | null;
  byMine: number | null;
  byTheirs: number | null;
  byRough: number | null;
  byExact: number | null;
}
export type Knot = 'unknown' | 'none' | 'flat-line' | 'converter' | 'converter+authorship' | 'other';
export type Pattern =
  | { ready: false; rows: Record<string, never>; sentence: null }
  | { ready: true; rows: PatternRows; sentence: string; knot: Knot };
export function pattern(placements: PlacementInput[], k?: number | null): Pattern;

export function validateWeights(weights: unknown): { ok: boolean; errors: string[] };
export function rebalanceWeights<T extends Record<string, number>>(group: T, key: keyof T & string, value: number): T;

export interface LevelCell { level: number; label: string; n: number; mean: number | null }
export function remainderByLevel(placements: PlacementInput[], k?: number | null): Record<DimKey, LevelCell[]>;
