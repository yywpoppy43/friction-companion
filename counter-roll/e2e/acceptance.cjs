/**
 * End-to-end acceptance run for phase one, against a running server with an EMPTY database.
 *
 *   OWNER_PASSCODE=... BASE=http://localhost:3000 node e2e/acceptance.cjs
 *
 * Needs Playwright (npm i -D playwright, or a global install) and a Chromium it can launch.
 * It signs in, places the five fixtures from HANDOFF.md and checks their verdicts, rebuilds one, reads the
 * log and pattern, sets the converter, saves a weight version and checks the log re-runs under it with the
 * stored answers untouched, logs a rep, exports JSON and CSV, imports a legacy bundle, opens the mechanism
 * scenes, and screenshots every screen at 390px while checking for horizontal overflow and banned wording.
 * Screenshots land in e2e/shots/.
 */
const path = require('path');
const { chromium } = (() => { try { return require('playwright'); } catch { return require('/opt/node22/lib/node_modules/playwright'); } })();
const BASE = process.env.BASE || 'http://localhost:3000';
const PASSCODE = process.env.OWNER_PASSCODE || 'open-sesame';
const OUT = path.join(__dirname, 'shots'); require('fs').mkdirSync(OUT, { recursive: true });
const FIXTURES = [
  ['weekly class', { object: 0, miss: 0, scope: 0, reason: 0, author: 0.45, exit: 0, grain: 0 }, 'Trellis'],
  ['daily feelings check-in proposed by a friend', { object: 0.5, miss: 0.6, scope: 0.5, reason: 0, author: 0.45, exit: 1, grain: 1 }, 'Trellis with a mold in it'],
  ["the exam's standard answer", { object: 1, miss: 1, scope: 1, reason: 1, author: 1, exit: 1, grain: 1 }, 'Mold'],
  ['my cold-turkey rule', { object: 1, miss: 0.6, scope: 0.5, reason: 0, author: 0, exit: 1, grain: 1 }, 'Inner mold'],
  ['a schedule handed to me without asking', { object: 0, miss: 0, scope: 0, reason: 1, author: 1, exit: 0.4, grain: 1 }, 'Cage'],
];
const BANNED = /\b(streaks?|badges?|points?|come back|keep it up|well done|great job|congrat\w*|reminder|you failed|failed)\b/i;
const fails = [];
const check = (cond, msg) => { if (!cond) { fails.push(msg); console.log('FAIL', msg); } else console.log('ok  ', msg); };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto(BASE + '/login');
  await page.fill('#passcode', PASSCODE);
  await page.click('button[type=submit]');
  await page.waitForURL(/\/place/);
  if (BASE.startsWith('http://localhost')) {
    const c = (await ctx.cookies()).find(x => x.name === 'cr_session');
    check(c && c.secure === false && c.httpOnly === true, 'session cookie is HttpOnly and not Secure on http://localhost (works in Safari)');
  }

  const shot = async (name) => {
    await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: true });
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    check(sw <= 390, `${name}: no horizontal overflow at 390px (scrollWidth ${sw})`);
    const text = await page.locator('body').innerText();
    const m = text.match(BANNED);
    check(!m, `${name}: no banned wording${m ? ' (found "' + m[0] + '")' : ''}`);
  };

  // place the five fixtures
  for (const [name, answers, expected] of FIXTURES) {
    await page.goto(BASE + '/place');
    await page.fill('input[type=text]', name);
    for (const [k, v] of Object.entries(answers)) {
      await page.locator(`input[name="${k}"][value="${v}"]`).locator('xpath=..').click();
    }
    const kind = (await page.locator('.verdict .kind').first().innerText()).trim();
    check(kind === expected, `fixture "${name}" → ${expected} (got "${kind}")`);
    if (name === 'my cold-turkey rule') await shot('place-filled');
    await page.click('button[type=submit]:has-text("place it")');
    await page.waitForURL(/\/rebuild\//, { timeout: 15000 });
  }
  await shot('rebuild');
  // rebuild: toggle one chip and see trail + save a rebuilt version
  const rebuildUrl = page.url();
  const chips = page.locator('.rebuild .chip');
  check((await chips.count()) >= 17, 'rebuild shows chips for every level');
  await page.locator('.rb').first().locator('.chip[aria-pressed="false"]').first().click();
  check((await page.locator('.map .trail').count()) === 1, 'rebuild draws a trail after a change');
  await page.click('button:has-text("save as a rebuilt version")');
  await page.waitForURL(/\/log/, { timeout: 15000 });

  // log
  await page.goto(BASE + '/log');
  const items = await page.locator('.list .item').count();
  check(items === 6, `log lists 6 placements (got ${items})`);
  const kinds = await page.locator('.list .item .k').allInnerTexts();
  check(kinds.some(k => /Cage/i.test(k)) && kinds.some(k => /Mold/i.test(k)) && kinds.some(k => /Trellis/i.test(k)), 'log shows verdict kinds');
  const sparks = await page.locator('.spark').count();
  check(sparks >= 1, `log shows a remainder-over-time line for the structure placed twice (got ${sparks})`);
  const gBefore = await page.locator('.list .item .g').first().innerText();
  await shot('log');

  // pattern
  await page.goto(BASE + '/pattern');
  check((await page.locator('.pattern .big').count()) === 1, 'pattern shows its sentence with 3+ placements');
  await shot('pattern');

  // converter: set and save
  await page.goto(BASE + '/converter');
  for (const [k, v] of [['sentence', 0.75], ['speed', 0.6], ['follow', 0.8], ['seat', 0.7]]) {
    await page.locator(`input[name="${k}"][value="${v}"]`).locator('xpath=..').click();
  }
  const kv = (await page.locator('.kread .kv').first().innerText()).trim();
  check(/the verdict · 0\.72/.test(kv), `converter readout "the verdict · 0.72" (got "${kv}")`);
  await page.click('button:has-text("save as a new version")');
  await page.waitForTimeout(1500);
  await shot('converter');
  await page.goto(BASE + '/place');
  const convLine = await page.locator('main').innerText();
  check(/the verdict/.test(convLine), 'place shows the converter label once set');

  // weights: change a slider, save, and compare log numbers under v1 vs v2
  await page.goto(BASE + '/weights');
  const slider = page.locator('input[type=range]').first();
  await slider.focus();
  for (let i = 0; i < 20; i++) await page.keyboard.press('ArrowRight');
  await page.click('button:has-text("save as a version")');
  await page.waitForTimeout(1500);
  await shot('weights');
  await page.goto(BASE + '/log');
  const wSel = page.locator('.rununder select').first();
  const opts = await wSel.locator('option').allInnerTexts();
  check(opts.length === 2, `log weights selector has 2 versions (got ${opts.length})`);
  const gActive = await page.locator('.list .item .g').first().innerText();
  await wSel.selectOption({ index: 0 });
  await page.waitForTimeout(1200);
  const gOld = await page.locator('.list .item .g').first().innerText();
  check(gActive !== gOld, `log numbers differ under v1 (${gOld}) and v2 (${gActive})`);
  // raw answers untouched: rebuild page still shows the same chips pressed under both
  await page.goto(rebuildUrl);
  const pressedA = await page.locator('.rebuild .chip[aria-pressed="true"]').allInnerTexts();
  await page.goto(rebuildUrl + '?w=' + encodeURIComponent(await (async () => { await page.goto(BASE + '/log'); return await wSel.locator('option').first().getAttribute('value'); })()));
  const pressedB = await page.locator('.rebuild .chip[aria-pressed="true"]').allInnerTexts();
  check(JSON.stringify(pressedA) === JSON.stringify(pressedB), 'stored answers are the same under either weight version');

  // examiner
  await page.goto(BASE + '/examiner');
  await page.fill('#act, input[placeholder*="forgot to send"]', 'skipped the class');
  await page.locator('input[name="level"][value="0.4"], input[name="exlevel"][value="0.4"]').first().locator('xpath=..').click();
  await page.waitForTimeout(1600);
  await page.fill('input[placeholder="the act: …"]', 'the class was skipped once');
  await page.fill('input[placeholder="the adjustment: …"]', 'go Thursday');
  await page.locator('input[value="worth"]').locator('xpath=..').click();
  await page.click('button:has-text("second sentence done")');
  await page.waitForTimeout(1500);
  const exKind = await page.locator('.verdict .kind').first().innerText();
  check(/Second sentence in \d+s/.test(exKind), `examiner readout "${exKind.trim()}"`);
  check((await page.locator('.list .item').count()) >= 1, 'examiner lists the rep');
  await shot('examiner');

  // data + export
  await page.goto(BASE + '/data');
  await shot('data');
  const json = await ctx.request.get(BASE + '/api/export/json');
  check(json.status() === 200, 'export json 200');
  const body = await json.json();
  check(Array.isArray(body.placements) && body.placements.length === 6 && body.placements[0].object != null && body.placements[0].warranted != null, 'export json has placements with raw answers and scores');
  const csv = await ctx.request.get(BASE + '/api/export/csv');
  const csvText = await csv.text();
  check(csv.status() === 200 && csvText.split('\n').length >= 7 && /^placement_id,structure/.test(csvText), 'export csv has header + 6 rows');

  // mechanism
  await page.goto(BASE + '/mechanism');
  for (const id of ['door', 'taste', 'converter', 'ground', 'rope', 'out', 'grounds', 'open']) check((await page.locator('#' + id).count()) === 1, `mechanism has #${id}`);
  await page.click('#door button:has-text("send a copy")');
  await page.waitForTimeout(2500);
  const copies = await page.locator('#door .counters').innerText();
  check(/copies sent\s*1/.test(copies.replace(/\n/g, ' ')), `door counts the copy (${copies.replace(/\n/g, ' ')})`);
  await shot('mechanism');

  // import legacy
  await page.goto(BASE + '/data');
  const bundle = { 'counter-roll-sort-v3': [{ id: '1717000000000', name: 'imported class', a: { felt: 3, object: 0, miss: 0, scope: 0, reason: 0, author: 0.45, exit: 0, grain: 0 } }], 'counter-roll-converter-v1': { c1: 0, c2: 0, c3: 0, c4: 0 }, 'counter-roll-examiner-v1': [{ id: '1717000200000', ts: 1717000200000, act: 'old miss', level: 0, act2: 'a', adj: 'b', ground: 'none', lat: 9 }] };
  await page.fill('textarea', JSON.stringify(bundle));
  await page.click('button:has-text("bring it in")');
  await page.waitForTimeout(2000);
  const dataText = await page.locator('main').innerText();
  check(/1 placement/.test(dataText) && /1 rep/.test(dataText), `import reports counts (${dataText.match(/brought in[^\n]*/)?.[0] ?? 'no report'})`);
  await page.goto(BASE + '/log');
  check(/imported class/.test(await page.locator('main').innerText()), 'imported placement shows in the log');

  // dark mode screenshot of place
  await page.goto(BASE + '/place');
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.screenshot({ path: path.join(OUT, 'place-dark.png'), fullPage: false });

  check(errors.length === 0, `no page errors (${errors.slice(0, 3).join(' | ')})`);
  await browser.close();
  console.log(`\n${fails.length === 0 ? 'ALL PASSED' : fails.length + ' FAILED'}`);
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
