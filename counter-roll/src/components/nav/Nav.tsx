'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const SCREENS: { href: string; label: string }[] = [
  { href: '/place', label: 'place' },
  { href: '/log', label: 'log' },
  { href: '/pattern', label: 'pattern' },
  { href: '/examiner', label: 'examiner' },
  { href: '/converter', label: 'converter' },
  { href: '/weights', label: 'weights' },
  { href: '/data', label: 'data' },
  { href: '/mechanism', label: 'mechanism' },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="Screens">
      {SCREENS.map((s) => {
        const on = path === s.href || path.startsWith(s.href + '/') || (s.href === '/log' && path.startsWith('/rebuild'));
        return <Link key={s.href} href={s.href} aria-current={on ? 'page' : undefined}>{s.label}</Link>;
      })}
    </nav>
  );
}
