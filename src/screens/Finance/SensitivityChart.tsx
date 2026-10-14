import type { CSSProperties } from "react";
import { ChartCrosshair, ChartFrame, useLineScrub } from "@/components/charts";
import styles from "./FinanceScreen.module.css";

export type SensitivityPoint = { value: number; npv: number };

type Props = {
  points: SensitivityPoint[];
  baseX: number;
  breakEven: number | null;
  formatX: (v: number) => string;
  formatY: (v: number) => string;
  /** Qué puntos llevan círculo y rótulo en el eje (los demás solo trazan la línea). */
  labeled: (x: number) => boolean;
  isBase: (x: number) => boolean;
  axisTitle: string;
};

const W = 680;
const PX0 = 70;
const PX1 = 640;
const PY0 = 20;
const PY1 = 210;

/**
 * Curva del VPN según el aumento de ventas, con la zona que destruye valor sombreada y el equilibrio marcado (lienzo Escenarios).
 * Al pasar el puntero (o con ← → tras enfocarla) la lectura salta al punto de la API más cercano y muestra su VPN.
 */
export const SensitivityChart = ({ points, baseX, breakEven, formatX, formatY, labeled, isBase, axisTitle }: Props) => {
  const sorted = [...points].sort((a, b) => a.value - b.value);
  const xs = sorted.map((p) => p.value);
  const scrubX = (x: number) => PX0 + ((x - Math.min(...xs)) / (Math.max(...xs) - Math.min(...xs) || 1)) * (PX1 - PX0);
  const baseIndex = sorted.findIndex((p) => isBase(p.value));
  const scrub = useLineScrub(xs.map(scrubX), baseIndex >= 0 ? baseIndex : 0);
  if (sorted.length === 0) return null;
  const ys = sorted.map((p) => p.npv);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(0, ...ys);
  const maxY = Math.max(0, ...ys);
  const sx = (x: number) => PX0 + ((x - minX) / (maxX - minX || 1)) * (PX1 - PX0);
  const sy = (y: number) => PY0 + ((maxY - y) / (maxY - minY || 1)) * (PY1 - PY0);
  const zeroY = sy(0);
  const xU = breakEven !== null && breakEven >= minX && breakEven <= maxX ? sx(breakEven) : null;
  const base = sorted.find((p) => isBase(p.value));
  const polyline = sorted.map((p) => `${sx(p.value).toFixed(1)},${sy(p.npv).toFixed(1)}`).join(" ");
  const active = scrub.active !== null ? sorted[scrub.active] : undefined;
  return (
    <ChartFrame
      svgRef={scrub.svgRef}
      anchor={active ? { x: sx(active.value), y: sy(active.npv) } : null}
      tip={active ? { label: `${formatX(active.value)}${isBase(active.value) ? " · caso base" : ""}`, value: `VPN ${formatY(active.npv)}` } : null}
    >
      <svg
        {...scrub.svgProps}
        className={[styles.svg, styles.scrubbable].join(" ")}
        viewBox={`0 0 ${W} 250`}
        height="250"
        role="img"
        aria-label={`VPN según ${axisTitle.toLowerCase()}; caso base ${formatX(baseX)}. Use las flechas para recorrer los puntos.`}
      >
        <line x1={PX0} y1={zeroY} x2={PX1 + 15} y2={zeroY} className={styles.axis} strokeWidth="1" />
        {maxY > 0 ? (
          <text x={PX0 - 8} y={sy(maxY) + 8} textAnchor="end" fontSize="10" className={styles.textMuted}>
            {formatY(maxY)}
          </text>
        ) : null}
        <text x={PX0 - 8} y={zeroY + 4} textAnchor="end" fontSize="10" className={styles.textMuted}>
          0
        </text>
        {minY < 0 ? (
          <text x={PX0 - 8} y={sy(minY) - 2} textAnchor="end" fontSize="10" className={styles.textMuted}>
            {formatY(minY)}
          </text>
        ) : null}
        {xU !== null ? (
          <>
            <rect x={PX0} y={PY0} width={Math.max(xU - PX0, 0)} height={PY1 - PY0} className={[styles.fillBad, styles.zoneIn].join(" ")} opacity="0.05" />
            <line x1={xU} y1={PY0} x2={xU} y2={PY1} className={[styles.markWarn, styles.fadeDown].join(" ")} strokeWidth="2" strokeDasharray="5 4" />
            <text x={xU - 5} y="34" textAnchor="end" fontSize="11" fontWeight="600" className={styles.textWarnTag}>
              {formatX(breakEven as number)}
            </text>
            <text x={xU - 5} y="47" textAnchor="end" fontSize="10" className={styles.textWarnTag}>
              equilibrio
            </text>
          </>
        ) : null}
        <polyline points={polyline} fill="none" pathLength={1} className={[styles.strokeGood, styles.draw].join(" ")} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {sorted
          .filter((p) => labeled(p.value) && !isBase(p.value))
          .map((p) => (
            <circle
              key={p.value}
              cx={sx(p.value)}
              cy={sy(p.npv)}
              r="4.5"
              className={[styles.dotGood, styles.pop].join(" ")}
              style={{ "--i": (sx(p.value) - PX0) / (PX1 - PX0) } as CSSProperties}
              strokeWidth="2"
            />
          ))}
        {base ? (
          <>
            <circle cx={sx(base.value)} cy={sy(base.npv)} r="6" className={styles.baseHalo} />
            <circle cx={sx(base.value)} cy={sy(base.npv)} r="6" className={[styles.dotBase, styles.pop].join(" ")} style={{ "--i": 1 } as CSSProperties} strokeWidth="2" />
            <text x={sx(base.value)} y={sy(base.npv) - 9.6} textAnchor="middle" fontSize="11.5" fontWeight="600" className={styles.textInk}>
              caso base
            </text>
          </>
        ) : null}
        {sorted
          .filter((p) => labeled(p.value))
          .map((p) => (
            <text key={`x${p.value}`} x={sx(p.value)} y="220" textAnchor="middle" fontSize="11" className={styles.textInk2}>
              {formatX(p.value)}
            </text>
          ))}
        <text x="360" y="242" textAnchor="middle" fontSize="11" className={styles.textMuted}>
          {axisTitle}
        </text>
        {active ? <ChartCrosshair x={sx(active.value)} y={sy(active.npv)} top={PY0} bottom={PY1} /> : null}
      </svg>
    </ChartFrame>
  );
};
