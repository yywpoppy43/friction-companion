import { test } from 'node:test';
import assert from 'node:assert/strict';

import { PlaybackQueue } from '../../public/playback-queue.js';

/**
 * A deterministic virtual-time harness. Timers fire when `advance` crosses their
 * deadline; microtasks are flushed before and after each firing so the queue's
 * promise settlements and pumps run in order. This exercises the exact browser
 * file. `produce` can be overridden to simulate a failing fetch.
 */
function harness({ minGapMs, produceMs = 150, produce } = {}) {
  let now = 0;
  const timers = [];
  const at = (delay, fn) => timers.push({ at: now + delay, fn });
  const flush = async () => {
    for (let i = 0; i < 8; i++) await Promise.resolve();
  };

  const events = [];
  const plays = []; // { index, start, end }
  const defaultProduce = (moment) =>
    new Promise((resolve) => at(produceMs, () => resolve({ index: moment.index, durationMs: moment.durationMs })));

  const queue = new PlaybackQueue({
    now: () => now,
    minGapMs,
    produce: produce ? (m) => produce(m, at) : defaultProduce,
    play: (playable) => new Promise((resolve) => at(playable.durationMs, resolve)),
    onEvent: (e) => {
      events.push(`${e.type}:${e.moment.index}`);
      if (e.type === 'play-start') plays.push({ index: e.moment.index, start: now, end: -1 });
      if (e.type === 'play-end') {
        const rec = plays.find((p) => p.index === e.moment.index && p.end === -1);
        if (rec) rec.end = now;
      }
      if (e.type === 'skip') plays.push({ index: e.moment.index, start: now, end: now, skipped: true });
    },
  });

  // A faithful virtual scheduler that models the browser's rAF loop: step the
  // clock in small ticks, firing any due timers (re-sorted to catch timers added
  // mid-loop) and pumping every tick so min-gap-gated transitions resolve promptly.
  const advance = async (ms) => {
    const target = now + ms;
    await flush();
    while (now < target) {
      const next = Math.min(now + 50, target);
      for (;;) {
        timers.sort((a, b) => a.at - b.at);
        if (timers.length === 0 || timers[0].at > next) break;
        const t = timers.shift();
        now = t.at;
        t.fn();
        await flush();
        queue.pump();
        await flush();
      }
      now = next;
      queue.pump(); // rAF-like tick
      await flush();
    }
  };

  return { queue, advance, events, plays, now: () => now };
}

test('plays every cue exactly once, in order, with no overlap and the min gap', async () => {
  const minGapMs = 2000;
  const { queue, advance, plays } = harness({ minGapMs, produceMs: 100 });

  // Three moments; the middle two are scheduled close together (a wall cluster).
  const moments = [
    { index: 0, atMs: 0, durationMs: 3000 },
    { index: 1, atMs: 3500, durationMs: 4000 },
    { index: 2, atMs: 4000, durationMs: 3000 }, // only 500ms after #1 — must wait its turn
  ];

  // Dispatch each moment at its scheduled time, like the rAF loop does.
  let dispatched = 0;
  for (let clock = 0; clock <= 40000; clock += 250) {
    while (dispatched < moments.length && moments[dispatched].atMs <= clock) {
      queue.enqueue(moments[dispatched]);
      dispatched += 1;
    }
    await advance(250);
  }

  // All three played, in order.
  assert.deepEqual(
    plays.map((p) => p.index),
    [0, 1, 2],
  );
  // No two audio intervals overlap, and each starts at least minGap after the last end.
  for (let i = 1; i < plays.length; i++) {
    assert.ok(plays[i].start >= plays[i - 1].end, `#${i} does not overlap #${i - 1}`);
    assert.ok(
      plays[i].start >= plays[i - 1].end + minGapMs - 1,
      `#${i} starts >= min gap after #${i - 1}`,
    );
  }
  assert.ok(queue.idle);
});

test('a cue whose audio fails to produce is skipped without stalling the queue', async () => {
  const { queue, advance, events } = harness({
    minGapMs: 1000,
    produce: (moment, at) =>
      new Promise((resolve, reject) =>
        at(100, () => (moment.index === 1 ? reject(new Error('tts down')) : resolve({ durationMs: 2000 }))),
      ),
  });

  for (const index of [0, 1, 2]) queue.enqueue({ index, atMs: 0, durationMs: 2000 });
  await advance(30000);

  const playAndSkip = events.filter((e) => e.startsWith('play-start') || e.startsWith('skip'));
  assert.deepEqual(playAndSkip, ['play-start:0', 'skip:1', 'play-start:2']);
  assert.ok(queue.idle, 'queue drains even though one cue failed');
});
