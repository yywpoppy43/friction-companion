/* one node — the machine. The view.
 *
 * SVG carries every addressable thing: nine regions, six wires, ten sealed
 * capacities, the split, the deposit route, the unfinished pile, the figure.
 * Each is a real element with an id, a tabindex and a label, so hover, click
 * and keyboard come from the browser rather than from hit-testing a bitmap.
 * Canvas carries the load, because a few hundred moving dots is what canvas
 * is for. Both read the same frame, so they stay in register at any size.
 *
 * Nothing here is fixed in place. Every position is a point between the
 * assembled layout and the separated one, so the diagnostic view of SPEC §8
 * is the same machine at a different value of one number — and it keeps
 * running the whole way.
 */

var VIEW_BOX = { x: 300, y: 8, w: 480, h: 652 };

var VIEWER = (function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  function el(n, a) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); return e; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpPt(a, b, t) { return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) }; }

  function build(opts) {
    var svg = opts.svg, cv = opts.canvas, S = opts.structure;
    var cx = cv.getContext('2d');
    var gRegion = {}, gSealed = {}, gWire = {}, wireVis = {}, hit = {};

    /* ------------------------------------------------------- live geometry */
    var sep = 0, sealedState = {};
    var POS = {}, SPOS = {}, FRAME = { x: VIEW_BOX.x, y: VIEW_BOX.y, w: VIEW_BOX.w, h: VIEW_BOX.h };

    function computePositions() {
      Object.keys(REGION_XY).forEach(function (id) {
        POS[id] = lerpPt(REGION_XY[id], REGION_APART[id], sep);
      });
      /* A sealed capacity holds onto its region for the first stretch, then
         lets go — which is what makes the detachment read as detachment. */
      var tt = Math.max(0, (sep - 0.08) / 0.92);
      var ease = tt * tt * (3 - 2 * tt);
      Object.keys(SEALED_XY).forEach(function (id) {
        var g = SEALED_XY[id], host = POS[g.r];
        /* a receding piece sits further from its region — the wood going
           further under, drawn */
        var k = sealedState[id] === 'recede' ? 2.1 : 1;
        SPOS[id] = lerpPt({ x: host.x + g.dx * k, y: host.y + g.dy * k }, SEALED_APART[id], ease);
      });
      FRAME.x = lerp(VIEW_BOX.x, VIEW_APART.x, sep);
      FRAME.y = lerp(VIEW_BOX.y, VIEW_APART.y, sep);
      FRAME.w = lerp(VIEW_BOX.w, VIEW_APART.w, sep);
      FRAME.h = lerp(VIEW_BOX.h, VIEW_APART.h, sep);
    }
    computePositions();

    /* ------------------------------------------------------------ the body */
    var gFig = el('g', { class: 'figure' });
    FIGURE.forEach(function (d, i) {
      gFig.appendChild(el('path', { d: d, class: FIGURE_ARMS.indexOf(i) >= 0 ? 'fig arm' : 'fig' }));
    });
    svg.appendChild(gFig);

    /* wires under the parts */
    var gW = el('g', { class: 'wires' });
    S.wires.forEach(function (w) {
      var ln = el('line', { class: 'wire' });
      gW.appendChild(ln);
      var h = el('line', { class: 'wirehit', tabindex: '0', role: 'button', 'aria-label': w.name });
      gW.appendChild(h);
      gWire[w.id] = h; hit[w.id] = h; wireVis[w.id] = ln;
    });
    svg.appendChild(gW);

    /* The split. The one thing on the machine that is an absence: two short
       marks with a clear gap between them, where the islands do not meet. */
    var gSplit = el('g', { class: 'split', tabindex: '0', role: 'button', 'aria-label': 'The split' });
    var splitA = el('path', { class: 'splitmark' });
    var splitB = el('path', { class: 'splitmark' });
    var splitHit = el('rect', { class: 'splithit' });
    gSplit.appendChild(splitA); gSplit.appendChild(splitB); gSplit.appendChild(splitHit);
    svg.appendChild(gSplit);
    hit['split'] = gSplit;

    /* The deposit route. Not a wire: the three legs are the routes the missing
       capacity would complete, and the piece beyond the outlet is scaffolding —
       external, built, and touching nothing in the mind island. */
    var gRoute = el('g', { class: 'route', tabindex: '0', role: 'button', 'aria-label': 'The deposit route' });
    var routeLegs = ROUTE.legs.map(function () { var e = el('path', { class: 'leg' }); gRoute.appendChild(e); return e; });
    var routeScaffold = el('path', { class: 'scaffold' });
    gRoute.appendChild(routeScaffold);
    var routeRungs = [1, 2, 3, 4].map(function () { var e = el('line', { class: 'rung' }); gRoute.appendChild(e); return e; });
    var routeHit = el('path', { class: 'routehit' });
    gRoute.appendChild(routeHit);
    svg.appendChild(gRoute);
    hit['route'] = gRoute;

    /* Unfinished things. Started, relieving, and never leaving. */
    var gUnf = el('g', { class: 'unfinished', tabindex: '0', role: 'button', 'aria-label': 'Unfinished things' });
    var unfTicks = el('g', {});
    var unfLabel = el('text', { class: 'unflabel', 'text-anchor': 'end' });
    gUnf.appendChild(unfTicks); gUnf.appendChild(unfLabel);
    svg.appendChild(gUnf);
    hit['unfinished'] = gUnf;

    /* sealed capacities: drawn full, and attached to nothing.
       §1.4 — present as pressure, absent as mechanism. */
    var gS = el('g', { class: 'sealeds' });
    S.sealed.forEach(function (s) {
      var n = el('g', { class: 'sealed', tabindex: '0', role: 'button', 'aria-label': s.name });
      n.appendChild(el('circle', { class: 'shit', r: 15 }));
      n.appendChild(el('circle', { class: 'sring', r: 10.5 }));
      n.appendChild(el('circle', { class: 'sdot',  r: 5.2 }));
      gS.appendChild(n); gSealed[s.id] = n; hit[s.id] = n;
    });
    svg.appendChild(gS);

    /* regions */
    var gR = el('g', { class: 'regions' });
    S.regions.forEach(function (r) {
      var lab = REGION_LABEL[r.id];
      var n = el('g', { class: 'region ' + r.state + (r.island ? ' isle-' + r.island : ' isle-none'),
                        tabindex: '0', role: 'button', 'aria-label': r.name });
      n.appendChild(el('circle', { class: 'rhit', r: 30 }));
      n.appendChild(el('circle', { class: 'rbody', r: 15 }));
      var t = el('text', { class: 'rlabel', x: lab.dx, y: lab.dy, 'text-anchor': lab.anchor });
      t.textContent = r.name;
      n.appendChild(t);
      gR.appendChild(n); gRegion[r.id] = n; hit[r.id] = n;
    });
    svg.appendChild(gR);

    /* --------------------------------------------------------- apply frame */
    function applyGeometry(loads) {
      svg.setAttribute('viewBox', FRAME.x + ' ' + FRAME.y + ' ' + FRAME.w + ' ' + FRAME.h);

      S.regions.forEach(function (r) {
        var p = POS[r.id];
        gRegion[r.id].setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')');
      });
      S.wires.forEach(function (w) {
        var a = POS[w.a], b = POS[w.b];
        [wireVis[w.id], gWire[w.id]].forEach(function (L) {
          L.setAttribute('x1', a.x.toFixed(1)); L.setAttribute('y1', a.y.toFixed(1));
          L.setAttribute('x2', b.x.toFixed(1)); L.setAttribute('y2', b.y.toFixed(1));
        });
      });
      S.sealed.forEach(function (s) {
        var p = SPOS[s.id];
        gSealed[s.id].setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')');
      });

      /* the split marks travel into the gap once the gap is real */
      var a0 = [470, 252, 516, 252], b0 = [564, 252, 610, 252];
      var A = a0.map(function (v, i) { return lerp(v, SPLIT_APART.a[i], sep); });
      var B = b0.map(function (v, i) { return lerp(v, SPLIT_APART.b[i], sep); });
      splitA.setAttribute('d', 'M' + A[0].toFixed(1) + ' ' + A[1].toFixed(1) + ' L' + A[2].toFixed(1) + ' ' + A[3].toFixed(1));
      splitB.setAttribute('d', 'M' + B[0].toFixed(1) + ' ' + B[1].toFixed(1) + ' L' + B[2].toFixed(1) + ' ' + B[3].toFixed(1));
      splitHit.setAttribute('x', A[0] - 4); splitHit.setAttribute('y', Math.min(A[1], B[3]) - 12);
      splitHit.setAttribute('width', Math.max(20, B[2] - A[0] + 8));
      splitHit.setAttribute('height', Math.abs(B[3] - A[1]) + 24);

      /* the route, still attached to the door wherever the door is */
      var thr = POS[ROUTE.at];
      var elbow = { x: thr.x + ROUTE.elbowOff.x, y: thr.y + ROUTE.elbowOff.y };
      var out   = { x: thr.x + ROUTE.outOff.x,   y: thr.y + ROUTE.outOff.y };
      ROUTE.legs.forEach(function (id, i) {
        var a = POS[id];
        routeLegs[i].setAttribute('d', 'M' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + ' L' + thr.x.toFixed(1) + ' ' + thr.y.toFixed(1));
      });
      var d = 'M' + thr.x.toFixed(1) + ' ' + thr.y.toFixed(1)
            + ' L' + elbow.x.toFixed(1) + ' ' + elbow.y.toFixed(1)
            + ' L' + out.x.toFixed(1) + ' ' + out.y.toFixed(1);
      routeScaffold.setAttribute('d', d); routeHit.setAttribute('d', d);
      var dx = out.x - elbow.x, dy = out.y - elbow.y, L = Math.hypot(dx, dy) || 1;
      var nx = -dy / L, ny = dx / L;
      routeRungs.forEach(function (e, k) {
        var f = (k + 1) / 5, px = elbow.x + dx * f, py = elbow.y + dy * f;
        e.setAttribute('x1', (px + nx * 5).toFixed(1)); e.setAttribute('y1', (py + ny * 5).toFixed(1));
        e.setAttribute('x2', (px - nx * 5).toFixed(1)); e.setAttribute('y2', (py - ny * 5).toFixed(1));
      });

      /* the pile moves clear of the spread */
      bandX = lerp(UNFINISHED_BAND.x, UNFINISHED_APART.x, sep);
      bandY = lerp(UNFINISHED_BAND.y, UNFINISHED_APART.y, sep);
      unfLabel.setAttribute('x', bandX - 10); unfLabel.setAttribute('y', bandY + 4);
      drawnUnfinished = -1;                    /* ticks are placed absolutely */
      paintUnfinished(lastUnfinished);

      /* the body dissolves as the parts leave it */
      gFig.setAttribute('opacity', Math.max(0, 1 - sep * 2.2).toFixed(3));
    }

    function setSeparation(t) {
      sep = Math.max(0, Math.min(1, t));
      computePositions();
      applyGeometry();
      fit();
    }

    /* ---------------------------------------------------------- the canvas */
    var W = 0, H = 0, sc = 1, ox = 0, oy = 0, dpr = 1;
    function fit() {
      var b = cv.parentElement.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      W = Math.max(1, b.width); H = Math.max(1, b.height);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sc = Math.min(W / FRAME.w, H / FRAME.h);
      ox = (W - FRAME.w * sc) / 2 - FRAME.x * sc;
      oy = (H - FRAME.h * sc) / 2 - FRAME.y * sc;
      /* Labels are drawn in model units, so a wider frame shrinks them on
         screen — at full separation on a phone that is about six pixels.
         Size them from the scale instead, and they hold steady. */
      var target = W < 520 ? 11.5 : 13;
      svg.style.setProperty('--labelsize', (target / sc).toFixed(2) + 'px');
    }
    var X = function (x) { return ox + x * sc; };
    var Y = function (y) { return oy + y * sc; };

    function swellRadius(id, loads) {
      var cap = PART_CAP[id] || 0;
      if (!cap) return 15;
      var f = Math.min(1.35, ((loads && loads[id]) || 0) / cap);
      return 15 * (1 + PARAMS.swellMax.value * f);
    }

    /* Isolate: everything not connected to the selection goes quiet. The
       canvas dims with the parts, or the load would stay bright on a dim body. */
    var focusKeep = null;
    function applyFocus(sel, keepSet) {
      focusKeep = keepSet;
      Object.keys(hit).forEach(function (id) {
        var off = !!keepSet && !keepSet[id];
        hit[id].classList.toggle('dim', off);
        hit[id].classList.toggle('sel', sel === id);
        if (wireVis[id]) {
          wireVis[id].classList.toggle('dim', off);
          wireVis[id].classList.toggle('sel', sel === id);
        }
      });
    }
    function litRegion(id) { return !focusKeep || !!focusKeep[id]; }

    var drawnUnfinished = -1, lastUnfinished = 0, bandX = UNFINISHED_BAND.x, bandY = UNFINISHED_BAND.y;
    function paintUnfinished(n) {
      lastUnfinished = n;
      if (n === drawnUnfinished) return;
      drawnUnfinished = n;
      while (unfTicks.firstChild) unfTicks.removeChild(unfTicks.firstChild);
      var B = UNFINISHED_BAND, perRow = Math.floor(B.w / B.gap), cap = perRow * B.rows;
      var shown = Math.min(n, cap);
      for (var i = 0; i < shown; i++) {
        var row = Math.floor(i / perRow), col = i % perRow;
        var x = bandX + col * B.gap, y = bandY + row * B.rowGap;
        unfTicks.appendChild(el('line', { class: 'unftick', x1: x, y1: y, x2: x, y2: y + B.tick }));
      }
      unfLabel.textContent = n ? (n + ' unfinished' + (n > cap ? ' (' + cap + ' shown)' : '')) : '';
    }

    /* August pushes the four body operations under; September locks them. */
    function setSealedState(map) {
      sealedState = map || {};
      S.sealed.forEach(function (s) {
        var st = sealedState[s.id] || '';
        gSealed[s.id].classList.toggle('recede', st === 'recede');
        gSealed[s.id].classList.toggle('locked', st === 'locked');
      });
      computePositions(); applyGeometry();
    }

    function paintRoute(state) {
      gRoute.classList.toggle('armed', state === 'armed');
      gRoute.classList.toggle('open', state === 'open');
    }

    function paintRegions(loads, pr, hot) {
      S.regions.forEach(function (r) {
        var n = gRegion[r.id];
        n.querySelector('.rbody').setAttribute('r', swellRadius(r.id, loads).toFixed(2));
        var cap = PART_CAP[r.id] || 0;
        var full = cap ? (loads[r.id] || 0) / cap : 0;
        n.classList.toggle('full', full >= 0.92 && hot);
      });
    }

    /* Load at rest sits inside an ink part, where a metal dot would be
       invisible, so it is drawn as paper — the part reads as full of holes.
       Load in motion is on the paper between parts, where the metal accent
       reads, and that is the load you can actually watch move. */
    function drawParts(model, loads, pr, hot) {
      cx.clearRect(0, 0, W, H);
      var P = model.parts(), R = model.regions;
      var rest = 2.4 * sc, move = 3.1 * sc;
      if (rest < 1.1) rest = 1.1;
      if (move < 1.4) move = 1.4;
      var i, q, x, y;

      cx.fillStyle = 'rgba(239,233,221,.55)';
      for (i = 0; i < P.length; i++) {
        q = P[i];
        if (q.b !== -1) continue;
        var id = R[q.a].id, c = POS[id];
        cx.globalAlpha = litRegion(id) ? 1 : 0.13;
        var spread = swellRadius(id, loads) * 0.74 * q.rr;
        x = c.x + Math.cos(q.ang) * spread;
        y = c.y + Math.sin(q.ang) * spread * 0.85;
        cx.beginPath(); cx.arc(X(x), Y(y), rest, 0, 6.2832); cx.fill();
      }
      cx.globalAlpha = 1;

      cx.fillStyle = hot ? 'rgba(140,58,36,.95)' : 'rgba(154,107,20,.92)';
      for (i = 0; i < P.length; i++) {
        q = P[i];
        if (q.b === -1 || q.b === MODEL.OUT) continue;
        var a = POS[R[q.a].id], b = POS[R[q.b].id];
        x = a.x + (b.x - a.x) * q.prog;
        y = a.y + (b.y - a.y) * q.prog;
        cx.globalAlpha = (litRegion(R[q.a].id) || litRegion(R[q.b].id)) ? 1 : 0.13;
        cx.beginPath(); cx.arc(X(x), Y(y), move, 0, 6.2832); cx.fill();
      }
      cx.globalAlpha = 1;

      /* what is leaving, on its way out through the scaffolding */
      cx.fillStyle = 'rgba(154,107,20,.95)';
      var t0 = POS[ROUTE.at];
      var e = { x: t0.x + ROUTE.elbowOff.x, y: t0.y + ROUTE.elbowOff.y };
      var o = { x: t0.x + ROUTE.outOff.x,   y: t0.y + ROUTE.outOff.y };
      for (i = 0; i < P.length; i++) {
        q = P[i];
        if (q.b !== MODEL.OUT) continue;
        var f = q.prog, px, py;
        if (f < 0.42) { var g = f / 0.42; px = t0.x + (e.x - t0.x) * g; py = t0.y + (e.y - t0.y) * g; }
        else { var g2 = (f - 0.42) / 0.58; px = e.x + (o.x - e.x) * g2; py = e.y + (o.y - e.y) * g2; }
        cx.globalAlpha = f > 0.75 ? Math.max(0, (1 - f) / 0.25) : 1;
        cx.beginPath(); cx.arc(X(px), Y(py), move * 1.15, 0, 6.2832); cx.fill();
      }
      cx.globalAlpha = 1;
    }

    /* Reduced motion: the model still runs. Only the dust stops. */
    function drawStill() { cx.clearRect(0, 0, W, H); }

    applyGeometry();
    fit();
    return {
      fit: fit, drawParts: drawParts, drawStill: drawStill, paintRegions: paintRegions,
      paintUnfinished: paintUnfinished, paintRoute: paintRoute, applyFocus: applyFocus,
      setSeparation: setSeparation, separation: function () { return sep; },
      setSealedState: setSealedState,
      hit: hit, regionEl: gRegion, sealedEl: gSealed, wireEl: gWire,
    };
  }

  return { build: build };
})();
