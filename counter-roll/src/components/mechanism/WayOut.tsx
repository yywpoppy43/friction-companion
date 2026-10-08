/**
 * Scene 8 · how to walk out and evolve. Four rungs: imposed, swallowed, chosen, yours.
 * Static: no state, server-safe.
 */
export function WayOut() {
  return (
    <section className="scene" id="out">
      <p className="mono"><b>8</b> · how to walk out and evolve</p>
      <h2>The way out is not fewer forms. It is forms that cannot become copies, served in reps, graded by your own measure of the act.</h2>
      <svg className="stage" viewBox="0 0 760 210" role="img" aria-label="Four rungs: imposed, swallowed, chosen, yours. The copy moves from outside, to inside as a should, to a form you endorse, to a form indistinguishable from what you want.">
        <line className="grid" x1="40" y1="150" x2="720" y2="150" />
        <g>
          <rect className="cps" x="60" y="80" width="56" height="56" /><circle cx="88" cy="97" r="7" style={{ fill: 'var(--paper)', stroke: 'none' }} /><rect x="77" y="107" width="22" height="22" rx="5" style={{ fill: 'var(--paper)', stroke: 'none' }} />
          <text className="t" x="88" y="176" textAnchor="middle">imposed</text><text x="88" y="194" textAnchor="middle">their copy, outside</text>
        </g>
        <g>
          <circle className="box" cx="268" cy="108" r="36" /><rect className="cpf" x="254" y="94" width="28" height="28" /><circle cx="268" cy="103" r="4" style={{ fill: 'var(--paper)', stroke: 'none' }} /><rect x="262" y="109" width="12" height="11" rx="3" style={{ fill: 'var(--paper)', stroke: 'none' }} />
          <text className="t" x="268" y="176" textAnchor="middle">swallowed</text><text x="268" y="194" textAnchor="middle">their copy, inside you</text>
        </g>
        <g>
          <circle className="box" cx="448" cy="108" r="36" /><rect className="fmk" x="432" y="92" width="32" height="32" /><line className="fmk" x1="448" y1="92" x2="448" y2="124" /><line className="fmk" x1="432" y1="108" x2="464" y2="108" />
          <text className="t" x="448" y="176" textAnchor="middle">chosen</text><text x="448" y="194" textAnchor="middle">a form you endorse</text>
        </g>
        <g>
          <circle className="box" cx="628" cy="108" r="36" /><path className="fmk" d="M612 92 L612 124 L644 124" /><path className="lvk" d="M620 116 C624 100 640 100 640 108 C640 116 624 124 620 116 Z" style={{ strokeWidth: 2.2, fill: 'var(--live-soft)' }} />
          <text className="t" x="628" y="176" textAnchor="middle">yours</text><text x="628" y="194" textAnchor="middle">the form and the want are one</text>
        </g>
        <path className="thin" d="M126 108 L222 108" /><path d="M220 103 L230 108 L220 113 Z" style={{ fill: 'var(--ink-2)', stroke: 'none' }} />
        <path className="thin" d="M306 108 L402 108" /><path d="M400 103 L410 108 L400 113 Z" style={{ fill: 'var(--ink-2)', stroke: 'none' }} />
        <path className="thin" d="M486 108 L582 108" /><path d="M580 103 L590 108 L580 113 Z" style={{ fill: 'var(--ink-2)', stroke: 'none' }} />
        <text className="cp" x="180" y="60" textAnchor="middle">most people stop here</text>
        <text className="cp" x="360" y="60" textAnchor="middle">rebels throw out the rung</text>
      </svg>
      <div className="text">
        <p>Four rungs. A copy imposed from outside. The same copy swallowed, so it runs inside you as a should and you police yourself the way you were policed. That rung is the converter. A form you chose because you can say what it is for. A form so fully yours that following it and wanting it are the same act.</p>
        <p>The rebel's move is to throw out the ladder at rung two, with the converter still inside. The force is then free and spreads, and the inner copy keeps grading. The way out is rungs three and four, and they are reached by reps, not by a decision.</p>
      </div>
      <div className="end">
        <div className="zhbig">从心所欲，不逾矩</div>
        <div className="text">
          <p>Confucius, at seventy: "I could follow what my heart wanted and not cross the square." The square, <span className="zh">矩</span>, is a carpenter's tool. A fixed form. At the end, the form is still there. The heart no longer collides with it, because the form was built to the heart's own measure.</p>
          <p>That is the fourth rung. Not no copy. A form so exact to you that it reads as your own want.</p>
        </div>
      </div>
      <ol className="rules">
        <li><span><b>Move the seat of evaluation first.</b> Grade the act, not the self. The sentence after a miss is "I adjust," and it is the full sentence. <span className="zh">自省</span>, not <span className="zh">自责</span>. The examiner is the rep for this, and every other move runs on it.</span></li>
        <li><span><b>Untie the taste by sorting, out loud, every time.</b> Each form you name as a form, and pass through, sharpens the line in scene two. This is discrimination training. Reps, not insight.</span></li>
        <li><span><b>Start with forms that score near zero on all seven.</b> One act. Rough grain. A visible end. Terms yours. The smaller the first loads, the fewer bad servings.</span></li>
        <li><span><b>Author before you accept.</b> A structure someone else proposes becomes yours when you restate its terms and set the exit. Same structure. Different rung.</span></li>
        <li><span><b>Keep the grain rough.</b> A window keeps the want. A minute kills it. Thirteen studies say so.</span></li>
        <li><span><b>Then build the bed.</b> Banks of forms only, each passing the seven, graded by your own measure. A bed laid before the seat moves is a dam you will blame yourself for.</span></li>
      </ol>
    </section>
  );
}
