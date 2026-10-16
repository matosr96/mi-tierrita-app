import styles from "./charts.module.css";

/** Minigráfico de tendencia para una tarjeta de indicador: solo la forma de la serie, sin ejes. */
export const Sparkline = ({ values, label }: { values: number[]; label?: string }) => {
  if (values.length < 2) return null;
  const w = 96;
  const h = 30;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - 3 - ((v - min) / (max - min || 1)) * (h - 6)).toFixed(1)}`);
  return (
    <svg className={styles.spark} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label ?? "Tendencia"} preserveAspectRatio="none">
      <polygon points={`0,${h} ${pts.join(" ")} ${w},${h}`} className={styles.sparkArea} />
      <polyline points={pts.join(" ")} pathLength={1} className={styles.sparkLine} />
    </svg>
  );
};
