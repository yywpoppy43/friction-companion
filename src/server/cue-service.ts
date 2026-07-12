/**
 * CueService — the server's cue producer for the phone app.
 *
 * It is deliberately thin: it draws cues from the EXISTING engine (the live
 * {@link SessionCueGenerator}, itself the existing {@link AnthropicCueGenerator})
 * and the EXISTING Cue Bank, and it keeps the EXISTING human filter on every line
 * that leaves the server. It does not invent cues or a state machine — it is
 * plumbing.
 *
 * Two guarantees matter here:
 *
 *   1. LIVE-PER-SESSION. When a model key is configured, every cue is generated
 *      fresh (grounded in the Cue Bank, steered away from what was already said),
 *      so a session never replays a baked batch. With no key, it degrades to
 *      rotating real lines from the Cue Bank so the app still runs end-to-end
 *      (clearly flagged `mode: 'offline'`).
 *
 *   2. NOTHING INTERNAL EVER CROSSES THE WIRE. The response is projected to a
 *      {@link SpokenCue} — the human-filtered spoken line and its tone, nothing
 *      else. The Cue's internal fields (PhysicalLever / EnergeticVector /
 *      StructuralYield) carry framework vocabulary and never leave the server.
 *      Every outgoing transcript is re-checked with {@link findForbiddenVocabulary}
 *      as a final seal; anything that trips it falls back to the guaranteed-clean
 *      safe-default for the state — live-generated "or not".
 */

import type { Cue } from '../domain/cue.ts';
import type { FrictionState } from '../domain/friction-state.ts';
import type { FrictionCondition } from '../domain/friction-condition.ts';
import type { CueBank } from '../cue-bank/cue-bank.ts';
import type { CueGenerator } from '../ports/cue-generator.ts';
import { safeDefaultCue } from '../cue-bank/safe-defaults.ts';
import { findForbiddenVocabulary } from '../generative/output-vocabulary.ts';

/** The only shape of a cue that ever reaches the client: the spoken line + tone. */
export interface SpokenCue {
  cueId: string;
  state: FrictionState;
  /** The exact line to speak — human-filtered, plain somatic language only. */
  text: string;
  /** Delivery-tone hint, passed to TTS. */
  tone: string;
}

/** Where the cue came from, and whether the session is running live or offline. */
export interface CueOutcome {
  cue: SpokenCue;
  origin: 'generated' | 'database' | 'fallback';
  mode: 'live' | 'offline';
  /** Generation status when a model was asked (for observability/tuning). */
  status?: 'ok' | 'rejected' | 'error';
  attempts?: number;
  /** Detail when generation failed or a line had to be sealed to a safe default. */
  reason?: string;
}

export interface CueQuery {
  state: FrictionState;
  /** Intensity in [0,1] at this moment (shades the generated cue). */
  intensity: number;
  round: number;
  frictionCondition?: FrictionCondition;
  /** Recent spoken lines to vary away from (keeps a live session fresh). */
  avoidTranscripts?: readonly string[];
}

function toSpoken(cue: Cue): SpokenCue {
  return { cueId: cue.CueID, state: cue.PrimaryState, text: cue.AudioTranscript, tone: cue.DeliveryTone };
}

export class CueService {
  private readonly bank: CueBank;
  private readonly generator: CueGenerator | undefined;

  constructor(bank: CueBank, generator?: CueGenerator) {
    this.bank = bank;
    this.generator = generator;
  }

  /** True when a model key is configured and cues are generated live per session. */
  get isLive(): boolean {
    return this.generator !== undefined;
  }

  /** Produce one cue for the moment. Never throws; never returns a leaky line. */
  async produce(query: CueQuery, signal?: AbortSignal): Promise<CueOutcome> {
    if (this.generator) {
      const outcome = await this.generator.generate(
        {
          state: query.state,
          source: 'INIT',
          intensity: query.intensity,
          round: query.round,
          frictionCondition: query.frictionCondition,
          avoidTranscripts: query.avoidTranscripts,
        },
        signal,
      );
      if (outcome.cue) {
        return this.sealed(outcome.cue, {
          origin: 'generated',
          mode: 'live',
          status: outcome.status,
          attempts: outcome.attempts,
        });
      }
      // Generation could not produce a clean cue — never go silent at a moment.
      return this.sealed(safeDefaultCue(query.state), {
        origin: 'fallback',
        mode: 'live',
        status: outcome.status,
        attempts: outcome.attempts,
        reason: outcome.reason,
      });
    }

    // Offline (no key): draw a real line from the Cue Bank, rotating to avoid repeats.
    const picked = this.pickOffline(query.state, query.round, query.avoidTranscripts);
    if (picked) return this.sealed(picked, { origin: 'database', mode: 'offline' });
    return this.sealed(safeDefaultCue(query.state), { origin: 'fallback', mode: 'offline' });
  }

  /**
   * Final seal: project to a {@link SpokenCue} and verify the transcript is clean.
   * If a line ever trips the human filter, substitute the guaranteed-clean safe
   * default so a forbidden word can never cross the wire.
   */
  private sealed(cue: Cue, meta: Omit<CueOutcome, 'cue'>): CueOutcome {
    if (findForbiddenVocabulary(cue.AudioTranscript).length === 0) {
      return { cue: toSpoken(cue), ...meta };
    }
    const safe = safeDefaultCue(cue.PrimaryState);
    return {
      cue: toSpoken(safe),
      ...meta,
      origin: 'fallback',
      reason: (meta.reason ? meta.reason + '; ' : '') + 'transcript failed spoken-vocabulary seal',
    };
  }

  /** Rotate through the Cue Bank for a state, skipping recently-spoken lines. */
  private pickOffline(
    state: FrictionState,
    round: number,
    avoid: readonly string[] | undefined,
  ): Cue | undefined {
    const pool = this.bank.cuesForState(state);
    if (pool.length === 0) return undefined;
    const avoidSet = new Set(avoid ?? []);
    const start = ((round - 1) % pool.length + pool.length) % pool.length;
    for (let i = 0; i < pool.length; i++) {
      const cue = pool[(start + i) % pool.length]!;
      if (!avoidSet.has(cue.AudioTranscript)) return cue;
    }
    return pool[start];
  }
}
