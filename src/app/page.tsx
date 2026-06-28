'use client';

import { useEffect, useState } from 'react';
import type { Watch } from '@/types/watch';
import { getWatches } from '@/lib/supabase';
import Header from '@/components/Header';
import WatchForm from '@/components/WatchForm';
import InventoryTable from '@/components/InventoryTable';

export default function Home() {
  const [watches, setWatches] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    getWatches()
      .then((data) => mounted && setWatches(data))
      .catch(
        (err) =>
          mounted &&
          setError(
            err instanceof Error
              ? `No se pudo cargar el inventario: ${err.message}`
              : 'No se pudo cargar el inventario.'
          )
      )
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  function handleCreated(watch: Watch) {
    setWatches((prev) => [watch, ...prev]);
  }

  function handleChange(updated: Watch) {
    setWatches((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
  }

  function handleRemove(id: string) {
    setWatches((prev) => prev.filter((w) => w.id !== id));
  }

  return (
    <main className="min-h-screen">
      <Header onNew={() => setFormOpen(true)} />

      {loading ? (
        <div className="mx-auto max-w-6xl px-6 py-24 text-center text-dominus-muted">
          Cargando inventario…
        </div>
      ) : error ? (
        <div className="mx-auto max-w-2xl px-6 py-24">
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        </div>
      ) : (
        <InventoryTable watches={watches} onChange={handleChange} onRemove={handleRemove} />
      )}

      <WatchForm open={formOpen} onClose={() => setFormOpen(false)} onCreated={handleCreated} />

      <footer className="border-t border-dominus-line py-8 text-center">
        <p className="text-[11px] uppercase tracking-widest2 text-dominus-muted">Dominus Joyería</p>
      </footer>
    </main>
  );
}
