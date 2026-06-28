'use client';

import { ButtonHTMLAttributes } from 'react';

type Variant = 'gold' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-sm font-medium tracking-wide transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-dominus-gold disabled:opacity-40 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  gold: 'bg-dominus-gold text-black hover:bg-dominus-gold-soft',
  outline: 'border border-dominus-line text-white hover:border-dominus-gold hover:text-dominus-gold',
  ghost: 'text-dominus-muted hover:text-white',
  danger: 'border border-dominus-line text-dominus-muted hover:border-red-500/60 hover:text-red-400',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-11 px-5 text-sm',
};

export default function Button({
  variant = 'gold',
  size = 'md',
  className = '',
  ...props
}: Props) {
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />
  );
}
