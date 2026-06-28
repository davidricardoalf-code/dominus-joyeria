// Margen automático del Precio Costo sobre el Precio Compra.
export const COST_MARKUP = 0.2;

/** Precio Costo = Precio Compra + 20% (automático). */
export function precioCosto(precioCompra: number): number {
  const value = (Number(precioCompra) || 0) * (1 + COST_MARKUP);
  // Dos decimales como máximo, sin arrastrar imprecisiones de coma flotante.
  return Math.round(value * 100) / 100;
}

/**
 * Etiqueta del movimiento.
 * Según especificación: si es automático => "Automático"; si no => sin etiqueta.
 */
export function movimientoLabel(automatico: boolean): string {
  return automatico ? 'Automático' : '';
}
