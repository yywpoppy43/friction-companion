import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

import { createAppServer } from '../server/server.ts';
import { CueService } from '../server/cue-service.ts';
import { resolveTtsConfig } from '../server/tts-service.ts';
import { createDatabaseCueBank } from '../cue-bank/cue-database.ts';
import { DEFAULT_ARC } from '../session/arc.ts';
import { FrictionState } from '../domain/friction-state.ts';

let server: Server;
let base: string;
let publicDir: string;

before(async () => {
  publicDir = mkdtempSync(join(tmpdir(), 'return-public-'));
  writeFileSync(join(publicDir, 'index.html'), '<!doctype html><title>ok</title>hello');

  const bank = createDatabaseCueBank();
  server = createAppServer({
    cueService: new CueService(bank), // offline
    ttsConfig: resolveTtsConfig({}), // tone
    arc: DEFAULT_ARC,
    publicDir,
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  base = `http://127.0.0.1:${port}`;
});

after(() => {
  server.close();
});

test('GET /api/config returns a schedule with the wedge on the wall', async () => {
  const res = await fetch(`${base}/api/config?lengthMin=10`);
  assert.equal(res.status, 200);
  const body = (await res.json()) as {
    mode: string;
    ttsProvider: string;
    arc: { lengthMs: number; wallAt: number };
    schedule: { atMs: number; kind: string; state: string }[];
  };
  assert.equal(body.mode, 'offline');
  assert.equal(body.ttsProvider, 'tone');
  assert.equal(body.arc.lengthMs, 10 * 60_000);
  const wedge = body.schedule.find((m) => m.kind === 'wedge')!;
  assert.equal(wedge.state, FrictionState.ENCOUNTER);
  assert.equal(wedge.atMs, Math.round(body.arc.wallAt * body.arc.lengthMs));
});

test('POST /api/cue returns only the speakable projection (no internal fields)', async () => {
  const res = await fetch(`${base}/api/cue`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ state: 'ENCOUNTER', intensity: 1, round: 1 }),
  });
  assert.equal(res.status, 200);
  const body = (await res.json()) as { cue: Record<string, unknown> };
  assert.deepEqual(Object.keys(body.cue).sort(), ['cueId', 'state', 'text', 'tone']);
  // Belt and braces: none of the internal Cue fields ever appear on the wire.
  const wire = JSON.stringify(body);
  for (const forbidden of ['PhysicalLever', 'EnergeticVector', 'StructuralYield', 'apparatus', 'operator']) {
    assert.ok(!wire.includes(forbidden), `wire must not contain ${forbidden}`);
  }
});

test('POST /api/cue rejects an unknown state', async () => {
  const res = await fetch(`${base}/api/cue`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ state: 'NONSENSE' }),
  });
  assert.equal(res.status, 400);
});

test('POST /api/tts streams audio bytes', async () => {
  const res = await fetch(`${base}/api/tts`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: 'Stay in it.' }),
  });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'audio/wav');
  assert.equal(res.headers.get('x-tts-provider'), 'tone');
  const buf = new Uint8Array(await res.arrayBuffer());
  assert.ok(buf.length > 44, 'a real WAV payload came back');
});

test('static hosting serves the app and blocks path traversal', async () => {
  const index = await fetch(`${base}/`);
  assert.equal(index.status, 200);
  assert.match(await index.text(), /hello/);

  const escape = await fetch(`${base}/../server/server.ts`);
  assert.ok(escape.status === 403 || escape.status === 404, 'traversal is refused');
});
