/* one node — the machine. Controls, gauge, reading, inspection.
 *
 * Phase 1 of SPEC §14: the core running, the passive vent, the time controls,
 * Show assumptions, hover only. No deposit, no click panel, no split control,
 * no weather. The next-deposit slot appears on the timeline, empty, so the
 * mechanism is visible before it is live.
 */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  /* one set of text helpers, owned by the inspector */
  var esc = INSPECT.esc, plain = INSPECT.plain,
      inline = INSPECT.inline, firstSentence = INSPECT.firstSentence;
  var BY = {};
  NODE.parts.forEach(function (p) { BY[p.id] = p; });

  /* ------------------------------------------------------------- structure */
  var REG = NODE.parts.filter(function (p) { return p.kind === 'region'; });
  var WIR = NODE.parts.filter(function (p) { return p.kind === 'wire'; });
  var SEA = NODE.parts.filter(function (p) { return p.kind === 'sealed'; });
  var idx = {}; REG.forEach(function (r, i) { idx[r.id] = i; });

  var regions = REG.map(function (r) {
    return { id: r.id, name: r.name, state: r.state, island: r.island, wires: [] };
  });
  WIR.forEach(function (w) {
    regions[idx[w.a]].wires.push(idx[w.b]);
    regions[idx[w.b]].wires.push(idx[w.a]);
  });
  var structure = { regions: regions, wires: WIR, sealed: SEA };

  var model = MODEL.create(structure, PARAMS);
  var view  = VIEWER.build({ svg: $('stage'), canvas: $('dust'), structure: structure, data: NODE });

  /* ----------------------------------------------------------------- state */
  var running = true, speed = 1, held = null, holdAt = null, acc = 0;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var hist = [];                                   /* {t, p} every 0.5s */
  var HIST_BACK = 150, HIST_FWD = 30;
  var lastSample = -1;

  function pct(x) { return Math.round(x * 100); }
  function thr() { return PARAMS.thresholdPct.value / 100; }

  /* ----------------------------------------------------------------- gauge */
  function paintGauge(pr) {
    var hot = pr >= thr();
    $('pv').textContent = pct(pr) + '%';
    $('fill').style.right = (100 - pct(pr)) + '%';
    $('bar').classList.toggle('hot', hot);
    $('mindrate').textContent = model.mindSpeed().toFixed(2) + '×';
  }

  /* --------------------------------------------------------------- reading */
  /* Every line here is the source's or hers, and says which. */
  function paintReading(pr, loads) {
    var hot = pr >= thr();
    var main, tag = '', sub = '';

    var rel = model.relief();
    var runsList = model.runs(), lastRun = runsList[runsList.length - 1];
    var justClosed = lastRun && model.time() - lastRun.closedAt < 10;

    if (model.routeOpen()) {
      var cur = model.currentRun();
      main = 'The route is open. <em>' + (cur ? cur.left : 0) + '</em> units have left the body.';
      sub = 'It is not a wire. It was built, it is held open by a date she set, and it '
          + 'touches nothing in the mind.';
      $('read').innerHTML = main;
      $('readsub').innerHTML = sub;
      $('readsub').classList.add('on');
      $('ventnote').textContent = 'Closing in ' + model.routeLeft().toFixed(0) + 's.';
      return;
    }
    if (justClosed) {
      main = '<em>Run ' + lastRun.n + '.</em> Left the body: ' + lastRun.left
           + '. Still in the mind: ' + lastRun.mind
           + '. Pressure ' + pct(lastRun.from) + '% → ' + pct(lastRun.to) + '%.';
      sub = 'The circling stopped. Not slowed — <em>stopped</em>. The mind did not empty: '
          + 'no wire runs to it, and nothing crossed. What changed is the rate. '
          + '<span class="tag">[hers]</span>';
      $('read').innerHTML = main;
      $('readsub').innerHTML = sub;
      $('readsub').classList.add('on');
      $('ventnote').textContent = 'The exit did not widen. Nothing about the machine changed except how full it is.';
      return;
    }
    var act = model.lastAct();
    var justActed = act && model.time() - act.at < 8;
    if (justActed && act.kind === 'talk') {
      $('read').innerHTML = 'Talked it out. <em>' + act.released + '</em> units left, and the circling quieted with them.';
      $('readsub').innerHTML = 'Nothing was deposited. The same material will have to be generated again from scratch. '
        + '<span class="tag">[firm]</span>';
      $('readsub').classList.add('on');
      $('ventnote').textContent = 'Real discharge. No residue.';
      return;
    }
    if (justActed && act.kind === 'start') {
      $('read').innerHTML = 'Started something. <em>' + act.released + '</em> units left, immediately.';
      $('readsub').innerHTML = 'And it added an unfinished thing. There are <em>' + model.unfinished()
        + '</em> now, and the count is raising generation — relief comes from starting, frustration from accumulation. '
        + '<span class="tag">[firm]</span>';
      $('readsub').classList.add('on');
      $('ventnote').textContent = 'Generation is running at ' + model.loopMultiplier().toFixed(2) + '× because of them.';
      return;
    }
    if (rel && model.time() - rel.at < 7) {
      main = 'Pressure fell, and the circling quieted with it.';
      tag = 'hers';
      sub = 'The mind holds what it held — no wire runs to it. What changed is the rate.';
    } else if (pr < 0.25) {
      main = 'Running clear. Generation has started; nothing is near its limit.';
    } else if (pr < 0.5) {
      main = 'Filling. Nothing has completed a route out — there is no completed route to take.';
    } else if (!hot) {
      main = '<em>Building.</em> The parts hold what they generate and pass it on.';
    } else {
      main = '<em>Frustration.</em> Not tiredness, not sadness. Pressure with nowhere to go.';
      sub = 'Or it may not announce itself as pressure at all — it can read as depression, flatness, futility, as a fact about the situation rather than a hydraulic state.';
      tag = 'arguable';
    }
    $('read').innerHTML = main;
    $('readsub').innerHTML = sub ? sub + (tag ? ' <span class="tag">[' + tag + ']</span>' : '')
                                 : (tag ? '<span class="tag">[' + tag + ']</span>' : '');
    $('readsub').classList.toggle('on', !!(sub || tag));
    $('ventnote').textContent = model.venting()
      ? 'Venting hard — illustrative, not the mechanism.'
      : 'Some of it is getting out — talking, testing, working assets. It leaves nothing behind.';
  }

  /* ---------------------------------------------------------------- ledger */
  var drawnRuns = -1;
  function paintLedger() {
    var T = model.tally(), runsList = model.runs(), unf = model.unfinished();
    $('l-talk').textContent  = T.talks ? T.talks + '× · ' + T.talkReleased + ' out' : '—';
    $('l-start').textContent = T.starts ? T.starts + '× · ' + T.startReleased + ' out' : '—';
    $('l-dep').textContent   = T.deposits ? T.deposits + ' run' + (T.deposits > 1 ? 's' : '')
                                          + ' · ' + T.depositReleased + ' out' : '—';
    $('l-start-r').textContent = unf ? unf + ' unfinished, still open' : 'leaves an unfinished thing';
    $('lline').textContent = [
      'talk ' + T.talks + '×',
      'start ' + T.starts + '× · ' + unf + ' unfinished',
      'deposit ' + T.deposits + (T.deposits === 1 ? ' run' : ' runs'),
    ].join('   ·   ');
    if (runsList.length !== drawnRuns) {
      drawnRuns = runsList.length;
      $('lruns').innerHTML = runsList.slice(-6).reverse().map(function (r) {
        return '<div><b>Run ' + r.n + '</b> · ' + clock(r.at) + ' · body ' + r.left
             + ' · mind ' + r.mind + ' · ' + pct(r.from) + '%→' + pct(r.to) + '%</div>';
      }).join('');
    }
  }
  function clock(t) { return Math.floor(t / 60) + ':' + ('0' + Math.floor(t % 60)).slice(-2); }

  /* -------------------------------------------------------------- timeline */
  var tl = $('tl'), tlPath = $('tlline'), tlNow = $('tlnow'), tlThr = $('tlthr');
  var TLW = 1000, TLH = 60;

  function sample(pr) {
    var t = model.time();
    if (t - lastSample < 0.5 && lastSample >= 0) return;
    lastSample = t;
    hist.push({ t: t, p: pr });
    while (hist.length && hist[0].t < t - HIST_BACK - 5) hist.shift();
  }
  function paintTimeline(pr) {
    var t = model.time();
    var span = HIST_BACK + HIST_FWD, t0 = Math.max(0, t - HIST_BACK);
    var xOf = function (tt) { return (tt - t0) / span * TLW; };
    var yOf = function (p) { return TLH - p * TLH; };
    var d = '';
    for (var i = 0; i < hist.length; i++) {
      if (hist[i].t < t0) continue;
      d += (d ? 'L' : 'M') + xOf(hist[i].t).toFixed(1) + ' ' + yOf(hist[i].p).toFixed(1);
    }
    tlPath.setAttribute('d', d || 'M0 ' + TLH);
    tlNow.setAttribute('x1', xOf(t)); tlNow.setAttribute('x2', xOf(t));
    tlThr.setAttribute('y1', yOf(thr())); tlThr.setAttribute('y2', yOf(thr()));
    $('tlfuture').setAttribute('x', xOf(t));
    $('tlfuture').setAttribute('width', Math.max(0, TLW - xOf(t)));
    $('tlclock').textContent = clock(t);

    /* the committed date sits ahead of now, where it cannot be reached early */
    var at = model.depositAt();
    var slot = $('tlslot');
    if (at !== null && xOf(at) <= TLW) {
      slot.setAttribute('x1', xOf(at)); slot.setAttribute('x2', xOf(at));
      slot.style.display = '';
    } else slot.style.display = 'none';
    $('tlopen').style.display = model.routeOpen() ? '' : 'none';
    if (model.routeOpen()) {
      var cur = model.currentRun();
      $('tlopen').setAttribute('x', xOf(cur ? cur.at : t));
      $('tlopen').setAttribute('width', Math.max(1, xOf(t) - xOf(cur ? cur.at : t)));
    }
  }

  /* scrub */
  var scrubbing = false;
  function scrubTo(clientX) {
    var b = tl.getBoundingClientRect();
    var f = Math.min(1, Math.max(0, (clientX - b.left) / b.width));
    var t = model.time();
    var span = HIST_BACK + HIST_FWD, t0 = Math.max(0, t - HIST_BACK);
    var target = t0 + f * span;
    var range = model.seekable();
    target = Math.min(t, Math.max(range.from, target));
    model.seek(target);
    while (hist.length && hist[hist.length - 1].t > model.time()) hist.pop();
    lastSample = model.time();
    redraw();
  }
  tl.addEventListener('pointerdown', function (e) {
    scrubbing = true; setRunning(false); tl.setPointerCapture(e.pointerId); scrubTo(e.clientX);
  });
  tl.addEventListener('pointermove', function (e) { if (scrubbing) scrubTo(e.clientX); });
  tl.addEventListener('pointerup', function () { scrubbing = false; });
  tl.addEventListener('pointercancel', function () { scrubbing = false; });

  /* ------------------------------------------------------------ inspection */
  /* Hover: one line, the content source's own words. The full entry is phase 3. */
  var EXTRA = {
    'route': ['The deposit route',
      'An external route to the outlet, opened by an agreement whose terms are hers, held by someone with no authority over the work.',
      'Not a wire. The three legs are the routes the missing capacity would complete — from identity, the engine and instinct. It touches nothing in the mind.'],
    'unfinished': ['Unfinished things',
      'Starting is fully supported by the engine and immediately satisfying, and it adds an unfinished thing.',
      'Nothing here finishes. The count raises generation, which is what makes the loop a loop.'],
  };
  var MACHINE_NOTE = {
    'region.emotion': 'This machine has no outside, so none of what it takes in reaches it here.',
    'region.throat': 'Nothing completes a route to it.',
  };
  function hoverFor(id) {
    if (EXTRA[id]) {
      var e = EXTRA[id];
      return '<b>' + e[0] + '</b> — ' + e[1] + ' <span class="mnote">' + e[2] + '</span>';
    }
    var p = BY[id];
    if (!p) return '';
    var f = p.fields.filter(function (x) { return /^(what it is|what it does)$/.test(x.label); })[0]
         || p.fields[0];
    var line = f ? firstSentence(f.value) : '';
    line = line.charAt(0).toUpperCase() + line.slice(1);
    if (!/[.!?]$/.test(line)) line += '.';
    var note = MACHINE_NOTE[id] || (p.kind === 'sealed' ? 'Real, full, and attached to nothing.' : '');
    return '<b>' + p.name + '</b> — ' + line + (note ? ' <span class="mnote">' + note + '</span>' : '');
  }
  var tip = $('tip');
  function showTip(id, ev) {
    tip.innerHTML = hoverFor(id);
    tip.classList.add('on');
    var b = $('stagewrap').getBoundingClientRect();
    var x = Math.min(ev.clientX - b.left + 14, b.width - 300);
    tip.style.left = Math.max(6, x) + 'px';
    tip.style.top = Math.min(ev.clientY - b.top + 16, b.height - 70) + 'px';
  }
  function hideTip() { tip.classList.remove('on'); }
  var CANVAS_ID = {
    'route': 'design.deposit-structure',
    'unfinished': 'mechanism.the-loop',
  };
  var partIdFor = function (id) { return CANVAS_ID[id] || id; };

  Object.keys(view.hit).forEach(function (id) {
    var n = view.hit[id];
    n.addEventListener('click', function () { openPart(partIdFor(id)); });
    n.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPart(partIdFor(id)); }
    });
    n.addEventListener('pointerenter', function (e) { showTip(id, e); });
    n.addEventListener('pointermove', function (e) { showTip(id, e); });
    n.addEventListener('pointerleave', hideTip);
    n.addEventListener('focus', function () {
      var box = n.getBoundingClientRect(), w = $('stagewrap').getBoundingClientRect();
      showTip(id, { clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 });
    });
    n.addEventListener('blur', hideTip);
  });

  /* ---------------------------------------------------------- the panel */
  var ON_CANVAS = {};
  Object.keys(view.hit).forEach(function (id) { ON_CANVAS[partIdFor(id)] = true; });
  /* a month has a panel but no element on the machine, so it can be read and
     not isolated — there is nothing on the canvas to isolate it to */
  var PLACED = {};
  Object.keys(ON_CANVAS).forEach(function (id) { PLACED[id] = true; });
  [WEATHER.decade.id, WEATHER.year.id].concat(WEATHER.order)
    .forEach(function (id) { ON_CANVAS[id] = true; });
  /* the element the panel's id belongs to, for dimming and selection */
  var ELEMENT_OF = {};
  Object.keys(view.hit).forEach(function (id) { ELEMENT_OF[partIdFor(id)] = id; });

  var focusView = {
    applyFocus: function (sel, keepSet) {
      var elSel = sel ? ELEMENT_OF[sel] : null;
      var elKeep = null;
      if (keepSet) {
        elKeep = {};
        Object.keys(keepSet).forEach(function (pid) {
          if (ELEMENT_OF[pid]) elKeep[ELEMENT_OF[pid]] = true;
        });
      }
      view.applyFocus(elSel, elKeep);
    },
  };

  INSPECT.init({ by: BY, onCanvas: ON_CANVAS, placed: PLACED, view: focusView, onSelect: function (id) {
    document.querySelector('main').classList.toggle('has-inspect', !!id);
    if (id) setAssume(false);
    view.fit();
  } });

  function openPart(id) {
    if (!ON_CANVAS[id]) return;
    hideTip();
    INSPECT.select(id);
  }

  /* ----------------------------------------------------------- assumptions */
  var panel = $('assume'), assumeOn = false;
  function buildAssumptions() {
    var box = $('alist'); box.innerHTML = '';
    Object.keys(PARAMS).forEach(function (k) {
      var P = PARAMS[k];
      var row = document.createElement('div'); row.className = 'arow';
      var lab = document.createElement('label');
      lab.setAttribute('for', 'p-' + k);
      lab.innerHTML = P.label + ' <span class="ill">illustrative</span>';
      var wrap = document.createElement('div'); wrap.className = 'actl';
      var inp = document.createElement('input');
      inp.type = 'range'; inp.id = 'p-' + k;
      inp.min = P.min; inp.max = P.max; inp.step = P.step; inp.value = P.value;
      var val = document.createElement('span'); val.className = 'aval';
      var fmt = function (v) { return v + (/^[a-z]/i.test(P.unit || '') ? ' ' : '') + (P.unit || ''); };
      val.textContent = fmt(P.value);
      inp.addEventListener('input', function () {
        P.value = parseFloat(inp.value);
        val.textContent = fmt(P.value);
        redraw();
      });
      wrap.appendChild(inp); wrap.appendChild(val);
      var note = document.createElement('p'); note.className = 'anote';
      note.innerHTML = plain(P.note);
      row.appendChild(lab); row.appendChild(wrap); row.appendChild(note);
      box.appendChild(row);
    });
    var ul = $('astated'); ul.innerHTML = '';
    STATED_ASSUMPTIONS.forEach(function (s) {
      var li = document.createElement('li'); li.innerHTML = plain(s); ul.appendChild(li);
    });
  }
  function setAssume(on) {
    if (on && INSPECT.selected()) INSPECT.clear();
    assumeOn = on;
    panel.classList.toggle('open', on);
    $('assumeBtn').setAttribute('aria-pressed', on ? 'true' : 'false');
    $('assumeBtn').textContent = on ? 'Hide assumptions' : 'Show assumptions';
    document.querySelector('main').classList.toggle('has-panel', on);
    view.fit(); redraw();
  }
  $('assumeBtn').addEventListener('click', function () { setAssume(!assumeOn); });
  $('aclose').addEventListener('click', function () { setAssume(false); });
  $('venthard').addEventListener('click', function () {
    model.ventHard(3, 26); setRunning(true);
  });

  /* ----------------------------------------------------------- the routes */
  $('talk').addEventListener('click', function () { model.talk(); setRunning(true); redraw(); });
  $('start').addEventListener('click', function () { model.startThing(); setRunning(true); redraw(); });
  $('commit').addEventListener('click', function () {
    if (model.commit()) { setRunning(true); redraw(); }
  });
  $('rhythm').addEventListener('change', function () { model.setRhythm($('rhythm').checked); });

  function paintRoutes() {
    var due = model.dueIn(), open = model.routeOpen();
    $('commit').disabled = open || due !== null;
    $('commit').textContent = due !== null ? 'Committed' : 'Commit a deposit';
    var d = $('due');
    if (open) { d.textContent = 'the route is open'; d.classList.remove('none'); }
    else if (due !== null) { d.textContent = 'opens in ' + due.toFixed(0) + 's'; d.classList.remove('none'); }
    else { d.textContent = 'no date set'; d.classList.add('none'); }
    $('slotlabel').textContent = open ? 'the route is open'
      : due !== null ? 'next deposit · ' + clock(model.depositAt()) : 'next deposit · no date set';
    view.paintRoute(open ? 'open' : due !== null ? 'armed' : 'shut');
  }

  /* -------------------------------------------------------------- weather */
  /* SPEC §9. The machine is timeless; a month multiplies its parameters and
     says which way the source points and which number is mine. */
  var month = null;

  function today() { var d = new Date(); return d.toISOString().slice(0, 10); }
  function currentMonthId() {
    var t = today();
    for (var i = 0; i < WEATHER.order.length; i++) {
      var m = WEATHER.months[WEATHER.order[i]];
      if (t >= m.from && t < m.to) return WEATHER.order[i];
    }
    return null;
  }

  function weatherEffects(id) {
    var w = { gen: 1, hold: 1, exit: 1, auto: false, autoEvery: 55 }, sealedMap = {};
    if (!id) return { w: w, sealed: sealedMap };
    /* the decade is on for every month the machine can model */
    WEATHER.decade.effects.forEach(function (e) { if (e.k === 'exit') w.exit *= e.v; });
    WEATHER.months[id].effects.forEach(function (e) {
      if (e.k === 'gen')  w.gen  *= e.v;
      if (e.k === 'hold') w.hold *= e.v;
      if (e.k === 'exit') w.exit *= e.v;
      if (e.k === 'auto') w.auto = true;
      if (e.k === 'sealed') BODY_OPERATIONS.forEach(function (s) { sealedMap[s] = e.v; });
    });
    return { w: w, sealed: sealedMap };
  }
  /* the wood, in the machine's vocabulary: the four sealed body operations */
  var BODY_OPERATIONS = ['sealed.completion', 'sealed.resource-direction',
                         'sealed.begin-experience', 'sealed.mutate-in-limit'];

  function setMonth(id) {
    month = id;
    var e = weatherEffects(id);
    model.setWeather(e.w);
    view.setSealedState(e.sealed);
    paintWeather();
    redraw();
  }

  function tagsHtml(list) {
    return (list || []).map(function (t) { return '<span class="tag">[' + t + ']</span>'; }).join(' ');
  }

  function paintWeather() {
    var cur = currentMonthId();
    var box = $('wbtns');
    if (!box.childNodes.length) {
      var mk = function (id, label, word) {
        var b = document.createElement('button');
        b.innerHTML = esc(label) + (word ? ' <span class="wword">' + esc(word) + '</span>' : '');
        b.addEventListener('click', function () { setMonth(id); });
        box.appendChild(b);
        return b;
      };
      mk(null, 'Timeless', '');
      WEATHER.order.forEach(function (id) {
        mk(id, WEATHER.months[id].short, WEATHER.months[id].word);
      });
    }
    Array.prototype.forEach.call(box.children, function (b, i) {
      var id = i === 0 ? null : WEATHER.order[i - 1];
      b.classList.toggle('on', id === month);
      b.setAttribute('aria-pressed', id === month ? 'true' : 'false');
    });
    $('wnow').textContent = cur ? WEATHER.months[cur].short + ' is the month now' : '';

    var d = $('wdetail');
    if (!month) {
      d.innerHTML = cur
        ? '<span class="wfull">The machine has no time in it. ' + esc(WEATHER.months[cur].label)
          + ' is running outside it — pick it to see what it does.</span>'
        : '<span class="stale">' + esc(WEATHER.stale) + '</span> '
          + '<span class="wfull">'
          + esc(WEATHER.staleYear).replace(/\[(\w+)\]/g, '<span class="tag">[$1]</span>')
          + '</span>';
      return;
    }
    var m = WEATHER.months[month];
    var eff = m.effects.map(function (e) {
      return '<span class="weff">' + esc(e.text) + '</span>' + (e.tag ? ' ' + tagsHtml([e.tag]) : '');
    });
    eff.push('<span class="weff">' + esc(WEATHER.decade.effects[0].text) + '</span> ' + tagsHtml(WEATHER.decade.tags));
    /* On a phone only the headline stays here; the rest is one tap away in the
       panel, which is where the detail lives. */
    d.innerHTML =
      '<span class="whead"><b>' + esc(m.label) + ' — ' + esc(m.word) + '.</b> '
      + '<span class="wfull">' + INSPECT.inline(m.line) + ' </span>' + tagsHtml(m.tags) + '</span>'
      + '<span class="wfull"><br>' + eff.join('<span class="wsep">·</span>')
      + (m.nothing ? '<br>' + esc(m.nothing) : '')
      + '<br><span class="wq">“' + esc(m.quote) + '”</span> ' + (m.quoteTag ? tagsHtml([m.quoteTag]) : '')
      + '</span> <button class="wlink" id="wread">the whole reading</button>';
    var link = $('wread');
    if (link) link.addEventListener('click', function () { openPart(month); });
  }

  /* ------------------------------------------------------------- separate */
  /* SPEC §8, the diagnostic view. The machine keeps running the whole way:
     nothing here touches the model, only where its parts are drawn. */
  var sepRange = $('sep'), sepAnim = null;
  function setSep(v, quiet) {
    view.setSeparation(v);
    if (!quiet) sepRange.value = Math.round(v * 1000);
    $('sepToggle').textContent = v > 0.5 ? 'together' : 'apart';
    $('sepcap').innerHTML = v > 0.8 ? 'Two islands. One gap. Ten loose pieces.'
                          : v > 0.25 ? 'Coming apart. The wired parts stay together.'
                          : '';
    redraw();
  }
  sepRange.addEventListener('input', function () {
    if (sepAnim) { cancelAnimationFrame(sepAnim); sepAnim = null; }
    setSep(sepRange.value / 1000, true);
  });
  function tweenSep(to, ms) {
    if (sepAnim) cancelAnimationFrame(sepAnim);
    var from = view.separation(), start = performance.now();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setSep(to); return; }
    var stepFn = function (now) {
      var k = Math.min(1, (now - start) / (ms || 1100));
      var e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      setSep(from + (to - from) * e);
      sepAnim = k < 1 ? requestAnimationFrame(stepFn) : null;
    };
    sepAnim = requestAnimationFrame(stepFn);
  }
  $('sepToggle').addEventListener('click', function () {
    tweenSep(view.separation() > 0.5 ? 0 : 1);
  });

  /* -------------------------------------------------------------- controls */
  function setRunning(on) {
    running = on;
    $('pause').textContent = on ? 'Pause' : 'Resume';
    $('pause').setAttribute('aria-pressed', on ? 'false' : 'true');
    if (on) holdAt = holdAt;                     /* hold stays armed across a resume */
  }
  $('pause').addEventListener('click', function () { setRunning(!running); });
  $('step').addEventListener('click', function () { setRunning(false); advance(5); });
  $('reset').addEventListener('click', function () {
    model.reset(); model.setRhythm($('rhythm').checked);
    hist = []; lastSample = -1; holdTripped = false; drawnRuns = -1;
    INSPECT.clear(); setSep(0); setMonth(null);
    setRunning(true); redraw();
  });
  Array.prototype.forEach.call(document.querySelectorAll('.spd'), function (b) {
    b.addEventListener('click', function () {
      speed = parseFloat(b.dataset.s);
      Array.prototype.forEach.call(document.querySelectorAll('.spd'), function (o) {
        o.classList.toggle('on', o === b); o.setAttribute('aria-pressed', o === b ? 'true' : 'false');
      });
    });
  });
  var holdTripped = false;
  $('hold').addEventListener('input', function () {
    var v = parseInt($('hold').value, 10);
    holdAt = (isNaN(v) || v <= 0) ? null : v / 100;   /* 0 is off, not "stop now" */
    holdTripped = false;
    $('holdval').textContent = holdAt === null ? 'off' : Math.round(holdAt * 100) + '%';
  });

  document.addEventListener('keydown', function (e) {
    if (/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (e.key === ' ') { e.preventDefault(); setRunning(!running); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); setRunning(false); advance(5); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); setRunning(false);
      var r = model.seekable(); model.seek(Math.max(r.from, model.time() - 5));
      while (hist.length && hist[hist.length - 1].t > model.time()) hist.pop();
      lastSample = model.time(); redraw(); }
    else if (e.key === '1') document.querySelector('.spd[data-s="0.25"]').click();
    else if (e.key === '2') document.querySelector('.spd[data-s="1"]').click();
    else if (e.key === '3') document.querySelector('.spd[data-s="4"]').click();
    else if (e.key === 't' || e.key === 'T') $('talk').click();
    else if (e.key === 's' || e.key === 'S') $('start').click();
    else if (e.key === 'd' || e.key === 'D') { if (!$('commit').disabled) $('commit').click(); }
    else if (e.key === 'r' || e.key === 'R') $('reset').click();
    else if (e.key === 'x' || e.key === 'X') $('sepToggle').click();
    else if (e.key === 'a' || e.key === 'A') setAssume(!assumeOn);
    else if (e.key === 'Escape') {
      hideTip();
      if (INSPECT.selected()) INSPECT.clear();
      else if (assumeOn) setAssume(false);
    }
    else if (e.key === 'i' || e.key === 'I') {
      if (INSPECT.selected()) document.getElementById('isolate').click();
    }
  });

  /* ------------------------------------------------------------------ loop */
  function advance(seconds) {
    var n = Math.round(seconds / MODEL.DT);
    for (var i = 0; i < n; i++) {
      model.tick();
      if (holdAt !== null && !holdTripped && model.pressure() >= holdAt) {
        holdTripped = true; setRunning(false);
        $('read').innerHTML = 'Held at ' + Math.round(holdAt * 100) + '%.';
        break;
      }
    }
    redraw();
  }

  function redraw() {
    var pr = model.pressure(), loads = model.loads(), hot = pr >= thr();
    sample(pr);
    paintGauge(pr); paintReading(pr, loads); paintTimeline(pr);
    paintLedger(); paintRoutes();
    view.paintRegions(loads, pr, hot);
    view.paintUnfinished(model.unfinished());
    if (reduce.matches) view.drawStill(); else view.drawParts(model, loads, pr, hot);
    $('total').textContent = model.parts().length;
  }

  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (running && !scrubbing) {
      acc += dt * speed;
      var guard = 0;
      while (acc >= MODEL.DT && guard++ < 600) {
        acc -= MODEL.DT;
        model.tick();
        if (holdAt !== null && !holdTripped && model.pressure() >= holdAt) {
          holdTripped = true; setRunning(false); acc = 0; break;
        }
      }
    }
    redraw();
    requestAnimationFrame(frame);
  }

  /* The stage animates its width when the panel opens, so measuring it right
     after the class toggle reads the box mid-transition and the canvas ends up
     out of register with the SVG. Observe the box instead of guessing when it
     settled. */
  if (window.ResizeObserver) {
    new ResizeObserver(function () { view.fit(); redraw(); }).observe($('stagewrap'));
  }
  window.addEventListener('resize', function () { view.fit(); redraw(); });
  buildAssumptions();
  $('stamp').textContent = 'Phase 5 · weather · content-source ' + NODE.meta.sourceSha256.slice(0, 7);
  model.setRhythm($('rhythm').checked);
  setMonth(null);
  setRunning(true);
  redraw();
  requestAnimationFrame(frame);
})();
