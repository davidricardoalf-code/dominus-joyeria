import { jsPDF } from 'jspdf';
import type { Watch, PdfVariant } from '@/types/watch';
import { formatPrice, loadImage } from './format';

const GOLD: [number, number, number] = [221, 173, 45]; // #DDAD2D
const WHITE: [number, number, number] = [255, 255, 255];
const MUTED: [number, number, number] = [150, 150, 150];

const PAGE = { w: 210, h: 297 }; // A4 vertical (mm)

/** Dibuja una etiqueta dorada en mayúsculas + un valor blanco, centrados. */
function centeredField(
  doc: jsPDF,
  label: string,
  value: string,
  y: number,
  opts: { valueSize?: number; valueColor?: [number, number, number] } = {}
): number {
  const { valueSize = 16, valueColor = WHITE } = opts;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GOLD);
  doc.text(label.toUpperCase(), PAGE.w / 2, y, { align: 'center', charSpace: 1.2 });

  doc.setFont('times', 'normal');
  doc.setFontSize(valueSize);
  doc.setTextColor(...valueColor);
  doc.text(value, PAGE.w / 2, y + 7, { align: 'center' });

  return y + 16;
}

function fileName(watch: Watch, variant: PdfVariant): string {
  const safe = watch.marca.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'reloj';
  const tag = {
    mayorista: 'mayorista',
    cliente_mayorista: 'catalogo',
    cliente_directo: 'cliente',
  }[variant];
  return `dominus-${safe}-${tag}.pdf`;
}

/**
 * Genera y descarga un PDF de una página, minimalista, fondo negro y dorado.
 *
 * - mayorista          (A): Logo, Foto, Marca, Milímetros, Movimiento, Precio Mayorista, Precio Sugerido (Cliente)
 * - cliente_mayorista  (B): SIN LOGO, SIN PRECIOS. Foto, Marca, Milímetros, Movimiento
 * - cliente_directo    (C): Logo, Foto, Marca, Milímetros, Movimiento, Precio Final Cliente
 */
export async function generateWatchPdf(watch: Watch, variant: PdfVariant): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const showLogo = variant !== 'cliente_mayorista';
  const showPrices = variant !== 'cliente_mayorista';

  // Fondo negro
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, PAGE.w, PAGE.h, 'F');

  let y = 22;

  // --- Logo (A y C) ---
  if (showLogo) {
    try {
      const logo = await loadImage('/logo.png');
      const logoW = 52;
      const logoH = (logoW * logo.height) / logo.width;
      doc.addImage(logo, 'PNG', (PAGE.w - logoW) / 2, y, logoW, logoH);
      y += logoH + 8;
    } catch {
      y += 4;
    }
  } else {
    y += 6;
  }

  // --- Foto principal ---
  const photoUrl = watch.fotos?.[0];
  if (photoUrl) {
    try {
      const photo = await loadImage(photoUrl, true);
      // Encaja la foto dentro de una caja máxima (ancho y alto) preservando proporción,
      // para que los precios y el pie nunca se salgan de la página A4.
      const maxW = 118;
      const maxH = 120;
      const ratio = photo.width / photo.height;
      let boxW = maxW;
      let boxH = boxW / ratio;
      if (boxH > maxH) {
        boxH = maxH;
        boxW = boxH * ratio;
      }
      const px = (PAGE.w - boxW) / 2;

      // Marco dorado fino
      doc.setDrawColor(...GOLD);
      doc.setLineWidth(0.4);
      doc.rect(px - 2.2, y - 2.2, boxW + 4.4, boxH + 4.4);
      doc.addImage(photo, 'JPEG', px, y, boxW, boxH);
      y += boxH + 16;
    } catch {
      y += 8;
    }
  }

  // --- Marca ---
  doc.setFont('times', 'normal');
  doc.setFontSize(30);
  doc.setTextColor(...WHITE);
  doc.text(watch.marca.toUpperCase(), PAGE.w / 2, y, { align: 'center' });
  y += 6;

  // Divisor dorado
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(PAGE.w / 2 - 14, y + 1, PAGE.w / 2 + 14, y + 1);
  y += 14;

  // --- Especificaciones ---
  y = centeredField(doc, 'Milímetros', `${watch.milimetros} mm`, y);
  if (watch.automatico) {
    y = centeredField(doc, 'Movimiento', 'Automático', y);
  }

  // --- Precios ---
  if (showPrices) {
    y += 4;
    if (variant === 'mayorista') {
      y = centeredField(doc, 'Precio Mayorista', formatPrice(watch.precio_mayorista), y, {
        valueSize: 24,
        valueColor: GOLD,
      });
      y = centeredField(doc, 'Precio Sugerido (Cliente)', formatPrice(watch.precio_cliente), y, {
        valueSize: 15,
        valueColor: MUTED,
      });
    } else {
      // cliente_directo
      y = centeredField(doc, 'Precio Final', formatPrice(watch.precio_cliente), y, {
        valueSize: 26,
        valueColor: GOLD,
      });
    }
  }

  // --- Pie ---
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.3);
  doc.line(PAGE.w / 2 - 30, PAGE.h - 24, PAGE.w / 2 + 30, PAGE.h - 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  const footer = showLogo ? 'DOMINUS JOYERIA' : 'CATALOGO';
  doc.text(footer, PAGE.w / 2, PAGE.h - 18, { align: 'center', charSpace: 2 });

  doc.save(fileName(watch, variant));
}
