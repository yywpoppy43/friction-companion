/* one node — layer 1: hardware.
 *
 * Renders 25 parts: 9 regions, 6 wires, 10 sealed capacities, and the split
 * they imply. Reads data/node.js (content) and layout.js (geometry) and holds
 * neither itself.
 *
 * The dial maths is the prototype's, unchanged: regions lerp straight from
 * assembled to exploded so wired ones keep their relative geometry; sealed
 * capacities hold for the first 8% of travel and then smoothstep out, which
 * is what makes the detachment read as detachment.
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------- indices */
  var BY = {};
  NODE.parts.forEach(function (p) { BY[p.id] = p; });

  var REGIONS = NODE.parts.filter(function (p) { return p.kind === 'region'; });
  var WIRES   = NODE.parts.filter(function (p) { return p.kind === 'wire'; });
  var SEALED  = NODE.parts.filter(function (p) { return p.kind === 'sealed'; });
  var ON_STAGE = {};
  REGIONS.concat(WIRES, SEALED).forEach(function (p) { ON_STAGE[p.id] = true; });

  /* Real in the data, not on the canvas in this layer. They show in panels as
     connections so the shape of what is coming is visible. */
  var LATER = ['missing-piece.now', 'integration-circuit'];

  var lerp = function (a, b, k) { return a + (b - a) * k; };
  var NS = 'http://www.w3.org/2000/svg';
  function el(name, attrs) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function $(id) { return document.getElementById(id); }

  /* --------------------------------------------------------------- state */
  var t = 0;
  var selected = null;          /* an id, or null */
  var isolated = false;
  var layers = { fixed: true, fluid: true, wires: true, sealed: true };

  /* --------------------------------------------------------------- build */
  var gGhost   = $('ghost');
  var gWants   = $('wants');
  var gWires   = $('wires');
  var gRegions = $('regions');
  var gSealed  = $('sealed');

  GHOST.forEach(function (g) {
    var e = g.el === 'ellipse'
      ? el('ellipse', { class: 'ghost', cx: g.cx, cy: g.cy, rx: g.rx, ry: g.ry })
      : el('path', { class: 'ghost', d: g.d });
    gGhost.appendChild(e);
  });

  var wireEl = {}, wireHit = {}, regionEl = {}, sealedEl = {}, wantEl = {};

  WIRES.forEach(function (w) {
    var ln  = el('line', { class: 'wire' });
    var hit = el('line', { class: 'hitline', tabindex: '0', role: 'button', 'aria-label': w.name });
    hit.addEventListener('click', function () { select(w.id); });
    hit.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(w.id); }
    });
    gWires.appendChild(ln);
    gWires.appendChild(hit);
    wireEl[w.id] = ln; wireHit[w.id] = hit;
  });

  REGIONS.forEach(function (r) {
    var g = GEOM[r.id];
    var node = el('g', { class: 'region ' + r.state, tabindex: '0', role: 'button', 'aria-label': r.name });
    node.appendChild(el('path', { class: 'shape', d: shapePath(g.shape) }));
    var tx = el('text', { class: 'lbl', x: g.lbl.x, y: g.lbl.y, 'text-anchor': g.lbl.anchor });
    tx.textContent = r.name;
    node.appendChild(tx);
    node.addEventListener('click', function () { select(r.id); });
    node.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(r.id); }
    });
    gRegions.appendChild(node);
    regionEl[r.id] = node;
  });

  SEALED.forEach(function (s) {
    var node = el('g', { class: 'sealed', tabindex: '0', role: 'button', 'aria-label': s.name });
    node.appendChild(el('circle', { class: 'hit', r: 22 }));
    node.appendChild(el('circle', { class: 'ring', r: 12 }));
    node.appendChild(el('circle', { class: 'dot', r: 6 }));
    var tx = el('text', { class: 'lbl', x: 0, y: 26, 'text-anchor': 'middle' });
    tx.textContent = s.name;
    node.appendChild(tx);
    node.addEventListener('click', function () { select(s.id); });
    node.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(s.id); }
    });
    gSealed.appendChild(node);
    sealedEl[s.id] = node;
    var want = el('line', { class: 'want' });
    gWants.appendChild(want);
    wantEl[s.id] = want;
  });

  /* ----------------------------------------------------------- positions */
  /* Unchanged from the prototype. */
  function regionPos(r) {
    var g = GEOM[r.id];
    return { x: lerp(g.a.x, g.e.x, t), y: lerp(g.a.y, g.e.y, t) };
  }
  function sealedPos(s) {
    var host = GEOM[s.region], g = SEALED_GEOM[s.id];
    var ax = host.a.x + g.off.x, ay = host.a.y + g.off.y;
    var tt = Math.max(0, (t - 0.08) / 0.92);
    var ease = tt * tt * (3 - 2 * tt);
    return { x: lerp(ax, g.e.x, ease), y: lerp(ay, g.e.y, ease) };
  }

  /* ---------------------------------------------------------------- frame */
  /* The camera, not the mechanism. On a laptop the viewBox is the prototype's
     fixed 900x640 and nothing here runs. On a narrow portrait screen that box
     scales the figure to 43% and it draws at a sixth of the available area, so
     there the camera follows the content instead. No part's position relative
     to any other part changes, at any dial value, on any screen — only how
     much of the screen the same arrangement is drawn across. */
  var svgStage = document.querySelector('svg.stage');
  var narrowMQ = window.matchMedia('(max-width:900px) and (orientation:portrait)');
  var FRAME_PAD = 78;               /* room for labels, in user units */

  function frame(pos, spos) {
    if (!narrowMQ.matches) {
      svgStage.setAttribute('viewBox', '0 0 ' + STAGE.w + ' ' + STAGE.h);
      return;
    }
    var xs = [], ys = [];
    REGIONS.forEach(function (r) { xs.push(pos[r.id].x); ys.push(pos[r.id].y); });
    SEALED.forEach(function (s) { xs.push(spos[s.id].x); ys.push(spos[s.id].y); });
    var x0 = Math.min.apply(null, xs) - FRAME_PAD, x1 = Math.max.apply(null, xs) + FRAME_PAD;
    var y0 = Math.min.apply(null, ys) - FRAME_PAD, y1 = Math.max.apply(null, ys) + FRAME_PAD;
    svgStage.setAttribute('viewBox', x0 + ' ' + y0 + ' ' + (x1 - x0) + ' ' + (y1 - y0));
  }

  function layout() {
    var pos = {}, spos = {};
    REGIONS.forEach(function (r) {
      pos[r.id] = regionPos(r);
      regionEl[r.id].setAttribute('transform', 'translate(' + pos[r.id].x + ' ' + pos[r.id].y + ')');
    });
    WIRES.forEach(function (w) {
      var a = pos[w.a], b = pos[w.b];
      [wireEl[w.id], wireHit[w.id]].forEach(function (L) {
        L.setAttribute('x1', a.x); L.setAttribute('y1', a.y);
        L.setAttribute('x2', b.x); L.setAttribute('y2', b.y);
      });
    });
    SEALED.forEach(function (s) {
      var p = sealedPos(s);
      spos[s.id] = p;
      sealedEl[s.id].setAttribute('transform', 'translate(' + p.x + ' ' + p.y + ')');
      sealedEl[s.id].classList.toggle('show', t > 0.55 || selected === s.id);
      var target = pos[s.completesAt];
      var w = wantEl[s.id];
      w.setAttribute('x1', p.x); w.setAttribute('y1', p.y);
      w.setAttribute('x2', target.x); w.setAttribute('y2', target.y);
    });
    gGhost.setAttribute('opacity', Math.max(0, 1 - t * 2.2));
    frame(pos, spos);
    caption();
  }

  function caption() {
    var c = $('caption');
    if (t < 0.12)     c.innerHTML = 'Assembled. One person, as she appears.';
    else if (t < 0.45) c.innerHTML = 'Coming apart. Watch which parts stay together.';
    else if (t < 0.8)  c.innerHTML = 'The wired parts hold. The sealed ones let go.';
    else               c.innerHTML = '<em>Two islands. One gap. Ten loose pieces.</em>';
  }

  /* ------------------------------------------------------- layers / dim */
  function connectedSet(id) {
    var p = BY[id], set = {};
    set[id] = true;
    if (p.kind === 'region') {
      WIRES.forEach(function (w) {
        if (w.a === id || w.b === id) { set[w.id] = true; set[w.a] = true; set[w.b] = true; }
      });
      SEALED.forEach(function (s) { if (s.region === id) set[s.id] = true; });
    } else if (p.kind === 'wire') {
      set[p.a] = true; set[p.b] = true;
    } else {
      set[p.region] = true; set[p.completesAt] = true;
    }
    return set;
  }

  function applyVisibility() {
    var keep = (isolated && selected) ? connectedSet(selected) : null;
    REGIONS.forEach(function (r) {
      var node = regionEl[r.id];
      node.style.display = layers[r.state] ? '' : 'none';
      node.classList.toggle('dim', !!keep && !keep[r.id]);
      node.classList.toggle('sel', selected === r.id);
    });
    /* The brief asks that turning both bodies off leave the connection map
       standing, so wire visibility answers only to its own toggle. */
    WIRES.forEach(function (w) {
      var show = layers.wires;
      wireEl[w.id].style.display = show ? '' : 'none';
      wireHit[w.id].style.display = show ? '' : 'none';
      wireEl[w.id].classList.toggle('dim', !!keep && !keep[w.id]);
      wireEl[w.id].classList.toggle('sel', selected === w.id);
    });
    SEALED.forEach(function (s) {
      var node = sealedEl[s.id];
      node.style.display = layers.sealed ? '' : 'none';
      node.classList.toggle('dim', !!keep && !keep[s.id]);
      node.classList.toggle('sel', selected === s.id);
      wantEl[s.id].classList.toggle('on', selected === s.id && layers.sealed);
    });
  }

  /* ------------------------------------------------------------- inline */
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  /* Renders the source file's inline notation. An id in backticks becomes the
     plain-language name of the part it points at — same referent, the file's
     own vocabulary. Nothing is added and nothing is dropped. */
  function inline(s) {
    return esc(s)
      .replace(/`\[([^\]]+)\]`/g, function (_, tag) {
        return '<span class="tag">[' + tag + ']</span>';
      })
      .replace(/`([^`]+)`/g, function (_, code) {
        var p = BY[code];
        return p ? '<span class="ref">' + esc(p.name) + '</span>'
                 : '<span class="lit">' + code + '</span>';
      })
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }

  /* ------------------------------------------------------------ inspect */
  var inspect = $('inspect');

  function kindLine(p) {
    if (p.kind === 'region') {
      var where = p.island ? 'island ' + p.island + ' (' + p.islandNote + ')' : p.islandNote;
      return 'Region · ' + p.state + ' · ' + where;
    }
    if (p.kind === 'wire') return 'Wire · ' + p.circuitry;
    return 'Sealed capacity · no wire';
  }

  function fieldsHtml(p) {
    return p.fields.map(function (f) {
      var items = f.items.length
        ? '<ul>' + f.items.map(function (i) { return '<li>' + inline(i) + '</li>'; }).join('') + '</ul>'
        : '';
      if (f.labelStyle === 'lead') {
        return '<div class="field lead"><p><strong>' + esc(f.label) + '</strong> '
             + inline(f.value) + '</p>' + items + '</div>';
      }
      return '<div class="field"><div class="lab">' + esc(f.label) + '</div>'
           + (f.value ? '<p>' + inline(f.value) + '</p>' : '') + items + '</div>';
    }).join('');
  }

  function chipsFor(p) {
    var chips = [];
    var add = function (id, label, cls) { chips.push({ id: id, label: label, cls: cls || '' }); };

    if (p.kind === 'region') {
      WIRES.forEach(function (w) { if (w.a === p.id || w.b === p.id) add(w.id, w.name); });
      SEALED.forEach(function (s) { if (s.region === p.id) add(s.id, s.name, 'metal'); });
    } else if (p.kind === 'wire') {
      add(p.a, BY[p.a].name);
      add(p.b, BY[p.b].name);
    } else {
      add(p.region, 'Sits in ' + BY[p.region].name.toLowerCase());
      add(p.completesAt, 'Would wire to ' + BY[p.completesAt].name.toLowerCase(), 'metal');
    }
    /* connections whose parts are not on the canvas in this layer */
    LATER.forEach(function (id) {
      if (p.adjacent.indexOf(id) !== -1) add(null, BY[id].name, 'later');
    });
    return chips;
  }

  function select(id) {
    var p = BY[id];
    if (!p || !ON_STAGE[id]) return;
    selected = id;

    $('i-kind').textContent = kindLine(p);
    $('i-name').textContent = p.name;

    $('i-owed').innerHTML = p.answerOwed
      ? 'An answer is owed on this part. Marked ' + p.tags.filter(function (x) { return x.pending; })
          .map(function (x) { return '[' + esc(x.raw) + ']'; }).join(' ') + ' in the source.'
      : '';
    $('i-owed').style.display = p.answerOwed ? '' : 'none';

    $('i-fields').innerHTML = fieldsHtml(p);

    var box = $('i-chips');
    box.innerHTML = '';
    chipsFor(p).forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'chip ' + c.cls;
      b.textContent = c.label;
      if (c.cls === 'later') {
        b.disabled = true;
        b.title = 'In the data, not on the canvas in this layer.';
      } else {
        b.addEventListener('click', function () { select(c.id); });
      }
      box.appendChild(b);
    });

    inspect.classList.add('open');
    inspect.scrollTop = 0;      /* a new part starts at its own beginning */
    document.querySelector('main').classList.add('has-panel');
    applyVisibility();
    layout();
  }

  function clearSel() {
    selected = null;
    isolated = false;
    $('isolate').textContent = 'Isolate';
    inspect.classList.remove('open');
    document.querySelector('main').classList.remove('has-panel');
    applyVisibility();
    layout();
  }

  $('close').addEventListener('click', clearSel);
  $('clear').addEventListener('click', clearSel);
  $('isolate').addEventListener('click', function () {
    isolated = !isolated;
    $('isolate').textContent = isolated ? 'Show all' : 'Isolate';
    applyVisibility();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') clearSel(); });

  /* -------------------------------------------------------------- layers */
  $('n-fixed').textContent  = REGIONS.filter(function (r) { return r.state === 'fixed'; }).length;
  $('n-fluid').textContent  = REGIONS.filter(function (r) { return r.state === 'fluid'; }).length;
  $('n-wires').textContent  = WIRES.length;
  $('n-sealed').textContent = SEALED.length;

  Array.prototype.forEach.call(document.querySelectorAll('.layers input'), function (cb) {
    cb.addEventListener('change', function () {
      layers[cb.dataset.layer] = cb.checked;
      applyVisibility();
    });
  });

  /* ---------------------------------------------------------------- dial */
  var range = $('t');
  range.addEventListener('input', function () { t = range.value / 1000; layout(); });

  var anim = null;
  function tween(to, ms) {
    ms = ms || 1100;
    if (anim) cancelAnimationFrame(anim);
    var from = t, start = performance.now();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      t = to; range.value = Math.round(t * 1000); layout(); return;
    }
    var step = function (now) {
      var k = Math.min(1, (now - start) / ms);
      var e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      t = lerp(from, to, e);
      range.value = Math.round(t * 1000);
      layout();
      if (k < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }
  $('toA').addEventListener('click', function () { tween(0); });
  $('toE').addEventListener('click', function () { tween(1); });
  $('reset').addEventListener('click', function () {
    Array.prototype.forEach.call(document.querySelectorAll('.layers input'), function (cb) {
      cb.checked = true; layers[cb.dataset.layer] = true;
    });
    isolated = false;
    $('isolate').textContent = 'Isolate';
    clearSel();
    tween(0, 700);
  });

  /* ------------------------------------------------------------------ go */
  $('stamp').textContent = 'Layer 1 — hardware · ' + REGIONS.length + ' regions, '
    + WIRES.length + ' wires, ' + SEALED.length + ' sealed · from content-source '
    + NODE.meta.sourceSha256.slice(0, 7);
  window.addEventListener('resize', layout);
  if (narrowMQ.addEventListener) narrowMQ.addEventListener('change', layout);
  applyVisibility();
  layout();
})();
