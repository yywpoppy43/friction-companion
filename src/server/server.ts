/**
 * The thin proxy server — Build Stage 1 plumbing.
 *
 * A minimal `node:http` server (zero runtime deps, matching the framework) that:
 *   - serves the phone web-app from `public/`;
 *   - GET  /api/config  → the arc + the computed cue schedule + the run mode
 *                         (live/offline) + the TTS provider. Query params allow an
 *                         operator (or a test) to override timing without code:
 *                         `?lengthMs=`, `?lengthMin=`, `?wallAt=`, `?minGapMs=`.
 *   - POST /api/cue      → one fresh, human-filtered cue for a moment (the model
 *                         key stays here; only the spoken line + tone go back).
 *   - POST /api/tts      → cloud-TTS audio for a line, streamed back to the app
 *                         (the TTS key stays here too).
 *
 * The server holds every secret. Nothing internal — no key, no framework
 * vocabulary, no Cue internals — ever crosses the wire to the page.
 */

import { createServer, type IncomingMessage, type ServerResponse, type Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, normalize, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FRICTION_STATES, type FrictionState } from '../domain/friction-state.ts';
import { FRICTION_CONDITIONS, type FrictionCondition } from '../domain/friction-condition.ts';
import { clamp01 } from '../domain/units.ts';
import { planSchedule, toPublicArc, type SessionArc } from '../session/arc.ts';
import type { CueService } from './cue-service.ts';
import { synthesizeSpeech, type TtsConfig } from './tts-service.ts';

export interface AppServerDeps {
  cueService: CueService;
  ttsConfig: TtsConfig;
  /** The operator-tuned base arc; requests may override timing via query params. */
  arc: SessionArc;
  /** Directory of the static phone app (defaults to the repo `public/`). */
  publicDir?: string;
}

const MAX_BODY_BYTES = 64 * 1024;
const MAX_TTS_CHARS = 600;

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

const DEFAULT_PUBLIC_DIR = fileURLToPath(new URL('../../public/', import.meta.url));

/** Build (but do not start) the HTTP server. */
export function createAppServer(deps: AppServerDeps): Server {
  const publicDir = deps.publicDir ?? DEFAULT_PUBLIC_DIR;
  return createServer((req, res) => {
    handle(req, res, deps, publicDir).catch((err) => {
      sendJson(res, 500, { error: 'internal', detail: err instanceof Error ? err.message : String(err) });
    });
  });
}

async function handle(
  req: IncomingMessage,
  res: ServerResponse,
  deps: AppServerDeps,
  publicDir: string,
): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const path = url.pathname;
  const method = req.method ?? 'GET';

  if (path === '/api/config' && method === 'GET') return sendConfig(res, deps, url);
  if (path === '/api/cue' && method === 'POST') return sendCue(req, res, deps);
  if (path === '/api/tts' && method === 'POST') return sendTts(req, res, deps);
  if (path.startsWith('/api/')) return sendJson(res, 404, { error: 'not found' });

  if (method !== 'GET' && method !== 'HEAD') return sendJson(res, 405, { error: 'method not allowed' });
  return serveStatic(res, publicDir, path);
}

// ── /api/config ───────────────────────────────────────────────────────────────

function sendConfig(res: ServerResponse, deps: AppServerDeps, url: URL): void {
  const arc = applyArcOverrides(deps.arc, url.searchParams);
  let schedule;
  try {
    schedule = planSchedule(arc);
  } catch (err) {
    return sendJson(res, 400, { error: 'invalid arc', detail: err instanceof Error ? err.message : String(err) });
  }
  sendJson(res, 200, {
    arc: toPublicArc(arc),
    schedule,
    mode: deps.cueService.isLive ? 'live' : 'offline',
    ttsProvider: deps.ttsConfig.provider,
  });
}

