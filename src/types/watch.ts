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
}

export type WatchInput = Omit<Watch, 'id' | 'created_at'>;

export type PdfVariant = 'mayorista' | 'cliente_mayorista' | 'cliente_directo';
