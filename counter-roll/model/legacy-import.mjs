/**
 * The Counter-Roll — import of the reference page's browser storage.
 * Pure functions. Turns the three localStorage payloads the single-file page kept into the
 * records the app stores: raw answers only, never computed scores.
 *
 *   counter-roll-sort-v3       [{ id, name, a: { object, miss, scope, reason, author, exit, grain, felt, ... }, sc, kind, cls }]
 *   counter-roll-converter-v1  { c1, c2, c3, c4, complete }     c1 sentence · c2 speed · c3 follow · c4 seat
 *   counter-roll-examiner-v1   [{ id, ts, act, verb, level, act2, adj, ground, lat }]
 */
import { DIMS, CONVERTER, EXAMINER_LEVELS, EXAMINER_GROUNDS } from './sort-algorithm.mjs';

export const LEGACY_KEYS = Object.freeze({
  sort: 'counter-roll-sort-v3',
  converter: 'counter-roll-converter-v1',
  examiner: 'counter-roll-examiner-v1',
});

const CONVERTER_KEY_MAP = Object.freeze({ c1: 'sentence', c2: 'speed', c3: 'follow', c4: 'seat' });

const isObj = (x) => x != null && typeof x === 'object' && !Array.isArray(x);
const num = (x) => (typeof x === 'number' && Number.isFinite(x) ? x : typeof x === 'string' && x.trim() !== '' && Number.isFinite(Number(x)) ? Number(x) : null);
const str = (x) => (typeof x === 'string' ? x.trim() : '');

/** A millisecond timestamp (number or numeric string, as the page used Date.now() for ids) → ISO string, or null. */
export function isoFromMillis(x) {
  const n = num(x);
  if (n == null) return null;
  if (n < 946684800000 || n > 4102444800000) return null; // outside 2000–2100: not a timestamp
  return new Date(n).toISOString();
}

/** Accepts a JSON string or an already-parsed value. Returns the value or throws a plain error. */
export function parseJsonLoose(input) {
  if (typeof input !== 'string') return input;
  const t = input.trim();
  if (!t) throw new Error('nothing to import');
  return JSON.parse(t);
}

/**
 * Finds the three payloads inside whatever was pasted: the full bundle keyed by the storage keys,
 * a bundle keyed by short names (sort / converter / examiner), or a bare array (placements if the
 * items have `a`, reps if they have `act`), or a bare converter object with c1..c4.
 */
export function locatePayloads(value) {
  const out = { sort: null, converter: null, examiner: null };
  if (Array.isArray(value)) {
    if (value.every(v => isObj(v) && isObj(v.a))) out.sort = value;
    else if (value.every(v => isObj(v) && 'act' in v)) out.examiner = value;
    else if (value.length === 0) out.sort = value;
    return out;
  }
  if (!isObj(value)) return out;
  if ('c1' in value || 'c2' in value || 'c3' in value || 'c4' in value) { out.converter = value; return out; }
  const pick = (longKey, shortKey) => (value[longKey] !== undefined ? value[longKey] : value[shortKey] !== undefined ? value[shortKey] : null);
  const sort = pick(LEGACY_KEYS.sort, 'sort'), converter = pick(LEGACY_KEYS.converter, 'converter'), examiner = pick(LEGACY_KEYS.examiner, 'examiner');
  // the page stored each key as a JSON string; a dump of localStorage may still have them as strings
  const unstring = (v) => { if (typeof v === 'string') { try { return JSON.parse(v); } catch { return v; } } return v; };
  out.sort = unstring(sort); out.converter = unstring(converter); out.examiner = unstring(examiner);
  return out;
}

/**
 * @returns {{ converter: { answers: Record<string, number> } | null,
 *             placements: Array<{ legacyId: string|null, name: string, answers: Record<string, number>, felt: number, createdAt: string|null }>,
 *             reps: Array<{ legacyId: string|null, act: string, verbatim: string|null, level: number, actTranslation: string, adjustment: string, ground: string, latencySec: number, createdAt: string|null }>,
 *             warnings: string[] }}
 */
