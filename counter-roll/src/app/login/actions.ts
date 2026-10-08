'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { OWNER_ID, SESSION_COOKIE, authConfigured, passcodeMatches, safeNext, sessionCookieOptions, signSession } from '@/lib/auth';

export interface LoginState { message: string | null }

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!authConfigured()) return { message: 'The instrument is not set up yet. Set OWNER_PASSCODE and AUTH_SECRET in the environment.' };
  const given = String(formData.get('passcode') ?? '');
  const expected = process.env.OWNER_PASSCODE ?? '';
  if (!given || !passcodeMatches(given, expected)) {
    // a small, fixed delay keeps guessing slow without a lockout state
    await new Promise((r) => setTimeout(r, 600));
    return { message: 'That is not the passcode.' };
  }
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await signSession(OWNER_ID), sessionCookieOptions);
  redirect(safeNext(String(formData.get('next') ?? '')));
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect('/login');
}
