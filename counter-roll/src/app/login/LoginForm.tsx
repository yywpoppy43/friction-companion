'use client';
import { useActionState } from 'react';
import { login, type LoginState } from './actions';

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, { message: null });
  return (
    <form action={action} className="qgrid" autoComplete="off">
      <input type="hidden" name="next" value={next} />
      <div className="q field">
        <label className="mono" htmlFor="passcode">passcode</label>
        <input id="passcode" name="passcode" type="password" className="text" autoComplete="current-password" autoFocus required />
      </div>
      <div className="row">
        <button type="submit" className="btn primary" disabled={pending}>{pending ? 'opening…' : 'open'}</button>
        {state.message && <span className="notice" role="status">{state.message}</span>}
      </div>
    </form>
  );
}
