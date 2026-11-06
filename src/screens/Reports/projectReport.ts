import { int, money, pct, times, years } from "../../lib/format";
import { points, signed } from "../Finance/simShared";
import type { SimDepreciationYear, SimulatorInput, SimulatorResult } from "../../types/api";
import type { XlsxSheet } from "../../lib/xlsx";
import type { Param } from "./ReportPaper";

/**
 * Cifras del «Informe del proyecto» (simulador financiero), armadas una sola vez para la hoja y el Excel. Nada de aquí
 * calcula: solo da formato a lo que devolvió `POST /financial/simulator/calculate` o `GET /financial/projects/:id`.
 */

export type Pair = [string, string];
export type TextTableData = { headers: string[]; rows: string[][]; note?: string };

/** Filas de la tabla de depreciación de activos fijos (línea recta): año, depreciación y valor neto de los activos. */
export const depreciationRows = (schedule: SimDepreciationYear[]): string[][] => schedule.map((d) => [int(d.year), money(d.depreciation), money(d.netBookValue)]);

/** Filas de la tabla de amortización de diferidos: año, amortización y valor neto de los diferidos. */
export const amortizationRows = (schedule: SimDepreciationYear[]): string[][] => schedule.map((d) => [int(d.year), money(d.amortization), money(d.deferredNetValue)]);

