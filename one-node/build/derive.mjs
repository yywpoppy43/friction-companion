#!/usr/bin/env node
/* one node — generator.
 *
 *   content-source.md  ->  data/node.js  +  content-gaps.md
 *
 * content-source.md is READ ONLY. This script never writes to it and never
 * paraphrases it: every value it emits is a verbatim slice of the file.
 *
 * Run:  node build/derive.mjs
 * Fails loudly (exit 1) rather than emitting data that violates an invariant.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const SRC  = join(ROOT, 'content-source.md');

const warnings = [];
const notes    = [];
const warn = m => warnings.push(m);
const note = m => notes.push(m);

/* ---------------------------------------------------------------- sections */
/* Layer comes from the section heading, never from the id prefix.
 * convergence.four-operations is filed in section 1, and it belongs to the
 * layer it is filed under. */
const LAYER_BY_SECTION = {
  '0': 'whole',   '1': 'hardware',    '2': 'elements', '3': 'software',
  '4': 'interface', '5': 'convergence', '6': 'conflict', '7': 'gap',
  '8': 'mechanism', '9': 'design',    '10': 'deposit',
};

/* Fields consumed into typed structure or into the graph. Not re-rendered as
 * prose, because the interface draws them instead. */
const STRUCTURAL = new Set([
  'id', 'state', 'island', 'region', 'regions', 'circuitry',
  'connects to', 'source', 'wires from here',
  'sealed capacities here', 'sealed capacity here',
  'attached to', 'written by',
]);

const SYSTEMS = new Set(['HD', 'BaZi']);

/* The five sealed capacities that name their completing region in prose only.
 * Every use is logged so the mapping can never drift silently. */
const PHRASE_TO_REGION = [
  ['the pressure center', 'region.pressure'],
  ['the outlet',          'region.throat'],
];

/* Vocabulary that exists only in the never-displayed appendix. If any of it
 * reaches the data file, the appendix leaked. */
const FORBIDDEN = [
  'Ajna', 'Sacral', 'Solar Plexus', 'Spleen', 'Jovian',
  'Incarnation Cross', 'Luck pillar', 'Hidden stems', 'Day master 庚',
];

/* -------------------------------------------------------------------- read */
const raw  = readFileSync(SRC, 'utf8');
const hash = createHash('sha256').update(raw).digest('hex');

const cut = raw.indexOf('\n# APPENDIX');
if (cut === -1) throw new Error('appendix marker not found — refusing to guess where content ends');
const body = raw.slice(0, cut);
note(`appendix cut at byte ${cut}; ${raw.length - cut} bytes excluded from the data`);

/* ------------------------------------------------------------------- parse */
const RE_H1    = /^#\s+(?:(\d+)\.\s*)?(.+?)\s*$/;
const RE_H2    = /^##\s+(?:([\d.]+)\s+)?(.+?)\s*$/;
const RE_H3    = /^###\s+(.+?)\s*$/;
const RE_FIELD = /^-\s+\*\*(.+?):\*\*\s*(.*)$/;
const RE_ITEM  = /^\s+-\s+(.+?)\s*$/;
const RE_QUOTE = /^>\s?(.*)$/;
const RE_RULE  = /^-{3,}\s*$/;
/* A bullet whose bold run has no colon in it: the bold text is a lead-in to
 * the sentence, not a field label. Five of these exist. */
const RE_LEAD  = /^-\s+\*\*([^*]+)\*\*\s*(.*)$/;
/* `- *(hers)*` — a marker on the block, not a field. */
const RE_MARK  = /^-\s+\*\((.+)\)\*\s*$/;
const RE_DEP   = /^Deposit\s+(\d+)\s*(?:—\s*(.*))?$/;

const parts = [];
const orphanFields = [];
let sectionNum = null, sectionTitle = null, subNum = null, subTitle = null, heading = null;
let block = null, field = null;
const sectionNotes = {};

const closeBlock = () => { block = null; field = null; };

