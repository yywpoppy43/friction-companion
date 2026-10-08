'use client';
import { useEffect, useState } from 'react';

type Theme = 'auto' | 'light' | 'dark';
const KEY = 'counter-roll-theme';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('auto');
  useEffect(() => {
    try { const t = localStorage.getItem(KEY); if (t === 'light' || t === 'dark') setTheme(t); } catch { /* storage may be unavailable */ }
  }, []);
  const apply = (t: Theme) => {
    setTheme(t);
    try { if (t === 'auto') localStorage.removeItem(KEY); else localStorage.setItem(KEY, t); } catch { /* ignore */ }
    if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
  };
  return (
    <div className="row" role="group" aria-label="Theme">
      {(['auto', 'light', 'dark'] as Theme[]).map((t) => (
        <button key={t} type="button" className="linklike" aria-pressed={theme === t} style={theme === t ? { color: 'var(--ink)', textDecoration: 'none' } : undefined} onClick={() => apply(t)}>{t}</button>
      ))}
    </div>
  );
}
