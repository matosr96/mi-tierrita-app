import type { CSSProperties } from "react";
import { ChartFrame, useChartHover } from "@/components/charts";
import { money } from "@/lib/format";
import styles from "./FinanceScreen.module.css";

export type TornadoRow = { label: string; low: number; high: number; amplitude: number };

type Props = { rows: TornadoRow[]; base: number; baseLabel: string };

const CX = 402.4;
const HALF = 178;
const ROW = 28;

/**
 * Tornado del lienzo: una barra por supuesto, de mayor a menor impacto; sin ancho = "sin efecto sobre el proyecto".
 * Pasar el puntero, tocar o tabular una fila apaga las demás y muestra el VPN más bajo y más alto que dio la API.
 */
export const TornadoBars = ({ rows, base, baseLabel }: Props) => {
  const hover = useChartHover();
  const height = 22 + rows.length * ROW + 24;
  const maxDev = Math.max(...rows.flatMap((r) => [Math.abs(r.low - base), Math.abs(r.high - base)]), 1);
  const scale = HALF / maxDev;
  const ai = hover.active;
  const active = ai !== null ? rows[ai] : undefined;
  const rowsOf = (r: TornadoRow) =>
    r.amplitude === 0
      ? [{ name: "VPN", value: `${money(r.low)} · sin efecto` }]
      : [
          { name: "VPN más bajo", value: money(Math.min(r.low, r.high)) },
          { name: "VPN más alto", value: money(Math.max(r.low, r.high)) },
        ];
  return (
    <ChartFrame
      svgRef={hover.svgRef}
      anchor={active && ai !== null ? { x: CX + ((Math.min(active.low, active.high) + Math.max(active.low, active.high)) / 2 - base) * scale, y: 22 + ai * ROW - 2 } : null}
      tip={active ? { label: active.label, rows: rowsOf(active) } : null}
    >
      <svg
        ref={hover.svgRef}
        className={[styles.svg, active ? styles.dimming : ""].join(" ")}
        viewBox={`0 0 620 ${height}`}
        height={height}
        role="group"
        aria-label="Supuestos ordenados por su efecto sobre el VPN del proyecto"
      >
        <line x1={CX} y1="18" x2={CX} y2={height - 24} className={styles.axisInk} strokeWidth="1.5" />
        <text x={CX} y={height - 6} textAnchor="middle" fontSize="10.5" className={styles.textInk2}>
          VPN base {baseLabel}
        </text>
        {rows.map((r, i) => {
          const y = 22 + i * ROW;
          const lo = Math.min(r.low, r.high) - base;
          const hi = Math.max(r.low, r.high) - base;
          const x = CX + lo * scale;
          const w = (hi - lo) * scale;
          const fill = i < 2 ? styles.fillGood : i < 5 ? styles.fillLeaf : styles.fillMuted2;
          const flat = r.amplitude === 0 || w < 1;
          return (
            <g
              key={r.label}
              style={{ "--i": i } as CSSProperties}
              className={styles.hoverItem}
              role="img"
              aria-label={`${r.label}: ${rowsOf(r)
                .map((x) => `${x.name} ${x.value}`)
                .join(", ")}`}
              {...hover.itemProps(i)}
            >
              <rect x="0" y={y - 6} width="620" height={ROW} className={styles.hit} />
              {flat ? (
                <>
                  <line x1={CX} y1={y - 4} x2={CX} y2={y + 12} className={styles.markMuted2} strokeWidth="3" />
                  <text x={CX + 10} y={y + 12} fontSize="11" className={styles.textMuted}>
                    sin efecto sobre el proyecto
                  </text>
                </>
              ) : (
                <rect x={x} y={y} width={w} height="16" rx="3" className={[fill, styles.growCenter].join(" ")} style={{ "--cx": `${CX}px` } as CSSProperties} />
              )}
              <text x="190" y={y + 12} textAnchor="end" fontSize="12" className={styles.textInk}>
                {r.label}
              </text>
            </g>
          );
        })}
      </svg>
    </ChartFrame>
  );
};
