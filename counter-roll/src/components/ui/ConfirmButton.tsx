'use client';
import { useEffect, useState } from 'react';

/** A two-step remove: first press asks, second press does it. No red; the question is in ink. */
export function ConfirmButton({ onConfirm, label = 'remove', ask = 'remove this? yes', className = 'linklike', pending = false }: {
  onConfirm: () => void | Promise<void>;
  label?: string;
  ask?: string;
  className?: string;
  pending?: boolean;
}) {
  const [arming, setArming] = useState(false);
  useEffect(() => {
    if (!arming) return;
    const t = setTimeout(() => setArming(false), 4000);
    return () => clearTimeout(t);
  }, [arming]);
  return (
    <button type="button" className={className} disabled={pending} aria-live="polite"
      onClick={() => { if (arming) { setArming(false); void onConfirm(); } else setArming(true); }}>
      {pending ? '…' : arming ? ask : label}
    </button>
  );
}
