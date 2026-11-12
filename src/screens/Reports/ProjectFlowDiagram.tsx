import { int, money, moneyCompact, pct, times } from "@/lib/format";
import type { SimulatorInput, SimulatorResult } from "@/types/api";
import { FlowDiagram, fit, type FlowStep } from "./FlowDiagram";

/** Los nueve pasos del modelo económico, en el orden en que la API los calcula, con las cifras del proyecto. */
export const flowSteps = (input: SimulatorInput, r: SimulatorResult): FlowStep[] => {
  const y1 = r.cashFlow.years[0];
  const top = [...r.risks.tornado].sort((a, b) => b.amplitude - a.amplitude)[0];
  return [
    { title: "Mercado", how: ["Población × intención de compra", "× consumo × 12 meses"], value: [`${int(r.market.annualDemand)} unidades al año`], section: "§2" },
    { title: "Competencia", how: ["Demanda × cuota que se capta", `(${pct(r.competition.marketShare)} del mercado)`], value: [`${int(r.competition.annualUnits)} unidades al año`], section: "§2" },
    { title: "Costos y precio", how: ["Costo unitario × (1 + margen)", `${moneyCompact(r.costs.unitCost)} × (1 + ${pct(r.costs.marginOnCost)})`], value: [`Precio ${money(r.costs.price)}`], section: "§3" },
    { title: "Ingresos y EBITDA", how: ["Año 1: unidades × precio,", "menos costos fijos y variables"], value: [`Ingresos ${moneyCompact(y1?.revenue)}`, `EBITDA ${moneyCompact(y1?.ebitda)}`], section: "§3 · §5" },
    { title: "Inversión", how: ["Activos, diferidos, capital de", "trabajo e imprevistos"], value: [`Total ${moneyCompact(r.investment.total)}`, `Dep. y amort. ${moneyCompact(r.investment.schedule[0]?.charge)}/año`], section: "§3" },
    { title: "Financiación", how: [`${pct(input.financing.creditPct)} con crédito al ${pct(input.financing.creditRateEA)} EA`, `a ${int(input.financing.termMonths)} meses, cuota fija`], value: [`Cuota ${moneyCompact(r.financing.installment)}/mes`, `Cobertura mín. ${r.financing.minCoverage === null ? "sin cuota" : times(r.financing.minCoverage)}`], section: "§4", ...(r.financing.coverageAlert ? { tone: "warn" as const } : {}) },
    { title: "Flujo de caja", how: ["EBITDA − impuesto ± capital", "de trabajo y salvamento"], value: [`Año 0 ${moneyCompact(r.cashFlow.flows[0])}`, `Año 1 ${moneyCompact(y1?.netFlow)}`], section: "§5" },
    { title: "Indicadores", how: [`Flujos descontados al ${pct(r.indicators.discountRate)}`, "(tasa mínima exigida)"], value: [`VPN ${moneyCompact(r.indicators.npv)}`, `TIR ${pct(r.indicators.irr)}`], section: "§5", ...(r.indicators.npv < 0 ? { tone: "bad" as const } : {}) },
    { title: "Riesgos", how: ["Se mueve cada variable y se", "mide cuánto cambia el VPN"], value: top ? [fit(`Más sensible: ${top.label}`, 30), `VPN ${moneyCompact(top.npvLow)} a ${moneyCompact(top.npvHigh)}`] : ["Sin variables"], section: "§6" },
  ];
};

/**
 * Diagrama del flujo económico del proyecto: los nueve pasos del cálculo encadenados, cada uno con su fórmula, su
 * resultado (cifras de la API) y la sección del informe donde está la tabla que lo respalda.
 */
export const ProjectFlowDiagram = ({ input, result }: { input: SimulatorInput; result: SimulatorResult }) => (
  <FlowDiagram
    id="proyecto"
    steps={flowSteps(input, result)}
    caption="Orden del cálculo, de la demanda a los indicadores. Cada caja muestra cómo se obtiene su cifra y la sección (§) donde está la tabla que la respalda. El VPN es del proyecto; la financiación se evalúa aparte con la cobertura de la cuota."
  />
);
