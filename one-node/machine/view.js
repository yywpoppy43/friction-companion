/* one node — the machine. The view.
 *
 * SVG carries every addressable thing: nine regions, six wires, ten sealed
 * capacities, the figure. Each is a real element with an id, a tabindex and a
 * label, so hover and keyboard come from the browser rather than from
 * hit-testing a bitmap. Canvas carries the load, because a few hundred moving
 * dots is what canvas is for.
 *
 * Both read the same viewBox, so they stay in register at any size.
 */

var VIEW_BOX = { x: 300, y: 8, w: 480, h: 652 };

var VIEWER = (function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  function el(n, a) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); return e; }

  function build(opts) {
    var svg = opts.svg, cv = opts.canvas, S = opts.structure, D = opts.data;
    var cx = cv.getContext('2d');
    var gRegion = {}, gSealed = {}, gWire = {}, hit = {};

    svg.setAttribute('viewBox', VIEW_BOX.x + ' ' + VIEW_BOX.y + ' ' + VIEW_BOX.w + ' ' + VIEW_BOX.h);

    var gFig = el('g', { class: 'figure' });
    FIGURE.forEach(function (d, i) {
      gFig.appendChild(el('path', { d: d, class: FIGURE_ARMS.indexOf(i) >= 0 ? 'fig arm' : 'fig' }));
    });
    svg.appendChild(gFig);

    /* wires under the parts */
    var gW = el('g', { class: 'wires' });
    S.wires.forEach(function (w) {
      var a = REGION_XY[w.a], b = REGION_XY[w.b];
      gW.appendChild(el('line', { class: 'wire', x1: a.x, y1: a.y, x2: b.x, y2: b.y }));
      var h = el('line', { class: 'wirehit', x1: a.x, y1: a.y, x2: b.x, y2: b.y,
                           tabindex: '0', role: 'button', 'aria-label': w.name });
      gW.appendChild(h);
      gWire[w.id] = h; hit[w.id] = h;
    });
    svg.appendChild(gW);

    /* sealed capacities: drawn full, and attached to nothing.
       §1.4 — present as pressure, absent as mechanism. */
    var gS = el('g', { class: 'sealeds' });
    S.sealed.forEach(function (s) {
      var g = SEALED_XY[s.id], host = REGION_XY[g.r];
      var x = host.x + g.dx, y = host.y + g.dy;
      var n = el('g', { class: 'sealed', transform: 'translate(' + x + ' ' + y + ')',
                        tabindex: '0', role: 'button', 'aria-label': s.name });
      n.appendChild(el('circle', { class: 'shit', r: 15 }));
      n.appendChild(el('circle', { class: 'sring', r: 10.5 }));
      n.appendChild(el('circle', { class: 'sdot',  r: 5.2 }));
      gS.appendChild(n); gSealed[s.id] = n; hit[s.id] = n;
    });

    /* The deposit route. Not a wire: the three legs are the routes the missing
       capacity would complete, and the piece beyond the outlet is scaffolding —
       external, built, and touching nothing in the mind island. */
    var gRoute = el('g', { class: 'route', tabindex: '0', role: 'button',
                           'aria-label': 'The deposit route' });
    var thr = REGION_XY[ROUTE.at];
    ROUTE.legs.forEach(function (id) {
      var a = REGION_XY[id];
      gRoute.appendChild(el('path', { class: 'leg',
        d: 'M' + a.x + ' ' + a.y + ' L' + thr.x + ' ' + thr.y }));
    });
    gRoute.appendChild(el('path', { class: 'scaffold',
      d: 'M' + thr.x + ' ' + thr.y + ' L' + ROUTE.elbow.x + ' ' + ROUTE.elbow.y +
         ' L' + ROUTE.out.x + ' ' + ROUTE.out.y }));
    /* rungs, so the external piece reads as built rather than drawn */
    (function () {
      var ax = ROUTE.elbow.x, ay = ROUTE.elbow.y, bx = ROUTE.out.x, by = ROUTE.out.y;
      var dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
      for (var k = 1; k <= 4; k++) {
        var f = k / 5, cxp = ax + dx * f, cyp = ay + dy * f;
        gRoute.appendChild(el('line', { class: 'rung',
          x1: cxp + nx * 5, y1: cyp + ny * 5, x2: cxp - nx * 5, y2: cyp - ny * 5 }));
      }
    })();
    gRoute.appendChild(el('path', { class: 'routehit',
      d: 'M' + thr.x + ' ' + thr.y + ' L' + ROUTE.elbow.x + ' ' + ROUTE.elbow.y +
         ' L' + ROUTE.out.x + ' ' + ROUTE.out.y }));
    svg.appendChild(gRoute);
    hit['route'] = gRoute;

    /* Unfinished things. Started, relieving, and never leaving. */
    var gUnf = el('g', { class: 'unfinished', tabindex: '0', role: 'button',
                         'aria-label': 'Unfinished things' });
    var unfTicks = el('g', {});
    var unfLabel = el('text', { class: 'unflabel', x: UNFINISHED_BAND.x - 10,
                                y: UNFINISHED_BAND.y + 4, 'text-anchor': 'end' });
    gUnf.appendChild(unfTicks); gUnf.appendChild(unfLabel);
    svg.appendChild(gUnf);
    hit['unfinished'] = gUnf;

    /* regions */
    var gR = el('g', { class: 'regions' });
    S.regions.forEach(function (r) {
      var pos = REGION_XY[r.id], lab = REGION_LABEL[r.id];
      var n = el('g', { class: 'region ' + r.state + (r.island ? ' isle-' + r.island : ' isle-none'),
                        transform: 'translate(' + pos.x + ' ' + pos.y + ')',
                        tabindex: '0', role: 'button', 'aria-label': r.name });
      n.appendChild(el('circle', { class: 'rhit', r: 30 }));
      n.appendChild(el('circle', { class: 'rbody', r: 15 }));
      var t = el('text', { class: 'rlabel', x: lab.dx, y: lab.dy, 'text-anchor': lab.anchor });
      t.textContent = r.name;
      n.appendChild(t);
      gR.appendChild(n); gRegion[r.id] = n; hit[r.id] = n;
    });
    svg.appendChild(gS);
    svg.appendChild(gR);

    /* ---------------------------------------------------------- the canvas */
    var W = 0, H = 0, sc = 1, ox = 0, oy = 0, dpr = 1;
    function fit() {
      var b = cv.parentElement.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      W = Math.max(1, b.width); H = Math.max(1, b.height);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sc = Math.min(W / VIEW_BOX.w, H / VIEW_BOX.h);
      ox = (W - VIEW_BOX.w * sc) / 2 - VIEW_BOX.x * sc;
      oy = (H - VIEW_BOX.h * sc) / 2 - VIEW_BOX.y * sc;
    }
    var X = function (x) { return ox + x * sc; };
    var Y = function (y) { return oy + y * sc; };

    function swellRadius(id, loads) {
      var cap = PART_CAP[id] || 0;
      if (!cap) return 15;
      var f = Math.min(1.35, (loads[id] || 0) / cap);
      return 15 * (1 + PARAMS.swellMax.value * f);
    }

    /* Load at rest sits inside an ink part, where a metal dot would be
       invisible, so it is drawn as paper — the part reads as full of holes.
       Load in motion is on the paper between parts, where the metal accent
       reads, and that is the load you can actually watch move. */
    function drawParts(model, loads, pr, hot) {
      cx.clearRect(0, 0, W, H);
      var P = model.parts(), R = model.regions;
      var rest = 2.4 * sc, move = 3.1 * sc;      /* model units, like the parts */
      if (rest < 1.1) rest = 1.1;
      if (move < 1.4) move = 1.4;
      var restFill = 'rgba(239,233,221,.55)';
      var moveFill = hot ? 'rgba(140,58,36,.95)' : 'rgba(154,107,20,.92)';
      var i, q, x, y;

      cx.fillStyle = restFill;
      for (i = 0; i < P.length; i++) {
        q = P[i];
        if (q.b !== -1) continue;
        var id = R[q.a].id, c = REGION_XY[id];
        var spread = swellRadius(id, loads) * 0.74 * q.rr;
        x = c.x + Math.cos(q.ang) * spread;
        y = c.y + Math.sin(q.ang) * spread * 0.85;
        cx.beginPath(); cx.arc(X(x), Y(y), rest, 0, 6.2832); cx.fill();
      }

      cx.fillStyle = moveFill;
      for (i = 0; i < P.length; i++) {
        q = P[i];
        if (q.b === -1 || q.b === MODEL.OUT) continue;
        var a = REGION_XY[R[q.a].id], b = REGION_XY[R[q.b].id];
        x = a.x + (b.x - a.x) * q.prog;
        y = a.y + (b.y - a.y) * q.prog;
        cx.beginPath(); cx.arc(X(x), Y(y), move, 0, 6.2832); cx.fill();
      }

      /* what is leaving, on its way out through the scaffolding */
      cx.fillStyle = 'rgba(154,107,20,.95)';
      var t0 = REGION_XY[ROUTE.at], e = ROUTE.elbow, o = ROUTE.out;
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

    var drawnUnfinished = -1;
    function paintUnfinished(n) {
      if (n === drawnUnfinished) return;
      drawnUnfinished = n;
      while (unfTicks.firstChild) unfTicks.removeChild(unfTicks.firstChild);
      var B = UNFINISHED_BAND, perRow = Math.floor(B.w / B.gap), cap = perRow * B.rows;
      var shown = Math.min(n, cap);
      for (var i = 0; i < shown; i++) {
        var row = Math.floor(i / perRow), col = i % perRow;
        var x = B.x + col * B.gap, y = B.y + row * B.rowGap;
        unfTicks.appendChild(el('line', { class: 'unftick', x1: x, y1: y, x2: x, y2: y + B.tick }));
      }
      unfLabel.textContent = n ? (n + ' unfinished' + (n > cap ? ' (' + cap + ' shown)' : '')) : '';
    }

    function paintRoute(state) {
      gRoute.classList.toggle('armed', state === 'armed');
      gRoute.classList.toggle('open', state === 'open');
    }

    function paintRegions(loads, pr, hot) {
      S.regions.forEach(function (r) {
        var n = gRegion[r.id];
        var body = n.querySelector('.rbody');
        body.setAttribute('r', swellRadius(r.id, loads).toFixed(2));
        var cap = PART_CAP[r.id] || 0;
        var full = cap ? (loads[r.id] || 0) / cap : 0;
        n.classList.toggle('full', full >= 0.92 && hot);
      });
    }

    fit();
    return {
      fit: fit, drawParts: drawParts, drawStill: drawStill, paintRegions: paintRegions,
      paintUnfinished: paintUnfinished, paintRoute: paintRoute,
      hit: hit, regionEl: gRegion, sealedEl: gSealed, wireEl: gWire,
      toScreen: function (x, y) { return { x: X(x), y: Y(y) }; },
    };
  }

  return { build: build };
})();
