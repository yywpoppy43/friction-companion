/**
 * Entrypoint for the phone web-app server.
 *
 *   node --env-file-if-exists=.env src/server/main.ts
 *
 * Wires the operator-tuned arc, the cue service (live when a model key is present,
 * offline otherwise), and the cloud-TTS config, then serves the app. Every timing
 * value and every key comes from the environment — changing the arc or the voice
 * is a config change, never a code change.
 *
 * Environment (all optional):
 *   PORT, HOST                              — bind address (default 0.0.0.0:3000)
 *   ANTHROPIC_API_KEY, ANTHROPIC_MODEL      — enable live cue generation
 *   OPENAI_API_KEY | GOOGLE_TTS_API_KEY,    — enable cloud TTS (else a tone stand-in)
 *     TTS_PROVIDER, TTS_VOICE, TTS_MODEL
 *   SESSION_LENGTH_MIN | SESSION_LENGTH_MS  — the real workout length
 *   WALL_AT, MIN_GAP_MS                     — tune the arc's wall / cue spacing
 *   ARC_JSON                                — a full/partial SessionArc as JSON
 */

import { createDatabaseCueBank } from '../cue-bank/cue-database.ts';
import { CueService } from './cue-service.ts';
import { SessionCueGenerator } from './session-cue-generator.ts';
import { resolveTtsConfig } from './tts-service.ts';
import { resolveArc, validateArc, type SessionArc } from '../session/arc.ts';
import { createAppServer } from './server.ts';

type Env = Record<string, string | undefined>;

function num(env: Env, key: string): number | undefined {
  const raw = env[key];
  if (raw === undefined) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/** Build the operator-tuned arc from the environment (over the design defaults). */
export function arcFromEnv(env: Env): SessionArc {
  let overrides: Partial<SessionArc> = {};
  if (env['ARC_JSON']) {
    try {
      overrides = JSON.parse(env['ARC_JSON']) as Partial<SessionArc>;
    } catch (err) {
      throw new Error(`ARC_JSON is not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  const lengthMin = num(env, 'SESSION_LENGTH_MIN');
  const lengthMs = num(env, 'SESSION_LENGTH_MS') ?? (lengthMin !== undefined ? lengthMin * 60_000 : undefined);
  if (lengthMs !== undefined) overrides = { ...overrides, lengthMs };
  const wallAt = num(env, 'WALL_AT');
  if (wallAt !== undefined) overrides = { ...overrides, wallAt };
  const minGapMs = num(env, 'MIN_GAP_MS');
  if (minGapMs !== undefined) overrides = { ...overrides, minGapMs };

  const arc = resolveArc(overrides);
  validateArc(arc);
  return arc;
}

function main(): void {
  const env: Env = process.env;
  const bank = createDatabaseCueBank();

  const anthropicKey = env['ANTHROPIC_API_KEY'];
  const generator = anthropicKey
    ? new SessionCueGenerator(bank, { apiKey: anthropicKey, ...(env['ANTHROPIC_MODEL'] ? { model: env['ANTHROPIC_MODEL'] } : {}) })
    : undefined;
  const cueService = new CueService(bank, generator);
  const ttsConfig = resolveTtsConfig(env);
  const arc = arcFromEnv(env);

  const server = createAppServer({ cueService, ttsConfig, arc });

  const port = Number(env['PORT'] ?? 3000);
  const host = env['HOST'] ?? '0.0.0.0';
  server.listen(port, host, () => {
    const mode = cueService.isLive ? 'LIVE (cues generated per session)' : 'OFFLINE (cues drawn from the Cue Bank — set ANTHROPIC_API_KEY for live)';
    const voice =
      ttsConfig.provider === 'tone'
        ? 'tone stand-in (set OPENAI_API_KEY or GOOGLE_TTS_API_KEY for a real voice)'
        : `${ttsConfig.provider} · ${ttsConfig.voice}`;
    // eslint-disable-next-line no-console
    console.log(
      `The Return — phone companion\n` +
        `  http://${host === '0.0.0.0' ? 'localhost' : host}:${port}  (open on a phone via this machine's LAN IP)\n` +
        `  session: ${Math.round(arc.lengthMs / 60_000)} min · wall at ${Math.round(arc.wallAt * 100)}%\n` +
        `  cues:  ${mode}\n` +
        `  voice: ${voice}`,
    );
  });
}

main();
