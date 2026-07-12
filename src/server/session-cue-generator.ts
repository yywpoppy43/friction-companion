/**
 * Session-aware cue generator — the live-per-session generation used by the phone
 * app's server. It is the EXISTING {@link AnthropicCueGenerator} (same strict
 * system prompt, same forced-tool schema, same code-level human filter / "double
 * seal", same retry/back-off, same never-throw contract) with one addition: it
 * grounds each generation in the existing Cue Bank and steers away from lines
 * already spoken this session.
 *
 * This is the "live generation" fix, not a rewrite of it:
 *   - GROUNDING draws the existing corpus's lines for the state into the prompt so
 *     generated cues stay in the established voice — "draw cues from the existing
 *     engine and Cue Bank", now generated fresh instead of replayed from a batch.
 *   - AVOID-LIST feeds the recent transcripts back so the model varies wording —
 *     "generated fresh per session so cues stop repeating."
 *
 * Nothing about the human filter changes: {@link AnthropicCueGenerator.generate}
 * still re-checks every transcript with {@link findForbiddenVocabulary} and
 * regenerates on a leak. We only enrich the user message; the spoken-vocabulary
 * seal is untouched and still on the live path.
 */

import { AnthropicCueGenerator, type AnthropicCueGeneratorOptions } from '../generative/anthropic-cue-generator.ts';
import type { CueGenerationRequest } from '../ports/cue-generator.ts';
import type { CueBank } from '../cue-bank/cue-bank.ts';

/** How many existing corpus lines to show the model as voice grounding. */
const GROUNDING_LIMIT = 4;
/** How many recently-spoken lines to feed back as the avoid-list. */
const AVOID_LIMIT = 6;

export class SessionCueGenerator extends AnthropicCueGenerator {
  private readonly bank: CueBank;

  constructor(bank: CueBank, options: AnthropicCueGeneratorOptions = {}) {
    // Slightly warmer than the base default so cues vary across a session, still
    // low enough to stay on-matrix (and the double-seal catches any drift).
    super({ temperature: 0.6, ...options });
    this.bank = bank;
  }

  /**
   * Same request body as the base generator, with the user message enriched by
   * corpus grounding and a per-session avoid-list. `generate()` calls
   * `this.buildRequestBody` polymorphically, so this enrichment is on the live path
   * without any change to the generation loop or the human-filter seal.
   */
  override buildRequestBody(request: CueGenerationRequest): Record<string, unknown> {
    const body = super.buildRequestBody(request);
    const messages = body['messages'] as { role: string; content: string }[];
    const first = messages[0];
    if (!first) return body;

    const grounding = this.bank
      .cuesForState(request.state)
      .slice(0, GROUNDING_LIMIT)
      .map((c) => c.AudioTranscript);
    const avoid = (request.avoidTranscripts ?? []).slice(-AVOID_LIMIT);

    let extra = '';
    if (grounding.length > 0) {
      extra +=
        '\n\nEXISTING LINES FOR THIS STATE (match this plain, physical voice — do NOT copy them verbatim):\n' +
        grounding.map((g) => `- "${g}"`).join('\n');
    }
    if (avoid.length > 0) {
      extra +=
        '\n\nALREADY SPOKEN THIS SESSION (say something clearly different — fresh wording, a different angle):\n' +
        avoid.map((a) => `- "${a}"`).join('\n');
    }
    extra += '\n\nReturn exactly one fresh cue via the emit_cue tool.';

    first.content += extra;
    return body;
  }
}