const continuations = [];
for (const line of body.split('\n')) {
  let m;
  if (RE_RULE.test(line)) continue;            /* thematic break, never content */
  if ((m = line.match(RE_H1))) {
    closeBlock();
    sectionNum = m[1] ?? null; sectionTitle = m[2];
    subNum = null; subTitle = null; heading = null;
    continue;
  }
  if ((m = line.match(RE_H2))) {
    closeBlock();
    subNum = m[1] ?? null; subTitle = m[2]; heading = null;
    continue;
  }
  if ((m = line.match(RE_H3))) {
    closeBlock();
    heading = m[1];
    /* Deposits carry no id: field. Open a block on the heading instead. */
    const d = heading.match(RE_DEP);
    if (sectionNum === '10' && d) {
      block = newBlock(`deposit.${d[1]}`);
      block.depositDate = (d[2] || '').trim() || null;
    }
    continue;
  }
  if ((m = line.match(RE_QUOTE))) {
    const key = `${sectionNum ?? '-'}${subNum ? '/' + subNum : ''}`;
    if (m[1].trim()) (sectionNotes[key] ??= []).push(m[1].trim());
    continue;
  }
  if ((m = line.match(RE_FIELD))) {
    const [, label, value] = m;
    if (label === 'id') { block = newBlock(value.trim()); continue; }
    if (!block) { orphanFields.push(`${label}: ${value.slice(0, 60)}`); continue; }
    field = { label, value: value.trim(), items: [] };
    block.rawFields.push(field);
    continue;
  }
  if ((m = line.match(RE_ITEM))) {
    if (field) field.items.push(m[1]);
    else if (block) block.strayItems.push(m[1]);
    continue;
  }
  if ((m = line.match(RE_MARK))) {
    if (block) block.marker = m[1].trim();
    continue;
  }
  if ((m = line.match(RE_LEAD))) {
    if (!block) { orphanFields.push(`(lead) ${m[1]}`); continue; }
    field = { label: m[1].trim(), labelStyle: 'lead', value: m[2].trim(), items: [] };
    block.rawFields.push(field);
    continue;
  }
  /* Anything left is a wrapped continuation of the previous field. The file
   * has none today; log every one so nothing is ever merged silently. */
  if (line.trim() && field) {
    continuations.push(`${block ? block.id : '?'} / ${field.label}: ${line.trim().slice(0, 70)}`);
    field.value += ' ' + line.trim();
  }
}
if (continuations.length) {
  warn(`${continuations.length} line(s) folded into the preceding field as continuations: ${continuations.join(' | ')}`);
}

function newBlock(id) {
  const b = {
    id,
    layer: LAYER_BY_SECTION[sectionNum] ?? 'unfiled',
    section: sectionNum, sectionTitle,
    subsection: subNum, subsectionTitle: subTitle,
    heading: heading ?? sectionTitle,
    headingIsSection: heading === null,
    rawFields: [], strayItems: [], depositDate: null, marker: null,
  };
  parts.push(b);
  return b;
}

if (orphanFields.length) note(`${orphanFields.length} field line(s) outside any block, ignored: ${orphanFields.join(' | ')}`);

/* ------------------------------------------------------------- confidence */
function splitTag(rawTag) {
  if (rawTag.includes(' + ')) {
    return { bases: rawTag.split(' + ').map(s => s.trim()), qualifier: '', pending: false, bookmarked: false };
  }
  const bits = rawTag.split(/\s+—\s+/);
  const qualifier = bits.slice(1).join(' — ').trim();
  return {
    bases: [bits[0].trim()],
    qualifier,
    pending:    /\bpending\b/i.test(qualifier),
    bookmarked: /\bbookmarked\b/i.test(qualifier),
  };
}

function parseTags(text) {
  const marks = [];
  const re = /`\[([^\]]+)\]`/g;
  let m;
  while ((m = re.exec(text))) marks.push({ raw: m[1], end: m.index + m[0].length, start: m.index });
  return marks.map((mk, i) => {
    const tail = text.slice(mk.end, i + 1 < marks.length ? marks[i + 1].start : text.length);
    const hasNote = /^\s*—/.test(tail);
    return { raw: mk.raw, ...splitTag(mk.raw), note: hasNote ? tail.replace(/^\s*—\s*/, '').trim() : '' };
  });
}

/* ------------------------------------------------------------------ source */
const splitTurns = s => s.split(';').map(t => t.trim()).filter(Boolean);