export const projectSections = (input: SimulatorInput, r: SimulatorResult) => {
  const m = input.market;
  const assumptions: Pair[] = [
    ["Población objetivo", `${int(m.population)} personas`],
    ["Disposición a comprar", pct(m.purchaseIntent)],
    ["Consumo por persona", `${signed(m.consumptionPerPerson)} unidades al mes`],
    ["Crecimiento del PIB × sensibilidad", `${pct(m.gdpGrowth)} × ${signed(m.gdpSensitivity)}`],
    ["Variación del desempleo × sensibilidad", `${points(m.unemploymentChange)} × ${signed(m.unemploymentSensitivity)}`],
    ["Factor de conversión", signed(input.competition.conversionFactor)],
    ["Costo variable por unidad (año 1)", money(input.costs.variableUnitCost)],
    ["IPC", pct(input.costs.inflation)],
    ["Margen sobre el costo", pct(input.costs.marginOnCost)],
    ["Parte con crédito", pct(input.financing.creditPct)],
    ["Tasa del crédito", `${pct(input.financing.creditRateEA)} EA`],
    ["Plazo", `${int(input.financing.termMonths)} meses`],
    ["Tasa mínima exigida", `${pct(input.evaluation.discountRate)} EA`],
    ["Impuesto de renta", pct(input.evaluation.taxRate)],
    ["Horizonte", `${int(input.evaluation.horizonYears)} años`],
  ];
  const market: Pair[] = [
    ["Demanda mensual", `${int(r.market.monthlyDemand)} unidades`],
    ["Demanda anual", `${int(r.market.annualDemand)} unidades`],
    ["Crecimiento anual", `${pct(r.market.gdpTerm)} + ${pct(r.market.unemploymentTerm)} = ${pct(r.market.growth)}`],
    ...r.market.years.map((y): Pair => [`Demanda del mercado, año ${y.year}`, `${int(y.demand)} unidades`]),
  ];
  const competitors: TextTableData = {
    headers: ["Competidor", "Cuota", "Satisfacción", "Prob. de captar", "Aporte"],
    rows: [
      ...r.competition.competitors.map((c) => [c.name, pct(c.share), signed(c.satisfaction), pct(c.captureProbability), pct(c.contribution)]),
      ["Total captado", "", "", "", pct(r.competition.marketShare)],
    ],
    note: `${int(r.competition.monthlyUnits)} unidades al mes y ${int(r.competition.annualUnits)} al año. «Otros» (${pct(r.competition.othersShare)}) no aportan.`,
  };
  const costs: TextTableData = {
    headers: ["Concepto", ...r.costs.years.map((y) => `Año ${y.year}`)],
    rows: [
      ...(r.costs.years[0]?.fixedCosts ?? []).map((f, i) => [f.name, ...r.costs.years.map((y) => money(y.fixedCosts[i]?.amount))]),
      ["Costos fijos", ...r.costs.years.map((y) => money(y.fixedTotal))],
      ["Unidades vendidas", ...r.costs.years.map((y) => int(y.units))],
      ["Costo variable por unidad", ...r.costs.years.map((y) => money(y.variableUnitCost))],
      ["Costos variables", ...r.costs.years.map((y) => money(y.variableTotal))],
      ["Costo total", ...r.costs.years.map((y) => money(y.total))],
      ["Costo unitario", ...r.costs.years.map((y) => money(y.unitCost))],
    ],
    note: `Precio = ${money(r.costs.unitCost)} × (1 + ${pct(r.costs.marginOnCost)}) = ${money(r.costs.price)} (margen sobre el precio ${pct(r.costs.marginOnPrice)}, informativo). Desde el año 2 sube con el IPC.`,
  };
  const investment: TextTableData = {
    headers: ["Concepto", "Valor", "Parte"],
    rows: [...r.investment.items.map((i) => [i.label, money(i.amount), pct(i.share)]), ["Total", money(r.investment.total), pct(1)]],
  };
  const last = r.investment.schedule[r.investment.schedule.length - 1];
  const depreciation: TextTableData = {
    headers: ["Año", "Depreciación", "Valor neto de los activos"],
    rows: [...depreciationRows(r.investment.schedule), ["Total", money(r.investment.depreciationTotal), ""]],
    note: `Línea recta a ${int(input.investment.depreciationYears)} años: ${money(r.investment.annualDepreciation)} al año.${last ? ` Salvamento del año ${int(last.year)}: valor neto en libros, ${money(last.netBookValue)}.` : ""}`,
  };
  const amortization: TextTableData = {
    headers: ["Año", "Amortización", "Valor neto de los diferidos"],
    rows: [...amortizationRows(r.investment.schedule), ["Total", money(r.investment.amortizationTotal), ""]],
    note: `Diferidos amortizados a ${int(input.investment.deferredAmortizationYears)} años: ${money(r.investment.annualAmortization)} al año.`,
  };
  const annualCharge = r.investment.schedule[0]?.charge ?? 0;
  const chargeNote = `Cargo anual por depreciación y amortización: ${money(annualCharge)}. No es salida de caja, pero baja la utilidad gravable y el impuesto.`;
  const financingSummary: Pair[] = [
    ["Crédito", `${money(r.financing.credit)} (${pct(r.financing.debtRatio)})`],
    ["Aporte propio", `${money(r.financing.ownContribution)} (${pct(r.financing.equityRatio)})`],
    ["Tasa mensual", pct(r.financing.monthlyRate)],
    ["Cuota mensual fija", money(r.financing.installment)],
    ["Intereses totales", money(r.financing.totalInterest)],
    ["Cobertura mínima", r.financing.minCoverage === null ? "sin cuota" : times(r.financing.minCoverage)],
  ];
  const annual: TextTableData = {
    headers: ["Año", "Cuotas", "Intereses", "Abono a capital", "Saldo", "Flujo libre", "Cobertura"],
    rows: r.financing.annual.map((a) => {
      const c = r.financing.coverage[a.year - 1];
      return [int(a.year), money(a.installments), money(a.interest), money(a.principal), money(a.balance), c ? money(c.freeCashFlow) : "—", c?.coverage === null || c === undefined ? "—" : times(c.coverage)];
    }),
  };
  const monthly: TextTableData = {
    headers: ["Mes", "Cuota", "Interés", "Abono a capital", "Saldo"],
    rows: r.financing.monthly.map((x) => [int(x.month), money(x.installment), money(x.interest), money(x.principal), money(x.balance)]),
  };
  const flow: TextTableData = {
    headers: ["Concepto", "Año 0", ...r.cashFlow.years.map((y) => `Año ${y.year}`)],
    rows: [
      ["Unidades vendidas", "", ...r.cashFlow.years.map((y) => int(y.units))],
      ["Precio", "", ...r.cashFlow.years.map((y) => money(y.price))],
      ["Ingresos", "", ...r.cashFlow.years.map((y) => money(y.revenue))],
      ["EBITDA", "", ...r.cashFlow.years.map((y) => money(y.ebitda))],
      ["Depreciación y amortización", "", ...r.cashFlow.years.map((y) => money(y.depreciationAmortization))],
      ["Impuesto", "", ...r.cashFlow.years.map((y) => money(y.tax))],
      ["Flujo libre", "", ...r.cashFlow.years.map((y) => money(y.freeCashFlow))],
      ["Capital de trabajo y salvamento", "", ...r.cashFlow.years.map((y) => money(y.workingCapitalRecovery + y.salvage))],
      ["Flujo neto", money(r.cashFlow.flows[0]), ...r.cashFlow.years.map((y) => money(y.netFlow))],
    ],
  };
  const indicators: Pair[] = [
    ["VPN del proyecto", money(r.indicators.npv)],
    ["TIR", pct(r.indicators.irr)],
    ["Recuperación", years(r.indicators.paybackSimple)],
    ["Recuperación descontada", years(r.indicators.paybackDiscounted)],
    ["Beneficio / costo", times(r.indicators.benefitCostRatio)],
  ];
  const tornado: TextTableData = {
    headers: ["Variable", "Cambio", "VPN a la baja", "VPN al alza", "Amplitud"],
    rows: r.risks.tornado.map((t) => [t.label, t.change, money(t.npvLow), money(t.npvHigh), money(t.amplitude)]),
  };
  const scenarios: TextTableData = {
    headers: ["Escenario", "Demanda", "Precio", "VPN", "TIR", "Recuperación", "B/C"],
    rows: r.scenarios.map((s) => [s.label, pct(s.demandChange), pct(s.priceChange), money(s.npv), pct(s.irr), years(s.paybackSimple), times(s.benefitCostRatio)]),
  };
  return { assumptions, market, competitors, costs, investment, depreciation, amortization, chargeNote, financingSummary, annual, monthly, flow, indicators, tornado, scenarios };
};

