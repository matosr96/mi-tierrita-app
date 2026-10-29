import { useState, type CSSProperties, type KeyboardEvent } from "react";
import { ChartFrame } from "./ChartFrame";
import { Legend, type ChartTone } from "./Legend";
import { useChartHover } from "./useChartHover";
import styles from "./charts.module.css";

export type StackedSeries = { key: string; label: string; tone: ChartTone };
export type StackedDatum = { label: string; values: Record<string, number> };

type Props = {
  data: StackedDatum[];
  series: StackedSeries[];
  format: (v: number) => string;
  /** Formato de la etiqueta flotante (por defecto, el mismo de la barra). */
  formatTip?: (v: number) => string;
  /** Nombre accesible del gráfico. */
  title?: string;
  /** Al tocar una barra (clic, Enter o espacio) con el índice del dato. */
  onSelect?: ((index: number) => void) | undefined;
};

/**
 * Barras verticales apiladas (varias series por categoría). La leyenda muestra u oculta series (`aria-pressed`); la
 * etiqueta flotante desglosa cada serie y el total; Tab recorre las barras, ← → saltan entre ellas y Enter abre el detalle.
 */
export const StackedBarChart = ({ data, series, format, formatTip = format, title, onSelect }: Props) => {
  const hover = useChartHover();
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const visible = series.filter((s) => !hidden.has(s.key));
  const totalOf = (d: StackedDatum) => visible.reduce((acc, s) => acc + Math.max(d.values[s.key] ?? 0, 0), 0);
  const max = Math.max(...data.map(totalOf), 1);
  const width = 520;
  const height = 230;
  const pad = { top: 24, bottom: 34, left: 10, right: 10 };
  const slot = (width - pad.left - pad.right) / Math.max(data.length, 1);
  const barW = Math.min(slot * 0.55, 60);
  const scale = (v: number) => (v / max) * (height - pad.top - pad.bottom);
  const active = hover.active !== null ? data[hover.active] : undefined;
  const ai = hover.active ?? 0;
  const tip = active
    ? {
        label: active.label,
        value: formatTip(totalOf(active)),
        rows: visible.map((s) => ({ name: s.label, value: formatTip(active.values[s.key] ?? 0) })),
      }
    : null;
  const toggle = (key: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else if (next.size < series.length - 1) next.add(key);
      return next;
    });
  const onKey = (i: number) => (e: KeyboardEvent<SVGGElement>) => {
    if ((e.key === "Enter" || e.key === " ") && onSelect) {
      e.preventDefault();
      onSelect(i);
    }
    const sibling = e.key === "ArrowRight" ? e.currentTarget.nextElementSibling : e.key === "ArrowLeft" ? e.currentTarget.previousElementSibling : null;
    if (sibling instanceof SVGGElement) {
      e.preventDefault();
      sibling.focus();
    }
  };

  return (
    <div className={styles.withLegend}>
      <Legend items={series.map((s) => ({ ...s, hidden: hidden.has(s.key) }))} onToggle={toggle} />
      <ChartFrame svgRef={hover.svgRef} anchor={active ? { x: pad.left + slot * ai + slot / 2, y: height - pad.bottom - scale(totalOf(active)) - 16 } : null} tip={tip}>
        <svg ref={hover.svgRef} className={[styles.svg, active ? styles.dimming : ""].join(" ")} viewBox={`0 0 ${width} ${height}`} role="group" aria-label={title ?? "Gráfico de barras apiladas"}>
          <line x1={pad.left} x2={width - pad.right} y1={height - pad.bottom} y2={height - pad.bottom} className={styles.axis} />
          {data.map((d, i) => {
            const x = pad.left + slot * i + (slot - barW) / 2;
            const total = totalOf(d);
            let yTop = height - pad.bottom;
            const text = `${d.label}: ${formatTip(total)}${visible.map((s) => `, ${s.label} ${formatTip(d.values[s.key] ?? 0)}`).join("")}`;
            const props = hover.itemProps(i);
            return (
              <g
                key={d.label}
                style={{ "--i": i } as CSSProperties}
                className={[styles.item, onSelect ? styles.selectable : ""].join(" ")}
                role="img"
                aria-label={text}
                {...props}
                onKeyDown={(e) => {
                  props.onKeyDown(e);
                  onKey(i)(e);
                }}
                onClick={onSelect ? () => onSelect(i) : undefined}
              >
                <rect x={pad.left + slot * i} y={pad.top / 2} width={slot} height={height - pad.top / 2} className={styles.hit} />
                {visible.map((s) => {
                  const h = scale(Math.max(d.values[s.key] ?? 0, 0));
                  yTop -= h;
                  return <rect key={s.key} x={x} y={yTop} width={barW} height={h} className={[styles.stack, styles[`tone_${s.tone}`]].join(" ")} />;
                })}
                {data.length <= 8 ? (
                  <text x={x + barW / 2} y={yTop - 6} textAnchor="middle" className={styles.value}>
                    {format(total)}
                  </text>
                ) : null}
                <text x={x + barW / 2} y={height - pad.bottom + 16} textAnchor="middle" className={styles.label}>
                  {d.label.length > 16 ? `${d.label.slice(0, 15)}…` : d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </ChartFrame>
    </div>
  );
};
