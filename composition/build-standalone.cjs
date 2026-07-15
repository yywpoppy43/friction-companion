#!/usr/bin/env node
/*
 * build-standalone.js — produce the single self-contained file.
 *
 * Reads index.html (the source, with empty embedded-data slots) plus the
 * two JSON faces and the two guardrail docs, injects them into the slots,
 * and writes composition-engine.html: one file, no companions, that runs
 * from a link, a double-click, or any static host.
 *
 * Rebuild after changing any data file:   node build-standalone.js
 * Then republish composition-engine.html as the Claude Artifact.
 */
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const read = f => fs.readFileSync(path.join(dir, f), 'utf8');

// grid/matrix are already JSON text; embed verbatim. The md docs are plain
// text, so JSON-encode them into a string the page parses back. In every
// case, escape "<" to < so no "</script>" can ever close the slot early.
const esc = s => s.replace(/</g, '\\u003c');
const slots = {
  'grid-data':        esc(read('grid_data.json')),
  'matrix-data':      esc(read('matrix_data.json')),
  'src-enneagram':    esc(JSON.stringify(read('Source_Enneagram.md'))),
  'src-neuroscience': esc(JSON.stringify(read('Source_Neuroscience.md'))),
};

let html = read('index.html');
for (const [id, content] of Object.entries(slots)) {
  const re = new RegExp(`(<script type="application/json" id="${id}">)([\\s\\S]*?)(</script>)`);
  if (!re.test(html)) { console.error(`FAIL: slot #${id} not found in index.html`); process.exit(1); }
  html = html.replace(re, (_m, open, _old, close) => open + content + close);
}

// Sanity: every slot must now parse.
for (const id of Object.keys(slots)) {
  const m = html.match(new RegExp(`id="${id}">([\\s\\S]*?)</script>`));
  try { JSON.parse(m[1]); } catch (e) { console.error(`FAIL: slot #${id} is not valid JSON after inject — ${e.message}`); process.exit(1); }
}

const out = 'composition-engine.html';
fs.writeFileSync(path.join(dir, out), html);
const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log(`ok: wrote ${out} (${kb} KB, self-contained — no companion files needed)`);
