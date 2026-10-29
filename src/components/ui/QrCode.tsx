import { useMemo } from "react";
import { encodeQr } from "@/lib/qr";

type Props = {
  /** Texto a codificar (una URL corta: hasta 213 bytes). */
  value: string;
  /** Lado en píxeles CSS. */
  size?: number;
  /** Nombre accesible; por defecto describe el enlace. */
  label?: string;
};

/**
 * Código QR en SVG con el codificador propio de `@/lib/qr`. Los módulos usan `currentColor`, así hereda el color del
 * texto que lo rodea (en papel, tinta negra) y se imprime nítido a cualquier tamaño. Zona de silencio de 4 módulos.
 */
export const QrCode = ({ value, size = 112, label }: Props) => {
  const matrix = useMemo(() => encodeQr(value), [value]);
  const n = matrix.length;
  const quiet = 4;
  const side = n + quiet * 2;
  // Un rectángulo por racha horizontal de módulos oscuros: menos nodos que uno por módulo.
  const path = useMemo(() => {
    const parts: string[] = [];
    matrix.forEach((row, y) => {
      let start = -1;
      for (let x = 0; x <= n; x += 1) {
        const dark = x < n && row[x];
        if (dark && start === -1) start = x;
        if (!dark && start !== -1) {
          parts.push(`M${start + quiet} ${y + quiet}h${x - start}v1h-${x - start}z`);
          start = -1;
        }
      }
    });
    return parts.join("");
  }, [matrix, n]);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${side} ${side}`} role="img" aria-label={label ?? `Código QR con el enlace ${value}`} shapeRendering="crispEdges">
      <rect width={side} height={side} fill="var(--surface)" />
      <path d={path} fill="currentColor" />
    </svg>
  );
};
