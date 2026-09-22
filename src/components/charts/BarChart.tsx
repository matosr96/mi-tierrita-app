import styles from "./charts.module.css";

export type BarDatum = { label: string; value: number; alt?: boolean };

/** Barras horizontales con etiqueta y valor formateado. */
export const HBarChart = ({ data, format }: { data: BarDatum[]; format: (v: number) => string }) => {
  const max = Math.max(...data.map((d) => Math.abs(d.value)), 1);
  const rowH = 26;
  const labelW = 150;
  const width = 520;
  const height = data.length * rowH + 8;
  return (
    <svg className={styles.svg} viewBox={`0 0 ${width} ${height}`} role="img">
      {data.map((d, i) => {
        const y = i * rowH + 4;
        const w = (Math.abs(d.value) / max) * (width - labelW - 90);
        return (
          <g key={d.label}>
            <text x={labelW - 8} y={y + 15} textAnchor="end" className={styles.label}>
              {d.label}
            </text>
            <rect x={labelW} y={y + 4} width={w} height={rowH - 10} rx={2} className={d.alt ? styles.barAlt : styles.bar} />
            <text x={labelW + w + 6} y={y + 15} className={styles.value}>
              {format(d.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/** Barras verticales (por categoría, por mes). */
export const VBarChart = ({ data, format }: { data: BarDatum[]; format: (v: number) => string }) => {
  const max = Math.max(...data.map((d) => Math.abs(d.value)), 1);
  const width = 520;
  const height = 220;
  const pad = { top: 24, bottom: 34, left: 10, right: 10 };
  const slot = (width - pad.left - pad.right) / Math.max(data.length, 1);
  const barW = Math.min(slot * 0.55, 60);
  return (
    <svg className={styles.svg} viewBox={`0 0 ${width} ${height}`} role="img">
      <line x1={pad.left} x2={width - pad.right} y1={height - pad.bottom} y2={height - pad.bottom} className={styles.axis} />
      {data.map((d, i) => {
        const h = (Math.abs(d.value) / max) * (height - pad.top - pad.bottom);
        const x = pad.left + slot * i + (slot - barW) / 2;
        const y = height - pad.bottom - h;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barW} height={h} rx={2} className={d.alt ? styles.barAlt : styles.bar} />
            <text x={x + barW / 2} y={y - 6} textAnchor="middle" className={styles.value}>
              {format(d.value)}
            </text>
            <text x={x + barW / 2} y={height - pad.bottom + 16} textAnchor="middle" className={styles.label}>
              {d.label.length > 16 ? `${d.label.slice(0, 15)}…` : d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