function parseSource(rawSrc, id) {
  const i = rawSrc.indexOf(' · ');
  if (i === -1) return { systems: [], turns: splitTurns(rawSrc), raw: rawSrc, inherited: false, from: null };
  const head = rawSrc.slice(0, i).trim();
  const bits = head.split(' + ').map(s => s.trim());
  if (bits.every(b => SYSTEMS.has(b))) {
    return { systems: bits, turns: splitTurns(rawSrc.slice(i + 3)), raw: rawSrc, inherited: false, from: null };
  }
  /* Unrecognised leading token: record no system rather than guess one. */
  warn(`${id}: source leader "${head}" is not a known system — recorded as a turn, no system claimed`);
  return { systems: [], turns: splitTurns(rawSrc), raw: rawSrc, inherited: false, from: null };
}

/* ------------------------------------------------------------------- kinds */
const KIND_EXACT = {
  'whole': 'whole',
  'type': 'setting', 'strategy': 'setting', 'authority': 'setting',
  'signature': 'setting', 'not-self': 'setting', 'split': 'setting',
  'profile': 'setting', 'life-theme': 'setting', 'variable': 'setting',
  'seven-fixed': 'setting',
  'integration-circuit': 'circuit', 'individual-circuitry': 'circuit',
  'zero-collective': 'circuit',
  'missing-piece.now': 'absence',
};
const KIND_PREFIX = [
  ['region.', 'region'], ['wire.', 'wire'], ['sealed.', 'sealed'],
  ['elements.pillar-', 'pillar'], ['elements.', 'element'],
  ['mechanism.', 'mechanism'], ['convergence.', 'convergence'],
  ['conflict.', 'conflict'], ['gap.', 'gap'], ['design.', 'design'],
  ['interface.', 'interface'], ['software.', 'slot'], ['deposit.', 'deposit'],
];
const kindOf = id =>
  KIND_EXACT[id] ?? (KIND_PREFIX.find(([p]) => id.startsWith(p))?.[1] ?? 'note');

/* ------------------------------------------------------------------- build */
const headingCount = {};
for (const b of parts) headingCount[b.heading] = (headingCount[b.heading] ?? 0) + 1;

const shortName = h => h.split(' — ')[0].trim();

const out = [];
for (const b of parts) {
  const get = l => b.rawFields.find(f => f.label === l);
  const fields = b.rawFields
    .filter(f => !STRUCTURAL.has(f.label))
    .map(f => ({
      label: f.label,
      labelStyle: f.labelStyle ?? 'label',
      value: f.value,
      items: f.items,
      tags: parseTags(f.value + ' ' + f.items.join(' ')),
    }));

  const connects = (get('connects to')?.value ?? '')
    .split(',').map(s => s.trim().replace(/\.$/, '')).filter(Boolean);

  const srcField = get('source');
  const source = srcField ? parseSource(srcField.value, b.id) : null;

  const unique = headingCount[b.heading] === 1;
  const firstLabel = b.rawFields.find(f => !STRUCTURAL.has(f.label))?.label ?? null;

  const p = {
    id: b.id,
    layer: b.layer,
    kind: kindOf(b.id),
    section: b.section,
    subsection: b.subsection,
    heading: b.heading,
    name: unique ? shortName(b.heading) : (firstLabel ?? shortName(b.heading)),
    nameSource: unique ? 'heading' : (firstLabel ? 'field-label' : 'heading'),
    fullName: b.heading,
    fields,
    connects,
    source,
    tags: fields.flatMap(f => f.tags),
    strayItems: b.strayItems,
    marker: b.marker,
  };
  p.answerOwed = p.tags.some(t => t.pending);
  p.bookmarked = p.tags.some(t => t.bookmarked);

  /* ------- typed extras, by kind ------- */
  if (p.kind === 'region') {
    p.state = get('state')?.value ?? null;
    const isl = get('island')?.value ?? '';
    const mm = isl.match(/^([AB])\s*\((.+)\)$/);
    p.island     = mm ? mm[1] : null;
    p.islandNote = mm ? mm[2] : isl.replace(/^neither\s*—\s*/, '').trim();
    p.isGap      = /the gap/.test(isl);
  }
  if (p.kind === 'wire') {
    const r = (get('regions')?.value ?? '').split('↔').map(s => s.trim());
    p.a = r[0] ?? null; p.b = r[1] ?? null;
    const c = get('circuitry')?.value ?? '';
    const cm = c.match(/^([a-z]+)/);
    p.circuitry     = cm ? cm[1] : null;
    p.circuitryNote = c.slice(cm ? cm[1].length : 0).replace(/^\s*[—(]\s*/, '').replace(/\)$/, '').trim();
  }
  if (p.kind === 'sealed') {
    p.region = get('region')?.value ?? null;
    p.side   = get('side')?.value ?? null;
    p.wired  = false;
    const wc = get('what would complete it')?.value ?? '';
    const direct = wc.match(/region\.[a-z-]+/);
    if (direct) {
      p.completesAt = direct[0];
      p.completesAtFrom = 'id-in-prose';
    } else {
      const hit = PHRASE_TO_REGION.find(([phrase]) => wc.includes(phrase));
      if (hit) {
        p.completesAt = hit[1];
        p.completesAtFrom = `phrase:"${hit[0]}"`;
        note(`${p.id}: completing region read from the phrase "${hit[0]}" -> ${hit[1]}`);
      } else {
        p.completesAt = null;
        p.completesAtFrom = null;
        warn(`${p.id}: cannot determine the completing region from "${wc.slice(0, 70)}"`);
      }
    }
  }
  if (p.kind === 'deposit') {
    p.date       = b.depositDate;
    p.attachedTo = get('attached to')?.value || null;
    p.writtenBy  = get('written by')?.value || null;
    p.empty      = fields.every(f => !f.value.trim());
  }
  out.push(p);
}

