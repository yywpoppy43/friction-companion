/**
 * The Return — phone client.
 *
 * Executes the server's computed schedule on the true clock:
 *   - a requestAnimationFrame loop dispatches each cue moment at its real time;
 *   - the PlaybackQueue serializes playback so no cue overlaps and the min gap
 *     is honoured;
 *   - each cue is fetched LIVE from the server (/api/cue) and spoken with the
 *     server's cloud TTS (/api/tts) through Web Audio — no baked cue batch, no
 *     browser SpeechSynthesis;
 *   - at the wall, the wedge cue fires with a shake + haptic: the felt event.
 *
 * All timing and all secrets live on the server; this file only plays what it is
 * told, when it is told.
 */

import { PlaybackQueue } from './playback-queue.js';

const STAGE = {
  BASELINE: { label: 'Baseline', mech: 'arrive · find the ground', color: '#7d97ac' },
  INTENTION: { label: 'Intention', mech: 'form over outcome', color: '#d39a2e' },
  ENCOUNTER: { label: 'Encounter', mech: 'the shake · the hold', color: '#d8633a' },
  GROWTH: { label: 'Growth', mech: 'reach · then recover', color: '#8aa06a' },
};

const el = (id) => document.getElementById(id);
const app = el('app');
const screens = { intro: el('intro'), session: el('session'), outro: el('outro') };

let config = null;
let audio = null; // { ctx, master }
let queue = null;
let startedAt = 0;
let dispatched = 0;
let rafId = 0;
let finished = false;
const recent = []; // recently spoken lines, fed back as the avoid-list

// Lightweight telemetry (also used by the end-to-end test to verify no overlap).
const telemetry = (window.__RETURN__ = { plays: [], log: [] });

// ── setup ─────────────────────────────────────────────────────────────────────

async function boot() {
  try {
    config = await fetch('/api/config' + location.search).then((r) => r.json());
  } catch {
    el('intro-sub').textContent = 'Could not reach the session server.';
    return;
  }
  const mins = Math.max(1, Math.round(config.arc.lengthMs / 60_000));
  el('intro-sub').textContent = `A ${mins}-minute session. One grounded voice, at the moments that matter.`;

  const notes = [];
  if (config.mode === 'offline') notes.push('offline demo — set ANTHROPIC_API_KEY for live-generated cues');
  if (config.ttsProvider === 'tone') notes.push('voice stand-in — set OPENAI_API_KEY or GOOGLE_TTS_API_KEY for the real voice');
  if (notes.length) {
    const m = el('modes');
    m.hidden = false;
    m.textContent = notes.join('  ·  ');
  }
  buildBeats();
}

function show(name) {
  for (const [key, node] of Object.entries(screens)) node.classList.toggle('is-active', key === name);
}

function setStage(state) {
  const s = STAGE[state] ?? STAGE.BASELINE;
  document.documentElement.style.setProperty('--stage', s.color);
  el('stage-label').textContent = s.label;
  el('stage-mech').textContent = s.mech;
}

// ── the ring + beats ──────────────────────────────────────────────────────────

const R = 108;
const C = 2 * Math.PI * R;

function initRing() {
  const fill = el('ring-fill');
  fill.setAttribute('transform', 'rotate(-90 120 120)'); // start the stroke at 12 o'clock
  fill.style.strokeDasharray = String(C);
  fill.style.strokeDashoffset = String(C);
  // Place the wall marker at its true angle around the ring.
  const p = config.arc.wallAt;
  const theta = (p * 360 - 90) * (Math.PI / 180);
  const mark = el('wall-mark');
  mark.setAttribute('cx', String(120 + R * Math.cos(theta)));
  mark.setAttribute('cy', String(120 + R * Math.sin(theta)));
}

function buildBeats() {
  const beats = el('beats');
  beats.innerHTML = '';
  for (const m of config.schedule) {
    const b = document.createElement('span');
    b.className = 'beat' + (m.kind === 'wedge' ? ' wall' : '');
    b.dataset.index = String(m.index);
    beats.appendChild(b);
  }
}

function markBeat(index, cls) {
  const b = el('beats').querySelector(`.beat[data-index="${index}"]`);
  if (!b) return;
  el('beats').querySelectorAll('.beat.now').forEach((n) => n.classList.remove('now'));
  b.classList.add(cls);
}

function updateHud(t) {
  const p = Math.max(0, Math.min(1, t / config.arc.lengthMs));
  el('ring-fill').style.strokeDashoffset = String(C * (1 - p));
  el('clock').textContent = fmt(t) + ' / ' + fmt(config.arc.lengthMs);

  // Countdown to the wall, and a pulse on the marker as it nears.
  const wallMs = config.arc.wallAt * config.arc.lengthMs;
  const toWall = wallMs - t;
  const wc = el('wall-count');
  const mark = el('wall-mark');
  if (toWall > 0 && toWall < 45_000) {
    wc.textContent = 'the wall · ' + Math.ceil(toWall / 1000) + 's';
    mark.classList.add('near');
  } else if (toWall <= 0 && toWall > -8000) {
    wc.textContent = 'the wall';
    mark.classList.add('near');
  } else {
    wc.textContent = '';
    mark.classList.remove('near');
  }
}

