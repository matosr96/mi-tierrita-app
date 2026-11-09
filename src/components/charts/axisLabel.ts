/**
 * Rótulo del eje X en hasta dos líneas que caben en el ancho de la barra (12 px ≈ 6,6 unidades por carácter). Antes se
 * cortaba a 16 caracteres fijos y, con seis líneas de producto, los nombres vecinos se montaban unos sobre otros.
 */
export const wrapAxisLabel = (label: string, maxChars: number): string[] => {
  const limit = Math.max(4, maxChars);
  const cut = (t: string) => (t.length > limit ? `${t.slice(0, limit - 1)}…` : t);
  if (label.length <= limit) return [label];
  const words = label.split(/\s+/);
  let first = "";
  let i = 0;
  while (i < words.length && `${first} ${words[i]}`.trim().length <= limit) first = `${first} ${words[i++]}`.trim();
  if (!first) return [cut(label)];
  const rest = words.slice(i).join(" ");
  return rest ? [first, cut(rest)] : [first];
};

/**
 * Rótulo de una sola línea recortado al final con «…». En las barras horizontales el texto va alineado a la derecha y
 * un nombre largo se salía por el borde izquierdo del SVG: se leía «o para hormiga arriera 1 kg».
 */
export const truncateLabel = (label: string, maxChars: number): string => {
  const limit = Math.max(4, maxChars);
  return label.length > limit ? `${label.slice(0, limit - 1).trimEnd()}…` : label;
};
