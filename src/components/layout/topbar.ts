/**
 * Cuándo se compacta la barra superior al desplazar la página. La barra es `sticky` y al compactarse se encoge (de 116 a
 * 74 px en escritorio: delta 42 px). Como está en el flujo, el navegador aplica el anclaje de scroll: resta esos 42 px a
 * `scrollY` para que el contenido no salte (medido: 70 → 28). Con el umbral único de 40 px eso dejaba `scrollY` por debajo,
 * la barra volvía a crecer, el anclaje sumaba 42 px, volvía a pasar de 40… y en cada evento de rueda la barra «subía y
 * bajaba» sin parar, en cualquier página; en las cortas se sumaba el recorte al final del documento. Por eso: histéresis
 * (compacta pasados 64 px, expande solo al volver bajo 16 px: el hueco de 48 px supera el delta) y una guarda que solo
 * compacta si la página seguirá teniendo recorrido después de encogerse.
 */
export const COMPACT_AT = 64;
export const EXPAND_AT = 16;
/** Diferencia de alto entre la barra alta y la compacta mientras no se haya medido. */
export const DEFAULT_DELTA = 48;

export type TopbarMeasure = { compact: boolean; scrollY: number; scrollHeight: number; innerHeight: number; delta: number };

export const shouldCompact = ({ compact, scrollY, scrollHeight, innerHeight, delta }: TopbarMeasure): boolean => {
  if (compact) return scrollY >= EXPAND_AT;
  const roomAfter = scrollHeight - innerHeight - delta;
  return scrollY > COMPACT_AT && roomAfter > COMPACT_AT;
};
