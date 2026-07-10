/**
 * Playwright verification for the Stage-1 live app.
 *
 * Starts the real server, opens the app in headless Chromium, and checks:
 *   1. No API key (or "sk-ant") ever appears in the served page.
 *   2. computeSchedule(10 min) spaces the four stages across the session with
 *      the Encounter near the break (last 10-15%), strictly increasing.
 *   3. Two consecutive full sessions run the true lifecycle order
 *      Baseline → Intention → Encounter → Growth, each cue fetched live from the
 *      server, and NO cue starts before the previous finishes speaking.
 *   4. When a real ANTHROPIC_API_KEY is present, the two sessions' cue wording
 *      DIFFERS (proves live generation, not a baked batch). Without a key the
 *      server serves safe-default fallbacks — reported, not failed.
 *   5. Stack mode: a queue tapped in arbitrary order (with a repeated stage)
 *      plays in exactly that order as equal per-piece blocks, no overlap.
 *   6. Every live cue survives the banned-vocabulary + slogan filter.
 *   7. Trigger → audio start is within 300ms for prefetched cues.
 *   8. The operator calibration panel is hidden without ?operator=1 and shown
 *      with it; a session run with a sample profile is printed beside a
 *      no-profile run (wording differs when a key is present).
 *
 * Speech is stubbed (headless has no audio) with a fixed simulated duration so
 * the no-overlap gate is measurable. Run:  node webapp/verify.mjs
 */

import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { isSpeakable } from '../src/generative/output-vocabulary.ts';

const PORT = Number(process.env['VERIFY_PORT'] ?? 8791);
const BASE = `http://127.0.0.1:${PORT}`;
const STAGES = ['BASELINE', 'INTENTION', 'ENCOUNTER', 'GROWTH'];
const MAX_TRIGGER_GAP_MS = 300;
const SAMPLE_PROFILE =
  'CORE: high-output competitor who muscles everything\n' +
  'STRONG: raw force, grinds through discomfort\n' +
  'ABSENT: breath rhythm under load\n' +
  'FAULT LINES: bails the instant it gets uncomfortable, bargains for the exit';

async function loadChromium() {
  try { return (await import('playwright')).chromium; } catch {}
  try {
    const m = await import('/opt/node22/lib/node_modules/playwright/index.js');
    return m.chromium ?? m.default?.chromium;
  } catch {
    throw new Error('Playwright not found. Install: npm i -D playwright && npx playwright install chromium');
  }
}