/* -------------------------------------------------- group source inheritance */
const groups = {};
for (const p of out) {
  const key = `${p.section}|${p.subsection}|${p.fullName}`;
  (groups[key] ??= []).push(p);
}
for (const [key, members] of Object.entries(groups)) {
  if (members.length < 2) continue;
  const donor = members.find(m => m.source);
  if (!donor) continue;
  for (const m of members) {
    if (m.source) continue;
    m.source = { ...donor.source, inherited: true, from: donor.id, group: members[0].fullName };
    note(`${m.id}: source inherited from the group "${members[0].fullName}" (recorded once, at ${donor.id})`);
  }
}

/* ---------------------------------------------------------------- the graph */
const byId = Object.fromEntries(out.map(p => [p.id, p]));
const unresolved = [];
const adjacency = {};
for (const p of out) adjacency[p.id] = new Set();
for (const p of out) {
  for (const t of p.connects) {
    if (!byId[t]) { unresolved.push(`${p.id} -> ${t}`); continue; }
    adjacency[p.id].add(t);
    adjacency[t].add(p.id);           /* 128 of 348 edges are one-way in the
                                         source; isolate needs them undirected */
  }
}
/* A deposit joins the graph through `attached to`, not `connects to`. */
for (const p of out) {
  if (p.kind !== 'deposit' || !p.attachedTo) continue;
  if (!byId[p.attachedTo]) { unresolved.push(`${p.id} -attached to-> ${p.attachedTo}`); continue; }
  adjacency[p.id].add(p.attachedTo);
  adjacency[p.attachedTo].add(p.id);
}

const inbound = {};
for (const p of out) inbound[p.id] = 0;
for (const p of out) for (const t of p.connects) if (byId[t]) inbound[t]++;
for (const p of out) if (p.kind === 'deposit' && byId[p.attachedTo]) inbound[p.attachedTo]++;

for (const p of out) p.adjacent = [...adjacency[p.id]].sort();

/* -------------------------------------------------------------- invariants */
const errors = [];
const expect = (cond, msg) => { if (!cond) errors.push(msg); };

const regions = out.filter(p => p.kind === 'region');
const wires   = out.filter(p => p.kind === 'wire');
const sealed  = out.filter(p => p.kind === 'sealed');

expect(regions.length === 9,  `expected 9 regions, found ${regions.length}`);
expect(wires.length === 6,    `expected 6 wires, found ${wires.length}`);
expect(sealed.length === 10,  `expected 10 sealed capacities, found ${sealed.length}`);
expect(out.length === 114,    `expected 114 blocks (112 ids + 2 deposits), found ${out.length}`);
expect(unresolved.length === 0, `unresolved connects-to: ${unresolved.join(', ')}`);

