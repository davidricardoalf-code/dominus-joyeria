import { createClient } from '@supabase/supabase-js';
import type { Watch, WatchInput, WatchStatus } from '@/types/watch';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Mensaje claro en desarrollo si faltan las variables de entorno.
  // eslint-disable-next-line no-console
  console.warn(
    '[Dominus] Falta NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local'
  );
}

export const supabase = createClient(url ?? '', anonKey ?? '');

export const STORAGE_BUCKET = 'relojes';
const TABLE = 'relojes';

/** Genera un id de archivo único sin dependencias externas. */
function uniqueName(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Sube un JPG ya comprimido y devuelve su URL pública. */
export async function uploadFoto(file: File): Promise<string> {
  const path = `${uniqueName()}.jpg`;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Lee todo el inventario, más reciente primero. */
export async function getWatches(): Promise<Watch[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Watch[];
}

/** Crea un reloj nuevo. */
export async function createWatch(input: WatchInput): Promise<Watch> {
  const { data, error } = await supabase.from(TABLE).insert(input).select().single();
  if (error) throw error;
  return data as Watch;
}

/** Cambia el estado disponible/vendido. */
export async function setWatchStatus(id: string, estado: WatchStatus): Promise<void> {
  const { error } = await supabase.from(TABLE).update({ estado }).eq('id', id);
  if (error) throw error;
}

/** Elimina un reloj. */
export async function deleteWatch(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

/** Asigna / cambia la ubicación (vendedor) de un reloj. */
export async function setWatchUbicacion(id: string, ubicacion: string | null): Promise<void> {
  const { error } = await supabase.from(TABLE).update({ ubicacion }).eq('id', id);
  if (error) throw error;
}
