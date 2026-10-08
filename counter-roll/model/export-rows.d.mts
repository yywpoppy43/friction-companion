import type { DimAnswers, Score, Verdict } from './sort-algorithm.mjs';

export const EXPORT_COLUMNS: readonly string[];
export interface ExportPlacement {
  id: string; structure: string; createdAt: string; parentPlacementId: string | null;
  answers: DimAnswers; felt: number; converterVersionId: string | null; weightVersionId: string | null;
  runConverterVersionId?: string | null; runWeightVersionId?: string | null;
  k: number | null; score: Score; verdict: Pick<Verdict, 'kind' | 'rung'>;
}
export type ExportRow = Record<string, string | number | null>;
export function placementRows(placements: ExportPlacement[]): ExportRow[];
export function csvCell(v: unknown): string;
export function toCsv(rows: ExportRow[], columns?: readonly string[]): string;
