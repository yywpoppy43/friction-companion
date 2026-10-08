/**
 * Single-owner auth. A passcode the owner types once; a signed, HttpOnly cookie after that.
 * Signing uses Web Crypto so the same code runs in the proxy and in server components.
 */
export const SESSION_COOKIE = 'cr_session';
/** Phase one has one owner. Their id is fixed; a second person will get their own row and id. */
export const OWNER_ID = 'owner';
const SESSION_DAYS = 90;

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function unb64url(s: string): Uint8Array | null {
  try {
    const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch { return null; }
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export function authConfigured(): boolean {
  return Boolean(process.env.OWNER_PASSCODE && process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 16);
}

export async function signSession(ownerId: string, now = Date.now()): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not set');
  const payload = b64url(enc.encode(JSON.stringify({ o: ownerId, e: now + SESSION_DAYS * 86400_000 })));
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(payload)));
  return `${payload}.${b64url(sig)}`;
}

/** Returns the owner id the token names, or null when it is missing, forged, or expired. */
export async function verifySession(token: string | undefined | null, now = Date.now()): Promise<string | null> {
  const secret = process.env.AUTH_SECRET;
  if (!token || !secret) return null;
  const dot = token.indexOf('.');
  if (dot < 0) return null;
  const payload = token.slice(0, dot), sig = unb64url(token.slice(dot + 1));
  if (!sig) return null;
  const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret), sig as BufferSource, enc.encode(payload));
  if (!ok) return null;
  const raw = unb64url(payload);
  if (!raw) return null;
  try {
    const data = JSON.parse(new TextDecoder().decode(raw)) as { o?: unknown; e?: unknown };
    if (typeof data.o !== 'string' || typeof data.e !== 'number' || data.e < now) return null;
    return data.o;
  } catch { return null; }
}

/** Constant-time comparison of two strings of possibly different length. */
export function passcodeMatches(given: string, expected: string): boolean {
  const a = enc.encode(given), b = enc.encode(expected);
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

/** `secure` is true only when the request came in over https (the host sets x-forwarded-proto), so http://localhost works in every browser. */
export function sessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: '/',
    maxAge: SESSION_DAYS * 86400,
  };
}

export const isHttps = (forwardedProto: string | null | undefined): boolean => forwardedProto?.split(',')[0]?.trim() === 'https';

/** Only a path on this site is followed after sign-in. Anything that resolves elsewhere ('//x', '/\\x', 'https://x', malformed) goes to /place. */
export function safeNext(raw: string): string {
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return '/place';
  try {
    const u = new URL(raw, 'http://x');
    const path = u.pathname + u.search;
    if (u.origin === 'http://x' && path.startsWith('/') && !path.startsWith('//') && new URL(path, 'http://x').origin === 'http://x') return path;
  } catch { /* malformed */ }
  return '/place';
}
