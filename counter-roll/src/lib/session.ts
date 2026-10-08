import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, verifySession } from './auth';
import { ensureOwner } from '@/db/queries';

/** The signed-in owner's id, or a redirect to /login. Also makes sure the owner's rows exist. Once per request: the layout and the page share it. */
export const requireOwner = cache(async (): Promise<string> => {
  const jar = await cookies();
  const ownerId = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!ownerId) redirect('/login');
  await ensureOwner(ownerId);
  return ownerId;
});

export async function currentOwner(): Promise<string | null> {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}
