/**
 * Cloud text-to-speech — the "natural voice" fix.
 *
 * The prototype used the browser's robotic SpeechSynthesis. This replaces it with
 * server-side cloud TTS: the app asks the server for audio, the server calls a
 * cloud TTS API with the key held here (never in the page), and streams the audio
 * back for the app to play. One clean, neutral, grounded voice — not theatrical.
 *
 * It is provider-agnostic over `fetch` (no SDK, preserving the repo's zero-runtime-
 * deps property). Two providers ship — OpenAI and Google Cloud TTS — selected by
 * whichever key is present (or `TTS_PROVIDER`). When no key is configured it falls
 * back to a locally-synthesized WAV tone whose duration tracks the line length, so
 * the whole pipeline — request, stream, play, and the no-overlap queue — runs and
 * is verifiable end-to-end without a paid key. That fallback is a dev stand-in, not
 * the product voice; set a key and the identical path speaks in the real voice.
 */

export type TtsFetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal },
) => Promise<{ ok: boolean; status: number; text(): Promise<string>; json(): Promise<unknown>; arrayBuffer(): Promise<ArrayBuffer> }>;

export type TtsProvider = 'openai' | 'google' | 'tone';

export interface TtsConfig {
  provider: TtsProvider;
  apiKey?: string;
  /** Model id (provider-specific). */
  model: string;
  /** One neutral, grounded voice. Provider-specific id. */
  voice: string;
  /** Delivery guidance for models that accept it (kept neutral, non-theatrical). */
  instructions: string;
  openaiBaseUrl: string;
  googleBaseUrl: string;
  fetchImpl?: TtsFetchLike;
}

export interface SynthesizedAudio {
  /** MIME type for the streamed bytes, e.g. `audio/mpeg` or `audio/wav`. */
  contentType: string;
  body: Uint8Array;
  /** Which provider produced this (surfaced to the client as a header). */
  provider: TtsProvider;
  /** Present for the tone fallback: the synthesized duration in ms. */
  durationMs?: number;
}

const DEFAULTS = {
  openaiModel: 'gpt-4o-mini-tts',
  openaiVoice: 'onyx', // deep, grounded, neutral
  googleModel: 'text:synthesize',
  googleVoice: 'en-US-Neural2-D', // neutral, grounded
  instructions: 'Speak calmly and grounded. Unhurried, neutral, matter-of-fact. Not theatrical, no hype.',
  openaiBaseUrl: 'https://api.openai.com',
  googleBaseUrl: 'https://texttospeech.googleapis.com',
};

type Env = Record<string, string | undefined>;

/**
 * Resolve the TTS configuration from the environment. Provider precedence:
 * an explicit `TTS_PROVIDER`, else the first key present (OpenAI, then Google),
 * else the keyless tone fallback.
 */
export function resolveTtsConfig(env: Env = readEnv(), fetchImpl?: TtsFetchLike): TtsConfig {
  const explicit = (env['TTS_PROVIDER'] ?? '').toLowerCase();
  const openaiKey = env['OPENAI_API_KEY'];
  const googleKey = env['GOOGLE_TTS_API_KEY'] ?? env['GOOGLE_API_KEY'];

  let provider: TtsProvider;
  if (explicit === 'openai' || explicit === 'google' || explicit === 'tone') provider = explicit;
  else if (openaiKey) provider = 'openai';
  else if (googleKey) provider = 'google';
  else provider = 'tone';

  const apiKey = provider === 'openai' ? openaiKey : provider === 'google' ? googleKey : undefined;
  const model =
    env['TTS_MODEL'] ?? (provider === 'google' ? DEFAULTS.googleModel : DEFAULTS.openaiModel);
  const voice =
    env['TTS_VOICE'] ?? (provider === 'google' ? DEFAULTS.googleVoice : DEFAULTS.openaiVoice);

  return {
    provider,
    apiKey,
    model,
    voice,
    instructions: env['TTS_INSTRUCTIONS'] ?? DEFAULTS.instructions,
    openaiBaseUrl: env['OPENAI_BASE_URL'] ?? DEFAULTS.openaiBaseUrl,
    googleBaseUrl: env['GOOGLE_TTS_BASE_URL'] ?? DEFAULTS.googleBaseUrl,
    fetchImpl,
  };
}

/** Synthesize `text` to audio bytes using the configured provider. Never returns
 *  silence: on any provider error it falls back to the local tone so a cue is
 *  always audible (and the failure is knowable via the returned provider). */
export async function synthesizeSpeech(
  text: string,
  config: TtsConfig,
  signal?: AbortSignal,
): Promise<SynthesizedAudio> {
  const clean = text.trim();
  if (config.provider === 'tone' || !config.apiKey) return toneFallback(clean);

  try {
    if (config.provider === 'openai') return await synthesizeOpenAi(clean, config, signal);
    if (config.provider === 'google') return await synthesizeGoogle(clean, config, signal);
  } catch {
    // Never strand a cue on a TTS hiccup — degrade to the audible tone.
    return toneFallback(clean);
  }
  return toneFallback(clean);
}

