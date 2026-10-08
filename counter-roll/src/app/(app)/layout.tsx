import Link from 'next/link';
import { requireOwner } from '@/lib/session';
import { Nav } from '@/components/nav/Nav';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { logout } from '@/app/login/actions';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireOwner();
  return (
    <div className="wrap">
      <header className="shell-head">
        <div className="title">
          <Link href="/place"><h1>The Counter-Roll</h1></Link>
          <span className="mono">two instruments · one converter</span>
        </div>
        <Nav />
      </header>
      <main>{children}</main>
      <footer className="shell-foot">
        <ThemeToggle />
        <form action={logout}><button type="submit" className="linklike">close</button></form>
      </footer>
    </div>
  );
}
