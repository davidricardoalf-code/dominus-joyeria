'use client';

import { useEffect, useMemo, useState } from 'react';
import { compressToJpg } from '@/lib/imageCompression';
import { uploadFoto, createWatch } from '@/lib/supabase';
import { precioCosto } from '@/lib/pricing';
import { formatPrice } from '@/lib/format';
import type { Watch, WatchStatus } from '@/types/watch';
import Button from './ui/Button';
import Field, { labelCls, inputCls } from './ui/Field';

const MAX_FOTOS = 3;
const NUEVA = '__nueva__';

interface LocalPhoto {
  file: File; // ya comprimido a JPG
  preview: string; // objectURL
}

export default function WatchForm({
  open,
  onClose,
  onCreated,
  ubicaciones,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (watch: Watch) => void;
  ubicaciones: string[];
}) {
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [marca, setMarca] = useState('');
  const [milimetros, setMilimetros] = useState('');
  const [automatico, setAutomatico] = useState(false);
  const [precioCompra, setPrecioCompra] = useState('');
  const [precioCliente, setPrecioCliente] = useState('');
  const [precioMayorista, setPrecioMayorista] = useState('');
  const [estado, setEstado] = useState<WatchStatus>('disponible');
  const [ubicacion, setUbicacion] = useState<string>('');
  const [nuevaUbic, setNuevaUbic] = useState('');

  const [busy, setBusy] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const costo = useMemo(() => precioCosto(Number(precioCompra) || 0), [precioCompra]);

  // Limpiar objectURLs al desmontar
  useEffect(() => {
    return () => photos.forEach((p) => URL.revokeObjectURL(p.preview));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function reset() {
    photos.forEach((p) => URL.revokeObjectURL(p.preview));
    setPhotos([]);
    setMarca('');
    setMilimetros('');
    setAutomatico(false);
    setPrecioCompra('');
    setPrecioCliente('');
    setPrecioMayorista('');
    setEstado('disponible');
    setUbicacion('');
    setNuevaUbic('');
    setError(null);
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setError(null);
    setCompressing(true);
    try {
      const room = MAX_FOTOS - photos.length;
      const incoming = Array.from(fileList).slice(0, room);
      const processed: LocalPhoto[] = [];
      for (const f of incoming) {
        const jpg = await compressToJpg(f);
        processed.push({ file: jpg, preview: URL.createObjectURL(jpg) });
      }
      setPhotos((prev) => [...prev, ...processed]);
    } catch {
      setError('No se pudo procesar alguna imagen. Intenta con otra.');
    } finally {
      setCompressing(false);
    }
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit() {
    setError(null);
    if (!marca.trim()) return setError('Ingresa la marca.');
    if (!milimetros.trim()) return setError('Ingresa los milímetros.');

    setBusy(true);
    try {
      // Subir fotos comprimidas
      const urls: string[] = [];
      for (const p of photos) {
        urls.push(await uploadFoto(p.file));
      }

      const ubicacionFinal =
        ubicacion === NUEVA ? nuevaUbic.trim() || null : ubicacion.trim() || null;

      const watch = await createWatch({
        marca: marca.trim(),
        milimetros: milimetros.trim(),
        automatico,
        precio_compra: Number(precioCompra) || 0,
        precio_cliente: Number(precioCliente) || 0,
        precio_mayorista: Number(precioMayorista) || 0,
        estado,
        fotos: urls,
        ubicacion: ubicacionFinal,
      });

      onCreated(watch);
      reset();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? `Error al guardar: ${err.message}`
          : 'Error al guardar el reloj.'
      );
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:p-8">
      <div className="w-full max-w-2xl rounded-md border border-dominus-line bg-dominus-surface">
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-dominus-line px-6 py-4">
          <h2 className="font-display text-2xl text-white">Nuevo reloj</h2>
          <button
            onClick={onClose}
            className="text-dominus-muted hover:text-white"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          {/* Fotos */}
          <div>
            <span className={labelCls}>Fotos (hasta {MAX_FOTOS})</span>
            <div className="flex flex-wrap gap-3">
              {photos.map((p, i) => (
                <div
                  key={i}
                  className="relative h-24 w-24 overflow-hidden rounded-sm border border-dominus-line"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.preview} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/80 text-xs text-white hover:bg-red-600"
                    aria-label="Quitar foto"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {photos.length < MAX_FOTOS && (
                <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-sm border border-dashed border-dominus-line text-center text-xs text-dominus-muted hover:border-dominus-gold hover:text-dominus-gold">
                  {compressing ? 'Optimizando…' : '+ Foto'}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      handleFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
            <p className="mt-2 text-xs text-dominus-muted">
              Cualquier formato se convierte automáticamente a JPG optimizado.
            </p>
          </div>

          {/* Marca + Milímetros */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Marca"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              placeholder="Rolex, Omega, Cartier…"
            />
            <Field
              label="Milímetros"
              value={milimetros}
              onChange={(e) => setMilimetros(e.target.value)}
              placeholder="41"
              inputMode="numeric"
            />
          </div>

          {/* Automático */}
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={automatico}
              onChange={(e) => setAutomatico(e.target.checked)}
              className="h-5 w-5 accent-dominus-gold"
            />
            <span className="text-sm text-white">
              Movimiento <span className="text-dominus-gold">Automático</span>
            </span>
          </label>

          {/* Precios */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Precio Compra"
              value={precioCompra}
              onChange={(e) => setPrecioCompra(e.target.value)}
              placeholder="0"
              inputMode="decimal"
              type="number"
            />
            <div>
              <span className={labelCls}>Precio Costo (+20%)</span>
              <div className={`${inputCls} flex items-center text-dominus-gold`}>
                {formatPrice(costo)}
              </div>
            </div>
            <Field
              label="Precio Cliente"
              value={precioCliente}
              onChange={(e) => setPrecioCliente(e.target.value)}
              placeholder="0"
              inputMode="decimal"
              type="number"
            />
            <Field
              label="Precio Mayorista"
              value={precioMayorista}
              onChange={(e) => setPrecioMayorista(e.target.value)}
              placeholder="0"
              inputMode="decimal"
              type="number"
            />
          </div>

          {/* Estado */}
          <div>
            <span className={labelCls}>Estado</span>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as WatchStatus)}
              className={inputCls}
            >
              <option value="disponible">Disponible</option>
              <option value="vendido">Vendido</option>
            </select>
          </div>

          {/* Ubicación / Vendedor (privado) */}
          <div>
            <span className={labelCls}>
              Ubicación / Vendedor <span className="text-dominus-muted">(privado)</span>
            </span>
            <select
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              className={inputCls}
            >
              <option value="">Sin ubicación</option>
              {ubicaciones.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
              <option value={NUEVA}>➕ Nueva ubicación…</option>
            </select>
            {ubicacion === NUEVA && (
              <input
                value={nuevaUbic}
                onChange={(e) => setNuevaUbic(e.target.value)}
                placeholder="Ej: Bodega, Tienda Surf Coco, Barbería Filadelfia"
                className={`${inputCls} mt-2`}
              />
            )}
            <p className="mt-1 text-xs text-dominus-muted">
              Solo tú la ves. No aparece en PDFs ni en WhatsApp.
            </p>
          </div>

          {error && (
            <p className="rounded-sm border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-3 border-t border-dominus-line px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={busy || compressing}>
            {busy ? 'Guardando…' : 'Guardar reloj'}
          </Button>
        </div>
      </div>
    </div>
  );
}