export function parseLegacy(input) {
  const value = parseJsonLoose(input);
  const found = locatePayloads(value);
  const warnings = [];
  const out = { converter: null, placements: [], reps: [], warnings };

  // converter
  if (found.converter != null) {
    if (!isObj(found.converter)) warnings.push('converter: not an object, skipped');
    else {
      const answers = {};
      let ok = true;
      for (const d of CONVERTER) {
        const legacyKey = Object.keys(CONVERTER_KEY_MAP).find(k => CONVERTER_KEY_MAP[k] === d.key);
        const raw = found.converter[d.key] !== undefined ? found.converter[d.key] : found.converter[legacyKey];
        const v = num(raw);
        if (v == null || !d.levels.includes(v)) { ok = false; warnings.push(`converter: ${d.key} is ${raw === undefined ? 'missing' : 'not one of its levels'}, converter skipped`); break; }
        answers[d.key] = v;
      }
      if (ok) out.converter = { answers };
    }
  }

  // placements
  if (found.sort != null) {
    if (!Array.isArray(found.sort)) warnings.push('placements: not a list, skipped');
    else found.sort.forEach((it, i) => {
      if (!isObj(it)) { warnings.push(`placement ${i + 1}: not an object, skipped`); return; }
      const a = isObj(it.a) ? it.a : it;
      const name = (str(it.name) || str(a.name)).replace(/\s+/g, ' ');
      if (!name) { warnings.push(`placement ${i + 1}: no name, skipped`); return; }
      if (name.length > 200) { warnings.push(`placement ${i + 1}: name is over 200 characters, skipped`); return; }
      const answers = {};
      for (const d of DIMS) {
        const v = num(a[d.key]);
        if (v == null || !d.levels.includes(v)) { warnings.push(`placement ${i + 1} (${name}): ${d.key} is ${a[d.key] === undefined || a[d.key] === null ? 'missing' : 'not one of its levels'}, skipped`); return; }
        answers[d.key] = v;
      }
      const felt = num(a.felt);
      if (felt == null || felt < 0 || felt > 10) { warnings.push(`placement ${i + 1} (${name}): felt is not 0–10, skipped`); return; }
      const createdAt = isoFromMillis(it.ts) ?? isoFromMillis(it.id) ?? isoFromMillis(a.ts) ?? null;
      out.placements.push({ legacyId: it.id != null ? String(it.id) : null, name, answers, felt: Math.round(felt), createdAt });
    });
  }

  // reps
  if (found.examiner != null) {
    if (!Array.isArray(found.examiner)) warnings.push('reps: not a list, skipped');
    else found.examiner.forEach((r, i) => {
      if (!isObj(r)) { warnings.push(`rep ${i + 1}: not an object, skipped`); return; }
      const act = str(r.act);
      if (!act) { warnings.push(`rep ${i + 1}: no act, skipped`); return; }
      const level = num(r.level);
      if (level == null || !EXAMINER_LEVELS.some(l => l.value === level)) { warnings.push(`rep ${i + 1} (${act}): level is not one of the four, skipped`); return; }
      const ground = str(r.ground);
      if (!EXAMINER_GROUNDS.includes(ground)) { warnings.push(`rep ${i + 1} (${act}): ground "${ground}" unknown, skipped`); return; }
      const lat = num(r.lat ?? r.latencySec);
      const createdAt = isoFromMillis(r.ts) ?? isoFromMillis(r.id) ?? null;
      out.reps.push({
        legacyId: r.id != null ? String(r.id) : null,
        act,
        verbatim: str(r.verb ?? r.verbatim) || null,
        level,
        actTranslation: str(r.act2 ?? r.actTranslation),
        adjustment: str(r.adj ?? r.adjustment),
        ground,
        latencySec: lat == null || lat < 0 ? 0 : Math.round(lat),
        createdAt,
      });
    });
  }

  // keep time order so versions and lines read in sequence
  const byTime = (x, y) => (x.createdAt ?? '').localeCompare(y.createdAt ?? '');
  out.placements.sort(byTime); out.reps.sort(byTime);
  return out;
}
