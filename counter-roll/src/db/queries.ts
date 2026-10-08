import 'server-only';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { getDb } from './client';
import { owners, converterVersions, weightVersions, structures, placements, reps } from './schema';
import type { ConverterVersionRow, PlacementRow, RepRow, StructureRow, WeightVersionRow } from './schema';
import { DEFAULT_WEIGHTS, converterStrength, validateWeights, type ConverterAnswers, type DimAnswers, type Weights, type Ground, DIMS, EXAMINER_LEVELS, EXAMINER_GROUNDS } from '@model/sort-algorithm.mjs';
import type { LegacyImport } from '@model/legacy-import.mjs';
import type { ConverterVersion, Placement, Rep, Structure, WeightVersion, Workspace } from '@/lib/types';

const now = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

// ---- row → shape -------------------------------------------------------------------------------

const toConverter = (r: ConverterVersionRow): ConverterVersion => ({ id: r.id, answers: r.answers as ConverterAnswers, k: r.k, createdAt: r.createdAt });
const toWeights = (r: WeightVersionRow): WeightVersion => ({ id: r.id, weights: r.weights as Weights, note: r.note, createdAt: r.createdAt });
const toStructure = (r: StructureRow): Structure => ({ id: r.id, name: r.name, createdAt: r.createdAt });
const toPlacement = (r: PlacementRow, structureName: string): Placement => ({
  id: r.id, structureId: r.structureId, structure: structureName, answers: r.answers as DimAnswers, felt: r.felt,
  converterVersionId: r.converterVersionId, weightVersionId: r.weightVersionId, parentPlacementId: r.parentPlacementId, createdAt: r.createdAt,
});
const toRep = (r: RepRow): Rep => ({
  id: r.id, act: r.act, verbatim: r.verbatim, level: r.level, actTranslation: r.actTranslation, adjustment: r.adjustment,
  ground: r.ground as Ground, latencySec: r.latencySec, converterVersionId: r.converterVersionId, createdAt: r.createdAt,
});

// ---- validation of raw answers (the model throws on missing; here we also refuse off-level values) --

export function assertDimAnswers(a: unknown): DimAnswers {
  if (!a || typeof a !== 'object') throw new Error('answers missing');
  const out = {} as DimAnswers;
  for (const d of DIMS) {
    const v = (a as Record<string, unknown>)[d.key];
    if (typeof v !== 'number' || !d.levels.includes(v)) throw new Error(`answer for ${d.key} is not one of its levels`);
    out[d.key] = v;
  }
  return out;
}
export function assertFelt(x: unknown): number {
  const n = typeof x === 'string' ? Number(x) : x;
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 0 || n > 10) throw new Error('felt must be a whole number from 0 to 10');
  return n;
}
export function assertConverterAnswers(a: unknown): ConverterAnswers {
  if (!a || typeof a !== 'object') throw new Error('converter answers missing');
  const out = {} as ConverterAnswers;
  for (const q of [['sentence', [0, 0.4, 0.75, 1]], ['speed', [0, 0.6, 1]], ['follow', [0, 0.4, 0.8, 1]], ['seat', [0, 0.7, 1]]] as const) {
    const v = (a as Record<string, unknown>)[q[0]];
    if (typeof v !== 'number' || !(q[1] as readonly number[]).includes(v)) throw new Error(`converter answer for ${q[0]} is not one of its levels`);
    out[q[0]] = v;
  }
  return out;
}
/** Trims a text field and refuses one over `max` characters. */
export function clip(x: unknown, max: number, what: string): string {
  const t = String(x ?? '').trim();
  if (t.length > max) throw new Error(`${what} is too long (${max} characters at most)`);
  return t;
}
export function assertLevel(x: unknown): number {
  if (typeof x !== 'number' || !EXAMINER_LEVELS.some(l => l.value === x)) throw new Error('level is not one of the four');
  return x;
}
export function assertGround(x: unknown): Ground {
  if (typeof x !== 'string' || !(EXAMINER_GROUNDS as readonly string[]).includes(x)) throw new Error('ground unknown');
  return x as Ground;
}

// ---- owner ---------------------------------------------------------------------------------------

