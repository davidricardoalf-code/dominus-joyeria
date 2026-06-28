'use client';

import { InputHTMLAttributes, ReactNode } from 'react';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: ReactNode;
}

const labelCls = 'mb-2 block text-[11px] uppercase tracking-widest2 text-dominus-gold';
const inputCls =
  'h-11 w-full rounded-sm border border-dominus-line bg-dominus-surface px-3 text-sm text-white placeholder:text-dominus-muted/60 focus:border-dominus-gold focus:outline-none';

export default function Field({ label, hint, className = '', ...props }: FieldProps) {
  return (
    <label className={`block ${className}`}>
      <span className={labelCls}>{label}</span>
      <input className={inputCls} {...props} />
      {hint ? <span className="mt-1 block text-xs text-dominus-muted">{hint}</span> : null}
    </label>
  );
}

export { labelCls, inputCls };
