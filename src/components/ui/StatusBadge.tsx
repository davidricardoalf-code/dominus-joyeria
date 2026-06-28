'use client';

import type { WatchStatus } from '@/types/watch';

export default function StatusBadge({ estado }: { estado: WatchStatus }) {
  const disponible = estado === 'disponible';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-widest ${
        disponible ? 'bg-dominus-gold/10 text-dominus-gold' : 'bg-white/5 text-dominus-muted'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${disponible ? 'bg-dominus-gold' : 'bg-dominus-muted'}`}
      />
      {disponible ? 'Disponible' : 'Vendido'}
    </span>
  );
}