async function waitForServer(ms = 15000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${BASE}/health`);
      if (r.ok) return await r.json();
    } catch {}
    await sleep(200);
  }
  throw new Error('server did not become ready');
}

// Stub speech: record nothing here (the page records), just drive onend so the
// page's speak() gate resolves after a fixed simulated speaking duration.
const SPEECH_STUB = `
  const ss = window.speechSynthesis;
  if (ss) {
    ss.getVoices = () => [];
    ss.cancel = () => {};
    ss.speak = (u) => { setTimeout(() => { if (u && typeof u.onend === 'function') u.onend(); }, 250); };
  }
`;

const CAPTURE = `window.__spoken.map(r => ({
  stage: r.stage, text: r.text, origin: r.origin,
  startedAt: r.startedAt, endedAt: r.endedAt, gapMs: r.gapMs,
}))`;

async function runOneSession(page, durationMs, profile) {
  await page.evaluate((p) => window.__setProfile(p || ''), profile ?? '');
  await page.evaluate((d) => { window.runSession(d); }, durationMs);
  await page.waitForFunction(() => window.__sessionDone === true, { timeout: 60000 });
  const spoken = await page.evaluate(`(() => (${CAPTURE}))()`);
  await page.evaluate(() => window.__setProfile(''));
  return spoken;
}

async function runQueueSession(page, stages, pieceMs) {
  await page.evaluate((a) => { window.runQueue(a.stages, a.pieceMs); }, { stages, pieceMs });
  await page.waitForFunction(() => window.__sessionDone === true, { timeout: 60000 });
  return await page.evaluate(`(() => (${CAPTURE}))()`);
}

/** trigger→audio gaps for the stage cues that had a prefetch window (index ≥ 1). */
function triggerGaps(spoken) {
  const cues = stageCues(spoken).slice(1); // first cue of a run has no prefetch window
  return cues.map((c) => c.gapMs ?? 0);
}

/** Every spoken stage cue must survive the banned/slogan/profile filter. */
function assertClean(cues, profile, label, problems) {
  for (const c of cues) {
    if (c.origin === 'unreachable') continue;
    if (!isSpeakable(c.text, { profile: profile || undefined })) {
      problems.push(`${label}: cue failed the vocabulary/slogan/profile filter → "${c.text}"`);
    }
  }
}

function checkNoOverlap(spoken) {
  for (let i = 1; i < spoken.length; i++) {
    const prevEnd = spoken[i - 1].endedAt;
    const curStart = spoken[i].startedAt;
    if (!(curStart >= prevEnd - 1)) {
      return { ok: false, detail: `"${spoken[i - 1].stage}" ended at ${prevEnd?.toFixed(0)}ms but "${spoken[i].stage}" started at ${curStart?.toFixed(0)}ms` };
    }
  }
  return { ok: true };
}

function stageCues(spoken) {
  // The four stage cues in the order they were spoken (ignores the closing line).
  return spoken.filter(r => STAGES.includes(r.stage));
}

async function main() {
  const chromium = await loadChromium();
  const problems = [];
  const notes = [];

  const server = spawn(process.execPath, ['webapp/server.ts'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', () => {});
  server.stderr.on('data', () => {});

  let browser;
  try {
    const health = await waitForServer();
    const keyPresent = Boolean(health.keyPresent);
    console.log(`server up on ${BASE} — ANTHROPIC_API_KEY present: ${keyPresent}\n`);

    // (1) No key in the served page.
    const html = await (await fetch(BASE)).text();
    if (/sk-ant|ANTHROPIC_API_KEY/.test(html)) problems.push('the served page contains "sk-ant" or "ANTHROPIC_API_KEY"');
    else console.log('✔ (1) no key material in the served page');

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.addInitScript(SPEECH_STUB);
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));
    await page.goto(BASE);

    // (2) 10-minute schedule.
    const schedule = await page.evaluate(() => window.computeSchedule(10 * 60000));
    const order = schedule.map(s => s.key);
    const enc = schedule.find(s => s.key === 'ENCOUNTER');
    const increasing = schedule.every((s, i) => i === 0 || s.atMs > schedule[i - 1].atMs);
    if (JSON.stringify(order) !== JSON.stringify(STAGES)) problems.push('10-min schedule not in stage order');
    if (!increasing) problems.push('10-min schedule times not strictly increasing');
    if (!(enc.frac >= 0.85 && enc.frac <= 0.90)) problems.push(`Encounter frac ${enc.frac} not in last 10-15%`);
    console.log('✔ (2) 10-minute schedule:');
    const fmt = (ms) => `${Math.floor(ms / 60000)}:${String(Math.round((ms % 60000) / 1000)).padStart(2, '0')}`;
    for (const s of schedule) console.log(`      ${s.key.padEnd(9)} at ${fmt(s.atMs)}  (${(s.frac * 100).toFixed(0)}%)`);

    // (3)+(4) Two consecutive short full sessions.
    const s1 = await runOneSession(page, 12000);
    const s2 = await runOneSession(page, 12000);

    for (const [n, spoken] of [[1, s1], [2, s2]]) {
      const cues = stageCues(spoken);
      const gotOrder = cues.map(c => c.stage);
      if (JSON.stringify(gotOrder) !== JSON.stringify(STAGES)) problems.push(`session ${n} stage order was ${gotOrder.join('→')}`);
      const ov = checkNoOverlap(spoken);
      if (!ov.ok) problems.push(`session ${n} cue overlap: ${ov.detail}`);
    }
    if (pageErrors.length) problems.push('page errors: ' + pageErrors.join(' | '));
    console.log('\n✔ (3) both sessions ran in order with no overlapping speech');

    const c1 = stageCues(s1), c2 = stageCues(s2);
    console.log('\n── SESSION 1 (live cues) ─────────────────────────');
    for (const c of c1) console.log(`  ${c.stage.padEnd(9)} [${c.origin}] ${c.text}`);
    console.log('── SESSION 2 (live cues) ─────────────────────────');
    for (const c of c2) console.log(`  ${c.stage.padEnd(9)} [${c.origin}] ${c.text}`);

    const allGenerated = [...c1, ...c2].every(c => c.origin === 'generated');
    const anyDiff = STAGES.some((st) => {
      const a = c1.find(c => c.stage === st)?.text;
      const b = c2.find(c => c.stage === st)?.text;
      return a !== b;
    });
    if (keyPresent && allGenerated) {
      if (anyDiff) console.log('\n✔ (4) live generation confirmed — the two sessions differ in wording');
      else problems.push('(4) both sessions were generated but produced identical wording');
    } else {
      notes.push('(4) live-generation wording proof SKIPPED: no ANTHROPIC_API_KEY in this environment, ' +
                 'so the server served safe-default fallback cues (identical by design). Set the key and re-run to see live, differing cues.');
    }

    // (5) Stack mode: arbitrary order (with a repeat), equal blocks, no overlap.
    const QUEUE = ['GROWTH', 'ENCOUNTER', 'BASELINE', 'ENCOUNTER'];
    const PIECE = 75000;
    const qSched = await page.evaluate((a) => window.computeQueueSchedule(a.q, a.p), { q: QUEUE, p: PIECE });
    if (!qSched.every((s, i) => s.key === QUEUE[i] && s.atMs === i * PIECE)) {
      problems.push('queue schedule is not equal per-piece blocks in queued order');
    }
    const s3 = await runQueueSession(page, QUEUE, 2500);
    const q3 = stageCues(s3);
    if (JSON.stringify(q3.map(c => c.stage)) !== JSON.stringify(QUEUE)) {
      problems.push(`stack played ${q3.map(c => c.stage).join('→')} instead of the queued order`);
    }
    const ov3 = checkNoOverlap(s3);
    if (!ov3.ok) problems.push('stack session cue overlap: ' + ov3.detail);
    console.log(`\n✔ (5) stack mode: ${QUEUE.join(' → ')} played in queued order (equal blocks, no overlap)`);

    // (6) Every spoken cue survives the banned-vocabulary + slogan filter.
    assertClean(stageCues(s1), '', 'session 1', problems);
    assertClean(stageCues(s2), '', 'session 2', problems);
    assertClean(stageCues(s3), '', 'stack', problems);
    console.log('\n✔ (6) all live cues passed the banned-vocabulary + slogan filter');

    // (7) Trigger → audio start within 300ms (prefetched cues, index ≥ 1).
    const gaps = [...triggerGaps(s1), ...triggerGaps(s2), ...triggerGaps(s3)];
    const worst = gaps.length ? Math.max(...gaps) : 0;
    if (worst > MAX_TRIGGER_GAP_MS) problems.push(`trigger→audio gap ${worst.toFixed(0)}ms exceeds ${MAX_TRIGGER_GAP_MS}ms`);
    console.log(`✔ (7) trigger→audio gap ≤ ${MAX_TRIGGER_GAP_MS}ms (worst prefetched cue: ${worst.toFixed(0)}ms)`);

    // (8) Operator gating + calibration changes the wording.
    // Participants (plain URL) never see the operator panel.
    const opHiddenPlain = await page.evaluate(() => getComputedStyle(document.getElementById('opPanel')).display === 'none');
    if (!opHiddenPlain) problems.push('operator calibration panel is visible without ?operator=1');
    // With ?operator=1 it is revealed (checked on a throwaway page).
    const opPage = await browser.newPage();
    await opPage.addInitScript(SPEECH_STUB);
    await opPage.goto(`${BASE}/?operator=1`);
    const opShownFlag = await opPage.evaluate(() => getComputedStyle(document.getElementById('opPanel')).display !== 'none');
    await opPage.close();
    if (!opShownFlag) problems.push('operator calibration panel did not appear with ?operator=1');

    // Run one session WITH a sample profile and one WITHOUT; print both.
    const sp = await runOneSession(page, 12000, SAMPLE_PROFILE);
    const cp = stageCues(sp);
    assertClean(cp, SAMPLE_PROFILE, 'profile-run', problems);
    const gp = triggerGaps(sp);
    if (gp.length && Math.max(...gp) > MAX_TRIGGER_GAP_MS) problems.push('profile run exceeded the 300ms trigger gap');

    console.log('\n── CALIBRATION: no profile vs. sample profile ─────');
    console.log(`  profile used: ${SAMPLE_PROFILE.replace(/\n/g, ' | ')}`);
    for (const st of STAGES) {
      const a = c1.find(c => c.stage === st);
      const b = cp.find(c => c.stage === st);
      console.log(`  ${st}`);
      console.log(`    no profile [${a?.origin}]: ${a?.text}`);
      console.log(`    profile    [${b?.origin}]: ${b?.text}`);
    }
    const bothGenerated = [...c1, ...cp].every(c => c.origin === 'generated');
    const calDiff = STAGES.some((st) => c1.find(c => c.stage === st)?.text !== cp.find(c => c.stage === st)?.text);
    if (keyPresent && bothGenerated) {
      if (calDiff) console.log('\n✔ (8) operator gating holds and calibration changed the wording');
      else problems.push('(8) calibration produced identical wording to the no-profile run');
    } else {
      console.log('\n✔ (8) operator gating holds (calibration-wording diff needs a key; served fallbacks are identical)');
      notes.push('(8) calibration-wording diff SKIPPED without a key (fallback cues are identical by design).');
    }
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
  }

  console.log('\n' + '═'.repeat(52));
  for (const nt of notes) console.log('• NOTE: ' + nt);
  if (problems.length) {
    console.log('✖ FAIL:');
    for (const p of problems) console.log('   - ' + p);
    process.exit(1);
  }
  console.log('✔ PASS — plumbing, timing, ordering, no-overlap, and no-key-leak all verified.');
}

main().catch((e) => { console.error('verify threw:', e); process.exit(1); });
