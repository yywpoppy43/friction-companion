import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/auth';

const OPEN = ['/login', '/api/auth'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (OPEN.some((p) => pathname === p || pathname.startsWith(p + '/'))) return NextResponse.next();
  const owner = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (owner) return NextResponse.next();
  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'not signed in' }, { status: 401 });
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = pathname !== '/' ? `?next=${encodeURIComponent(pathname)}` : '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|manifest.webmanifest).*)'],
};
