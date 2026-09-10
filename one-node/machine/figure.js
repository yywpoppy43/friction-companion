/* one node — the machine. Geometry.
 *
 * Coordinates only. No claims. The figure and the region positions are ported
 * from the-machine.html; the sealed offsets likewise, re-keyed from its short
 * names to content-source ids. Nothing here is content and nothing in
 * data/node.js is geometry.
 */

var VIEW = { w: 1080, h: 620 };

var REGION_XY = {
  'region.head':     { x: 540, y:  78 },
  'region.mind':     { x: 540, y: 150 },
  'region.throat':   { x: 540, y: 212 },
  'region.identity': { x: 540, y: 300 },
  'region.will':     { x: 640, y: 270 },
  'region.instinct': { x: 412, y: 352 },
  'region.engine':   { x: 540, y: 376 },
  'region.emotion':  { x: 672, y: 376 },
  'region.pressure': { x: 540, y: 462 },
};

/* label placement, so names clear the shapes and each other */
var REGION_LABEL = {
  'region.head':     { dx:  34, dy:   4, anchor: 'start'  },
  'region.mind':     { dx:  34, dy:   4, anchor: 'start'  },
  'region.throat':   { dx:   0, dy: -26, anchor: 'middle' },
  'region.identity': { dx: -34, dy:   4, anchor: 'end'    },
  'region.will':     { dx:  32, dy:   4, anchor: 'start'  },
  'region.instinct': { dx: -32, dy:   4, anchor: 'end'    },
  'region.engine':   { dx:   0, dy:  40, anchor: 'middle' },
  'region.emotion':  { dx: -34, dy:   4, anchor: 'end'    },
  'region.pressure': { dx:   0, dy:  60, anchor: 'middle' },
};

var SEALED_XY = {
  'sealed.begin-experience':   { r: 'region.pressure', dx: -58, dy:  34 },
  'sealed.mutate-in-limit':    { r: 'region.pressure', dx:  58, dy:  34 },
  'sealed.resource-direction': { r: 'region.engine',   dx: -74, dy:  26 },
  'sealed.completion':         { r: 'region.engine',   dx:  74, dy:  26 },
  'sealed.precise-naming':     { r: 'region.throat',   dx: -62, dy:  -6 },
  'sealed.demonstrated-craft': { r: 'region.throat',   dx:  62, dy:  -6 },
  'sealed.material-control':   { r: 'region.will',     dx:  52, dy: -24 },
  'sealed.melancholy-swing':   { r: 'region.emotion',  dx:  54, dy: -22 },
  'sealed.principles':         { r: 'region.emotion',  dx:  62, dy:  10 },
  'sealed.social-openness':    { r: 'region.emotion',  dx:  54, dy:  42 },
};

/* --------------------------------------------------------------- separated
 * The diagnostic view. Wired parts stay together, so the two islands become
 * two clusters with real space between them; the outlet floats alone in that
 * space, connected to neither; emotion sits off to the side, in neither; and
 * the ten sealed capacities let go and drift to the edges.
 * Positions only — the same claim the assembled view makes, spread out. */
var REGION_APART = {
  'region.head':     { x: 330, y:  90 },   /* the mind: two parts, one wire */
  'region.mind':     { x: 330, y: 190 },
  'region.throat':   { x: 430, y: 275 },   /* alone in the gap */
  'region.identity': { x: 620, y: 380 },   /* the body: five parts, five wires */
  'region.will':     { x: 760, y: 300 },
  'region.instinct': { x: 490, y: 440 },
  'region.engine':   { x: 620, y: 490 },
  'region.emotion':  { x: 880, y: 520 },   /* off to the side, in neither */
  'region.pressure': { x: 540, y: 580 },
};

var SEALED_APART = {
  'sealed.precise-naming':     { x: 210, y: 320 },
  'sealed.demonstrated-craft': { x: 220, y: 415 },
  'sealed.material-control':   { x: 890, y: 170 },
  'sealed.melancholy-swing':   { x: 940, y: 330 },
  'sealed.principles':         { x: 955, y: 445 },
  'sealed.social-openness':    { x: 930, y: 625 },
  'sealed.resource-direction': { x: 775, y: 615 },
  'sealed.completion':         { x: 845, y: 660 },
  'sealed.begin-experience':   { x: 350, y: 620 },
  'sealed.mutate-in-limit':    { x: 660, y: 650 },
};

/* the gap the split marks, once the gap is real */
var SPLIT_APART = { a: [410, 212, 505, 212], b: [535, 335, 625, 335] };
var UNFINISHED_APART = { x: 190, y: 675 };

/* the body the parts sit on */
var FIGURE = [
  'M540 24 c16 0 29 15 29 35 0 22-13 40-29 40 s-29-18-29-40 c0-20 13-35 29-35 Z',
  'M526 96 h28 v18 h-28 Z',
  'M540 108 c28 0 51 6 60 17 10 12 13 36 12 66 -1 28-5 58-9 84 -3 21-5 43-6 62 l-114 0 c-1-19-3-41-6-62 -4-26-8-56-9-84 -1-30 2-54 12-66 9-11 32-17 60-17 Z',
  'M486 118 c-14 9-21 32-26 71 -3 32-6 66-8 96 -1 15-2 28-3 38 l17 2 c1-11 3-24 4-38 3-30 6-64 10-94 4-28 9-51 17-64 Z',
  'M594 118 c14 9 21 32 26 71 3 32 6 66 8 96 1 15 2 28 3 38 l-17 2 c-1-11-3-24-4-38 -3-30-6-64-10-94 -4-28-9-51-17-64 Z',
  'M485 340 c2 70 5 148 6 218 l0 42 h43 l1-42 c1-70 3-148 4-218 Z',
  'M595 340 c-2 70-5 148-6 218 l0 42 h-43 l-1-42 c-1-70-3-148-4-218 Z',
];
var FIGURE_ARMS = [3, 4];      /* drawn a shade darker so the arms read */

/* Where the deposit route will attach when phase 2 builds it. Drawn in phase 1
   only as the empty slot on the timeline — the mechanism visible before it is
   live. Grounded by missing-piece.now: the routes into the outlet lead from
   identity, engine and instinct, which is why the body can reach it and the
   mind cannot. */
/* the camera pulls back to hold the spread */
var VIEW_APART = { x: 170, y: 8, w: 800, h: 700 };

var ROUTE = {
  /* the three legs the missing capacity would wire, per missing-piece.now */
  legs: ['region.identity', 'region.engine', 'region.instinct'],
  at: 'region.throat',
  /* and the scaffolding beyond it: away from the body, and nowhere near the
     mind island, which it must not touch */
  /* offsets from the outlet, so the scaffolding stays attached to the door
     wherever the door ends up */
  elbowOff: { x: -88, y: -16 },
  outOff:   { x: -188, y: 2 },
};

/* Unfinished things pile up below the feet and never leave. */
var UNFINISHED_BAND = { x: 402, y: 622, w: 276, rows: 3, gap: 8, rowGap: 11, tick: 8 };
