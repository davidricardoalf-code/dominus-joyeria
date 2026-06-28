import type { Watch } from '@/types/watch';
import { formatPrice, loadImage } from './format';

const W = 1080;
const H = 1350;
const GOLD = '#DDAD2D';

/** Dibuja una imagen recortada tipo "cover" dentro de un rectángulo. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  const ir = img.width / img.height;
  const dr = dw / dh;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (ir > dr) {
    sw = img.height * dr;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / dr;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

/**
 * Construye la tarjeta de imagen para compartir por WhatsApp.
 * SIN LOGO. Incluye: Foto, Marca, Milímetros, Movimiento y Precio Final (Cliente).
 */
export async function buildShareCard(watch: Watch): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo crear el lienzo.');

  // Fondo negro
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);

  // Foto (cuadrada, con marco dorado)
  const pad = 70;
  const photoSize = W - pad * 2;
  const photoUrl = watch.fotos?.[0];
  if (photoUrl) {
    try {
      const photo = await loadImage(photoUrl, true);
      ctx.save();
      ctx.beginPath();
      ctx.rect(pad, pad, photoSize, photoSize);
      ctx.clip();
      drawCover(ctx, photo, pad, pad, photoSize, photoSize);
      ctx.restore();
    } catch {
      // si falla la foto, se deja el fondo negro
    }
  }
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.strokeRect(pad, pad, photoSize, photoSize);

  // Marca
  let y = pad + photoSize + 110;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 78px Georgia, "Times New Roman", serif';
  ctx.fillText(watch.marca.toUpperCase(), W / 2, y);

  // Divisor dorado
  y += 38;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 70, y);
  ctx.lineTo(W / 2 + 70, y);
  ctx.stroke();

  // Especificaciones
  y += 70;
  const specs = [`${watch.milimetros} mm`];
  if (watch.automatico) specs.push('Automático');
  ctx.fillStyle = '#C9C9C9';
  ctx.font = '400 40px Helvetica, Arial, sans-serif';
  ctx.fillText(specs.join('   ·   '), W / 2, y);

  // Precio final
  y += 110;
  ctx.fillStyle = GOLD;
  ctx.font = '700 92px Georgia, "Times New Roman", serif';
  ctx.fillText(formatPrice(watch.precio_cliente), W / 2, y);

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('No se pudo exportar la imagen.'))),
      'image/jpeg',
      0.92
    )
  );

  const safe = watch.marca.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'reloj';
  return new File([blob], `dominus-${safe}.jpg`, { type: 'image/jpeg' });
}

/** Texto que acompaña la imagen. */
function shareText(watch: Watch): string {
  const parts = [watch.marca, `${watch.milimetros} mm`];
  if (watch.automatico) parts.push('Automático');
  parts.push(formatPrice(watch.precio_cliente));
  return parts.join(' · ');
}

/** Descarga la imagen como fallback si el navegador no soporta compartir archivos. */
function download(file: File) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * Genera la tarjeta y abre el menú nativo de compartir (Web Share API),
 * desde donde el usuario elige WhatsApp y envía la imagen directamente.
 * Fallback: descarga la imagen y abre WhatsApp con el texto.
 */
export async function shareWatch(watch: Watch): Promise<void> {
  const file = await buildShareCard(watch);
  const text = shareText(watch);

  const canShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] });

  if (canShareFiles && navigator.share) {
    try {
      await navigator.share({ files: [file], title: watch.marca, text });
      return;
    } catch (err) {
      // El usuario canceló el diálogo: no hacemos nada más.
      if (err instanceof DOMException && err.name === 'AbortError') return;
    }
  }

  // Fallback (escritorio sin Web Share de archivos)
  download(file);
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}
