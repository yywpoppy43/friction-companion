import { test } from 'node:test';
import assert from 'node:assert/strict';

import { CueService } from '../server/cue-service.ts';
import { SessionCueGenerator } from '../server/session-cue-generator.ts';
import { createDatabaseCueBank } from '../cue-bank/cue-database.ts';
import { FrictionState } from '../domain/friction-state.ts';
import type { Cue } from '../domain/cue.ts';
import type { CueGenerator, CueGenerationRequest, GenerationOutcome } from '../ports/cue-generator.ts';

const bank = createDatabaseCueBank();

/** A stub generator that returns whatever outcome the test supplies. */
class StubGenerator implements CueGenerator {
  lastRequest: CueGenerationRequest | null = null;
  private readonly outcome: (req: CueGenerationRequest) => GenerationOutcome;
  constructor(outcome: (req: CueGenerationRequest) => GenerationOutcome) {
    this.outcome = outcome;
  }
  async generate(request: CueGenerationRequest): Promise<GenerationOutcome> {
    this.lastRequest = request;
    return this.outcome(request);
  }
}

function genCue(text: string, state = FrictionState.ENCOUNTER): Cue {
  return {
    CueID: 'gen-x',
    PrimaryState: state,
    PhysicalLever: 'internal lever wording',
    EnergeticVector: 'the operator and the apparatus and the Engine', // internal jargon
    StructuralYield: 'internal structural jargon',
    AudioTranscript: text,
    DeliveryTone: 'Sharp, commanding',
  };
}

test('offline mode draws real Cue Bank lines and never leaks internal fields', async () => {
  const service = new CueService(bank); // no generator → offline
  assert.equal(service.isLive, false);
  const out = await service.produce({ state: FrictionState.ENCOUNTER, intensity: 1, round: 1 });
  assert.equal(out.mode, 'offline');
  assert.equal(out.origin, 'database');
  // Only the speakable projection crosses the boundary.
  assert.deepEqual(Object.keys(out.cue).sort(), ['cueId', 'state', 'text', 'tone']);
  assert.equal(out.cue.state, FrictionState.ENCOUNTER);
  // It is a genuine ENCOUNTER line from the corpus.
  const encounterTexts = bank.cuesForState(FrictionState.ENCOUNTER).map((c) => c.AudioTranscript);
  assert.ok(encounterTexts.includes(out.cue.text));
});

test('offline rotation avoids repeating the just-spoken line', async () => {
  const service = new CueService(bank);
  const first = await service.produce({ state: FrictionState.INTENTION, intensity: 0.3, round: 1 });
  const second = await service.produce({
    state: FrictionState.INTENTION,
    intensity: 0.3,
    round: 2,
    avoidTranscripts: [first.cue.text],
  });
  assert.notEqual(second.cue.text, first.cue.text);
});

test('live mode returns a freshly generated cue', async () => {
  const gen = new StubGenerator(() => ({
    cue: genCue('Feel the tremor. Drop your breath and hold the line — this is where it is built.'),
    status: 'ok',
    attempts: 1,
    networkRetries: 0,
  }));
  const service = new CueService(bank, gen);
  assert.equal(service.isLive, true);
  const out = await service.produce({
    state: FrictionState.ENCOUNTER,
    intensity: 1,
    round: 1,
    avoidTranscripts: ['old line'],
  });
  assert.equal(out.mode, 'live');
  assert.equal(out.origin, 'generated');
  assert.match(out.cue.text, /tremor/);
  // The avoid-list is threaded into the generation request.
  assert.deepEqual(gen.lastRequest?.avoidTranscripts, ['old line']);
  // Still no internal fields on the wire.
  assert.deepEqual(Object.keys(out.cue).sort(), ['cueId', 'state', 'text', 'tone']);
});

test('a failed generation never goes silent — it falls back to the safe default', async () => {
  const gen = new StubGenerator(() => ({
    cue: null,
    status: 'error',
    attempts: 2,
    networkRetries: 2,
    reason: 'network error',
  }));
  const service = new CueService(bank, gen);
  const out = await service.produce({ state: FrictionState.ENCOUNTER, intensity: 1, round: 1 });
  assert.equal(out.origin, 'fallback');
  assert.equal(out.cue.state, FrictionState.ENCOUNTER);
  assert.ok(out.cue.text.length > 0);
  assert.match(out.reason ?? '', /network/);
});

test('the final seal catches a leaky transcript and substitutes a clean safe default', async () => {
  // A misbehaving generator that leaks internal vocabulary in the spoken line.
  const gen = new StubGenerator(() => ({
    cue: genCue('Your Engine is redlining — the operator must hold.'),
    status: 'ok',
    attempts: 1,
    networkRetries: 0,
  }));
  const service = new CueService(bank, gen);
  const out = await service.produce({ state: FrictionState.ENCOUNTER, intensity: 1, round: 1 });
  assert.equal(out.origin, 'fallback');
  assert.doesNotMatch(out.cue.text.toLowerCase(), /\bengine\b|\boperator\b/);
  assert.match(out.reason ?? '', /seal/);
});

test('live path end-to-end: SessionCueGenerator over a fake API → stripped SpokenCue', async () => {
  // A canned Messages API response with the forced emit_cue tool call.
  const fakeFetch = async () => ({
    ok: true,
    status: 200,
    async text() {
      return '';
    },
    async json() {
      return {
        content: [
          {
            type: 'tool_use',
            name: 'emit_cue',
            input: {
              PhysicalLever: 'internal lever',
              EnergeticVector: 'the operator apparatus jargon',
              StructuralYield: 'internal jargon',
              AudioTranscript: 'Feel the tremor. Drop your breath and hold your line.',
              DeliveryTone: 'Sharp, commanding',
            },
          },
        ],
      };
    },
  });
  const gen = new SessionCueGenerator(bank, { apiKey: 'k', fetchImpl: fakeFetch });
  const service = new CueService(bank, gen);
  const out = await service.produce({ state: FrictionState.ENCOUNTER, intensity: 1, round: 1 });
  assert.equal(out.origin, 'generated');
  assert.equal(out.mode, 'live');
  assert.match(out.cue.text, /tremor/);
  // The internal fields never survive the projection.
  assert.deepEqual(Object.keys(out.cue).sort(), ['cueId', 'state', 'text', 'tone']);
  assert.ok(!JSON.stringify(out).includes('operator'));
});

test('SessionCueGenerator grounds the prompt in the Cue Bank and the avoid-list', () => {
  const gen = new SessionCueGenerator(bank, { apiKey: 'test-key' });
  const body = gen.buildRequestBody({
    state: FrictionState.ENCOUNTER,
    source: 'INIT',
    intensity: 1,
    round: 1,
    avoidTranscripts: ['Feel that shake? Stay in it.'],
  });
  const messages = body['messages'] as { role: string; content: string }[];
  const content = messages[0]!.content;
  assert.match(content, /EXISTING LINES FOR THIS STATE/);
  assert.match(content, /ALREADY SPOKEN THIS SESSION/);
  assert.match(content, /Feel that shake\? Stay in it\./);
  // Grounding is drawn from the real corpus for the requested state.
  const anEncounterLine = bank.cuesForState(FrictionState.ENCOUNTER)[0]!.AudioTranscript;
  assert.ok(content.includes(anEncounterLine));
});
