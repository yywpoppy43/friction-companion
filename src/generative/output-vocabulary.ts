/**
 * Code-level enforcement of the spoken-output constraint.
 *
 * The system prompt forbids internal architectural vocabulary, generic
 * motivation, universal slogans, and (when calibration is on) any operator
 * profile text in spoken output — but prompts can leak. This module re-checks
 * every generated `AudioTranscript` programmatically before it reaches TTS — the
 * "double seal" the spec calls for. If anything is found, the generator rejects
 * the cue and regenerates.
 *
 * This applies ONLY to generated cues. Static corpus cues are authored/trusted
 * and are not run through this guard.
 */

/**
 * Internal architectural / clinical-theory terms that must never be spoken.
 * Derived from the YAML `Output_Vocabulary_Rule.NEVER_SPEAK`. Matched as whole
 * words / stems, case-insensitively.
 */
const INTERNAL_VOCABULARY: readonly RegExp[] = [
  /\bapparatus\b/i,
  /\bengine\b/i,
  /\bpilot\b/i,
  /\boperator\b/i,
  /\blife\s?force\b/i,
  /\bsoul\b/i,
  /\bsoftware\b/i,
  /\bcognit\w*/i, // cognitive, cognition
  /\bnervous system\b/i,
  /\bdefen[cs]e\b/i,
  /\bstructur\w*/i, // structure, structural (as jargon)
];

/**
 * Generic motivation phrases (YAML `Forbidden_Phrases`) AND universal slogans /
 * outcome-claims the Reframe_Rule bans. Matched as substrings, case-insensitively.
 */
const GENERIC_MOTIVATION: readonly string[] = [
  'you can do it',
  'believe in yourself',
  'almost there',
  'good job',
  "you've got this",
  'push through',
  'no pain no gain',
  'dig deep',
  // Slogan / belief / outcome-claim patterns (Reframe_Rule).
  'power goes',
  'speed is not',
  'believe',
  'you got this',
];

/** Lowercased word tokens (letters, digits, apostrophes) from arbitrary text. */
function words(text: string): string[] {
  const m = text.toLowerCase().match(/[a-z0-9']+/g);
  return m ?? [];
}

/**
 * The set of profile "shingles" (3 consecutive content words) that must never be
 * spoken verbatim, plus the identifying label phrase "fault line(s)". Strips the
 * CORE / STRONG / ABSENT / FAULT LINES labels so only the operator's descriptive
 * content is protected. Kept to 3-grams to catch actual quoting while avoiding
 * single-word false positives (a profile that mentions "breath" must not block a
 * legitimate "drop your breath low" cue).
 */
function profileShingles(profile: string): string[] {
  const out: string[] = [];
  for (const rawLine of profile.split(/\r?\n/)) {
    const line = rawLine.replace(/^\s*(core|strong|absent|fault\s+lines?)\s*:?\s*/i, '');
    const w = words(line);
    for (let i = 0; i + 3 <= w.length; i++) {
      out.push(w.slice(i, i + 3).join(' '));
    }
  }
  return out;
}

export interface VocabularyOptions {
  /** Operator profile text whose content must never be spoken verbatim. */
  profile?: string;
}

/**
 * Returns the list of forbidden terms/phrases found in `text` (lower-cased).
 * An empty array means the text is clean and safe to speak. When `opts.profile`
 * is supplied, any verbatim 3-word run from the profile (or the "fault line"
 * label) also counts as a leak.
 */
export function findForbiddenVocabulary(text: string, opts: VocabularyOptions = {}): string[] {
  const found: string[] = [];
  for (const pattern of INTERNAL_VOCABULARY) {
    const m = pattern.exec(text);
    if (m) found.push(m[0].toLowerCase());
  }
  const lower = text.toLowerCase();
  for (const phrase of GENERIC_MOTIVATION) {
    if (lower.includes(phrase)) found.push(phrase);
  }

  const profile = (opts.profile ?? '').trim();
  if (profile) {
    if (/\bfault\s+lines?\b/i.test(text)) found.push('fault line');
    const haystack = ' ' + words(text).join(' ') + ' ';
    for (const shingle of profileShingles(profile)) {
      if (haystack.includes(' ' + shingle + ' ')) found.push(`profile: ${shingle}`);
    }
  }
  return found;
}

/** True when `text` contains no forbidden internal vocabulary, slogan, or profile leak. */
export function isSpeakable(text: string, opts: VocabularyOptions = {}): boolean {
  return findForbiddenVocabulary(text, opts).length === 0;
}
