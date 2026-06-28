import { jsPDF } from 'jspdf';
import type { Watch, CatalogVariant } from '@/types/watch';
import { formatPrice, loadImage } from './format';
import { DEJAVU_SANS_NORMAL, DEJAVU_SANS_BOLD } from './pdfFont';

const GOLD: [number, number, number] = [221, 173, 45];
const WHITE: [number, number, number] = [255, 255, 255];
const MUTED: [number, number, number] = [150, 150, 150];

// Fuente incrustada (DejaVu Sans) que SÍ incluye el signo de colón ₡.
const FONT = 'DejaVu';

const PAGE = { w: 210, h: 297 }; // A4 vertical (mm)
const MARGIN = 14;
const COL_W = 85;
const COL_GAP = 12;
const COLS = 2;
const ROWS = 3;
const PER_PAGE = COLS * ROWS; // 6 relojes por página
const GRID_TOP = 40;
const CELL_H = 78;
const PHOTO_H = 50;

const TITLES: Record<CatalogVariant, string> = {
  mayorista: 'MAYORISTA',
  catalogo: 'CATÁLOGO',
  cliente: 'COLECCIÓN',
};

// El catálogo sin precios también va SIN logo (para reenviar sin marca).
function showLogo(variant: CatalogVariant): boolean {
  return variant !== 'catalogo';
}

/** Registra la fuente incrustada en el documento (necesario por cada PDF). */
function registerFonts(doc: jsPDF): void {
  doc.addFileToVFS('DejaVuSans.ttf', DEJAVU_SANS_NORMAL);
  doc.addFont('DejaVuSans.ttf', FONT, 'normal');
  doc.addFileToVFS('DejaVuSans-Bold.ttf', DEJAVU_SANS_BOLD);
  doc.addFont('DejaVuSans-Bold.ttf', FONT, 'bold');
}

// Cache del logo entre páginas
let cachedLogo: HTMLImageElement | null = null;
async function getLogo(): Promise<HTMLImageElement | null> {
  if (!cachedLogo) {
    try {
      cachedLogo = await loadImage('/logo.png');
    } catch {
      cachedLogo = null;
    }
  }
  return cachedLogo;
}

function colX(col: number): number {
  return MARGIN + col * (COL_W + COL_GAP);
}

function fileName(variant: CatalogVariant): string {
  return `dominus-catalogo-${variant}.pdf`;
}

/** Reduce el tamaño de fuente hasta que el texto quepa en maxW. */
function fitFont(doc: jsPDF, text: string, maxW: number, startSize: number): number {
  let size = startSize;
  doc.setFontSize(size);
  while (doc.getTextWidth(text) > maxW && size > 8) {
    size -= 0.5;
    doc.setFontSize(size);
  }
  return size;
}

/** Pinta el fondo negro y el encabezado (logo + título) de una página. */
async function paintHeader(doc: jsPDF, variant: CatalogVariant, count: number): Promise<void> {
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, PAGE.w, PAGE.h, 'F');

  let y = 12;
  if (showLogo(variant)) {
    const logo = await getLogo();
    if (logo) {
      const w = 40;
      const h = (w * logo.height) / logo.width;
      doc.addImage(logo, 'PNG', (PAGE.w - w) / 2, y, w, h);
      y += h + 5;
    } else {
      y += 8;
    }
  } else {
    y += 6;
  }

  doc.setFont(FONT, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GOLD);
  const word = count === 1 ? 'RELOJ' : 'RELOJES';
  doc.text(`${TITLES[variant]}   ·   ${count} ${word}`, PAGE.w / 2, y, {
    align: 'center',
    charSpace: 2,
  });

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(PAGE.w / 2 - 16, y + 3, PAGE.w / 2 + 16, y + 3);
}

/** Dibuja una celda (un reloj) en la cuadrícula. */
async function drawCell(
  doc: jsPDF,
  watch: Watch,
  x: number,
  y: number,
  variant: CatalogVariant
): Promise<void> {
  // Foto (encajada dentro de la caja, sin recortar)
  const url = watch.fotos?.[0];
  if (url) {
    try {
      const img = await loadImage(url, true);
      const ratio = img.width / img.height;
      let w = COL_W;
      let h = w / ratio;
      if (h > PHOTO_H) {
        h = PHOTO_H;
        w = h * ratio;
      }
      const ix = x + (COL_W - w) / 2;
      const iy = y + (PHOTO_H - h) / 2;
      doc.setDrawColor(...GOLD);
      doc.setLineWidth(0.3);
      doc.rect(ix - 1, iy - 1, w + 2, h + 2);
      doc.addImage(img, 'JPEG', ix, iy, w, h);
    } catch {
      // sin foto: se deja vacío
    }
  }

  const cx = x + COL_W / 2;
  let ty = y + PHOTO_H + 7;

  // Marca
  doc.setFont(FONT, 'bold');
  doc.setTextColor(...WHITE);
  fitFont(doc, watch.marca.toUpperCase(), COL_W - 4, 13);
  doc.text(watch.marca.toUpperCase(), cx, ty, { align: 'center' });
  ty += 5;

  // Especificaciones
  const specs = [`${watch.milimetros} mm`];
  if (watch.automatico) specs.push('Automático');
  doc.setFont(FONT, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(specs.join('   ·   '), cx, ty, { align: 'center' });
  ty += 6;

  // Precio (según variante; el catálogo no lleva precio)
  if (variant !== 'catalogo') {
    const price = variant === 'mayorista' ? watch.precio_mayorista : watch.precio_cliente;
    doc.setFont(FONT, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...GOLD);
    doc.text(formatPrice(price), cx, ty, { align: 'center' });
  }
}

/**
 * Genera un catálogo PDF en cuadrícula con TODOS los relojes recibidos.
 * El llamador decide qué relojes pasar (normalmente, los disponibles).
 *
 * - mayorista: con logo, muestra el Precio Mayorista
 * - catalogo : SIN logo y SIN precio (solo foto y características)
 * - cliente  : con logo, muestra el Precio Final Cliente
 *
 * La ubicación / vendedor NUNCA aparece en estos PDFs (es privada).
 */
export async function generateCatalogPdf(
  watches: Watch[],
  variant: CatalogVariant
): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  registerFonts(doc);
  const count = watches.length;

  if (count === 0) {
    await paintHeader(doc, variant, 0);
    doc.setFont(FONT, 'normal');
    doc.setFontSize(14);
    doc.setTextColor(...MUTED);
    doc.text('No hay relojes disponibles.', PAGE.w / 2, 120, { align: 'center' });
    doc.save(fileName(variant));
    return;
  }

  for (let i = 0; i < count; i++) {
    const posInPage = i % PER_PAGE;
    if (posInPage === 0) {
      if (i > 0) doc.addPage();
      await paintHeader(doc, variant, count);
    }
    const row = Math.floor(posInPage / COLS);
    const col = posInPage % COLS;
    await drawCell(doc, watches[i], colX(col), GRID_TOP + row * CELL_H, variant);
  }

  // Pie con número de página en todas las páginas
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.2);
    doc.line(PAGE.w / 2 - 20, PAGE.h - 16, PAGE.w / 2 + 20, PAGE.h - 16);
    doc.setFont(FONT, 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(`DOMINUS JOYERIA   ·   ${p} / ${pages}`, PAGE.w / 2, PAGE.h - 11, {
      align: 'center',
      charSpace: 1.5,
    });
  }

  doc.save(fileName(variant));
}
