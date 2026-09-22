import styles from "./FinanceScreen.module.css";

type Props = {
  from: number;
  to: number;
  current: number;
  currentLabel: string;
  breakEven: number | null;
  breakEvenLabel: string;
  fromLabel: string;
  toLabel: string;
  /** Sin punto de equilibrio en el rango: toda la pista es favorable (true) o desfavorable (false). */
  allGood: boolean;
};

const X0 = 60;
const X1 = 1040;

/** Pista del lienzo: tramo rojo hasta el equilibrio, tramo verde después, marcador del equilibrio y del caso base. */
export const SafetyMarginChart = ({ from, to, current, currentLabel, breakEven, breakEvenLabel, fromLabel, toLabel, allGood }: Props) => {
  const scale = (x: number) => Math.min(X1, Math.max(X0, X0 + ((x - from) / (to - from || 1)) * (X1 - X0)));
  const xU = breakEven === null ? (allGood ? X0 : X1) : scale(breakEven);
  const xA = scale(current);
  const wNo = Math.max(xU - X0, 0);
  const wSi = Math.max(X1 - xU, 0);
  const yLabel = breakEven !== null && Math.abs(xA - xU) < 70 ? 92 : 10;
  return (
    <svg className={styles.svg} viewBox="0 0 1060 96" height="96" role="img" aria-label="Posición actual frente al punto de equilibrio de las ventas">
      {wNo > 0 ? <rect x={X0} y="30" width={wNo} height="26" rx="4" className={styles.trackBad} /> : null}
      {wSi > 0 ? <rect x={xU} y="30" width={wSi} height="26" rx="4" className={styles.trackGood} /> : null}
      {breakEven !== null ? (
        <>
          <line x1={xU} y1="22" x2={xU} y2="64" className={styles.markBad} strokeWidth="2.5" />
          <text x={xU} y="80" textAnchor="middle" fontSize="11.5" fontWeight="600" className={styles.textBad}>
            equilibrio {breakEvenLabel}
          </text>
        </>
      ) : null}
      <line x1={xA} y1="14" x2={xA} y2="72" className={styles.markForest} strokeWidth="3" />
      <circle cx={xA} cy="14" r="5.5" className={styles.fillForest} />
      <text x={xA} y={yLabel} textAnchor="middle" fontSize="12" fontWeight="600" className={styles.textForest}>
        {currentLabel}
      </text>
      <text x={X0} y="20" fontSize="10.5" className={styles.textMuted}>
        {fromLabel}
      </text>
      <text x={X1} y="20" textAnchor="end" fontSize="10.5" className={styles.textMuted}>
        {toLabel}
      </text>
    </svg>
  );
};
