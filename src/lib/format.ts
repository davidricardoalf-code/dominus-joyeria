// Moneda por defecto: colón costarricense (₡).
// Se puede sobrescribir con NEXT_PUBLIC_CURRENCY (ej. "$").
const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || '₡';

/**
 * Formatea un número como precio en colones:
 * separador de miles con punto y sin decimales. Ej: ₡ 4.500.000
 */
export function formatPrice(value: number): string {
  const n = Math.round(Number(value) || 0);
  const grouped = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${CURRENCY} ${grouped}`;
}

/**
 * Carga una imagen y la devuelve como HTMLImageElement.
 * Para fotos de Supabase (cross-origin) usa crossOrigin para poder
 * dibujarlas en canvas / jsPDF sin "tainted canvas".
 */
export function loadImage(src: string, crossOrigin = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src}`));
    img.src = src;
  });
}
