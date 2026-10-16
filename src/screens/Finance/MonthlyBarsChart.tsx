import { ChartFrame, useChartHover } from "@/components/charts";
import styles from "./FinanceScreen.module.css";

type Props = { generates: number; installment: number; generatesLabel: string; installmentLabel: string; differenceLabel: string };

/**
 * "Cada mes": lo que genera la ampliación (verde) frente a la cuota del crédito (naranja), como en el lienzo.
 * Pasar el puntero, tocar o tabular una barra apaga la otra y muestra su cifra exacta.
 */
export const MonthlyBarsChart = ({ generates, installment, generatesLabel, installmentLabel, differenceLabel }: Props) => {
  const hover = useChartHover();
  const maxBar = Math.max(generates, installment, 1) * 1.18;
  const hGen = Math.max((generates / maxBar) * 96, 2);
  const hCuo = Math.max((installment / maxBar) * 96, 2);
  const tips = [
    { x: 101, y: 106 - hGen, tip: { label: "Genera al mes", value: generatesLabel } },
    { x: 225, y: 106 - hCuo, tip: { label: "Cuota mensual", value: installmentLabel } },
  ];
  const active = hover.active !== null ? tips[hover.active] : undefined;
  return (
    <ChartFrame svgRef={hover.svgRef} anchor={active ? { x: active.x, y: active.y } : null} tip={active?.tip ?? null}>
      <svg
        ref={hover.svgRef}
        className={[styles.svg, active ? styles.dimming : ""].join(" ")}
        viewBox="0 0 330 168"
        height="168"
        role="group"
        aria-label="Flujo mensual que genera la ampliación frente a la cuota del crédito"
      >
        <line x1="20" y1="130" x2="316" y2="130" className={styles.axis} strokeWidth="1" />
        <g className={styles.hoverItem} role="img" aria-label={`Genera: ${generatesLabel}`} {...hover.itemProps(0)}>
          <rect x="46" y="8" width="110" height="148" className={styles.hit} />
          <rect x="66" y={130 - hGen} width="70" height={hGen} rx="4" className={styles.fillGood} />
          <text x="101" y={124 - hGen} textAnchor="middle" fontSize="12.5" fontWeight="600" className={styles.textInk}>
            {generatesLabel}
          </text>
          <text x="101" y="148" textAnchor="middle" fontSize="12" className={styles.textInk2}>
            Genera
          </text>
        </g>
        <g className={styles.hoverItem} role="img" aria-label={`Cuota: ${installmentLabel}`} {...hover.itemProps(1)}>
          <rect x="170" y="8" width="110" height="148" className={styles.hit} />
          <rect x="190" y={130 - hCuo} width="70" height={hCuo} rx="4" className={styles.fillAccent} />
          <text x="225" y={124 - hCuo} textAnchor="middle" fontSize="12.5" fontWeight="600" className={styles.textInk}>
            {installmentLabel}
          </text>
          <text x="225" y="148" textAnchor="middle" fontSize="12" className={styles.textInk2}>
            Cuota
          </text>
        </g>
        <text x="168" y="162" textAnchor="middle" fontSize="11" className={styles.textMuted}>
          {differenceLabel}
        </text>
      </svg>
    </ChartFrame>
  );
};
