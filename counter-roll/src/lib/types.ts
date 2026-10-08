/** Serializable shapes shared by server and client code. */
import type { ConverterAnswers, DimAnswers, Ground, Weights } from '@model/sort-algorithm.mjs';

export interface ConverterVersion { id: string; answers: ConverterAnswers; k: number; createdAt: string }
export interface WeightVersion { id: string; weights: Weights; note: string | null; createdAt: string }
export interface Structure { id: string; name: string; createdAt: string }
export interface Placement {
  id: string;
  structureId: string;
  structure: string;
  answers: DimAnswers;
  felt: number;
  converterVersionId: string | null;
  weightVersionId: string | null;
  parentPlacementId: string | null;
  createdAt: string;
}
export interface Rep {
  id: string;
  act: string;
  verbatim: string | null;
  level: number;
  actTranslation: string;
  adjustment: string;
  ground: Ground;
  latencySec: number;
  converterVersionId: string | null;
  createdAt: string;
}

/** Everything the screens read, loaded once per request. Versions oldest first; placements newest first; reps oldest first. */
export interface Workspace {
  ownerId: string;
  converterVersions: ConverterVersion[];
  weightVersions: WeightVersion[];
  structures: Structure[];
  placements: Placement[];
  reps: Rep[];
}