const islandA = regions.filter(r => r.island === 'A').map(r => r.id).sort();
const islandB = regions.filter(r => r.island === 'B').map(r => r.id).sort();
const neither = regions.filter(r => r.island === null).map(r => r.id).sort();
expect(String(islandA) === 'region.head,region.mind', `island A is ${islandA}`);
expect(String(islandB) === 'region.engine,region.identity,region.instinct,region.pressure,region.will', `island B is ${islandB}`);
expect(String(neither) === 'region.emotion,region.throat', `regions in neither island: ${neither}`);
expect(regions.filter(r => r.state === 'fixed').length === 7, 'expected 7 fixed regions');
expect(regions.filter(r => r.state === 'fluid').length === 2, 'expected 2 fluid regions');

for (const w of wires) {
  expect(byId[w.a]?.kind === 'region', `${w.id}: end "${w.a}" is not a region`);
  expect(byId[w.b]?.kind === 'region', `${w.id}: end "${w.b}" is not a region`);
  expect(['individual', 'integration', 'tribal'].includes(w.circuitry), `${w.id}: circuitry "${w.circuitry}"`);
}
for (const s of sealed) {
  expect(byId[s.region]?.kind === 'region', `${s.id}: region "${s.region}" unknown`);
  expect(byId[s.completesAt]?.kind === 'region', `${s.id}: completing region "${s.completesAt}" unknown`);
}

/* ------------------------------------------------------------------- emit */
const data = {
  meta: {
    subject: 'one node',
    generatedBy: 'build/derive.mjs',
    generatedAt: new Date().toISOString().slice(0, 10),
    sourceFile: 'content-source.md',
    sourceSha256: hash,
    sourceBytes: raw.length,
    appendixExcludedBytes: raw.length - cut,
    counts: {
      parts: out.length, regions: regions.length, wires: wires.length,
      sealed: sealed.length, deposits: out.filter(p => p.kind === 'deposit').length,
      directedEdges: out.reduce((n, p) => n + p.connects.length, 0),
    },
    layers: Object.fromEntries(
      Object.values(LAYER_BY_SECTION).map(l => [l, out.filter(p => p.layer === l).length])),
  },
  sectionNotes,
  parts: out,
};

const serialized = JSON.stringify(data, null, 2);
for (const bad of FORBIDDEN) {
  if (serialized.includes(bad)) errors.push(`appendix vocabulary "${bad}" reached the data file`);
}
if (/\b(?:gates?|channels?)\s+\d/i.test(serialized)) errors.push('a gate or channel number reached the data file');
for (const p of out) {
  for (const f of p.fields) {
    if (/\s---\s*$|\s---\s/.test(f.value)) errors.push(`${p.id}: a thematic break leaked into field "${f.label}"`);
    if (/^-\s+\*\*/.test(f.value) || f.value.includes(' - **')) errors.push(`${p.id}: field "${f.label}" swallowed a following bullet`);
  }
  if (p.source && /\s---/.test(p.source.raw)) errors.push(`${p.id}: a thematic break leaked into source`);
}

if (errors.length) {
  console.error('\nREFUSING TO WRITE — invariants failed:');
  for (const e of errors) console.error('  ✗ ' + e);
  process.exit(1);
}

mkdirSync(join(ROOT, 'data'), { recursive: true });
writeFileSync(join(ROOT, 'data', 'node.js'),
`/* GENERATED by build/derive.mjs from content-source.md — do not edit.
 * To change anything here, edit content-source.md and re-run the generator.
 * source sha256: ${hash}
 *
 * Loaded as a plain script, not an ES module, so index.html opens straight
 * from the filesystem with no server. Do not convert this to ES exports.
 */
var NODE = ${serialized};
`);

/* ------------------------------------------------------- content-gaps.md */
/* Deposits are excluded: they join the graph through `attached to`, and an
 * empty deposit stub is a slot waiting to be filled, not a missing edge. */
const contentParts = out.filter(p => p.kind !== 'deposit');
const isolatedIds  = contentParts.filter(p => p.connects.length === 0 && inbound[p.id] === 0);
const oneWay       = contentParts.filter(p => p.connects.length === 0 && inbound[p.id] > 0);

