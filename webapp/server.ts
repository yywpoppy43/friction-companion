/**
 * Friction Companion — Stage-1 live server.
 *
 * Two jobs:
 *   1. Serve the static web app (`index.html`).
 *   2. Expose `POST /api/cue` that runs the engine's REAL generator
 *      ({@link AnthropicCueGenerator}) to produce one live, in-voice cue for a
 *      given stage, and returns only the cue text/tone to the client.
 *
 * The API key is read from the `ANTHROPIC_API_KEY` environment variable and
 * stays server-side — it is NEVER sent to the browser. The client only ever sees
 * generated cue text. If generation fails (no key / flaky network), the endpoint
 * returns the engine's hand-authored safe-default cue for that state, so a stage
 * is never silent (mirrors the engine's never-silent principle).
 *
 * Run:
 *   node --env-file-if-exists=.env webapp/server.ts        # or: npm run serve:app
 *   PORT=9000 node webapp/server.ts
 *
 * Zero runtime dependencies (Node built-ins only), consistent with the rest of
 * the framework.
 */

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { networkInterfaces } from 'node:os';

import { AnthropicCueGenerator } from '../src/generative/anthropic-cue-generator.ts';
import { safeDefaultCue } from '../src/cue-bank/safe-defaults.ts';
import { isSpeakable } from '../src/generative/output-vocabulary.ts';
import { FrictionState } from '../src/domain/friction-state.ts';
import { FrictionCondition } from '../src/domain/friction-condition.ts';
import { TriggerSource } from '../src/triggers/trigger.ts';
import type { CueGenerationRequest } from '../src/ports/cue-generator.ts';
import type { Cue } from '../src/domain/cue.ts';

const here = dirname(fileURLToPath(import.meta.url));
const INDEX_HTML = join(here, 'index.html');
const PORT = Number(process.env['PORT'] ?? 8787);

/**
 * Per-stage generation parameters (the "engine logic" lives here, server-side).
 * Intensity rises across the session; ENCOUNTER carries a friction condition so
 * the generator targets the peak-friction moment precisely.
 */
const STAGE_PLAN: Record<
  FrictionState,
  { intensity: number; source: CueGenerationRequest['source']; frictionCondition?: FrictionCondition }
> = {
  [FrictionState.BASELINE]: { intensity: 0.25, source: 'INIT' },
  [FrictionState.INTENTION]: { intensity: 0.5, source: 'INIT' },
  [FrictionState.ENCOUNTER]: {
    intensity: 0.9,
    source: TriggerSource.TEMPORAL,
    frictionCondition: FrictionCondition.RESOURCE,
  },
  [FrictionState.GROWTH]: { intensity: 0.72, source: 'INIT' },
};

const VALID_STATES = new Set<string>(Object.values(FrictionState));

// A slightly higher temperature than the default keeps successive sessions from
// converging on identical wording, while the generator's double-seal still
// regenerates anything that leaks internal vocabulary. maxAttempts bumped to 3
// to absorb the occasional extra regeneration that higher variety can cause.
const generator = new AnthropicCueGenerator({ temperature: 0.8, maxAttempts: 3 });

/** Trim a full Cue down to what the client needs to speak + display. */
function toClientCue(cue: Cue): Pick<Cue, 'CueID' | 'PrimaryState' | 'AudioTranscript' | 'DeliveryTone'> {
  return {
    CueID: cue.CueID,
    PrimaryState: cue.PrimaryState,
    AudioTranscript: cue.AudioTranscript,
    DeliveryTone: cue.DeliveryTone,
  };
}

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(payload);
}

async function readBody(req: http.IncomingMessage, limitBytes = 8_192): Promise<unknown> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    total += (chunk as Buffer).length;
    if (total > limitBytes) throw new Error('request body too large');
    chunks.push(chunk as Buffer);
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

/** POST /api/cue — generate one live cue for the requested stage. */
async function handleCue(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  let body: { stage?: unknown; round?: unknown };
  try {
    body = (await readBody(req)) as typeof body;
  } catch {
    sendJson(res, 400, { error: 'invalid JSON body' });
    return;
  }

  const stage = String(body.stage ?? '');
  if (!VALID_STATES.has(stage)) {
    sendJson(res, 400, { error: `unknown stage "${stage}"`, valid: [...VALID_STATES] });
    return;
  }
  const state = stage as FrictionState;
  const round = Number.isFinite(Number(body.round)) ? Math.max(1, Math.floor(Number(body.round))) : 1;
  const plan = STAGE_PLAN[state];

  const request: CueGenerationRequest = {
    state,
    source: plan.source,
    intensity: plan.intensity,
    round,
    frictionCondition: plan.frictionCondition,
  };

  const outcome = await generator.generate(request);

  // Never silent: on any failure, fall back to the engine's safe-default cue.
  if (outcome.status !== 'ok' || !outcome.cue || !isSpeakable(outcome.cue.AudioTranscript)) {
    const fallback = safeDefaultCue(state);
    sendJson(res, 200, {
      cue: toClientCue(fallback),
      origin: 'fallback',
      status: outcome.status,
      attempts: outcome.attempts,
      networkRetries: outcome.networkRetries,
      reason: outcome.reason ?? 'generation did not yield a speakable cue',
    });
    return;
  }

  sendJson(res, 200, {
    cue: toClientCue(outcome.cue),
    origin: 'generated',
    status: outcome.status,
    attempts: outcome.attempts,
    networkRetries: outcome.networkRetries,
  });
}

async function serveIndex(res: http.ServerResponse): Promise<void> {
  try {
    const html = await readFile(INDEX_HTML);
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    res.end(html);
  } catch {
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end('index.html not found next to server.ts');
  }
}

const server = http.createServer((req, res) => {
  const url = (req.url ?? '/').split('?')[0];
  const method = req.method ?? 'GET';

  if (method === 'POST' && url === '/api/cue') {
    void handleCue(req, res).catch((err) => {
      sendJson(res, 500, { error: err instanceof Error ? err.message : String(err) });
    });
    return;
  }
  if (method === 'GET' && url === '/health') {
    sendJson(res, 200, { ok: true, keyPresent: Boolean(process.env['ANTHROPIC_API_KEY']) });
    return;
  }
  if (method === 'GET' && (url === '/' || url === '/index.html')) {
    void serveIndex(res);
    return;
  }
  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('not found');
});

/** Best-effort list of LAN URLs so the user can open the app from their phone. */
function lanUrls(port: number): string[] {
  const urls: string[] = [];
  for (const addrs of Object.values(networkInterfaces())) {
    for (const a of addrs ?? []) {
      if (a.family === 'IPv4' && !a.internal) urls.push(`http://${a.address}:${port}`);
    }
  }
  return urls;
}

server.listen(PORT, '0.0.0.0', () => {
  const keyPresent = Boolean(process.env['ANTHROPIC_API_KEY']);
  console.log(`Friction Companion server listening on http://localhost:${PORT}`);
  for (const u of lanUrls(PORT)) console.log(`  on your network:  ${u}   ← open this on your phone`);
  if (!keyPresent) {
    console.warn(
      '⚠ ANTHROPIC_API_KEY is not set — /api/cue will serve safe-default cues only.\n' +
        '  Set it (see README "Setting the API key") and restart for live generation.',
    );
  }
});
