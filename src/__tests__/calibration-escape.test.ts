import { test } from 'node:test';
import assert from 'node:assert/strict';

import { FRICTION_CONDITIONS, FrictionCondition } from '../domain/friction-condition.ts';
import { findForbiddenVocabulary, isSpeakable } from '../generative/output-vocabulary.ts';
import { GENERATIVE_SYSTEM_PROMPT, buildSystemPrompt } from '../generative/system-prompt.ts';
import { AnthropicCueGenerator } from '../generative/anthropic-cue-generator.ts';
import { FrictionState } from '../domain/friction-state.ts';

test('ESCAPE is a friction condition', () => {
  assert.equal(FrictionCondition.ESCAPE, 'ESCAPE');
  assert.ok(FRICTION_CONDITIONS.includes(FrictionCondition.ESCAPE));
});

test('slogans, belief, and outcome-claim phrases are caught by the filter', () => {
  for (const s of [
    'Power goes where your eyes go.',
    'Speed is not strength.',
    'You got this.',
    'Believe in the work.',
  ]) {
    assert.ok(findForbiddenVocabulary(s).length > 0, `should flag "${s}"`);
  }
});

test('a clean ESCAPE-style present-sensation reframe passes', () => {
  const clean =
    "That's the quit talking. You don't have to answer it. Stay — let it shake; the shake is the muscle working.";
  assert.deepEqual(findForbiddenVocabulary(clean), []);
  assert.equal(isSpeakable(clean), true);
});

test('operator profile text is never speakable, but unrelated somatic cues are fine', () => {
  const profile =
    'CORE: anxious over-achiever\nSTRONG: grinds through everything\nABSENT: breathing rhythm\n' +
    'FAULT LINES: negotiates the exit at first discomfort';

  // Quoting the profile content leaks (verbatim 3-word run).
  assert.ok(!isSpeakable('You negotiate the exit at first discomfort. Stay.', { profile }));
  // The identifying label leaks.
  assert.ok(!isSpeakable('Mind your fault lines here.', { profile }));
  // A legitimate breath cue is NOT over-flagged just because the profile mentions breathing.
  assert.deepEqual(findForbiddenVocabulary('Drop your breath low and stay.', { profile }), []);
  // With no profile supplied, behaviour is unchanged (nothing profile-related is checked).
  assert.deepEqual(findForbiddenVocabulary('You negotiate the exit at first discomfort. Stay.'), []);
});

test('buildSystemPrompt is byte-identical without a profile, calibrated with one', () => {
  assert.equal(buildSystemPrompt(), GENERATIVE_SYSTEM_PROMPT);
  assert.equal(buildSystemPrompt('   '), GENERATIVE_SYSTEM_PROMPT);

  const p = 'CORE: high-output competitor\nABSENT: breath channel under load';
  const withP = buildSystemPrompt(p);
  assert.ok(withP.startsWith(GENERATIVE_SYSTEM_PROMPT), 'calibration is appended after the base');
  assert.match(withP, /CALIBRATION/);
  assert.match(withP, /shapes FORM only/i);
  assert.match(withP, /high-output competitor/);
  assert.match(withP, /breath channel under load/);
});

test('buildRequestBody injects calibration only when a profile is present', () => {
  const gen = new AnthropicCueGenerator({ apiKey: 'k' });
  const base = gen.buildRequestBody({ state: FrictionState.ENCOUNTER, source: 'INIT', intensity: 0.9, round: 1 });
  assert.equal(base['system'], GENERATIVE_SYSTEM_PROMPT);

  const withP = gen.buildRequestBody({
    state: FrictionState.ENCOUNTER,
    source: 'INIT',
    intensity: 0.9,
    round: 1,
    profile: 'CORE: holds the breath under load',
  });
  assert.notEqual(withP['system'], GENERATIVE_SYSTEM_PROMPT);
  assert.match(withP['system'] as string, /holds the breath under load/);
});

test('the system prompt carries the safety carve-out, the reframe rule, and ESCAPE', () => {
  assert.match(GENERATIVE_SYSTEM_PROMPT, /Safety_Rule/);
  assert.match(GENERATIVE_SYSTEM_PROMPT, /sharp pain/i);
  assert.match(GENERATIVE_SYSTEM_PROMPT, /Reframe_Rule/);
  assert.match(GENERATIVE_SYSTEM_PROMPT, /\bESCAPE:/);
  assert.match(GENERATIVE_SYSTEM_PROMPT, /escape_encounter/);
  // The old universal slogans no longer appear as endorsed reframe truths.
  assert.doesNotMatch(GENERATIVE_SYSTEM_PROMPT, /Speed is not strength\. Control is/);
});
