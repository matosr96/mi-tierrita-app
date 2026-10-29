import { ChartFrame } from "./ChartFrame";
import { useChartHover } from "./useChartHover";
import styles from "./charts.module.css";

type Props = {
  values: number[];
  label?: string;
  /** Rótulo de cada punto en la etiqueta flotante (por defecto, «i de n»). */
  labels?: string[];
  /** Formato del valor en la etiqueta flotante (por defecto, el número tal cual). */
  format?: (v: number) => string;
};

/**
 * Minigráfico de tendencia en barras finas (estilo de las referencias): solo la forma de la serie, sin ejes.
 * Pasar el puntero, tocar o tabular una barra muestra su valor en la etiqueta flotante.
 */
export const Sparkline = ({ values, label, labels, format = (v) => String(v) }: Props) => {
  const hover = useChartHover();
  if (values.length < 2) return null;
  const w = 120;
  const h = 34;
  const max = Math.max(...values, 0) || 1;
  const step = w / values.length;
  const bw = Math.max(2, Math.min(5, step * 0.5));
  const barH = (v: number) => Math.max(2, (Math.max(v, 0) / max) * (h - 2));
  const ai = hover.active;
  const activeValue = ai !== null ? values[ai] : undefined;
  const name = (i: number) => labels?.[i] ?? `${i + 1} de ${values.length}`;
  return (
    <ChartFrame svgRef={hover.svgRef} anchor={ai !== null && activeValue !== undefined ? { x: ai * step + step / 2, y: h - barH(activeValue) } : null} tip={ai !== null && activeValue !== undefined ? { label: name(ai), value: format(activeValue) } : null}>
      <svg ref={hover.svgRef} className={[styles.spark, ai !== null ? styles.dimming : ""].join(" ")} viewBox={`0 0 ${w} ${h}`} role="group" aria-label={label ?? "Tendencia"} preserveAspectRatio="none">
        {values.map((v, i) => (
          <g key={i} className={styles.item} role="img" aria-label={`${name(i)}: ${format(v)}`} {...hover.itemProps(i)}>
            <rect x={i * step} y={0} width={step} height={h} className={styles.hit} />
            <rect x={i * step + (step - bw) / 2} y={h - barH(v)} width={bw} height={barH(v)} rx={bw / 2} className={i === values.length - 1 ? styles.sparkLast : styles.sparkBar} />
          </g>
        ))}
      </svg>
    </ChartFrame>
  );
};
