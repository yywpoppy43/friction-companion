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

var VIEW_BOX = { x: 300, y: 8, w: 480, h: 618 };

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
        if (q.b === -1) continue;
        var a = REGION_XY[R[q.a].id], b = REGION_XY[R[q.b].id];
        x = a.x + (b.x - a.x) * q.prog;
        y = a.y + (b.y - a.y) * q.prog;
        cx.beginPath(); cx.arc(X(x), Y(y), move, 0, 6.2832); cx.fill();
      }
    }

    /* Reduced motion: the model still runs. Only the dust stops. */
    function drawStill() { cx.clearRect(0, 0, W, H); }

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
      hit: hit, regionEl: gRegion, sealedEl: gSealed, wireEl: gWire,
      toScreen: function (x, y) { return { x: X(x), y: Y(y) }; },
    };
  }

  return { build: build };
})();
