'use client';

import { useMemo, useState } from 'react';
import type { Watch, WatchStatus } from '@/types/watch';
import WatchCard from './WatchCard';

type Filtro = 'todos' | WatchStatus;

export default function InventoryTable({
  watches,
  onChange,
  onRemove,
}: {
  watches: Watch[];
  onChange: (w: Watch) => void;
  onRemove: (id: string) => void;
}) {
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [query, setQuery] = useState('');

  const visibles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return watches.filter((w) => {
      const okFiltro = filtro === 'todos' || w.estado === filtro;
      const okQuery = !q || w.marca.toLowerCase().includes(q);
      return okFiltro && okQuery;
    });
  }, [watches, filtro, query]);

  const tabs: { key: Filtro; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'disponible', label: 'Disponibles' },
    { key: 'vendido', label: 'Vendidos' },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Controles */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-sm border border-dominus-line p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFiltro(t.key)}
              className={`rounded-sm px-3 py-1.5 text-xs tracking-wide transition-colors ${
                filtro === t.key
                  ? 'bg-dominus-gold text-black'
                  : 'text-dominus-muted hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por marca…"
          className="h-10 w-full rounded-sm border border-dominus-line bg-dominus-surface px-3 text-sm text-white placeholder:text-dominus-muted/60 focus:border-dominus-gold focus:outline-none sm:w-64"
        />
      </div>

      {visibles.length === 0 ? (
        <div className="rounded-md border border-dashed border-dominus-line py-20 text-center">
          <p className="font-display text-2xl text-white">Sin relojes</p>
          <p className="mt-2 text-sm text-dominus-muted">
            Agrega tu primer reloj con “+ Nuevo reloj”.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((w) => (
            <WatchCard key={w.id} watch={w} onChange={onChange} onRemove={onRemove} />
          ))}
        </div>
      )}
    </section>
  );
}
