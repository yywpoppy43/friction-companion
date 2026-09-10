/* one node — the machine. Weather.
 *
 * The machine is timeless. Weather is what changes its parameters, and this is
 * the layering doing real work: Hardware says here is the machine, Elements say
 * here is what this month does to it.
 *
 * Every month is a content-source id and every adjustment says which way the
 * source points and which part of it is a number I chose. The months are
 * solar-term months, not civil ones — the source is [firm] that September
 * turned on the 7th — so the ranges below are the source's own.
 *
 * Nothing here invents a month. When the readings run out, the layer says so.
 */

var WEATHER = {

  /* On for every month the machine can model. Not permanent: it ends roughly
     2029, which is the temporary side of a conflict her answer leaves open. */
  decade: {
    id: 'elements.decade',
    label: 'the decade, 2019 to about 2029',
    line: 'Resource dams output. The star that feeds her suppresses the star that expresses her — and it muddies rather than blocks, so it degrades the way out rather than closing it.',
    tags: ['firm'],
    effects: [{ k: 'exit', v: 1.35, text: 'output dammed, ×1.35 slower out',
                why: 'Grounded [firm] that resource dams output and muddies rather than blocks, so it degrades the route rather than shutting it. The size is illustrative.' }],
  },

  /* The year is a second persistent modifier over all of these months. The
     source describes it; the machine does not model it, and says so rather
     than inventing a mechanism for it. */
  year: {
    id: 'elements.year-2026',
    label: '2026',
    line: 'Doubled fire at full strength — a heavy pressure year, a forge year, but yang fire melts rather than shapes.',
    tags: ['read'],
    modelled: false,
  },

  order: ['elements.august', 'elements.september', 'elements.october', 'elements.november'],

  months: {
    'elements.august': {
      short: 'August', label: 'August 2026', word: 'filled',
      from: '2026-08-07', to: '2026-09-07', datesTag: 'firm',
      line: 'The water frame completes and generation surges — the full water structure, for the first time in years. Nothing drains: the frame fills the storehouses rather than opening them, and the wood goes further under.',
      quote: 'Maximum generation into a closed system feels exactly like being stuck, because that is what it is.',
      tags: ['firm', 'corrected'],
      effects: [
        { k: 'gen', v: 1.35, text: 'generation ×1.35',
          why: 'Grounded that generation surged when the water frame completed. The size is illustrative — the source does not say which of the four sources rose, so the rise is spread across all four.' },
        { k: 'sealed', v: 'recede', text: 'the four body operations recede',
          why: 'Grounded: the wood goes further under (`elements.wood-buried`, `convergence.four-operations`), and the wood is the four sealed body operations. How far they recede is a rendering choice.' },
      ],
    },

    'elements.september': {
      short: 'September', label: 'September 2026', word: 'binds',
      from: '2026-09-07', to: '2026-10-08', datesTag: 'firm',
      line: 'The forging fire arrives — the only month this year carrying it, and the exact element her own is prescribed and does not have. A route, once open, holds longer, because structure is supported. It does not drain better: the month is strong, defining, clarifying, and not draining. Flow belongs to October.',
      quote: 'Binding is not failure. It is a container. Free-running output is the current problem — water everywhere, landing nowhere.',
      quoteTag: 'hers',
      tags: ['firm', 'arguable', 'hers'],
      effects: [
        { k: 'hold', v: 1.6, text: 'the route holds ×1.6 longer',
          why: 'Grounded [firm] that structure is supported this month and that the deposit design is this element constructed (`convergence.deposit-is-yin-fire`). The size is illustrative.' },
        { k: 'gen', v: 1.12, text: 'generation ×1.12',
          why: 'An inference, not a claim. The source says her *element* is at its absolute peak, not that generation is. Metal generates water, so this follows — but it is [arguable] and the size is illustrative.',
          tag: 'arguable' },
        { k: 'sealed', v: 'locked', text: 'the four body operations lock',
          why: 'Grounded: the storehouses are locked, not opened, and the wood inside stays down. What locks is the wood — the four sealed body operations, not all ten. The pivot combination itself is [arguable].',
          tag: 'arguable' },
        { k: 'nodrain', v: true, text: 'the drain is not improved',
          why: 'Grounded and worth stating as an effect: the source says this month is *not draining*, and puts flow in October — build in the binding month, flow in the clashing one.' },
      ],
    },

    'elements.october': {
      short: 'October', label: 'October 2026', word: 'cracks',
      from: '2026-10-08', to: '2026-11-07', datesTag: null,
      line: 'The first month all year that opens rather than binds. The clash cracks the storehouses and a route opens on its own, with no deposit and no date. It is not a clean drain: the month’s stem is still resource and still dams water.',
      quote: 'A clash is disruptive by nature — expect movement, not comfort. Hold as a condition to watch for, not a schedule.',
      tags: ['uncertain', 'corrected', 'arguable'],
      effects: [
        { k: 'auto', v: true, text: 'a route opens on its own',
          why: 'Grounded that the clash opens what the other months bind. That it recurs on a fixed interval here is a rendering choice — the source is explicit that this is a condition to watch for, not a schedule.',
          tag: 'uncertain' },
        { k: 'exit', v: 1.55, text: 'and the drainage is not clean, ×1.55 slower',
          why: 'Grounded: the stem is still resource and still dams water, on top of the decade. The size is illustrative.' },
      ],
    },

    'elements.november': {
      short: 'November', label: 'November 2026', word: 'first sprout',
      from: '2026-11-07', to: '2026-12-07', datesTag: null,
      line: 'Damming continues at the stem. Wood is at its birth stage, and the element she lacks is hidden in the branch.',
      quote: 'First viable sprout — from earlier work, not re-derived in detail.',
      quoteTag: 'read',
      tags: ['read'],
      effects: [],
      nothing: 'The source gives this month a label and no more, so the machine changes nothing. Only the decade still applies.',
    },
  },

  /* The last monthly reading ends about December 7. There is no December
     block. At the year level there are still readings, at lower confidence. */
  lastMonthEnds: '2026-12-07',
  stale: 'No monthly reading past November 2026 — it ends about December 7. This layer needs a new deposit.',
  staleYear: 'At the year level the source still carries reads for 2027 and 2028 [read], and the decade turning around 2029 [uncertain]. Those are not months, and the machine does not model them.',
};