// ── OpenAI ──────────────────────────────────────────────────────────────────

/** Build the OpenAI `/v1/audio/speech` request. Pure — unit-testable offline. */
export function buildOpenAiRequest(text: string, config: TtsConfig) {
  const body: Record<string, unknown> = {
    model: config.model,
    voice: config.voice,
    input: text,
    response_format: 'mp3',
  };
  // Only the gpt-4o tts models accept delivery `instructions`.
  if (/^gpt-4o/i.test(config.model)) body['instructions'] = config.instructions;
  return {
    url: `${config.openaiBaseUrl}/v1/audio/speech`,
    headers: {
      authorization: `Bearer ${config.apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}

async function synthesizeOpenAi(
  text: string,
  config: TtsConfig,
  signal?: AbortSignal,
): Promise<SynthesizedAudio> {
  const fetchImpl = requireFetch(config);
  const req = buildOpenAiRequest(text, config);
  const res = await fetchImpl(req.url, { method: 'POST', headers: req.headers, body: req.body, signal });
  if (!res.ok) throw new Error(`OpenAI TTS ${res.status}: ${await res.text()}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  return { contentType: 'audio/mpeg', body: buf, provider: 'openai' };
}

// ── Google Cloud TTS ──────────────────────────────────────────────────────────

/** Build the Google `text:synthesize` request. Pure — unit-testable offline. */
export function buildGoogleRequest(text: string, config: TtsConfig) {
  const languageCode = config.voice.split('-').slice(0, 2).join('-') || 'en-US';
  const body = {
    input: { text },
    voice: { languageCode, name: config.voice },
    audioConfig: { audioEncoding: 'MP3' },
  };
  return {
    url: `${config.googleBaseUrl}/v1/text:synthesize?key=${encodeURIComponent(config.apiKey ?? '')}`,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}

async function synthesizeGoogle(
  text: string,
  config: TtsConfig,
  signal?: AbortSignal,
): Promise<SynthesizedAudio> {
  const fetchImpl = requireFetch(config);
  const req = buildGoogleRequest(text, config);
  const res = await fetchImpl(req.url, { method: 'POST', headers: req.headers, body: req.body, signal });
  if (!res.ok) throw new Error(`Google TTS ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { audioContent?: string };
  if (!json.audioContent) throw new Error('Google TTS: no audioContent in response');
  const buf = Uint8Array.from(Buffer.from(json.audioContent, 'base64'));
  return { contentType: 'audio/mpeg', body: buf, provider: 'google' };
}

// ── Keyless tone fallback ─────────────────────────────────────────────────────

/** Estimate how long a line takes to speak, in ms (~150 wpm), clamped to a cue's span. */
export function estimateSpeechMs(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length || 1;
  return Math.max(1200, Math.min(8000, Math.round(words * 380)));
}

/** Synthesize a soft, grounded tone of the estimated speech length as a WAV. */
export function toneFallback(text: string): SynthesizedAudio {
  const durationMs = estimateSpeechMs(text);
  return { contentType: 'audio/wav', body: toneWav(durationMs), provider: 'tone', durationMs };
}

/** A gentle low sine (fundamental + soft harmonic) with click-free envelope, as a
 *  16-bit mono PCM WAV. Pure Node, no dependencies. */
export function toneWav(durationMs: number, freq = 196, sampleRate = 22050): Uint8Array {
  const samples = Math.max(1, Math.floor((sampleRate * durationMs) / 1000));
  const dataLen = samples * 2;
  const buf = Buffer.alloc(44 + dataLen);

  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataLen, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); // PCM chunk size
  buf.writeUInt16LE(1, 20); // audio format PCM
  buf.writeUInt16LE(1, 22); // channels = mono
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32); // block align
  buf.writeUInt16LE(16, 34); // bits per sample
  buf.write('data', 36);
  buf.writeUInt32LE(dataLen, 40);

  const attack = Math.floor(samples * 0.12);
  const release = Math.floor(samples * 0.28);
  const twoPi = Math.PI * 2;
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    let env = 1;
    if (i < attack) env = i / attack;
    else if (i > samples - release) env = (samples - i) / release;
    const tone = Math.sin(twoPi * freq * t) + 0.35 * Math.sin(twoPi * freq * 2 * t);
    const v = Math.max(-1, Math.min(1, tone * 0.2 * env));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.length);
}

// ── helpers ───────────────────────────────────────────────────────────────────

function requireFetch(config: TtsConfig): TtsFetchLike {
  const f = config.fetchImpl ?? (globalThis as { fetch?: TtsFetchLike }).fetch;
  if (!f) throw new Error('tts-service: no fetch implementation available');
  return f;
}

function readEnv(): Env {
  return (globalThis as { process?: { env?: Env } }).process?.env ?? {};
}
