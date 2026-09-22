import styles from "./charts.module.css";

export type LinePoint = { x: number; y: number };

type Props = {
  points: LinePoint[];
  formatX: (v: number) => string;
  formatY: (v: number) => string;
  /** Marca vertical (por ejemplo, el punto de equilibrio) y etiqueta. */
  marker?: { x: number; label: string } | undefined;
  highlightX?: number | undefined;
};

/** Línea simple con eje cero, área negativa sombreada y marcador opcional. */
export const LineChart = ({ points, formatX, formatY, marker, highlightX }: Props) => {
  const width = 520;
  const height = 240;
  const pad = { top: 20, bottom: 36, left: 56, right: 20 };
  if (points.length === 0) return null;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(0, ...ys);
  const maxY = Math.max(0, ...ys);
  const sx = (x: number) => pad.left + ((x - minX) / (maxX - minX || 1)) * (width - pad.left - pad.right);
  const sy = (y: number) => pad.top + ((maxY - y) / (maxY - minY || 1)) * (height - pad.top - pad.bottom);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x)},${sy(p.y)}`).join(" ");
  const zeroY = sy(0);
  return (
    <svg className={styles.svg} viewBox={`0 0 ${width} ${height}`} role="img">
      {minY < 0 ? <rect x={pad.left} y={zeroY} width={width - pad.left - pad.right} height={sy(minY) - zeroY} className={styles.negativeArea} /> : null}
      <line x1={pad.left} x2={width - pad.right} y1={zeroY} y2={zeroY} className={styles.zero} />
      <text x={pad.left - 8} y={sy(maxY) + 4} textAnchor="end" className={styles.label}>
        {formatY(maxY)}
      </text>
      <text x={pad.left - 8} y={zeroY + 4} textAnchor="end" className={styles.label}>
        0
      </text>
      {minY < 0 ? (
        <text x={pad.left - 8} y={sy(minY) + 4} textAnchor="end" className={styles.label}>
          {formatY(minY)}
        </text>
      ) : null}
      {marker && marker.x >= minX && marker.x <= maxX ? (
        <g>
          <line x1={sx(marker.x)} x2={sx(marker.x)} y1={pad.top} y2={height - pad.bottom} className={styles.marker} />
          <text x={sx(marker.x) + 4} y={pad.top + 10} className={styles.label}>
            {marker.label}
          </text>
        </g>
      ) : null}
      <path d={path} className={styles.line} />
      {points.map((p) => (
        <circle key={p.x} cx={sx(p.x)} cy={sy(p.y)} r={p.x === highlightX ? 5 : 3.5} className={styles.dot} />
      ))}
      {points.map((p) => (
        <text key={`x${p.x}`} x={sx(p.x)} y={height - pad.bottom + 16} textAnchor="middle" className={styles.label}>
          {formatX(p.x)}
        </text>
      ))}
    </svg>
  );
};