export type ProjectSections = ReturnType<typeof projectSections>;

/** Los seis datos que van en la portada del PDF (el resto de supuestos está en la sección 1 del informe). */
export const coverParams = (input: SimulatorInput, r: SimulatorResult): Param[] => [
  { label: "Inversión total", value: money(r.investment.total) },
  { label: "Parte con crédito", value: `${pct(input.financing.creditPct)} a ${int(input.financing.termMonths)} meses` },
  { label: "Precio de venta", value: money(r.costs.price) },
  { label: "Unidades del año 1", value: int(r.competition.annualUnits) },
  { label: "Tasa mínima exigida", value: `${pct(input.evaluation.discountRate)} EA` },
  { label: "Horizonte", value: `${int(input.evaluation.horizonYears)} años` },
];

/** Veredicto en una frase, con las cifras de la API. */
export const projectVerdict = (r: SimulatorResult): string => {
  const ind = r.indicators;
  return `${ind.npv >= 0 ? "El proyecto deja ganancia" : "El proyecto no alcanza la tasa mínima"}: VPN ${money(ind.npv)} al ${pct(ind.discountRate)}, TIR ${pct(ind.irr)}.`;
};

const pairSheet = (name: string, rows: Pair[], title?: string[]): XlsxSheet => ({ name, ...(title ? { title } : {}), headers: ["Concepto", "Valor"], rows });
const textSheet = (name: string, t: TextTableData, title?: string[]): XlsxSheet => ({ name, ...(title ? { title } : {}), headers: t.headers, rows: t.rows });

/** Hojas del Excel: seis secciones en el orden de las pestañas, numeradas; depreciación y amortización en hojas aparte. */
export const projectSheets = (s: ProjectSections, notes: string[], title: string[]): XlsxSheet[] => [
  pairSheet("1 Resumen y supuestos", [...s.indicators, ...s.assumptions], title),
  { name: "1 Tasas", headers: ["Por qué estas tasas"], rows: notes.map((n) => [n]) },
  pairSheet("2 Mercado", s.market),
  textSheet("2 Competencia", s.competitors),
  textSheet("3 Costos", s.costs),
  textSheet("3 Inversión", s.investment),
  textSheet("3 Depreciación", s.depreciation),
  textSheet("3 Amortización diferidos", s.amortization),
  pairSheet("4 Financiación", s.financingSummary),
  textSheet("4 Resumen anual", s.annual),
  textSheet("4 Amortización crédito", s.monthly),
  textSheet("5 Flujo de caja", s.flow),
  pairSheet("5 Indicadores", s.indicators),
  textSheet("6 Tornado", s.tornado),
  textSheet("6 Escenarios", s.scenarios),
];
