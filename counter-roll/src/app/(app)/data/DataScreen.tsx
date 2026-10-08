'use client';
import { useEffect, useId, useRef, useState, useTransition, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { importLegacyAction } from '@/app/(app)/actions';

/** The line the owner pastes into the old page's console. It bundles the three browser keys the page kept. Text only; nothing here runs. */
const SNIPPET = 'copy(JSON.stringify({"counter-roll-sort-v3":JSON.parse(localStorage.getItem("counter-roll-sort-v3")||"[]"),"counter-roll-converter-v1":JSON.parse(localStorage.getItem("counter-roll-converter-v1")||"null"),"counter-roll-examiner-v1":JSON.parse(localStorage.getItem("counter-roll-examiner-v1")||"[]")}))';

/** What a successful import reports. Read off the action's own type so this screen never names the data layer. */
type ImportOutcome = Extract<Awaited<ReturnType<typeof importLegacyAction>>, { ok: true }>;

export interface DataCounts { placements: number; reps: number; converterVersions: number; weightVersions: number }

/** "1 placement", "2 placements". Formatting only. */
const count = (n: number, one: string, many = one + 's'): string => `${n} ${n === 1 ? one : many}`;

export function DataScreen({ counts }: { counts: DataCounts }) {
  const router = useRouter();
  const textId = useId();
  const fileId = useId();
  const preRef = useRef<HTMLPreElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState('');
  const [copyNote, setCopyNote] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<ImportOutcome | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // the copy note clears itself; the import result stays until the next import
  useEffect(() => {
    if (!copyNote) return;
    const t = setTimeout(() => setCopyNote(null), 4000);
    return () => clearTimeout(t);
  }, [copyNote]);

  async function copySnippet() {
    try {
      await navigator.clipboard.writeText(SNIPPET);
      setCopyNote('copied');
    } catch {
      // no clipboard here: select the line so a long press or the keyboard can copy it
      const el = preRef.current;
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
      setCopyNote('selected · copy it from the menu or the keyboard');
    }
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setText(await file.text());
      setMessage(null);
    } catch {
      setMessage('that file could not be read');
    }
    // let the same file be chosen again
    if (fileRef.current) fileRef.current.value = '';
  }

  function bringIn() {
    const body = text.trim();
    if (!body || pending) return;
    setMessage(null);
    startTransition(async () => {
      const r = await importLegacyAction(body);
      if (!r.ok) { setMessage(r.message); return; }
      setOutcome(r);
      setText('');
      router.refresh();
    });
  }

  const empty = text.trim() === '';

  return (
    <section className="screen data">
      <header>
        <p className="mono">data</p>
        <h2>Carry over, take out</h2>
      </header>

      <div className="inst">
        <p className="mono">carry over</p>
        <p>Open the old page. Open the browser console. Paste this line and press return. Then paste what comes back into the box below, or choose the file you saved it to.</p>
        <pre ref={preRef} className="eq snippet" aria-label="the line to paste into the console">{SNIPPET}</pre>
        <div className="row">
          <button type="button" className="btn" onClick={() => void copySnippet()}>copy</button>
          {copyNote && <span className="notice" role="status">{copyNote}</span>}
        </div>
        <div className="stack">
          <label className="mono" htmlFor={textId}>what came back</label>
          <textarea
            id={textId}
            className="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            placeholder='{"counter-roll-sort-v3": [ … ], …}'
          />
        </div>
        <div className="stack">
          <label className="mono" htmlFor={fileId}>or a file</label>
          <input ref={fileRef} id={fileId} type="file" accept=".json,application/json" onChange={(e) => void onFile(e)} />
        </div>
        <div className="row">
          <button type="button" className="btn primary" disabled={empty || pending} onClick={bringIn} aria-busy={pending}>
            {pending ? 'bringing in…' : 'bring it in'}
          </button>
        </div>
        {message && <p className="notice" role="status">{message}</p>}
        {outcome && (
          <div className="stack" role="status">
            <p className="notice">
              brought in: {count(outcome.result.structures, 'structure')} · {count(outcome.result.placements, 'placement')} · {count(outcome.result.reps, 'rep')} · converter {outcome.result.converter ? 'yes' : 'no'} · {outcome.result.skipped} already here
            </p>
            {outcome.warnings.length > 0 && (
              <ul className="mono warnings">
                {outcome.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            )}
          </div>
        )}
        <p className="notice">Entries already here are left alone, so this can be run again.</p>
      </div>

      <div className="inst">
        <p className="mono">take out</p>
        <div className="row">
          <a className="btn" href="/api/export/json" download>JSON · everything</a>
          <a className="btn" href="/api/export/csv" download>CSV · placements</a>
        </div>
        <p className="notice">Raw answers and the scores under the active weights. Nothing here is the only copy of a number: the answers are.</p>
        <p className="mono tnum">
          {count(counts.placements, 'placement')} · {count(counts.reps, 'rep')} · {count(counts.converterVersions, 'converter version')} · {count(counts.weightVersions, 'weight version')}
        </p>
      </div>
    </section>
  );
}
