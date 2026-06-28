export type WatchStatus = 'disponible' | 'vendido';

export interface Watch {
  id: string;
  created_at: string;
  marca: string;
  milimetros: string;
  automatico: boolean;
  precio_compra: number;
  precio_cliente: number;
  precio_mayorista: number;
  estado: WatchStatus;
  fotos: string[];
  ubicacion: string | null; // Ubicación / vendedor (privado, solo admin)
}

export type WatchInput = Omit<Watch, 'id' | 'created_at'>;

// Catálogos globales (todos los relojes disponibles en un solo PDF)
export type CatalogVariant = 'mayorista' | 'catalogo' | 'cliente';
