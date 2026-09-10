/* one node — the machine. Illustrative parameters.
 *
 * Every number the machine runs on that is NOT a claim from content-source.md
 * lives here, with the word "illustrative" attached to it. SPEC §4/§11: every
 * behaviour is either grounded (cites an id) or illustrative (labelled). There
 * is no third category, and nothing grounded is configurable from this file.
 *
 * Loaded as a plain script so machine.html opens from the filesystem.
 */

var PARAMS = {
  /* --- the anchor -------------------------------------------------------- */
  thresholdPct: {
    value: 70, min: 20, max: 95, step: 1, unit: '%',
    label: 'Frustration threshold',
    note: 'The source names the signal, never a level. `not-self` measures whether pressure is moving, not how much there is.',
  },
  capacityTotal: {
    value: 135, min: 60, max: 260, step: 5, unit: 'units',
    label: 'Total capacity',
    note: 'How much the whole holds before the gauge reads full. Model units are model units.',
  },

  /* --- generation -------------------------------------------------------- */
  genEngine: {
    value: 0.92, min: 0, max: 2, step: 0.02, unit: '/s',
    label: 'The work engine generates',
    note: 'Engine-first is a reading, not a claim. The source lists the four sources flat and never ranks them.',
  },
  genPressure: { value: 0.64, min: 0, max: 2, step: 0.02, unit: '/s', label: 'Pressure and drive generates', note: 'Relative rate. Illustrative.' },
  genHead:     { value: 0.64, min: 0, max: 2, step: 0.02, unit: '/s', label: 'Mental pressure generates',   note: 'Relative rate. Illustrative.' },
  genWill:     { value: 0.46, min: 0, max: 2, step: 0.02, unit: '/s', label: 'Will and worth generates',    note: 'Relative rate. Illustrative.' },

  /* --- the vent ---------------------------------------------------------- */
  ventRate: {
    value: 0.0231, min: 0, max: 0.08, step: 0.001, unit: '/unit/s',
    label: 'Passive vent',
    note: 'Grounded that it happens and leaves nothing (`mechanism.discharge-without-residue`). The rate is not. Modelled as continuous where the source describes talk as episodic, and applied to both islands: evaporation is not a wire, so it does not cross the split.',
  },

  /* --- circulation ------------------------------------------------------- */
  dwellMin:   { value: 1.5, min: 0.2, max: 8, step: 0.1, unit: 's', label: 'Dwell in a part, shortest', note: 'How long load rests before moving. Illustrative.' },
  dwellMax:   { value: 4.5, min: 0.3, max: 14, step: 0.1, unit: 's', label: 'Dwell in a part, longest',  note: 'Illustrative.' },
  transitMin: { value: 1.5, min: 0.3, max: 8, step: 0.1, unit: 's', label: 'Time to cross a wire, fastest', note: 'That load travels along a wire at all is a rendering choice — the source says wires connect, never that anything is carried.' },
  transitMax: { value: 2.5, min: 0.4, max: 12, step: 0.1, unit: 's', label: 'Time to cross a wire, slowest', note: 'Illustrative.' },

  /* --- the coupling she answered ----------------------------------------- */
  mindBase: {
    value: 0.30, min: 0, max: 1.5, step: 0.05, unit: '×',
    label: 'Mind circling at zero pressure',
    note: 'That the circling quiets when something gets out is hers and grounded (`split`, her answer of September 10 2026). How much it quiets is not.',
  },
  mindGain: {
    value: 1.40, min: 0, max: 4, step: 0.05, unit: '×',
    label: 'Mind circling, added at full pressure',
    note: 'The size of the coupling. Illustrative.',
  },

  /* --- rendering --------------------------------------------------------- */
  swellMax: { value: 0.55, min: 0, max: 1.2, step: 0.05, unit: '×', label: 'How much a full part swells', note: 'Rendering. Illustrative.' },
};

/* Per-part swell points, calibrated from a measured equilibrium run so that the
   parts fill in step with the gauge rather than at random. Occupancy follows
   wire count under uniform wire choice — itself an illustrative choice. */
var PART_CAP = {
  'region.head': 11, 'region.mind': 10,
  'region.identity': 17, 'region.instinct': 17, 'region.engine': 13,
  'region.will': 7, 'region.pressure': 7,
  'region.throat': 0, 'region.emotion': 0,
};

/* Assumptions with no number attached — shown in the same panel so the list of
   modelling choices is complete rather than only the adjustable ones. */
var STATED_ASSUMPTIONS = [
  'Load travelling along a wire is a rendering choice. The source says wires connect two regions; it never says anything is carried along them.',
  'Generation runs flat. `region.pressure` describes periods where pressure builds and drives hard, then drops — the machine has no such rhythm.',
  'Wire choice is uniform, so occupancy follows wire count. The hub parts hold the most because they have the most wires, not because the source says so.',
  'The vent is continuous. The source describes talking, testing, working assets — events, not a leak.',
  'The vent applies to both islands. Evaporation is not a wire and not a route to the outlet, so it does not cross the split, but the source does not say where it happens.',
  'This machine has no outside. `gap.environment`: Hardware has no outside world. Emotion takes in the room and amplifies it, and none of that can appear here.',
  'One model unit is one model unit. No number here is a fact about her.',
];
