'use client';

import { useState } from 'react';
import type { Watch } from '@/types/watch';
import { precioCosto } from '@/lib/pricing';
import { formatPrice } from '@/lib/format';
import { generateWatchPdf } from '@/lib/pdf';
import { shareWatch } from '@/lib/shareCard';
import { setWatchStatus, deleteWatch } from '@/lib/supabase';
import Button from './ui/Button';
import StatusBadge from './ui/StatusBadge';

function PriceLine({ label, value, gold }: { label: string; value: number; gold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-dominus-muted">{label}</span>
      <span className={gold ? 'text-dominus-gold' : 'text-white'}>{formatPrice(value)}</span>
    </div>
  );
}

export default function WatchCard({
  watch,
  onChange,
  onRemove,
}: {
  watch: Watch;
  onChange: (w: Watch) => void;
  onRemove: (id: string) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    try {
      await fn();
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(err instanceof Error ? err.message : 'Ocurrió un error.');
    } finally {
      setBusy(null);
    }
  }

  async function toggleEstado() {
    const next = watch.estado === 'disponible' ? 'vendido' : 'disponible';
    await setWatchStatus(watch.id, next);
    onChange({ ...watch, estado: next });
  }

  async function eliminar() {
    // eslint-disable-next-line no-alert
    if (!confirm(`¿Eliminar "${watch.marca}"? Esta acción no se puede deshacer.`)) return;
    await deleteWatch(watch.id);
    onRemove(watch.id);
  }

  const foto = watch.fotos?.[0];

  return (
    <article className="flex flex-col overflow-hidden rounded-md border border-dominus-line bg-dominus-surface">
      {/* Foto */}
      <div className="relative aspect-square w-full bg-black">
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt={watch.marca} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-dominus-muted">
            Sin foto
          </div>
        )}
        <div className="absolute left-3 top-3">
          <StatusBadge estado={watch.estado} />
        </div>
        {watch.fotos.length > 1 && (
          <span className="absolute right-3 top-3 rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-white">
            {watch.fotos.length} fotos
          </span>
        )}
      </div>

      {/* Cuerpo */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="font-display text-2xl leading-none text-white">{watch.marca}</h3>
          <p className="mt-1 text-sm text-dominus-muted">
            {watch.milimetros} mm
            {watch.automatico && <span className="text-dominus-gold"> · Automático</span>}
          </p>
        </div>

        {/* Precios internos */}
        <div className="space-y-1.5 border-y border-dominus-line py-3">
          <PriceLine label="Compra" value={watch.precio_compra} />
          <PriceLine label="Costo (+20%)" value={precioCosto(watch.precio_compra)} />
          <PriceLine label="Cliente" value={watch.precio_cliente} gold />
          <PriceLine label="Mayorista" value={watch.precio_mayorista} />
        </div>

        {/* PDFs */}
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-widest2 text-dominus-gold">PDF</p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={busy !== null}
              onClick={() => run('pdfA', () => generateWatchPdf(watch, 'mayorista'))}
            >
              Mayorista
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={busy !== null}
              onClick={() => run('pdfB', () => generateWatchPdf(watch, 'cliente_mayorista'))}
            >
              Catálogo
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={busy !== null}
              onClick={() => run('pdfC', () => generateWatchPdf(watch, 'cliente_directo'))}
            >
              Cliente
            </Button>
          </div>
        </div>

        {/* Acciones */}
        <div className="mt-auto flex items-center gap-2">
          <Button
            size="sm"
            className="flex-1"
            disabled={busy !== null}
            onClick={() => run('share', () => shareWatch(watch))}
          >
            {busy === 'share' ? 'Generando…' : 'Enviar reloj'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy !== null}
            onClick={() => run('estado', toggleEstado)}
          >
            {watch.estado === 'disponible' ? 'Vendido' : 'Disponible'}
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={busy !== null}
            onClick={() => run('del', eliminar)}
            aria-label="Eliminar"
          >
            ✕
          </Button>
        </div>
      </div>
    </article>
  );
}