function fmt(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

// ── run ───────────────────────────────────────────────────────────────────────

async function start() {
  // Unlock audio on this user gesture (required on phones).
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  try {
    await ctx.resume();
  } catch {
    /* resume may reject on some browsers; the silent ping below still unlocks */
  }
  const silent = ctx.createBufferSource();
  silent.buffer = ctx.createBuffer(1, 1, 22050);
  silent.connect(ctx.destination);
  silent.start(0);
  const master = ctx.createGain();
  master.gain.value = 1;
  master.connect(ctx.destination);
  audio = { ctx, master };

  finished = false;
  dispatched = 0;
  recent.length = 0;
  startedAt = performance.now();
  queue = new PlaybackQueue({
    now: () => performance.now() - startedAt,
    minGapMs: config.arc.minGapMs,
    produce,
    play,
    onEvent,
  });

  setStage(config.schedule[0]?.state ?? 'BASELINE');
  initRing();
  el('cue-text').textContent = '';
  show('session');
  loop();
}

function loop() {
  const t = performance.now() - startedAt;
  while (dispatched < config.schedule.length && config.schedule[dispatched].atMs <= t) {
    queue.enqueue(config.schedule[dispatched]);
    dispatched += 1;
  }
  queue.pump();
  updateHud(t);
  if (!finished && t >= config.arc.lengthMs && queue.idle) return finish();
  rafId = requestAnimationFrame(loop);
}

/** Fetch one live cue and its audio for a moment (prefetched by the queue). */
async function produce(moment) {
  const round = moment.index + 1;
  let cue;
  try {
    const res = await fetch('/api/cue', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        state: moment.state,
        intensity: moment.intensity,
        round,
        avoidTranscripts: recent.slice(-6),
      }),
    });
    cue = (await res.json()).cue;
  } catch {
    cue = { cueId: 'client-fallback', state: moment.state, text: '', tone: '' };
  }
  if (cue.text) recent.push(cue.text);

  const buffer = await synthesize(cue.text);
  return { buffer, cue, moment };
}

/** Ask the server to speak `text`; decode to an AudioBuffer. Never rejects — on
 *  any failure it returns a short silent buffer so the beat still shows its line. */
async function synthesize(text) {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const bytes = await res.arrayBuffer();
    return await audio.ctx.decodeAudioData(bytes);
  } catch {
    const words = (text || '').split(/\s+/).filter(Boolean).length || 3;
    const secs = Math.min(8, Math.max(1.5, words * 0.38));
    return audio.ctx.createBuffer(1, Math.floor(audio.ctx.sampleRate * secs), audio.ctx.sampleRate);
  }
}

/** Play a decoded cue; resolves when the audio ends (with a safety timeout). */
function play(playable) {
  return new Promise((resolve) => {
    let done = false;
    const finishOne = () => {
      if (done) return;
      done = true;
      resolve();
    };
    let src;
    try {
      src = audio.ctx.createBufferSource();
      src.buffer = playable.buffer;
      src.connect(audio.master);
      src.onended = finishOne;
      src.start();
    } catch {
      finishOne();
      return;
    }
    setTimeout(finishOne, Math.ceil(playable.buffer.duration * 1000) + 1500);
  });
}

function onEvent(e) {
  const at = performance.now() - startedAt;
  telemetry.log.push({ type: e.type, index: e.moment.index, kind: e.moment.kind, state: e.moment.state, at });
  if (e.type === 'play-end') {
    const rec = telemetry.plays.find((p) => p.index === e.moment.index && p.end === -1);
    if (rec) rec.end = at;
    return;
  }
  if (e.type !== 'play-start') return;
  const { moment, playable } = e;
  telemetry.plays.push({ index: moment.index, kind: moment.kind, state: moment.state, start: at, end: -1, text: playable.cue.text });
  setStage(moment.state);
  showCue(playable.cue.text);
  markBeat(moment.index, 'now');
  if (moment.kind === 'wedge') feltEvent();
}

function showCue(text) {
  const node = el('cue-text');
  node.classList.remove('show');
  // reflow to restart the animation
  void node.offsetWidth;
  node.textContent = text || '';
  node.classList.add('show');
}

/** The wall: a shake + a vermilion flare + a haptic. Hold through it. */
function feltEvent() {
  const flash = el('flash');
  flash.classList.remove('fire');
  void flash.offsetWidth;
  flash.classList.add('fire');
  app.classList.remove('shake');
  void app.offsetWidth;
  app.classList.add('shake');
  if (navigator.vibrate) navigator.vibrate([0, 90, 60, 90, 60, 220]);
  setTimeout(() => app.classList.remove('shake'), 900);
}

function finish() {
  finished = true;
  cancelAnimationFrame(rafId);
  stopAudio();
  show('outro');
}

function stopAudio() {
  if (audio) {
    try {
      audio.ctx.close();
    } catch {
      /* ignore */
    }
    audio = null;
  }
}

function end() {
  finished = true;
  cancelAnimationFrame(rafId);
  stopAudio();
  show('intro');
}

// ── wire up ───────────────────────────────────────────────────────────────────

el('begin').addEventListener('click', start);
el('again').addEventListener('click', start);
el('end').addEventListener('click', end);
boot();