/** Makes sure the owner row and a first weight version exist. Safe to call on every request. */
export async function ensureOwner(ownerId: string): Promise<void> {
  const db = await getDb();
  const existing = await db.select({ id: owners.id }).from(owners).where(eq(owners.id, ownerId)).limit(1);
  if (existing.length === 0) await db.insert(owners).values({ id: ownerId, createdAt: now() }).onConflictDoNothing();
  // One statement, so two concurrent first requests (layout and page render in parallel) cannot both insert.
  await db.run(sql`INSERT INTO weight_versions (id, owner_id, weights, note, created_at)
    SELECT ${uuid()}, ${ownerId}, ${JSON.stringify(DEFAULT_WEIGHTS)}, 'first setting', ${now()}
    WHERE NOT EXISTS (SELECT 1 FROM weight_versions WHERE owner_id = ${ownerId})`);
}

// ---- converter -----------------------------------------------------------------------------------

export async function listConverterVersions(ownerId: string): Promise<ConverterVersion[]> {
  const db = await getDb();
  const rows = await db.select().from(converterVersions).where(eq(converterVersions.ownerId, ownerId)).orderBy(asc(converterVersions.createdAt), asc(converterVersions.id));
  return rows.map(toConverter);
}

export async function createConverterVersion(ownerId: string, answers: ConverterAnswers, createdAt = now()): Promise<ConverterVersion> {
  const db = await getDb();
  const weights = (await activeWeights(ownerId)).weights;
  const row = { id: uuid(), ownerId, answers, k: converterStrength(answers, weights), createdAt };
  await db.insert(converterVersions).values(row);
  return toConverter(row);
}

// ---- weights -------------------------------------------------------------------------------------

export async function listWeightVersions(ownerId: string): Promise<WeightVersion[]> {
  const db = await getDb();
  const rows = await db.select().from(weightVersions).where(eq(weightVersions.ownerId, ownerId)).orderBy(asc(weightVersions.createdAt), asc(weightVersions.id));
  return rows.map(toWeights);
}

export async function activeWeights(ownerId: string): Promise<WeightVersion> {
  const all = await listWeightVersions(ownerId);
  const last = all.at(-1);
  if (!last) throw new Error('no weight version for owner');
  return last;
}

export async function createWeightVersion(ownerId: string, weights: Weights, note: string | null): Promise<WeightVersion> {
  const check = validateWeights(weights);
  if (!check.ok) throw new Error(check.errors.join('; '));
  const db = await getDb();
  const row = { id: uuid(), ownerId, weights, note: clip(note, 80, 'the note') || null, createdAt: now() };
  await db.insert(weightVersions).values(row);
  return toWeights(row);
}

// ---- structures ----------------------------------------------------------------------------------

export async function listStructures(ownerId: string): Promise<Structure[]> {
  const db = await getDb();
  const rows = await db.select().from(structures).where(eq(structures.ownerId, ownerId)).orderBy(asc(structures.createdAt));
  return rows.map(toStructure);
}

export async function findOrCreateStructure(ownerId: string, name: string, createdAt = now()): Promise<Structure> {
  const clean = name.trim().replace(/\s+/g, ' ');
  if (!clean) throw new Error('the structure needs a name');
  if (clean.length > 200) throw new Error('the name is too long');
  const db = await getDb();
  const found = await db.select().from(structures).where(and(eq(structures.ownerId, ownerId), eq(structures.name, clean))).limit(1);
  if (found[0]) return toStructure(found[0]);
  const row = { id: uuid(), ownerId, name: clean, createdAt };
  await db.insert(structures).values(row);
  return toStructure(row);
}

// ---- placements ----------------------------------------------------------------------------------

export async function listPlacements(ownerId: string): Promise<Placement[]> {
  const db = await getDb();
  const rows = await db.select({ p: placements, name: structures.name }).from(placements)
    .innerJoin(structures, eq(placements.structureId, structures.id))
    .where(eq(placements.ownerId, ownerId))
    .orderBy(desc(placements.createdAt), desc(placements.id));
  return rows.map(r => toPlacement(r.p, r.name));
}

