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
 * Phase 2 — three routes out, and what each one leaves behind:
 *   talk      vents, deposits nothing     mechanism.discharge-without-residue [firm]
 *   starting  relieves, adds an unfinished thing, and the count drives the
 *             pressure back up                                mechanism.the-loop [firm]
 *   deposit   an external route, opened by a date she committed to, leaving a
 *             dated residue               design.deposit-structure; mechanism.autonomy-resolved
 *
 * The deposit's path is not invented: missing-piece.now says the routes into
 * the outlet lead from exactly identity, engine and instinct. Will and pressure
 * reach those over their own wires. The mind has no route and does not drain.
 *
 * Everything numeric is in params.js and is illustrative.
 */

var MODEL = (function () {
  'use strict';

  var DT = 1 / 30;                    /* fixed model step, seconds */
  var OUT = -2;                       /* leaving, through the scaffolding */

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
    return { next: next, range: function (a, b) { return a + (b - a) * next(); },
             get: function () { return s; }, set: function (v) { s = v >>> 0; } };
  }

  function create(structure, params) {
    var R = structure.regions;
    var idx = {};
    R.forEach(function (r, i) { idx[r.id] = i; });

    var THROAT = idx['region.throat'];
    /* the three that can reach the outlet, per missing-piece.now */
    var TO_OUTLET = ['region.identity', 'region.engine', 'region.instinct']
      .map(function (k) { return idx[k]; });
    /* and how the other two body parts reach them, over their own wires */
    var FEEDS = {}; FEEDS[idx['region.will']] = idx['region.identity'];
                    FEEDS[idx['region.pressure']] = idx['region.instinct'];

    var GEN_OF = { 'region.engine': 'genEngine', 'region.pressure': 'genPressure',
                   'region.head': 'genHead', 'region.will': 'genWill' };
    var p = function (k) { return params[k].value; };

    var rng, t, parts, acc, ventMul, ventFor, ventCarry, snaps, hi, lastP, relief, ticks;
    var unfinished, routeOpen, routeUntil, depositAt, rhythm, runs, tally, run, lastAct;
    var wx, autoAt;

    function reset(seed) {
      rng = makeRng(seed === undefined ? 20260910 : seed);
      t = 0; ticks = 0;
      parts = []; acc = {};
      R.forEach(function (r) { acc[r.id] = 0; });
      ventMul = 1; ventFor = 0; ventCarry = 0;
      snaps = []; hi = -1; lastP = 0; relief = null;
      unfinished = 0;
      routeOpen = false; routeUntil = 0; depositAt = null; rhythm = true;
      runs = [];
      tally = { talks: 0, talkReleased: 0, starts: 0, startReleased: 0,
                deposits: 0, depositReleased: 0, opened: 0, openedReleased: 0 };
      run = null; lastAct = null;
      wx = { gen: 1, hold: 1, exit: 1, auto: false, autoEvery: 55 }; autoAt = null;
    }

    function newDwell() { return rng.range(p('dwellMin'), p('dwellMax')); }
    function newRate()  { return 1 / rng.range(p('transitMin'), p('transitMax')); }
    function isBody(i)  { return R[i].island === 'B'; }
    function isMind(i)  { return R[i].island === 'A'; }

    function spawn(i) {
      parts.push({ a: i, b: -1, prog: 0, dwell: newDwell(), rate: newRate(),
                   ang: rng.range(0, Math.PI * 2), rr: rng.range(0.45, 1) });
    }

    function pressure() { return Math.min(1, parts.length / p('capacityTotal')); }

    /* Her answer, September 10 2026: the mind's circling is coupled to whether
       anything is getting out. The islands still exchange no load. */
    function mindSpeed(pr) { return p('mindBase') + p('mindGain') * pr; }

    /* mechanism.the-loop: every unfinished thing is still live, and the count
       pushes the pressure back up. That is what makes the loop a loop. */
    function loopMultiplier() { return 1 + p('unfinishedGain') * unfinished; }

    /* Weather modulates; it does not rewrite. The parameters stay exactly as
       set in params.js and the month multiplies on top, so turning the month
       off returns the machine to itself. */
    function setWeather(w) {
      wx = { gen: 1, hold: 1, exit: 1, auto: false, autoEvery: 55 };
      if (w) for (var k in w) wx[k] = w[k];
      autoAt = wx.auto ? t + wx.autoEvery : null;
    }
    function holdSecs() { return p('holdSeconds') * wx.hold; }
    function exitSecs() { return p('exitSeconds') * wx.exit; }

    function loadOf(pred) {
      var n = 0;
      for (var i = 0; i < parts.length; i++) if (pred(parts[i])) n++;
      return n;
    }
    function mindLoad() { return loadOf(function (q) { return isMind(q.a); }); }

    /* remove n units at random from the particles matching pred */
    function release(n, pred) {
      var pool = [];
      for (var i = 0; i < parts.length; i++) if (pred(parts[i])) pool.push(i);
      n = Math.min(n, pool.length);
      for (var k = 0; k < n; k++) {
        var pick = (rng.next() * pool.length) | 0;
        parts[pool[pick]] = null;
        pool.splice(pick, 1);
      }
      if (n) parts = parts.filter(Boolean);
      return n;
    }

    /* ------------------------------------------------------------- routes */

    /* Talk. Real discharge — the pressure gets out — and it deposits nothing,
       so next time the same material has to be generated again from scratch. */
    function talk() {
      var n = release(Math.round(parts.length * p('talkBurst')), function () { return true; });
      tally.talks++; tally.talkReleased += n;
      lastAct = { kind: 'talk', at: t, released: n };
      return n;
    }

    /* Starting. Immediately satisfying, fully supported by the engine, and it
       adds an unfinished thing that never leaves. */
    function startThing() {
      var body = loadOf(function (q) { return isBody(q.a); });
      var n = release(Math.round(body * p('startRelief')), function (q) { return isBody(q.a); });
      unfinished++;
      tally.starts++; tally.startReleased += n;
      lastAct = { kind: 'start', at: t, released: n };
      return n;
    }

    /* The deposit. A date she set, that she cannot move and cannot bring
       forward. Committing is the only act; the date does the rest. */
    function commit() {
      if (depositAt !== null || routeOpen) return false;
      depositAt = t + p('depositInterval');
      return true;
    }
    function setRhythm(on) { rhythm = !!on; }
    function openRoute(via) {
      routeOpen = true;
      routeUntil = t + holdSecs() * (via === 'month' ? 2.2 : 1);
      /* a month opening the route does not consume the date she committed to;
         her deposit is still due when it is due */
      if (via !== 'month') depositAt = null;
      run = { n: runs.length + 1, at: t, from: pressure(), left: 0, via: via || 'deposit' };
    }
    function closeRoute() {
      routeOpen = false;
      var closedVia = run ? run.via : 'deposit';
      if (run) {
        run.to = pressure();
        run.mind = mindLoad();
        run.closedAt = t;
        runs.push(run);
        /* a month that opens on its own is drainage, but it is not a deposit
           and must not be counted as one */
        if (run.via === 'month') { tally.opened++; tally.openedReleased += run.left; }
        else { tally.deposits++; tally.depositReleased += run.left; }
        run = null;
      }
      if (wx.auto && autoAt === null) autoAt = t + wx.autoEvery;
      /* a month opening the route on its own is not her rhythm and must not
         start one — only a deposit she committed re-arms the next date */
      if (rhythm && closedVia === 'deposit') depositAt = t + p('depositInterval');
    }

    /* ---------------------------------------------------------------- tick */
    function tick() {
      var pr = pressure();
      var mind = mindSpeed(pr);
      var loop = loopMultiplier();
      t += DT; ticks++;

      if (depositAt !== null && !routeOpen && t >= depositAt) openRoute();
      /* the clash opens what the other months bind — no deposit, no date */
      if (autoAt !== null && !routeOpen && t >= autoAt) { openRoute('month'); autoAt = null; }
      if (routeOpen && t >= routeUntil) closeRoute();

      /* generation — constant, indifferent to whether anything can leave, and
         raised by everything already started and unfinished */
      for (var k in GEN_OF) {
        var gi = idx[k];
        if (gi === undefined) continue;
        acc[k] += p(GEN_OF[k]) * loop * wx.gen * DT;
        while (acc[k] >= 1) { acc[k] -= 1; spawn(gi); }
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

      /* circulation, and — while the route is open — the way out */
      for (var n = 0; n < parts.length; n++) {
        var q = parts[n];

        if (q.b === OUT) {                       /* leaving through the scaffolding */
          q.prog += q.rate * DT;
          if (q.prog >= 1) {
            parts.splice(n, 1); n--;
            if (run) run.left++;
          }
          continue;
        }

        var sp = isMind(q.a) ? mind : 1;
        if (q.b === -1) {
          q.dwell -= DT * sp;
          if (q.dwell > 0) continue;
          /* Load leaves progressively: a part only heads for the door when its
             own dwell is up. Nothing is yanked out the moment the route opens.
             The outlet is in neither island, so it is tested before the body. */
          if (routeOpen && q.a === THROAT) {
            q.b = OUT; q.prog = 0; q.rate = 1 / exitSecs(); continue;
          }
          if (routeOpen && isBody(q.a)) {
            if (TO_OUTLET.indexOf(q.a) >= 0) { q.b = THROAT; q.prog = 0; q.rate = newRate(); continue; }
            if (FEEDS[q.a] !== undefined) { q.b = FEEDS[q.a]; q.prog = 0; q.rate = newRate(); continue; }
          }
          if (q.a === THROAT) {
            /* the door shut with it standing there — back to the body */
            q.b = idx['region.identity']; q.prog = 0; q.rate = newRate(); continue;
          }
          var w = R[q.a].wires;
          if (!w.length) { q.dwell = newDwell(); continue; }
          q.b = w[(rng.next() * w.length) | 0];
          q.prog = 0; q.rate = newRate();
        } else {
          q.prog += q.rate * DT * sp;
          if (q.prog >= 1) {
            q.a = q.b; q.b = -1; q.prog = 0;
            q.dwell = newDwell();
            q.ang = rng.range(0, Math.PI * 2); q.rr = rng.range(0.45, 1);
            /* arrived at the outlet: out if the route is still open, back if not */
            if (q.a === THROAT) q.dwell = 0;
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
      return { t: t, ticks: ticks, rng: rng.get(), a: a, acc: ac, hi: hi, lastP: lastP,
               vc: ventCarry, unfinished: unfinished, routeOpen: routeOpen,
               routeUntil: routeUntil, depositAt: depositAt, rhythm: rhythm,
               runs: JSON.stringify(runs), tally: JSON.stringify(tally),
               run: run ? JSON.stringify(run) : null,
               lastAct: lastAct ? JSON.stringify(lastAct) : null,
               autoAt: autoAt };
    }
    function restore(s) {
      t = s.t; ticks = s.ticks; rng.set(s.rng);
      acc = {}; for (var k in s.acc) acc[k] = s.acc[k];
      hi = s.hi; lastP = s.lastP; ventCarry = s.vc || 0; relief = null;
      unfinished = s.unfinished; routeOpen = s.routeOpen; routeUntil = s.routeUntil;
      depositAt = s.depositAt; rhythm = s.rhythm;
      runs = JSON.parse(s.runs); tally = JSON.parse(s.tally);
      run = s.run ? JSON.parse(s.run) : null;
      lastAct = s.lastAct ? JSON.parse(s.lastAct) : null;
      autoAt = s.autoAt === undefined ? null : s.autoAt;
      parts = [];
      for (var i = 0; i < s.a.length; i += 7) {
        parts.push({ a: s.a[i], b: s.a[i + 1], prog: s.a[i + 2], dwell: s.a[i + 3],
                     rate: s.a[i + 4], ang: s.a[i + 5], rr: s.a[i + 6] });
      }
    }

    var SNAP_EVERY = 2, SNAP_KEEP = 95;
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
      DT: DT, OUT: OUT,
      tick: function () { var v = tick(); maybeSnap(); return v; },
      reset: reset, seek: seek,
      seekable: function () { return snaps.length ? { from: snaps[0].t, to: t } : { from: 0, to: t }; },
      loads: loads, parts: function () { return parts; },
      pressure: pressure, mindSpeed: function () { return mindSpeed(pressure()); },
      time: function () { return t; },
      relief: function () { return relief; }, clearRelief: function () { relief = null; },
      ventHard: function (secs, mul) { ventMul = mul || 20; ventFor = secs || 3; },
      venting: function () { return ventFor > 0; },
      /* phase 2 */
      talk: talk, startThing: startThing, commit: commit, setRhythm: setRhythm,
      unfinished: function () { return unfinished; },
      loopMultiplier: loopMultiplier,
      routeOpen: function () { return routeOpen; },
      routeLeft: function () { return Math.max(0, routeUntil - t); },
      depositAt: function () { return depositAt; },
      dueIn: function () { return depositAt === null ? null : Math.max(0, depositAt - t); },
      rhythm: function () { return rhythm; },
      runs: function () { return runs; },
      currentRun: function () { return run; },
      tally: function () { return tally; },
      lastAct: function () { return lastAct; },
      setWeather: setWeather,
      weather: function () { return wx; },
      autoIn: function () { return autoAt === null ? null : Math.max(0, autoAt - t); },
      mindLoad: mindLoad,
      regions: R, index: idx, throatIndex: THROAT, toOutlet: TO_OUTLET,
    };
  }

  return { create: create, DT: DT, OUT: -2 };
})();

if (typeof module !== 'undefined') module.exports = MODEL;
