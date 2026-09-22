import styles from "./FinanceScreen.module.css";

export type TornadoRow = { label: string; low: number; high: number; amplitude: number };

type Props = { rows: TornadoRow[]; base: number; baseLabel: string };

const CX = 402.4;
const HALF = 178;
const ROW = 28;

/** Tornado del lienzo: una barra por supuesto, de mayor a menor impacto; sin ancho = "sin efecto sobre el proyecto". */
export const TornadoBars = ({ rows, base, baseLabel }: Props) => {
  const height = 22 + rows.length * ROW + 24;
  const maxDev = Math.max(...rows.flatMap((r) => [Math.abs(r.low - base), Math.abs(r.high - base)]), 1);
  const scale = HALF / maxDev;
  return (
    <svg className={styles.svg} viewBox={`0 0 620 ${height}`} height={height} role="img" aria-label="Supuestos ordenados por su efecto sobre el VPN del proyecto">
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
          <g key={r.label}>
            {flat ? (
              <>
                <line x1={CX} y1={y - 4} x2={CX} y2={y + 12} className={styles.markMuted2} strokeWidth="3" />
                <text x={CX + 10} y={y + 12} fontSize="11" className={styles.textMuted}>
                  sin efecto sobre el proyecto
                </text>
              </>
            ) : (
              <rect x={x} y={y} width={w} height="16" rx="3" className={fill} />
            )}
            <text x="190" y={y + 12} textAnchor="end" fontSize="12" className={styles.textInk}>
              {r.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