export async function getPlacement(ownerId: string, id: string): Promise<Placement | null> {
  const db = await getDb();
  const rows = await db.select({ p: placements, name: structures.name }).from(placements)
    .innerJoin(structures, eq(placements.structureId, structures.id))
    .where(and(eq(placements.ownerId, ownerId), eq(placements.id, id))).limit(1);
  const r = rows[0];
  return r ? toPlacement(r.p, r.name) : null;
}

export interface NewPlacement {
  structureName?: string;
  structureId?: string;
  answers: DimAnswers;
  felt: number;
  parentPlacementId?: string | null;
  createdAt?: string;
  /** when importing: the converter version to record (defaults to the active one) */
  converterVersionId?: string | null;
}

export async function createPlacement(ownerId: string, input: NewPlacement): Promise<Placement> {
  const db = await getDb();
  const answers = assertDimAnswers(input.answers);
  const felt = assertFelt(input.felt);
  let structure: Structure;
  if (input.structureId) {
    const rows = await db.select().from(structures).where(and(eq(structures.ownerId, ownerId), eq(structures.id, input.structureId))).limit(1);
    if (!rows[0]) throw new Error('structure not found');
    structure = toStructure(rows[0]);
  } else {
    structure = await findOrCreateStructure(ownerId, input.structureName ?? '', input.createdAt);
  }
  if (input.parentPlacementId) {
    const parent = await getPlacement(ownerId, input.parentPlacementId);
    if (!parent) throw new Error('parent placement not found');
  }
  const [conv, w] = await Promise.all([listConverterVersions(ownerId), activeWeights(ownerId)]);
  const converterVersionId = input.converterVersionId !== undefined ? input.converterVersionId : conv.at(-1)?.id ?? null;
  const row = {
    id: uuid(), ownerId, structureId: structure.id, answers, felt,
    converterVersionId, weightVersionId: w.id, parentPlacementId: input.parentPlacementId ?? null,
    createdAt: input.createdAt ?? now(),
  };
  await db.insert(placements).values(row);
  return toPlacement(row, structure.name);
}

export async function deletePlacement(ownerId: string, id: string): Promise<void> {
  const db = await getDb();
  await db.delete(placements).where(and(eq(placements.ownerId, ownerId), eq(placements.id, id)));
}

// ---- reps ----------------------------------------------------------------------------------------

export async function listReps(ownerId: string): Promise<Rep[]> {
  const db = await getDb();
  const rows = await db.select().from(reps).where(eq(reps.ownerId, ownerId)).orderBy(asc(reps.createdAt), asc(reps.id));
  return rows.map(toRep);
}

export interface NewRep {
  act: string; verbatim?: string | null; level: number; actTranslation: string; adjustment: string; ground: Ground; latencySec: number;
  createdAt?: string; converterVersionId?: string | null;
}

export async function createRep(ownerId: string, input: NewRep): Promise<Rep> {
  const db = await getDb();
  const act = clip(input.act, 500, 'the miss'), actTranslation = clip(input.actTranslation, 500, 'the act'), adjustment = clip(input.adjustment, 500, 'the adjustment');
  const verbatim = clip(input.verbatim, 500, 'its words') || null;
  if (!act) throw new Error('the miss needs a few words');
  if (!actTranslation || !adjustment) throw new Error('the second sentence has two parts: the act and the adjustment');
  const level = assertLevel(input.level);
  const ground = assertGround(input.ground);
  const latencySec = Math.max(0, Math.round(Number(input.latencySec) || 0));
  const conv = await listConverterVersions(ownerId);
  const row = {
    id: uuid(), ownerId, act, verbatim, level, actTranslation, adjustment, ground, latencySec,
    converterVersionId: input.converterVersionId !== undefined ? input.converterVersionId : conv.at(-1)?.id ?? null,
    createdAt: input.createdAt ?? now(),
  };
  await db.insert(reps).values(row);
  return toRep(row);
}

export async function deleteRep(ownerId: string, id: string): Promise<void> {
  const db = await getDb();
  await db.delete(reps).where(and(eq(reps.ownerId, ownerId), eq(reps.id, id)));
}

// ---- import --------------------------------------------------------------------------------------

