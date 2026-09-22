import styles from "./FinanceScreen.module.css";

export type YearSplit = { year: number; interest: number; principal: number };

type Props = { years: YearSplit[]; format: (v: number) => string; caption: string };

const PX0 = 54;
const PX1 = 452;
const TOP = 46;
const BASE = 186;

/** "A qué se va cada cuota": barras apiladas de interés (naranja) y capital (verde) por año, como en el lienzo. */
export const InterestCapitalChart = ({ years, format, caption }: Props) => {
  const max = Math.max(...years.map((y) => y.interest + y.principal), 1);
  const slot = (PX1 - PX0) / Math.max(years.length, 1);
  const barW = Math.min(62, slot * 0.63);
  const plotH = BASE - TOP;
  return (
    <svg className={styles.svg} viewBox="0 0 470 240" height="240" role="img" aria-label="Interés y abono a capital pagados cada año">
      <line x1={PX0} y1={BASE} x2={PX1} y2={BASE} className={styles.axis} strokeWidth="1" />
      <text x={PX0 - 8} y={TOP + 4} textAnchor="end" fontSize="10" className={styles.textMuted}>
        {format(max)}
      </text>
      <text x={PX0 - 8} y={BASE + 4} textAnchor="end" fontSize="10" className={styles.textMuted}>
        0
      </text>
      {years.map((y, i) => {
        const x = PX0 + slot * i + (slot - barW) / 2;
        const hInt = (y.interest / max) * plotH;
        const hCap = (y.principal / max) * plotH;
        const yInt = BASE - hCap - hInt;
        const yCap = BASE - hCap;
        const cx = x + barW / 2;
        return (
          <g key={y.year}>
            {hInt > 0 ? <rect x={x} y={yInt} width={barW} height={Math.max(hInt - 2, 0)} rx="3" className={styles.fillAccent} /> : null}
            {hCap > 0 ? <rect x={x} y={yCap} width={barW} height={hCap} rx="3" className={styles.fillGood} /> : null}
            {hInt >= 18 ? (
              <text x={cx} y={yInt + hInt / 2 + 4} textAnchor="middle" fontSize="11.5" fontWeight="600" className={styles.textOnDark}>
                {format(y.interest)}
              </text>
            ) : (
              <text x={x + barW + 4} y={yInt + 8} fontSize="11" fontWeight="600" className={styles.textAccent}>
                {format(y.interest)}
              </text>
            )}
            {hCap >= 18 ? (
              <text x={cx} y={yCap + hCap / 2 + 4} textAnchor="middle" fontSize="11.5" fontWeight="600" className={styles.textOnDark}>
                {format(y.principal)}
              </text>
            ) : null}
            <text x={cx} y={BASE + 18} textAnchor="middle" fontSize="12" className={styles.textInk2}>
              Año {y.year}
            </text>
          </g>
        );
      })}
      <text x="253" y="228" textAnchor="middle" fontSize="11" className={styles.textMuted}>
        {caption}
      </text>
    </svg>
  );
};
