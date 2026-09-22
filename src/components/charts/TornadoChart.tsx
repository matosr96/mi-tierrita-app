import styles from "./charts.module.css";

export type TornadoDatum = { label: string; low: number; high: number };

/** Diagrama de tornado: desviación del VPN respecto al caso base a −20 %/+20 %. */
export const TornadoChart = ({ data, base, format }: { data: TornadoDatum[]; base: number; format: (v: number) => string }) => {
  const width = 560;
  const rowH = 24;
  const labelW = 170;
  const height = data.length * rowH + 30;
  const maxDev = Math.max(...data.flatMap((d) => [Math.abs(d.low - base), Math.abs(d.high - base)]), 1);
  const cx = labelW + (width - labelW - 20) / 2;
  const scale = (width - labelW - 20) / 2 / maxDev;
  return (
    <svg className={styles.svg} viewBox={`0 0 ${width} ${height}`} role="img">
      <line x1={cx} x2={cx} y1={0} y2={data.length * rowH} className={styles.axis} />
      {data.map((d, i) => {
        const y = i * rowH + 4;
        const lo = (d.low - base) * scale;
        const hi = (d.high - base) * scale;
        return (
          <g key={d.label}>
            <text x={labelW - 8} y={y + 13} textAnchor="end" className={styles.label}>
              {d.label}
            </text>
            <rect x={Math.min(cx, cx + lo)} y={y + 2} width={Math.abs(lo)} height={rowH - 8} className={styles.tornadoLow} />
            <rect x={Math.min(cx, cx + hi)} y={y + 2} width={Math.abs(hi)} height={rowH - 8} className={styles.tornadoHigh} />
          </g>
        );
      })}
      <text x={cx} y={data.length * rowH + 18} textAnchor="middle" className={styles.label}>
        VPN base {format(base)}
      </text>
    </svg>
  );
};
