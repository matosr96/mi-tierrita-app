import type { CSSProperties, KeyboardEvent } from "react";
import { ChartFrame } from "./ChartFrame";
import type { ChartTone } from "./Legend";
import { useChartHover } from "./useChartHover";
import styles from "./charts.module.css";

export type RankingDatum = { label: string; value: number; tone?: ChartTone; /** Texto adicional de la etiqueta flotante (por ejemplo, «Vencida»). */ hint?: string };

type Props = {
  data: RankingDatum[];
  format: (v: number) => string;
  formatTip?: (v: number) => string;
  /** Nombre accesible del gráfico. */
  title?: string;
  /** Al tocar una barra (clic, Enter o espacio) con el índice del dato. */
  onSelect?: ((index: number) => void) | undefined;
};

/** Ranking: barras horizontales con posición («1.», «2.»…), nombre y valor; el tono de cada barra lo decide el dato. */
export const RankingChart = ({ data, format, formatTip = format, title, onSelect }: Props) => {
  const hover = useChartHover();
  const max = Math.max(...data.map((d) => Math.abs(d.value)), 1);
  const rowH = 28;
  const labelW = 186;
  const width = 520;
  const height = data.length * rowH + 8;
  const barW = (d: RankingDatum) => (Math.abs(d.value) / max) * (width - labelW - 96);
  const active = hover.active !== null ? data[hover.active] : undefined;
  const ai = hover.active ?? 0;
  const onKey = (i: number) => (e: KeyboardEvent<SVGGElement>) => {
    if ((e.key === "Enter" || e.key === " ") && onSelect) {
      e.preventDefault();
      onSelect(i);
    }
    const sibling = e.key === "ArrowDown" ? e.currentTarget.nextElementSibling : e.key === "ArrowUp" ? e.currentTarget.previousElementSibling : null;
    if (sibling instanceof SVGGElement) {
      e.preventDefault();
      sibling.focus();
    }
  };
  return (
    <ChartFrame
      svgRef={hover.svgRef}
      anchor={active ? { x: labelW + barW(active) / 2, y: ai * rowH + 8 } : null}
      tip={active ? { label: `${ai + 1}. ${active.label}`, value: formatTip(active.value), rows: active.hint ? [{ name: active.hint, value: "" }] : [] } : null}
    >
      <svg ref={hover.svgRef} className={[styles.svg, active ? styles.dimming : ""].join(" ")} viewBox={`0 0 ${width} ${height}`} role="group" aria-label={title ?? "Ranking"}>
        {data.map((d, i) => {
          const y = i * rowH + 4;
          const w = barW(d);
          const props = hover.itemProps(i);
          return (
            <g
              key={`${i}-${d.label}`}
              style={{ "--i": i } as CSSProperties}
              className={[styles.item, onSelect ? styles.selectable : ""].join(" ")}
              role="img"
              aria-label={`${i + 1}. ${d.label}: ${formatTip(d.value)}${d.hint ? `, ${d.hint}` : ""}`}
              {...props}
              onKeyDown={(e) => {
                props.onKeyDown(e);
                onKey(i)(e);
              }}
              onClick={onSelect ? () => onSelect(i) : undefined}
            >
              <rect x={0} y={y} width={width} height={rowH} className={styles.hit} />
              <text x={24} y={y + 17} textAnchor="end" className={styles.rank}>
                {i + 1}.
              </text>
              <text x={32} y={y + 17} className={styles.label}>
                {d.label.length > 24 ? `${d.label.slice(0, 23)}…` : d.label}
              </text>
              <rect x={labelW} y={y + 5} width={w} height={rowH - 11} rx={6} className={[styles.rankBar, styles[`tone_${d.tone ?? "accent"}`]].join(" ")} />
              <text x={labelW + w + 6} y={y + 17} className={styles.value}>
                {format(d.value)}
              </text>
            </g>
          );
        })}
      </svg>
    </ChartFrame>
  );
};
