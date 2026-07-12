/**
 * PlaybackQueue — the "no cue ever cuts off the one before it" guarantee.
 *
 * The real-timing fix is only half timing; the other half is playback. With real
 * cloud-TTS audio each cue has a real duration, and two cue moments can fall close
 * together (the Encounter cluster at the wall). This queue serializes playback so
 * that:
 *
 *   - cues play in schedule order (never reordered by which audio loaded first);
 *   - only ONE cue is ever audible at a time (no overlap);
 *   - consecutive cues are separated by at least `minGapMs` of silence;
 *   - audio is PREFETCHED on enqueue, so a cue is ready to play the instant its
 *     turn and the gap allow — the wall cue lands on the wall, not late.
 *
 * It owns no timers: it is driven by `pump()`, which the caller invokes on a clock
 * tick (requestAnimationFrame in the browser) and the queue also calls whenever a
 * produce/play settles. That makes it fully deterministic and unit-testable under
 * a virtual clock — the same file the browser loads is exercised in Node tests.
 *
 * Injected dependencies (no DOM here):
 *   now()                  → current session-relative time in ms
 *   minGapMs               → minimum silence between the END of one cue and the
 *                            START of the next
 *   produce(moment)        → Promise<playable>  (fetch the cue + its audio)
 *   play(playable, moment) → Promise<void>      (resolves when the audio ENDS)
 *   onEvent(evt)           → optional observability hook
 */

export class PlaybackQueue {
  constructor({ now, minGapMs, produce, play, onEvent }) {
    this._now = now;
    this._minGapMs = minGapMs;
    this._produce = produce;
    this._play = play;
    this._onEvent = onEvent || (() => {});
    this._items = [];
    this._playIndex = 0;
    this._playing = false;
    this._lastEndAt = -Infinity;
  }

  /** Register a moment and immediately begin prefetching its cue + audio. */
  enqueue(moment) {
    const item = { moment, status: 'producing', playable: null, error: null };
    this._items.push(item);
    this._emit({ type: 'produce-start', moment });
    // Start the fetch NOW (prefetch), converting a sync or async throw into the
    // failure path so a bad producer can never stall the queue.
    let producing;
    try {
      producing = Promise.resolve(this._produce(moment));
    } catch (error) {
      producing = Promise.reject(error);
    }
    producing
      .then(
        (playable) => {
          item.playable = playable;
          item.status = 'ready';
          this._emit({ type: 'produce-done', moment });
        },
        (error) => {
          item.status = 'failed';
          item.error = error;
          this._emit({ type: 'produce-failed', moment, error });
        },
      )
      .finally(() => this.pump());
    this.pump();
  }

  /**
   * Advance the queue: play the next cue if it is its turn, resolved, and the
   * minimum gap has elapsed. Idempotent and cheap — safe to call every frame.
   */
  pump() {
    if (this._playing) return;
    const item = this._items[this._playIndex];
    if (!item) return; // nothing enqueued yet, or all drained
    if (item.status === 'producing') return; // hold order: wait for the prefetch

    const gateAt = this._lastEndAt + this._minGapMs;
    const t = this._now();
    if (t < gateAt) return; // enforce the minimum gap — try again on the next tick

    if (item.status === 'failed') {
      // Could not produce this cue's audio; skip it without stalling the queue.
      item.status = 'done';
      this._playIndex += 1;
      this._lastEndAt = this._now();
      this._emit({ type: 'skip', moment: item.moment, error: item.error });
      this.pump();
      return;
    }

    // Ready — play it. Exactly one play is in flight at a time (no overlap).
    item.status = 'playing';
    this._playing = true;
    this._emit({ type: 'play-start', moment: item.moment, playable: item.playable });
    let playing;
    try {
      playing = Promise.resolve(this._play(item.playable, item.moment));
    } catch (error) {
      playing = Promise.reject(error);
    }
    playing
      .catch(() => {})
      .finally(() => {
        item.status = 'done';
        this._playing = false;
        this._playIndex += 1;
        this._lastEndAt = this._now();
        this._emit({ type: 'play-end', moment: item.moment });
        this.pump();
      });
  }

  /** True when every enqueued cue has finished (nothing pending or playing). */
  get idle() {
    return !this._playing && this._playIndex >= this._items.length;
  }

  /** How many cues are still waiting to play (produced or not). */
  get pending() {
    return Math.max(0, this._items.length - this._playIndex);
  }

  _emit(evt) {
    try {
      this._onEvent(evt);
    } catch {
      /* observer errors never break playback */
    }
  }
}
