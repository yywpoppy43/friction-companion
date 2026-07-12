import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveTtsConfig,
  buildOpenAiRequest,
  buildGoogleRequest,
  synthesizeSpeech,
  estimateSpeechMs,
  toneWav,
  type TtsFetchLike,
  type TtsConfig,
} from '../server/tts-service.ts';

function fakeFetch(
  handler: (url: string, init: { body: string; headers: Record<string, string> }) => {
    ok?: boolean;
    status?: number;
    bytes?: Uint8Array;
    json?: unknown;
    text?: string;
  },
): TtsFetchLike {
  return async (url, init) => {
    const r = handler(url, { body: init.body, headers: init.headers });
    return {
      ok: r.ok ?? true,
      status: r.status ?? 200,
      async text() {
        return r.text ?? '';
      },
      async json() {
        return r.json ?? {};
      },
      async arrayBuffer() {
        const b = r.bytes ?? new Uint8Array([1, 2, 3]);
        return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
      },
    };
  };
}

test('resolveTtsConfig selects provider from keys / TTS_PROVIDER', () => {
  assert.equal(resolveTtsConfig({}).provider, 'tone');
  assert.equal(resolveTtsConfig({ OPENAI_API_KEY: 'k' }).provider, 'openai');
  assert.equal(resolveTtsConfig({ GOOGLE_TTS_API_KEY: 'k' }).provider, 'google');
  assert.equal(resolveTtsConfig({ OPENAI_API_KEY: 'k', TTS_PROVIDER: 'tone' }).provider, 'tone');
  assert.equal(resolveTtsConfig({ TTS_PROVIDER: 'google', GOOGLE_API_KEY: 'k' }).voice, 'en-US-Neural2-D');
});

test('buildOpenAiRequest targets the speech endpoint with a bearer key', () => {
  const cfg = resolveTtsConfig({ OPENAI_API_KEY: 'secret', TTS_VOICE: 'onyx' });
  const req = buildOpenAiRequest('stay with it', cfg);
  assert.equal(req.url, 'https://api.openai.com/v1/audio/speech');
  assert.equal(req.headers['authorization'], 'Bearer secret');
  const body = JSON.parse(req.body);
  assert.equal(body.input, 'stay with it');
  assert.equal(body.voice, 'onyx');
  assert.equal(body.response_format, 'mp3');
  assert.ok(body.instructions, 'gpt-4o tts model carries neutral delivery instructions');
});

test('buildOpenAiRequest omits instructions for legacy tts-1', () => {
  const cfg = resolveTtsConfig({ OPENAI_API_KEY: 'secret', TTS_MODEL: 'tts-1' });
  const body = JSON.parse(buildOpenAiRequest('x', cfg).body);
  assert.equal(body.instructions, undefined);
});

test('buildGoogleRequest carries the key and derives the language code', () => {
  const cfg = resolveTtsConfig({ GOOGLE_TTS_API_KEY: 'gkey', TTS_PROVIDER: 'google' });
  const req = buildGoogleRequest('hold the line', cfg);
  assert.match(req.url, /text:synthesize\?key=gkey$/);
  const body = JSON.parse(req.body);
  assert.equal(body.input.text, 'hold the line');
  assert.equal(body.voice.languageCode, 'en-US');
  assert.equal(body.audioConfig.audioEncoding, 'MP3');
});

test('synthesizeSpeech streams provider audio through', async () => {
  const audio = new Uint8Array([9, 8, 7, 6]);
  const cfg: TtsConfig = { ...resolveTtsConfig({ OPENAI_API_KEY: 'k' }), fetchImpl: fakeFetch(() => ({ bytes: audio })) };
  const out = await synthesizeSpeech('breathe low', cfg);
  assert.equal(out.provider, 'openai');
  assert.equal(out.contentType, 'audio/mpeg');
  assert.deepEqual([...out.body], [9, 8, 7, 6]);
});

test('synthesizeSpeech never goes silent — a provider error degrades to the tone', async () => {
  const cfg: TtsConfig = {
    ...resolveTtsConfig({ OPENAI_API_KEY: 'k' }),
    fetchImpl: fakeFetch(() => ({ ok: false, status: 500, text: 'boom' })),
  };
  const out = await synthesizeSpeech('hold', cfg);
  assert.equal(out.provider, 'tone');
  assert.equal(out.contentType, 'audio/wav');
  assert.ok(out.body.length > 44);
});

test('tone fallback is a well-formed WAV whose length tracks the text', () => {
  const short = toneWav(estimateSpeechMs('stay'));
  const long = toneWav(estimateSpeechMs('stay here and breathe low and hold the line all the way through'));
  // RIFF/WAVE/data headers present.
  assert.equal(Buffer.from(short.slice(0, 4)).toString('ascii'), 'RIFF');
  assert.equal(Buffer.from(short.slice(8, 12)).toString('ascii'), 'WAVE');
  assert.equal(Buffer.from(short.slice(36, 40)).toString('ascii'), 'data');
  // Declared data length matches the byte payload.
  const declared = Buffer.from(short.buffer, short.byteOffset).readUInt32LE(40);
  assert.equal(declared, short.length - 44);
  // Longer line → longer audio.
  assert.ok(long.length > short.length);
});

test('estimateSpeechMs stays inside a single cue window', () => {
  assert.ok(estimateSpeechMs('a') >= 1200);
  assert.ok(estimateSpeechMs('word '.repeat(100)) <= 8000);
});
