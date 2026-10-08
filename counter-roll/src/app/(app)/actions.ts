'use server';
/** Server actions for every screen. Each one checks the owner, validates, writes, and revalidates. */
import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/session';
import * as q from '@/db/queries';
import { parseLegacy } from '@model/legacy-import.mjs';
import { validateWeights, type ConverterAnswers, type DimAnswers, type Weights, type Ground } from '@model/sort-algorithm.mjs';

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; message: string };

const fail = (e: unknown): { ok: false; message: string } => ({ ok: false, message: e instanceof Error ? e.message : 'something did not go through' });
const touch = () => revalidatePath('/', 'layout');

export async function saveConverterAction(answers: ConverterAnswers): Promise<ActionResult<{ id: string; k: number }>> {
  try {
    const ownerId = await requireOwner();
    const v = await q.createConverterVersion(ownerId, q.assertConverterAnswers(answers));
    touch();
    return { ok: true, id: v.id, k: v.k };
  } catch (e) { return fail(e); }
}

export async function placeAction(input: { name: string; answers: DimAnswers; felt: number; parentPlacementId?: string | null; structureId?: string | null }): Promise<ActionResult<{ id: string }>> {
  try {
    const ownerId = await requireOwner();
    const p = await q.createPlacement(ownerId, {
      structureName: input.structureId ? undefined : input.name,
      structureId: input.structureId ?? undefined,
      answers: input.answers,
      felt: input.felt,
      parentPlacementId: input.parentPlacementId ?? null,
    });
    touch();
    return { ok: true, id: p.id };
  } catch (e) { return fail(e); }
}

export async function deletePlacementAction(id: string): Promise<ActionResult> {
  try {
    const ownerId = await requireOwner();
    await q.deletePlacement(ownerId, id);
    touch();
    return { ok: true };
  } catch (e) { return fail(e); }
}

export async function saveWeightsAction(weights: Weights, note: string | null): Promise<ActionResult<{ id: string }>> {
  try {
    const check = validateWeights(weights);
    if (!check.ok) return { ok: false, message: check.errors.join('; ') };
    const ownerId = await requireOwner();
    const v = await q.createWeightVersion(ownerId, weights, note);
    touch();
    return { ok: true, id: v.id };
  } catch (e) { return fail(e); }
}

export async function saveRepAction(input: { act: string; verbatim: string | null; level: number; actTranslation: string; adjustment: string; ground: Ground; latencySec: number }): Promise<ActionResult<{ id: string }>> {
  try {
    const ownerId = await requireOwner();
    const r = await q.createRep(ownerId, input);
    touch();
    return { ok: true, id: r.id };
  } catch (e) { return fail(e); }
}

export async function deleteRepAction(id: string): Promise<ActionResult> {
  try {
    const ownerId = await requireOwner();
    await q.deleteRep(ownerId, id);
    touch();
    return { ok: true };
  } catch (e) { return fail(e); }
}

export async function importLegacyAction(text: string): Promise<ActionResult<{ result: q.ImportResult; warnings: string[] }>> {
  try {
    const ownerId = await requireOwner();
    const parsed = parseLegacy(text);
    if (!parsed.converter && parsed.placements.length === 0 && parsed.reps.length === 0) {
      return { ok: false, message: parsed.warnings[0] ?? 'nothing recognisable in that text: expected the three counter-roll keys, or one of their values' };
    }
    const result = await q.importLegacy(ownerId, parsed);
    touch();
    return { ok: true, result, warnings: [...parsed.warnings, ...result.problems] };
  } catch (e) { return fail(e); }
}
