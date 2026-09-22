import styles from "./FinanceScreen.module.css";

type Props = { generates: number; installment: number; generatesLabel: string; installmentLabel: string; differenceLabel: string };

/** "Cada mes": lo que genera la ampliación (verde) frente a la cuota del crédito (naranja), como en el lienzo. */
export const MonthlyBarsChart = ({ generates, installment, generatesLabel, installmentLabel, differenceLabel }: Props) => {
  const maxBar = Math.max(generates, installment, 1) * 1.18;
  const hGen = Math.max((generates / maxBar) * 96, 2);
  const hCuo = Math.max((installment / maxBar) * 96, 2);
  return (
    <svg className={styles.svg} viewBox="0 0 330 168" height="168" role="img" aria-label="Flujo mensual que genera la ampliación frente a la cuota del crédito">
      <line x1="20" y1="130" x2="316" y2="130" className={styles.axis} strokeWidth="1" />
      <rect x="66" y={130 - hGen} width="70" height={hGen} rx="4" className={styles.fillGood} />
      <text x="101" y={124 - hGen} textAnchor="middle" fontSize="12.5" fontWeight="600" className={styles.textInk}>
        {generatesLabel}
      </text>
      <text x="101" y="148" textAnchor="middle" fontSize="12" className={styles.textInk2}>
        Genera
      </text>
      <rect x="190" y={130 - hCuo} width="70" height={hCuo} rx="4" className={styles.fillAccent} />
      <text x="225" y={124 - hCuo} textAnchor="middle" fontSize="12.5" fontWeight="600" className={styles.textInk}>
        {installmentLabel}
      </text>
      <text x="225" y="148" textAnchor="middle" fontSize="12" className={styles.textInk2}>
        Cuota
      </text>
      <text x="168" y="162" textAnchor="middle" fontSize="11" className={styles.textMuted}>
        {differenceLabel}
      </text>
    </svg>
  );
};
