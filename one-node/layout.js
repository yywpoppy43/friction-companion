/* one node — layout.
 *
 * Geometry only. Every coordinate here is ported verbatim from
 * explode-prototype.html, re-keyed from the prototype's short ids to the
 * content-source ids. This file carries no claims about the person: nothing
 * here is content, and nothing in data/node.js is layout.
 *
 * Loaded as a plain script so index.html opens from the filesystem.
 */

/* svg viewBox: 0 0 900 640 */
var STAGE = { w: 900, h: 640 };

/* a = assembled position, e = exploded position, lbl = label offset. */
var GEOM = {
  'region.head':     { shape: 'tri',      a: { x: 450, y: 70  }, e: { x: 170, y: 170 }, lbl: { x:  34, y:   5, anchor: 'start'  } },
  'region.mind':     { shape: 'tridown',  a: { x: 450, y: 140 }, e: { x: 170, y: 280 }, lbl: { x:  34, y:   5, anchor: 'start'  } },
  'region.throat':   { shape: 'square',   a: { x: 450, y: 218 }, e: { x: 420, y: 300 }, lbl: { x:   0, y:  44, anchor: 'middle' } },
  'region.identity': { shape: 'diamond',  a: { x: 450, y: 305 }, e: { x: 640, y: 250 }, lbl: { x: -34, y: -24, anchor: 'end'    } },
  'region.will':     { shape: 'trismall', a: { x: 532, y: 340 }, e: { x: 760, y: 210 }, lbl: { x:  28, y:   5, anchor: 'start'  } },
  'region.instinct': { shape: 'trileft',  a: { x: 335, y: 400 }, e: { x: 560, y: 360 }, lbl: { x: -32, y:  32, anchor: 'middle' } },
  'region.engine':   { shape: 'square',   a: { x: 450, y: 415 }, e: { x: 690, y: 380 }, lbl: { x:   0, y:  44, anchor: 'middle' } },
  'region.emotion':  { shape: 'triright', a: { x: 568, y: 415 }, e: { x: 820, y: 440 }, lbl: { x:  30, y:  32, anchor: 'middle' } },
  'region.pressure': { shape: 'square',   a: { x: 450, y: 525 }, e: { x: 640, y: 500 }, lbl: { x:   0, y:  44, anchor: 'middle' } },
};

/* off = offset from the host region's assembled position; e = where it drifts. */
var SEALED_GEOM = {
  'sealed.precise-naming':     { off: { x: -15, y: 15 }, e: { x:  90, y: 420 } },
  'sealed.demonstrated-craft': { off: { x:  15, y: 15 }, e: { x: 140, y: 520 } },
  'sealed.completion':         { off: { x:  15, y: 15 }, e: { x: 830, y: 580 } },
  'sealed.resource-direction': { off: { x: -15, y: 15 }, e: { x: 560, y: 590 } },
  'sealed.begin-experience':   { off: { x: -15, y: 15 }, e: { x: 240, y: 560 } },
  'sealed.mutate-in-limit':    { off: { x:  15, y: 15 }, e: { x: 350, y: 585 } },
  'sealed.melancholy-swing':   { off: { x: -16, y: 12 }, e: { x: 830, y: 100 } },
  'sealed.principles':         { off: { x:   0, y: 19 }, e: { x: 720, y:  80 } },
  'sealed.social-openness':    { off: { x:  16, y: 12 }, e: { x: 860, y: 330 } },
  'sealed.material-control':   { off: { x:   0, y: 17 }, e: { x:  60, y: 300 } },
};

/* The faint figure the parts sit on. Fades as the dial moves. */
var GHOST = [
  { el: 'ellipse', cx: 450, cy: 64, rx: 31, ry: 35 },
  { el: 'path', d: 'M402 106 C 366 114, 350 168, 354 260 C 358 350, 364 420, 376 486 L 376 600 L 524 600 L 524 486 C 536 420, 542 350, 546 260 C 550 168, 534 114, 498 106 Z' },
];

function shapePath(shape) {
  var s = 24;
  switch (shape) {
    case 'tri':      return 'M0 ' + (-s) + ' L' + s + ' ' + (s * 0.75) + ' L' + (-s) + ' ' + (s * 0.75) + ' Z';
    case 'tridown':  return 'M' + (-s) + ' ' + (-s * 0.75) + ' L' + s + ' ' + (-s * 0.75) + ' L0 ' + s + ' Z';
    case 'trismall': return 'M0 ' + (-s * 0.8) + ' L' + (s * 0.8) + ' ' + (s * 0.6) + ' L' + (-s * 0.8) + ' ' + (s * 0.6) + ' Z';
    case 'trileft':  return 'M' + (-s) + ' 0 L' + (s * 0.8) + ' ' + (-s) + ' L' + (s * 0.8) + ' ' + s + ' Z';
    case 'triright': return 'M' + s + ' 0 L' + (-s * 0.8) + ' ' + (-s) + ' L' + (-s * 0.8) + ' ' + s + ' Z';
    case 'diamond':  return 'M0 ' + (-s * 1.15) + ' L' + s + ' 0 L0 ' + (s * 1.15) + ' L' + (-s) + ' 0 Z';
    default:         return 'M' + (-s) + ' ' + (-s) + ' L' + s + ' ' + (-s) + ' L' + s + ' ' + s + ' L' + (-s) + ' ' + s + ' Z';
  }
}