export interface ImportResult { converter: boolean; structures: number; placements: number; reps: number; skipped: number; problems: string[] }

/**
 * Brings the reference page's entries over. The converter, if present, becomes a version dated at
 * the earliest imported entry so the placements that follow record it. Placements already present
 * (same structure, same answers, same felt, same minute) are skipped so an import can be repeated.
 */
export async function importLegacy(ownerId: string, parsed: LegacyImport): Promise<ImportResult> {
  await ensureOwner(ownerId);
  const result: ImportResult = { converter: false, structures: 0, placements: 0, reps: 0, skipped: 0, problems: [] };
  const stamps = [...parsed.placements, ...parsed.reps].map(x => x.createdAt).filter((x): x is string => !!x).sort();
  const earliest = stamps[0] ?? now();

  let converterVersionId: string | null = null;
  if (parsed.converter) {
    const existing = await listConverterVersions(ownerId);
    const same = existing.find(v => JSON.stringify(v.answers) === JSON.stringify(parsed.converter!.answers));
    if (same) converterVersionId = same.id;
    else {
      // dated at the earliest imported entry so those entries can record it, but always after any version already here
      const latest = existing.at(-1)?.createdAt;
      const wanted = earliest < now() ? earliest : now();
      const stamp = latest && latest >= wanted ? new Date(Date.parse(latest) + 1000).toISOString() : wanted;
      const v = await createConverterVersion(ownerId, parsed.converter.answers, stamp);
      converterVersionId = v.id;
      result.converter = true;
    }
  } else {
    converterVersionId = (await listConverterVersions(ownerId)).at(-1)?.id ?? null;
  }

  const before = await listPlacements(ownerId);
  const structuresBefore = new Set(before.map(p => p.structureId));
  const cleanName = (name: string) => name.trim().replace(/\s+/g, ' ');
  const key = (name: string, answers: DimAnswers, felt: number, createdAt: string | null) => `${cleanName(name)}|${JSON.stringify(answers)}|${felt}|${(createdAt ?? '').slice(0, 16)}`;
  const seen = new Set(before.map(p => key(p.structure, p.answers, p.felt, p.createdAt)));
  for (const lp of parsed.placements) {
    const k = key(lp.name, lp.answers, lp.felt, lp.createdAt);
    if (seen.has(k)) { result.skipped++; continue; }
    seen.add(k);
    try {
      const created = await createPlacement(ownerId, { structureName: lp.name, answers: lp.answers, felt: lp.felt, createdAt: lp.createdAt ?? now(), converterVersionId });
      if (!structuresBefore.has(created.structureId)) { structuresBefore.add(created.structureId); result.structures++; }
      result.placements++;
    } catch (e) {
      result.problems.push(`placement "${cleanName(lp.name)}" not brought in: ${e instanceof Error ? e.message : 'unknown problem'}`);
    }
  }

  const repsBefore = await listReps(ownerId);
  const rkey = (r: { act: string; level: number; latencySec: number; createdAt: string | null }) => `${r.act}|${r.level}|${r.latencySec}|${(r.createdAt ?? '').slice(0, 16)}`;
  const rseen = new Set(repsBefore.map(rkey));
  for (const lr of parsed.reps) {
    const k = rkey(lr);
    if (rseen.has(k)) { result.skipped++; continue; }
    rseen.add(k);
    try {
      await createRep(ownerId, { ...lr, createdAt: lr.createdAt ?? now(), converterVersionId });
      result.reps++;
    } catch (e) {
      result.problems.push(`rep "${lr.act}" not brought in: ${e instanceof Error ? e.message : 'unknown problem'}`);
    }
  }
  return result;
}

// ---- everything at once --------------------------------------------------------------------------

export async function loadWorkspace(ownerId: string): Promise<Workspace> {
  const [converterVersions, weightVersions, structuresList, placementsList, repsList] = await Promise.all([
    listConverterVersions(ownerId), listWeightVersions(ownerId), listStructures(ownerId), listPlacements(ownerId), listReps(ownerId),
  ]);
  return { ownerId, converterVersions, weightVersions, structures: structuresList, placements: placementsList, reps: repsList };
}
