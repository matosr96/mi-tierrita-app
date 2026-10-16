import type { CSSProperties } from "react";
import { ChartFrame } from "./ChartFrame";
import { useChartHover } from "./useChartHover";
import styles from "./charts.module.css";

export type BarDatum = { label: string; value: number; alt?: boolean };

type Props = {
  data: BarDatum[];
  format: (v: number) => string;
  /** Formato de la etiqueta flotante (por defecto, el mismo de la barra). */
  formatTip?: (v: number) => string;
  /** Nombre accesible del gráfico. */
  title?: string;
};

const tipOf = (d: BarDatum, fmt: (v: number) => string) => ({ label: d.label, value: fmt(d.value) });

/**
 * Barras horizontales con etiqueta y valor formateado; crecen desde la izquierda una tras otra.
 * Pasar el puntero, tocar o tabular una barra apaga las demás y muestra su valor en una etiqueta flotante.
 */
export const HBarChart = ({ data, format, formatTip = format, title }: Props) => {
  const hover = useChartHover();
  const max = Math.max(...data.map((d) => Math.abs(d.value)), 1);
  const rowH = 26;
  const labelW = 150;
  const width = 520;
  const height = data.length * rowH + 8;
  const barW = (d: BarDatum) => (Math.abs(d.value) / max) * (width - labelW - 90);
  const active = hover.active !== null ? data[hover.active] : undefined;
  const ai = hover.active ?? 0;
  return (
    <ChartFrame svgRef={hover.svgRef} anchor={active ? { x: labelW + barW(active) / 2, y: ai * rowH + 8 } : null} tip={active ? tipOf(active, formatTip) : null}>
      <svg
        ref={hover.svgRef}
        className={[styles.svg, styles.hbars, active ? styles.dimming : ""].join(" ")}
        viewBox={`0 0 ${width} ${height}`}
        role="group"
        aria-label={title ?? "Gráfico de barras horizontales"}
      >
        {data.map((d, i) => {
          const y = i * rowH + 4;
          const w = barW(d);
          const text = formatTip(d.value) || format(d.value);
          return (
            <g key={d.label} style={{ "--i": i } as CSSProperties} className={styles.item} role="img" aria-label={text ? `${d.label}: ${text}` : d.label} {...hover.itemProps(i)}>
              <rect x={0} y={y} width={width} height={rowH} className={styles.hit} />
              <text x={labelW - 8} y={y + 15} textAnchor="end" className={styles.label}>
                {d.label}
              </text>
              <rect x={labelW} y={y + 4} width={w} height={rowH - 10} rx={6} className={d.alt ? styles.barAlt : styles.bar} />
              <text x={labelW + w + 6} y={y + 15} className={styles.value}>
                {format(d.value)}
              </text>
            </g>
          );
        })}
      </svg>
    </ChartFrame>
  );
};

/**
 * Barras verticales (por categoría, por mes); suben desde el eje una tras otra.
 * Pasar el puntero, tocar o tabular una barra apaga las demás y muestra su valor en una etiqueta flotante.
 */
export const VBarChart = ({ data, format, formatTip = format, title }: Props) => {
  const hover = useChartHover();
  const max = Math.max(...data.map((d) => Math.abs(d.value)), 1);
  const width = 520;
  const height = 220;
  const pad = { top: 24, bottom: 34, left: 10, right: 10 };
  const slot = (width - pad.left - pad.right) / Math.max(data.length, 1);
  const barW = Math.min(slot * 0.55, 60);
  const barH = (d: BarDatum) => (Math.abs(d.value) / max) * (height - pad.top - pad.bottom);
  const active = hover.active !== null ? data[hover.active] : undefined;
  const ai = hover.active ?? 0;
  return (
    <ChartFrame svgRef={hover.svgRef} anchor={active ? { x: pad.left + slot * ai + slot / 2, y: height - pad.bottom - barH(active) - 16 } : null} tip={active ? tipOf(active, formatTip) : null}>
      <svg
        ref={hover.svgRef}
        className={[styles.svg, styles.vbars, active ? styles.dimming : ""].join(" ")}
        viewBox={`0 0 ${width} ${height}`}
        role="group"
        aria-label={title ?? "Gráfico de barras verticales"}
      >
        <line x1={pad.left} x2={width - pad.right} y1={height - pad.bottom} y2={height - pad.bottom} className={styles.axis} />
        {data.map((d, i) => {
          const h = barH(d);
          const x = pad.left + slot * i + (slot - barW) / 2;
          const y = height - pad.bottom - h;
          const text = formatTip(d.value) || format(d.value);
          return (
            <g key={d.label} style={{ "--i": i } as CSSProperties} className={styles.item} role="img" aria-label={text ? `${d.label}: ${text}` : d.label} {...hover.itemProps(i)}>
              <rect x={pad.left + slot * i} y={pad.top / 2} width={slot} height={height - pad.top / 2} className={styles.hit} />
              <rect x={x} y={y} width={barW} height={h} rx={6} className={d.alt ? styles.barAlt : styles.bar} />
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
    </ChartFrame>
  );
};
