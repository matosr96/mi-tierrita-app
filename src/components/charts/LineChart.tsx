import type { CSSProperties } from "react";
import { ChartCrosshair } from "./ChartCrosshair";
import { ChartFrame } from "./ChartFrame";
import { useLineScrub } from "./useChartHover";
import styles from "./charts.module.css";

export type LinePoint = { x: number; y: number };

type Props = {
  points: LinePoint[];
  formatX: (v: number) => string;
  formatY: (v: number) => string;
  /** Marca vertical (por ejemplo, el punto de equilibrio) y etiqueta. */
  marker?: { x: number; label: string } | undefined;
  highlightX?: number | undefined;
  /** Nombre accesible del gráfico. */
  title?: string;
};

/**
 * Línea con eje cero, área negativa sombreada y marcador opcional; el trazo se dibuja y los puntos aparecen a su paso.
 * Al pasar el puntero (o con ← → tras enfocarla) una línea vertical salta al punto más cercano y una etiqueta
 * flotante muestra su X y su Y formateadas.
 */
export const LineChart = ({
  points,
  formatX,
  formatY,
  marker,
  highlightX,
  title,
}: Props) => {
  const width = 520;
  const height = 240;
  const pad = { top: 20, bottom: 36, left: 56, right: 20 };
  const minX0 = Math.min(...points.map((p) => p.x));
  const maxX0 = Math.max(...points.map((p) => p.x));
  const sx0 = (x: number) =>
    pad.left +
    ((x - minX0) / (maxX0 - minX0 || 1)) * (width - pad.left - pad.right);
  const highlightIndex = points.findIndex((p) => p.x === highlightX);
  const scrub = useLineScrub(
    points.map((p) => sx0(p.x)),
    highlightIndex >= 0 ? highlightIndex : 0,
  );
  if (points.length === 0) return null;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(0, ...ys);
  const maxY = Math.max(0, ...ys);
  const sx = (x: number) =>
    pad.left +
    ((x - minX) / (maxX - minX || 1)) * (width - pad.left - pad.right);
  const sy = (y: number) =>
    pad.top +
    ((maxY - y) / (maxY - minY || 1)) * (height - pad.top - pad.bottom);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x)},${sy(p.y)}`)
    .join(" ");
  const zeroY = sy(0);
  const labelEvery = Math.max(1, Math.ceil(points.length / 7));
  const active = scrub.active !== null ? points[scrub.active] : undefined;
  const label =
    title ??
    `Serie de ${points.length} puntos, de ${formatX(minX)} a ${formatX(maxX)}`;
  return (
    <ChartFrame
      svgRef={scrub.svgRef}
      anchor={active ? { x: sx(active.x), y: sy(active.y) } : null}
      tip={
        active ? { label: formatX(active.x), value: formatY(active.y) } : null
      }
    >
      <svg
        {...scrub.svgProps}
        className={[styles.svg, styles.interactive].join(" ")}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${label}. Use las flechas para recorrer los puntos.`}
      >
        {minY < 0 ? (
          <rect
            x={pad.left}
            y={zeroY}
            width={width - pad.left - pad.right}
            height={sy(minY) - zeroY}
            className={styles.negativeArea}
          />
        ) : null}
        <line
          x1={pad.left}
          x2={width - pad.right}
          y1={zeroY}
          y2={zeroY}
          className={styles.zero}
        />
        <text
          x={pad.left - 8}
          y={sy(maxY) + 4}
          textAnchor="end"
          className={styles.label}
        >
          {formatY(maxY)}
        </text>
        <text
          x={pad.left - 8}
          y={zeroY + 4}
          textAnchor="end"
          className={styles.label}
        >
          0
        </text>
        {minY < 0 ? (
          <text
            x={pad.left - 8}
            y={sy(minY) + 4}
            textAnchor="end"
            className={styles.label}
          >
            {formatY(minY)}
          </text>
        ) : null}
        {marker && marker.x >= minX && marker.x <= maxX ? (
          <g>
            <line
              x1={sx(marker.x)}
              x2={sx(marker.x)}
              y1={pad.top}
              y2={height - pad.bottom}
              className={styles.marker}
            />
            <text
              x={sx(marker.x) + 4}
              y={pad.top + 10}
              className={styles.label}
            >
              {marker.label}
            </text>
          </g>
        ) : null}
        <path d={path} className={styles.line} pathLength={1} />
        {points.map((p, i) => (
          <circle
            key={p.x}
            style={
              { "--i": i / Math.max(points.length - 1, 1) } as CSSProperties
            }
            cx={sx(p.x)}
            cy={sy(p.y)}
            r={p.x === highlightX ? 5 : 3.5}
            className={styles.dot}
          />
        ))}
        {points.map((p, i) =>
          // Con muchos puntos solo se rotulan algunos (siempre el primero y el último) para que no se encimen.
          i !== points.length - 1 && (i % labelEvery !== 0 || points.length - 1 - i < Math.ceil(labelEvery / 2)) ? null : (
            <text
              key={`x${p.x}`}
              x={sx(p.x)}
              y={height - pad.bottom + 16}
              textAnchor="middle"
              className={styles.label}
            >
              {formatX(p.x)}
            </text>
          ),
        )}
        {active ? (
          <ChartCrosshair
            x={sx(active.x)}
            y={sy(active.y)}
            top={pad.top}
            bottom={height - pad.bottom}
          />
        ) : null}
      </svg>
    </ChartFrame>
  );
};
