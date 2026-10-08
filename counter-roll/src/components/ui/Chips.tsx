'use client';
import type { ReactNode } from 'react';

export interface ChipOption<T> { value: T; label: ReactNode }

/** A radio group drawn as chips, as the reference page's `.opts` rows. Real radio inputs underneath. */
export function Chips<T extends string | number>({ name, value, options, onChange, label }: {
  name: string;
  value: T | null | undefined;
  options: readonly ChipOption<T>[];
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <div className="opts" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <label key={String(o.value)}>
          <input type="radio" name={name} value={String(o.value)} checked={value === o.value} onChange={() => onChange(o.value)} />
          {o.label}
        </label>
      ))}
    </div>
  );
}
