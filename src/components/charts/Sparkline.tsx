import styles from "./charts.module.css";

/** Minigráfico de tendencia en barras finas (estilo de las referencias): solo la forma de la serie, sin ejes. */
export const Sparkline = ({ values, label }: { values: number[]; label?: string }) => {
  if (values.length < 2) return null;
  const w = 120;
  const h = 34;
  const max = Math.max(...values, 0) || 1;
  const step = w / values.length;
  const bw = Math.max(2, Math.min(5, step * 0.5));
  return (
    <svg className={styles.spark} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label ?? "Tendencia"} preserveAspectRatio="none">
      {values.map((v, i) => {
        const bh = Math.max(2, (Math.max(v, 0) / max) * (h - 2));
        return <rect key={i} x={i * step + (step - bw) / 2} y={h - bh} width={bw} height={bh} rx={bw / 2} className={i === values.length - 1 ? styles.sparkLast : styles.sparkBar} />;
      })}
    </svg>
  );
};
