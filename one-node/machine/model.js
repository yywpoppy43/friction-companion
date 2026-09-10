/* one node — the machine. The model.
 *
 * Pure state, no DOM, no drawing. Fixed timestep and a seeded generator, so
 * the same seed plus the same tick count is always the same state — which is
 * what makes pause, step, hold-at and scrub exact rather than approximate.
 *
 * Grounded behaviours, each citing content-source.md:
 *   four parts generate and never slow    mechanism.pressure-differential [firm]
 *   load moves only between wired parts   the six wire ids; split
 *   two islands, nothing crosses          split
 *   nothing completes a route out         region.throat
 *   pressure leaves and leaves nothing    mechanism.discharge-without-residue [firm]
 *   the mind's rate follows the pressure  split, her answer of September 10 2026 [hers]
 *
 * Everything numeric is in params.js and is illustrative.
 */

var MODEL = (function () {
  'use strict';

  var DT = 1 / 30;                    /* fixed model step, seconds */

  /* mulberry32 — small, seedable, and its whole state is one integer, which is
     what lets a snapshot restore the exact future. */
  function makeRng(seed) {
    var s = seed >>> 0;
    function next() {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), 1 | t);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    return {
      next: next,
      range: function (a, b) { return a + (b - a) * next(); },
      get: function () { return s; },
      set: function (v) { s = v >>> 0; },
    };
  }

  function create(structure, params) {
    var R = structure.regions;                 /* [{id, island, wires:[i]}] */
    var idx = {};
    R.forEach(function (r, i) { idx[r.id] = i; });

    var GEN_OF = {
      'region.engine': 'genEngine',
      'region.pressure': 'genPressure',
      'region.head': 'genHead',
      'region.will': 'genWill',
    };
    var p = function (k) { return params[k].value; };

    var rng, t, parts, acc, ventMul, ventFor, ventCarry, snaps, hi, lastP, relief, ticks;

    function reset(seed) {
      rng = makeRng(seed === undefined ? 20260910 : seed);
      t = 0; ticks = 0;
      parts = [];
      acc = {};
      R.forEach(function (r) { acc[r.id] = 0; });
      ventMul = 1; ventFor = 0; ventCarry = 0;
      snaps = []; hi = -1; lastP = 0;
      relief = null;
    }

    function newDwell() { return rng.range(p('dwellMin'), p('dwellMax')); }
    function newRate()  { return 1 / rng.range(p('transitMin'), p('transitMax')); }

    function spawn(i) {
      parts.push({
        a: i, b: -1, prog: 0,
        dwell: newDwell(), rate: newRate(),
        ang: rng.range(0, Math.PI * 2), rr: rng.range(0.45, 1),
        born: t,
      });
    }

    function pressure() {
      return Math.min(1, parts.length / p('capacityTotal'));
    }

    /* Her answer, September 10 2026: the mind's circling is coupled to whether
       anything is getting out. The islands still exchange no load. */
    function mindSpeed(pr) { return p('mindBase') + p('mindGain') * pr; }

    function tick() {
      var pr = pressure();
      var mind = mindSpeed(pr);
      t += DT; ticks++;

      /* generation — constant, and indifferent to whether anything can leave */
      for (var k in GEN_OF) {
        var i = idx[k];
        if (i === undefined) continue;
        acc[k] += p(GEN_OF[k]) * DT;
        while (acc[k] >= 1) { acc[k] -= 1; spawn(i); }
      }

      /* the vent — it gets out, it leaves nothing behind.
         The count that leaves is deterministic and which ones leave is not:
         a per-particle coin toss adds enough variance to slam the gauge into
         its ceiling, which is the one reading this vent exists to prevent. */
      if (ventFor > 0) { ventFor -= DT; if (ventFor <= 0) { ventFor = 0; ventMul = 1; } }
      ventCarry += p('ventRate') * ventMul * parts.length * DT;
      while (ventCarry >= 1 && parts.length) {
        parts.splice((rng.next() * parts.length) | 0, 1);
        ventCarry -= 1;
      }

      /* circulation, between wired parts only */
      for (var n = 0; n < parts.length; n++) {
        var q = parts[n];
        var sp = R[q.a].island === 'A' ? mind : 1;
        if (q.b === -1) {
          q.dwell -= DT * sp;
          if (q.dwell <= 0) {
            var w = R[q.a].wires;
            if (!w.length) { q.dwell = newDwell(); continue; }   /* nowhere to go */
            q.b = w[(rng.next() * w.length) | 0];
            q.prog = 0; q.rate = newRate();
          }
        } else {
          q.prog += q.rate * DT * sp;
          if (q.prog >= 1) {
            q.a = q.b; q.b = -1; q.prog = 0;
            q.dwell = newDwell(); q.ang = rng.range(0, Math.PI * 2); q.rr = rng.range(0.45, 1);
          }
        }
      }

      /* relief: how long was it held before it fell, and by how much.
         Hers: the longer the isolation before the exit, the stronger the relief. */
      var np = pressure();
      if (np > 0.45 && hi < 0) hi = t;
      if (np < 0.30) hi = -1;
      if (np < lastP - 0.06) {
        relief = { at: t, from: lastP, to: np, isolatedFor: hi > 0 ? t - hi : 0 };
      }
      lastP = Math.max(lastP * 0.9993, np);     /* a slow high-water mark, ~2%/s */
      return np;
    }

    /* ---------------------------------------------------------- snapshots */
    function capture() {
      var a = new Float32Array(parts.length * 7);
      for (var i = 0; i < parts.length; i++) {
        var q = parts[i], o = i * 7;
        a[o] = q.a; a[o + 1] = q.b; a[o + 2] = q.prog; a[o + 3] = q.dwell;
        a[o + 4] = q.rate; a[o + 5] = q.ang; a[o + 6] = q.rr;
      }
      var ac = {}; for (var k in acc) ac[k] = acc[k];
      return { t: t, ticks: ticks, rng: rng.get(), a: a, acc: ac, hi: hi, lastP: lastP, vc: ventCarry };
    }
    function restore(s) {
      t = s.t; ticks = s.ticks; rng.set(s.rng);
      acc = {}; for (var k in s.acc) acc[k] = s.acc[k];
      hi = s.hi; lastP = s.lastP; ventCarry = s.vc || 0; relief = null;
      parts = [];
      for (var i = 0; i < s.a.length; i += 7) {
        parts.push({ a: s.a[i], b: s.a[i + 1], prog: s.a[i + 2], dwell: s.a[i + 3],
                     rate: s.a[i + 4], ang: s.a[i + 5], rr: s.a[i + 6], born: 0 });
      }
    }

    var SNAP_EVERY = 2;                 /* model seconds */
    var SNAP_KEEP  = 95;                /* ~190s of history */
    function maybeSnap() {
      if (snaps.length && t - snaps[snaps.length - 1].t < SNAP_EVERY) return;
      snaps.push(capture());
      if (snaps.length > SNAP_KEEP) snaps.shift();
    }

    /* Scrub: restore the newest snapshot at or before the target, then replay
       forward. Deterministic, so the state shown is the state that was. */
    function seek(target) {
      if (!snaps.length) return;
      var s = snaps[0];
      for (var i = snaps.length - 1; i >= 0; i--) { if (snaps[i].t <= target) { s = snaps[i]; break; } }
      restore(s);
      var guard = 0;
      while (t < target && guard++ < 20000) tick();
      while (snaps.length && snaps[snaps.length - 1].t > t) snaps.pop();
    }

    function loads() {
      var out = {};
      R.forEach(function (r) { out[r.id] = 0; });
      for (var i = 0; i < parts.length; i++) {
        var q = parts[i];
        if (q.b === -1) out[R[q.a].id]++;
      }
      return out;
    }

    reset();
    return {
      DT: DT,
      tick: function () { var v = tick(); maybeSnap(); return v; },
      tickQuiet: tick,
      reset: reset,
      seek: seek,
      seekable: function () { return snaps.length ? { from: snaps[0].t, to: t } : { from: 0, to: t }; },
      loads: loads,
      parts: function () { return parts; },
      pressure: pressure,
      mindSpeed: function () { return mindSpeed(pressure()); },
      time: function () { return t; },
      relief: function () { return relief; },
      clearRelief: function () { relief = null; },
      ventHard: function (secs, mul) { ventMul = mul || 20; ventFor = secs || 3; },
      venting: function () { return ventFor > 0; },
      regions: R, index: idx,
    };
  }

  return { create: create, DT: DT };
})();

if (typeof module !== 'undefined') module.exports = MODEL;