const gapLines = [];
gapLines.push('# CONTENT GAPS — one node');
gapLines.push('');
gapLines.push('> GENERATED by `build/derive.mjs`. Regenerated on every run, so do not');
gapLines.push('> add notes here — they would be overwritten. This file reports what');
gapLines.push('> `content-source.md` is missing. Fixing any of it means editing');
gapLines.push('> `content-source.md`, which only Poppy does.');
gapLines.push('');
gapLines.push(`Source: \`content-source.md\`, sha256 \`${hash.slice(0, 16)}…\``);
gapLines.push(`Checked ${contentParts.length} content blocks, ${data.meta.counts.directedEdges} directed \`connects to\` edges.`);
gapLines.push('The 2 deposit blocks are not checked here: a deposit joins the graph');
gapLines.push('through `attached to`, and an empty deposit is a slot, not a gap.');
gapLines.push('');
gapLines.push('---');
gapLines.push('');
gapLines.push(`## Unreachable — ${isolatedIds.length} ids with no edges in either direction`);
gapLines.push('');
gapLines.push('These have no `connects to` field of their own **and** are never named in');
gapLines.push('any other part\'s `connects to`. Isolate can never arrive at them from');
gapLines.push('anywhere, and they can never lead anywhere. They are present in the data');
gapLines.push('and renderable on their own; they are simply not in the graph.');
gapLines.push('');
for (const p of isolatedIds) {
  const missing = ['no `connects to` field', 'never referenced by another part'];
  if (!p.source) missing.push('no `source:` field');
  else if (p.source.inherited) missing.push(`\`source:\` inherited from the group “${p.source.group}”, not its own`);
  gapLines.push(`- **\`${p.id}\`** — §${p.section}${p.subsection ? '.' + p.subsection.split('.')[1] : ''}, “${p.fullName}”`);
  gapLines.push(`  - missing: ${missing.join('; ')}`);
}
gapLines.push('');
gapLines.push('---');
gapLines.push('');
gapLines.push(`## One-way — ${oneWay.length} ids reachable but leading nowhere`);
gapLines.push('');
gapLines.push('Not part of the 18 above. These are named by other parts, so isolate can');
gapLines.push('reach them, but they carry no `connects to` of their own, so a walk stops');
gapLines.push('there. Included because it is the same class of gap.');
gapLines.push('');
for (const p of oneWay) {
  gapLines.push(`- **\`${p.id}\`** — “${p.fullName}”; referenced by ${inbound[p.id]} part(s), no \`connects to\` of its own`);
}
gapLines.push('');
gapLines.push('---');
gapLines.push('');
gapLines.push('## Notes from the last generator run');
gapLines.push('');
if (warnings.length) { gapLines.push('**Warnings**'); gapLines.push(''); for (const w of warnings) gapLines.push(`- ${w}`); gapLines.push(''); }
gapLines.push('**Inferences the generator made, each one logged**');
gapLines.push('');
for (const n of notes) gapLines.push(`- ${n}`);
gapLines.push('');

writeFileSync(join(ROOT, 'content-gaps.md'), gapLines.join('\n'));

/* ------------------------------------------------------------------ report */
console.log('one node — generator');
console.log(`  source        content-source.md  ${raw.length} bytes  sha256 ${hash.slice(0, 12)}…`);
console.log(`  parsed        ${out.length} blocks  (${data.meta.counts.directedEdges} directed edges)`);
console.log(`  layers        ${Object.entries(data.meta.layers).filter(([, n]) => n).map(([l, n]) => `${l}:${n}`).join('  ')}`);
console.log(`  hardware      ${regions.length} regions (7 fixed / 2 fluid)  ${wires.length} wires  ${sealed.length} sealed`);
console.log(`  answer owed   ${out.filter(p => p.answerOwed).map(p => p.id).join(', ') || 'none'}`);
console.log(`  bookmarked    ${out.filter(p => p.bookmarked).map(p => p.id).join(', ') || 'none'}`);
console.log(`  wrote         data/node.js`);
console.log(`  wrote         content-gaps.md  (${isolatedIds.length} unreachable, ${oneWay.length} one-way)`);
if (warnings.length) { console.log('  WARNINGS'); for (const w of warnings) console.log('    ! ' + w); }
console.log(`  inferences    ${notes.length} logged to content-gaps.md`);
console.log('  invariants    all passed');
