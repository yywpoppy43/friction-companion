import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { currentOwner } from '@/lib/session';
import { authConfigured } from '@/lib/auth';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Sign in' };
export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await currentOwner()) redirect('/place');
  const { next } = await searchParams;
  return (
    <main className="wrap">
      <div className="login">
        <p className="mono">the counter-roll</p>
        <h1>Open.</h1>
        <p className="thesis" style={{ fontSize: 'clamp(20px, 3vw, 26px)' }}>Control is a copy held against a living thing. This instrument sorts the copies from the forms.</p>
        {authConfigured() ? (
          <LoginForm next={next ?? ''} />
        ) : (
          <p className="notice">The instrument is not set up yet. Set <code>OWNER_PASSCODE</code> and <code>AUTH_SECRET</code> in the environment, then reload.</p>
        )}
      </div>
    </main>
  );
}
