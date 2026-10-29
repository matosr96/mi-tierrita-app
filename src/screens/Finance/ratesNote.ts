import { pct } from "../../lib/format";
import type { SimulatorResult } from "@/types/api";
import { points } from "./simShared";

/**
 * Párrafos de la decisión 4 para el informe y la pestaña Riesgos: por qué la tasa mínima es menor que la del crédito,
 * de dónde sale la tasa mínima y qué tan cerca queda la TIR del crédito. Solo arma texto con cifras de la API; el origen
 * del 18 % es el del TCC (capítulo «Tasa mínima atractiva de retorno»).
 */
export const ratesNote = (r: SimulatorResult): string[] => {
  const ind = r.indicators;
  const f = r.financing;
  const gap = ind.irrOverCredit;
  return [
    `El VPN se calcula sobre el flujo libre del proyecto, sin deuda, descontado a la tasa mínima exigida de ${pct(ind.discountRate)} efectiva anual. El crédito, al ${pct(f.creditRateEA)} EA, solo entra en Financiación y en la cobertura de la cuota.`,
    `La tasa mínima es menor que la del crédito porque los intereses se descuentan del impuesto: con el impuesto del ${pct(ind.taxRate)}, la deuda cuesta en realidad ${pct(f.creditRateEA)} × (1 − ${pct(ind.taxRate)}) = ${pct(f.afterTaxCostOfDebt)} (escudo fiscal).`,
    `La tasa mínima de ${pct(ind.discountRate)} es la rentabilidad que el equipo exige al proyecto para aceptarlo: una tasa de referencia más una prima por el riesgo del negocio. Es un criterio del equipo, no un dato de mercado, y se puede cambiar en Flujo de caja.`,
    gap === null
      ? "La TIR no está definida para estos flujos, así que no se puede comparar con la tasa del crédito."
      : gap >= 0
        ? `Advertencia: la TIR (${pct(ind.irr)}) supera la tasa del crédito (${pct(f.creditRateEA)}) por ${points(gap)}. ${gap < 0.05 ? "El margen es estrecho: una caída moderada del precio o de la demanda lo borra (ver el tornado)." : "El proyecto paga sus propios intereses con holgura."}`
        : `Advertencia: la TIR (${pct(ind.irr)}) es menor que la tasa del crédito (${pct(f.creditRateEA)}): el proyecto no alcanza a pagar sus propios intereses.`,
  ];
};