/** Merge timing overrides from query params over the base arc (operator/test knob). */
function applyArcOverrides(base: SessionArc, q: URLSearchParams): SessionArc {
  const arc: SessionArc = { ...base };
  const lengthMs = numberParam(q, 'lengthMs');
  const lengthMin = numberParam(q, 'lengthMin');
  if (lengthMs !== undefined) arc.lengthMs = lengthMs;
  else if (lengthMin !== undefined) arc.lengthMs = Math.round(lengthMin * 60_000);
  const wallAt = numberParam(q, 'wallAt');
  if (wallAt !== undefined) arc.wallAt = wallAt;
  const minGapMs = numberParam(q, 'minGapMs');
  if (minGapMs !== undefined) arc.minGapMs = minGapMs;
  return arc;
}

function numberParam(q: URLSearchParams, key: string): number | undefined {
  const raw = q.get(key);
  if (raw === null) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

// ── /api/cue ──────────────────────────────────────────────────────────────────

async function sendCue(req: IncomingMessage, res: ServerResponse, deps: AppServerDeps): Promise<void> {
  const body = await readJsonBody(req);
  if (body === null) return sendJson(res, 400, { error: 'invalid JSON body' });

  const state = body['state'];
  if (!isFrictionState(state)) {
    return sendJson(res, 400, { error: `state must be one of ${FRICTION_STATES.join(', ')}` });
  }
  const intensity = clamp01(Number(body['intensity'] ?? 0.5));
  const round = Math.max(1, Math.floor(Number(body['round'] ?? 1)) || 1);
  const frictionCondition = isFrictionCondition(body['frictionCondition']) ? body['frictionCondition'] : undefined;
  const avoidTranscripts = toStringArray(body['avoidTranscripts']);

  const outcome = await deps.cueService.produce({ state, intensity, round, frictionCondition, avoidTranscripts });
  sendJson(res, 200, outcome);
}

// ── /api/tts ──────────────────────────────────────────────────────────────────

async function sendTts(req: IncomingMessage, res: ServerResponse, deps: AppServerDeps): Promise<void> {
  const body = await readJsonBody(req);
  if (body === null) return sendJson(res, 400, { error: 'invalid JSON body' });
  const text = typeof body['text'] === 'string' ? body['text'].slice(0, MAX_TTS_CHARS).trim() : '';
  if (!text) return sendJson(res, 400, { error: 'text is required' });

  const audio = await synthesizeSpeech(text, deps.ttsConfig);
  res.writeHead(200, {
    'content-type': audio.contentType,
    'content-length': String(audio.body.length),
    'x-tts-provider': audio.provider,
    'cache-control': 'no-store',
  });
  res.end(Buffer.from(audio.body));
}

// ── static ────────────────────────────────────────────────────────────────────

async function serveStatic(res: ServerResponse, publicDir: string, path: string): Promise<void> {
  const rel = path === '/' ? 'index.html' : normalize(path).replace(/^(\.\.[/\\])+/, '').replace(/^[/\\]+/, '');
  const full = join(publicDir, rel);
  // Containment guard: never serve outside the public dir.
  if (!full.startsWith(publicDir)) return sendJson(res, 403, { error: 'forbidden' });
  try {
    const data = await readFile(full);
    res.writeHead(200, { 'content-type': CONTENT_TYPES[extname(full)] ?? 'application/octet-stream' });
    res.end(data);
  } catch {
    sendJson(res, 404, { error: 'not found' });
  }
}

// ── helpers ───────────────────────────────────────────────────────────────────

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  const data = JSON.stringify(payload);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(data);
}

/** Read a size-bounded JSON body; returns null on overflow or parse failure. */
function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown> | null> {
  return new Promise((resolve) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        resolve(null);
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (chunks.length === 0) return resolve({});
      try {
        const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        resolve(typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null);
      } catch {
        resolve(null);
      }
    });
    req.on('error', () => resolve(null));
  });
}

function isFrictionState(value: unknown): value is FrictionState {
  return typeof value === 'string' && (FRICTION_STATES as readonly string[]).includes(value);
}

function isFrictionCondition(value: unknown): value is FrictionCondition {
  return typeof value === 'string' && (FRICTION_CONDITIONS as readonly string[]).includes(value);
}

function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out = value.filter((v): v is string => typeof v === 'string').slice(-12);
  return out.length > 0 ? out : undefined;
}
