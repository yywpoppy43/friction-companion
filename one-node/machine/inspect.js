/* one node — the machine. Inspection.
 *
 * Hover is one line. This is the other level: the full entry for a part, out
 * of data/node.js, with nothing from the content source dropped. Every field,
 * every confidence tag, the source as recorded, and the connections.
 *
 * SPEC §7 and §11. Two rules do most of the work here:
 *   nothing is invented — a part whose source names only a conversation turn
 *     shows that turn and claims no system; a source recorded once for a group
 *     says so and names the group; a claim with no tag is shown as untagged
 *   nothing is flattened — the content source uses ten tag forms where it
 *     declares six, and compound forms render whole
 */

var INSPECT = (function () {
  'use strict';

  var BY = {}, ON = {}, PLACED = {}, view = null, onSelect = null;
  var selected = null, isolated = false;

  /* ------------------------------------------------------------------ text */
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  /* An id in backticks becomes the plain-language name of the part it points
     at — the same referent, in the file's own vocabulary. Tags are pulled out
     separately and rendered as tags, not left as literal brackets in prose. */
  var BARE_ID = /\b((?:region|wire|sealed|mechanism|design|convergence|conflict|elements|gap|interface|software|deposit|missing-piece)\.[a-z0-9-]+)\b/g;
  function inline(s) {
    return esc(s)
      .replace(/`\[[^\]]+\]`\s*(—\s*)?/g, '')
      .replace(/`([^`]+)`/g, function (_, code) {
        var p = BY[code];
        return p ? '<span class="ref">' + esc(p.name) + '</span>'
                 : '<span class="lit">' + code + '</span>';
      })
      .replace(BARE_ID, function (m) {
        return BY[m] ? '<span class="ref">' + esc(BY[m].name) + '</span>' : m;
      })
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }
  function plain(s) {
    return String(s).replace(/`\[[^\]]+\]`/g, '')
      .replace(/`([^`]+)`/g, function (_, c) { return BY[c] ? BY[c].name : c; })
      .replace(BARE_ID, function (m) { return BY[m] ? BY[m].name : m; })
      .replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')
      .replace(/\s+/g, ' ').trim();
  }
  function firstSentence(s, cap) {
    s = plain(s);
    var m = /^(.{20,}?[.!?])(\s|$)/.exec(s);
    var out = m ? m[1] : s;
    if (out.length > (cap || 190)) out = out.slice(0, (cap || 190)).replace(/\s+\S*$/, '') + '…';
    return out;
  }

  /* ------------------------------------------------------------------ tags */
  function tagHtml(t) {
    var cls = 'tagchip' + (t.pending ? ' owed' : '');
    var title = t.note ? plain(t.note) : '';
    return '<span class="' + cls + '"' + (title ? ' title="' + esc(title) + '"' : '') + '>['
         + esc(t.raw) + ']</span>';
  }

  /* ---------------------------------------------------------------- source */
  /* Recorded, never inferred. */
  function sourceHtml(p) {
    if (!p.source) {
      return '<div class="src"><span class="srcnone">No source recorded for this part.</span></div>';
    }
    var s = p.source, bits = [];
    if (s.systems.length) bits.push('<b>' + s.systems.map(esc).join(' + ') + '</b>');
    else bits.push('<span class="srcnone">no system recorded</span>');
    if (s.turns.length) bits.push(s.turns.map(esc).join(' · '));
    var inh = s.inherited
      ? '<div class="srcinh">Recorded once for the group “' + esc(s.group || '') + '”, not for this part on its own.</div>'
      : '';
    return '<div class="src"><span class="srclab">Source</span> ' + bits.join(' · ') + inh + '</div>';
  }

  /* ----------------------------------------------------------------- kinds */
  function kindLine(p) {
    if (p.kind === 'region') {
      var where = p.island ? 'island ' + p.island + ' (' + p.islandNote + ')' : p.islandNote;
      return 'Region · ' + p.state + ' · ' + where;
    }
    if (p.kind === 'wire')   return 'Wire · ' + p.circuitry + ' circuitry';
    if (p.kind === 'sealed') return 'Sealed capacity · no wire';
    if (p.id === 'split')    return 'The gap between the two islands';
    return p.layer.charAt(0).toUpperCase() + p.layer.slice(1);
  }

  /* The content source heads this block "Definition — split", so its short name
     is "Definition", which says nothing on a chip. The machine calls the
     element what the spec calls it. */
  var CHIP_LABEL = { 'split': 'The split' };
  function chipLabel(id) { return CHIP_LABEL[id] || BY[id].name; }

  /* --------------------------------------------------------------- connect */
  /* Structural adjacency the graph does not carry — a wire never lists its own
     two regions in `connects to`, and a sealed capacity never lists the region
     that would complete it. */
  function structural(id) {
    var p = BY[id], out = [];
    if (p.kind === 'wire') { out.push(p.a, p.b); }
    if (p.kind === 'sealed') { out.push(p.region, p.completesAt); }
    Object.keys(PLACED).forEach(function (o) {
      var q = BY[o];
      if (!q) return;
      /* a wire that touches this region brings the region at its far end with
         it — being wired to something is the connection */
      if (q.kind === 'wire' && (q.a === id || q.b === id)) out.push(o, q.a, q.b);
      if (q.kind === 'sealed' && (q.region === id || q.completesAt === id)) out.push(o);
    });
    return out;
  }
  function connectedSet(id) {
    var set = {}; set[id] = true;
    structural(id).forEach(function (x) { if (PLACED[x]) set[x] = true; });
    (BY[id].adjacent || []).forEach(function (x) { if (PLACED[x]) set[x] = true; });
    return set;
  }

  /* ----------------------------------------------------------------- panel */
  function render(id) {
    var p = BY[id];
    if (!p) return;
    var q = function (x) { return document.getElementById(x); };

    q('i-kind').textContent = kindLine(p);
    /* the file's own heading, minus the FIXED/FLUID the kind line already gives */
    q('i-name').textContent = (p.fullName || p.name).replace(/\s+—\s+(FIXED|FLUID)\s*$/, '');

    /* an answer owed here, in her words */
    var owedField = p.fields.filter(function (f) {
      return f.tags.some(function (t) { return t.pending; });
    })[0];
    if (p.answerOwed && owedField) {
      q('i-owed').innerHTML = '<div class="owedlab">An answer is owed here</div>'
        + '<p>' + inline(owedField.value) + '</p>';
      q('i-owed').style.display = '';
    } else {
      q('i-owed').style.display = 'none';
    }

    /* every field, in the order the content source has them */
    var tagged = 0;
    var html = p.fields.map(function (f) {
      var tags = f.tags.length
        ? f.tags.map(tagHtml).join(' ')
        : '<span class="untagged">untagged</span>';
      if (f.tags.length) tagged++;
      var items = f.items.length
        ? '<ul>' + f.items.map(function (i) { return '<li>' + inline(i) + '</li>'; }).join('') + '</ul>'
        : '';
      if (f.labelStyle === 'lead') {
        return '<div class="field lead"><p><strong>' + esc(f.label) + '</strong> '
             + inline(f.value) + ' ' + tags + '</p>' + items + '</div>';
      }
      return '<div class="field"><div class="flab">' + esc(f.label) + '</div>'
           + (f.value ? '<p>' + inline(f.value) + ' ' + tags + '</p>' : '')
           + items + (f.value ? '' : ' ' + tags) + '</div>';
    }).join('');
    q('i-fields').innerHTML = html;

    q('i-count').textContent = p.fields.length
      ? tagged + ' of ' + p.fields.length + ' claims here carry a confidence tag.'
      : '';

    q('i-src').innerHTML = sourceHtml(p);

    /* connections: what is on the machine, then what is only in the data */
    var set = connectedSet(id);
    var chips = Object.keys(set).filter(function (x) { return x !== id; }).sort();
    var box = q('i-chips'); box.innerHTML = '';
    chips.forEach(function (x) {
      var b = document.createElement('button');
      b.className = 'chip' + (BY[x].kind === 'sealed' ? ' metal' : '');
      b.textContent = chipLabel(x);
      b.addEventListener('click', function () { select(x); });
      box.appendChild(b);
    });
    var off = (p.adjacent || []).filter(function (x) { return !ON[x] && BY[x]; });
    q('i-off').innerHTML = off.length
      ? '<span class="offlab">Also connects to</span> '
        + off.map(function (x) { return esc(chipLabel(x)); }).join(' · ')
        + '<span class="offnote">In the data, in layers not built yet.</span>'
      : '';

    /* a month can be read but not isolated: it is nowhere on the machine */
    var iso = q('isolate');
    iso.disabled = !PLACED[id];
    iso.title = PLACED[id] ? '' : 'This has a reading but no place on the machine.';
    iso.textContent = isolated ? 'Show all' : 'Isolate';
  }

  /* ------------------------------------------------------------- selection */
  function select(id) {
    if (!ON[id]) return;
    selected = id;
    render(id);
    document.getElementById('inspect').classList.add('open');
    document.getElementById('inspect').scrollTop = 0;
    if (onSelect) onSelect(id);
    apply();
  }
  function clear() {
    selected = null; isolated = false;
    document.getElementById('inspect').classList.remove('open');
    if (onSelect) onSelect(null);
    apply();
  }
  function toggleIsolate() {
    if (!selected || !PLACED[selected]) return;
    isolated = !isolated;
    document.getElementById('isolate').textContent = isolated ? 'Show all' : 'Isolate';
    apply();
  }
  /* what the canvas should keep bright, or null for all of it */
  function keep() {
    return (isolated && selected) ? connectedSet(selected) : null;
  }
  function apply() { if (view) view.applyFocus(selected, keep()); }

  function init(opts) {
    BY = opts.by; ON = opts.onCanvas; PLACED = opts.placed || opts.onCanvas;
    view = opts.view; onSelect = opts.onSelect;
    document.getElementById('i-close').addEventListener('click', clear);
    document.getElementById('isolate').addEventListener('click', toggleIsolate);
    return api;
  }

  var api = {
    init: init, select: select, clear: clear, keep: keep,
    selected: function () { return selected; },
    isolated: function () { return isolated; },
    plain: plain, inline: inline, firstSentence: firstSentence, esc: esc,
  };
  return api;
})();
