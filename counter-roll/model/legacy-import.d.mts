import type { ConverterAnswers, DimAnswers, Ground } from './sort-algorithm.mjs';

export const LEGACY_KEYS: { readonly sort: 'counter-roll-sort-v3'; readonly converter: 'counter-roll-converter-v1'; readonly examiner: 'counter-roll-examiner-v1' };

export interface LegacyPlacement { legacyId: string | null; name: string; answers: DimAnswers; felt: number; createdAt: string | null }
export interface LegacyRep {
  legacyId: string | null; act: string; verbatim: string | null; level: number;
  actTranslation: string; adjustment: string; ground: Ground; latencySec: number; createdAt: string | null;
}
export interface LegacyImport {
  converter: { answers: ConverterAnswers } | null;
  placements: LegacyPlacement[];
  reps: LegacyRep[];
  warnings: string[];
}
export function isoFromMillis(x: unknown): string | null;
export function parseJsonLoose(input: unknown): unknown;
export function locatePayloads(value: unknown): { sort: unknown; converter: unknown; examiner: unknown };
export function parseLegacy(input: unknown): LegacyImport;
