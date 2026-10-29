import { useEffect, useRef, useState } from "react";
import { Button, DataTable, type Column } from "@/components/ui";
import { useRecordExport } from "@/hooks/reports";
import { dateOnly, int, money, pct, times, todayIso, years } from "@/lib/format";
import { notify } from "@/stores/toasts";
import { printElement } from "@/lib/print";
import { downloadXlsx, type XlsxSheet } from "@/lib/xlsx";
import { ROLE_LABELS, useSessionStore } from "@/stores/session";
import type { ExportData, SimulatorInput, SimulatorResult } from "@/types/api";
import { ReportPaper, type Indicator } from "@/screens/Reports/ReportPaper";
import { PaperBlock } from "@/screens/Reports/PaperBlock";
import { ratesNote } from "./ratesNote";
import { fileBase, points, signed } from "./simShared";
import styles from "./FinanceScreen.module.css";

type Props = { name: string; projectId: number | null; input: SimulatorInput; result: SimulatorResult; size?: "sm" | "md" };

type Pair = [string, string];
const pairColumns: Column<Pair>[] = [
  { key: "k", header: "Concepto", render: (p) => p[0] },
  { key: "v", header: "Valor", align: "right", render: (p) => p[1] },
];
const PairTable = ({ rows }: { rows: Pair[] }) => <DataTable columns={pairColumns} rows={rows} rowKey={(p) => p[0]} />;

/** Tabla de texto ya formateado (encabezados + celdas). */
const TextTable = ({ headers, rows }: { headers: string[]; rows: string[][] }) => (
  <DataTable
    columns={headers.map((h, i) => ({ key: String(i), header: h, align: i === 0 ? ("left" as const) : ("right" as const), render: (r: string[]) => r[i] ?? "" }))}
    rows={rows}
    rowKey={(r) => r.join("|")}
    scroll
  />
);

/** Las cifras del informe, armadas una sola vez para el PDF y el Excel (todas salen de `result`). */
const sections = (input: SimulatorInput, r: SimulatorResult) => {
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
  const competitors = {
    headers: ["Competidor", "Cuota", "Satisfacción", "Prob. de captar", "Aporte"],
    rows: [
      ...r.competition.competitors.map((c) => [c.name, pct(c.share), signed(c.satisfaction), pct(c.captureProbability), pct(c.contribution)]),
      ["Total captado", "", "", "", pct(r.competition.marketShare)],
    ],
    note: `${int(r.competition.monthlyUnits)} unidades al mes y ${int(r.competition.annualUnits)} al año. «Otros» (${pct(r.competition.othersShare)}) no aportan.`,
  };
  const costs = {
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
  const investment = {
    headers: ["Concepto", "Valor", "Parte"],
    rows: [...r.investment.items.map((i) => [i.label, money(i.amount), pct(i.share)]), ["Total", money(r.investment.total), pct(1)]],
  };
  const depreciation = {
    headers: ["Año", "Depreciación", "Amortización", "Cargo anual", "Valor neto activos", "Valor neto diferidos"],
    rows: r.investment.schedule.map((d) => [int(d.year), money(d.depreciation), money(d.amortization), money(d.charge), money(d.netBookValue), money(d.deferredNetValue)]),
  };
  const financingSummary: Pair[] = [
    ["Crédito", `${money(r.financing.credit)} (${pct(r.financing.debtRatio)})`],
    ["Aporte propio", `${money(r.financing.ownContribution)} (${pct(r.financing.equityRatio)})`],
    ["Tasa mensual", pct(r.financing.monthlyRate)],
    ["Cuota mensual fija", money(r.financing.installment)],
    ["Intereses totales", money(r.financing.totalInterest)],
    ["Cobertura mínima", r.financing.minCoverage === null ? "sin cuota" : times(r.financing.minCoverage)],
  ];
  const annual = {
    headers: ["Año", "Cuotas", "Intereses", "Abono a capital", "Saldo", "Flujo libre", "Cobertura"],
    rows: r.financing.annual.map((a) => {
      const c = r.financing.coverage[a.year - 1];
      return [int(a.year), money(a.installments), money(a.interest), money(a.principal), money(a.balance), c ? money(c.freeCashFlow) : "—", c?.coverage === null || c === undefined ? "—" : times(c.coverage)];
    }),
  };
  const monthly = {
    headers: ["Mes", "Cuota", "Interés", "Abono a capital", "Saldo"],
    rows: r.financing.monthly.map((m) => [int(m.month), money(m.installment), money(m.interest), money(m.principal), money(m.balance)]),
  };
  const flow = {
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
  const tornado = {
    headers: ["Variable", "Cambio", "VPN a la baja", "VPN al alza", "Amplitud"],
    rows: r.risks.tornado.map((t) => [t.label, t.change, money(t.npvLow), money(t.npvHigh), money(t.amplitude)]),
  };
  const scenarios = {
    headers: ["Escenario", "Demanda", "Precio", "VPN", "TIR", "Recuperación", "B/C"],
    rows: r.scenarios.map((s) => [s.label, pct(s.demandChange), pct(s.priceChange), money(s.npv), pct(s.irr), years(s.paybackSimple), times(s.benefitCostRatio)]),
  };
  return { assumptions, market, competitors, costs, investment, depreciation, financingSummary, annual, monthly, flow, indicators, tornado, scenarios };
};

const pairSheet = (name: string, rows: Pair[], title?: string[]): XlsxSheet => ({ name, ...(title ? { title } : {}), headers: ["Concepto", "Valor"], rows });
const textSheet = (name: string, t: { headers: string[]; rows: string[][] }, title?: string[]): XlsxSheet => ({ name, ...(title ? { title } : {}), headers: t.headers, rows: t.rows });

/**
 * Informe del simulador en PDF y Excel: seis secciones en el orden de las pestañas (resumen y supuestos; mercado y
 * competencia; costos e inversión; financiación y amortización; flujo de caja e indicadores; riesgos y escenarios).
 * Es también «Exportar escenario»: todas las cifras son las del mismo cálculo de la API que muestra la pantalla.
 */
export const SimulatorReport = ({ name, projectId, input, result, size = "md" }: Props) => {
  const user = useSessionStore((s) => s.user);
  const paperRef = useRef<HTMLDivElement>(null);
  const recordExport = useRecordExport();
  const [folio, setFolio] = useState<string | undefined>(undefined);
  const [printing, setPrinting] = useState(false);
  const s = sections(input, result);
  const ind = result.indicators;
  const good = ind.npv >= 0;
  const notes = ratesNote(result);
  const generated = user ? `Generado por ${user.firstName} ${user.lastName}, ${ROLE_LABELS[user.role]}, el ${dateOnly(todayIso())}` : `Generado el ${dateOnly(todayIso())}`;
  const verdict = `${good ? "El proyecto deja ganancia" : "El proyecto no alcanza la tasa mínima"}: VPN ${money(ind.npv)} al ${pct(ind.discountRate)}, TIR ${pct(ind.irr)}.`;

  const record = (format: "pdf" | "xlsx") => {
    const filters: ExportData = { projectId, proyecto: name.slice(0, 160) };
    const summary: ExportData = { npv: ind.npv, irr: ind.irr, paybackSimple: ind.paybackSimple, benefitCostRatio: ind.benefitCostRatio, price: result.costs.price, growth: result.market.growth };
    return recordExport.mutateAsync({ report: "scenario", format, description: `Simulador · ${name}`.slice(0, 200), filters, summary });
  };

  // Con el folio ya pintado en el pie de la hoja, se abre el diálogo de impresión.
  useEffect(() => {
    if (!printing) return;
    const id = requestAnimationFrame(() => {
      printElement(paperRef.current?.querySelector("article") ?? null, `${fileBase(name)}.pdf`);
      setPrinting(false);
    });
    return () => cancelAnimationFrame(id);
  }, [printing, name]);

  const exportPdf = async () => {
    try {
      setFolio((await record("pdf")).folio);
    } catch {
      setFolio(undefined);
      notify.error("No se pudo registrar el documento: el PDF sale sin folio.");
    }
    setPrinting(true);
  };

  const exportExcel = async () => {
    const title = [`Agropecuaria Mi Tierrita · Simulador financiero: ${name}`, verdict, generated];
    const saved = await downloadXlsx(`${fileBase(name)}.xlsx`, [
      { ...pairSheet("1 Resumen y supuestos", [...s.indicators, ...s.assumptions], title) },
      { name: "1 Tasas", headers: ["Por qué estas tasas"], rows: notes.map((n) => [n]) },
      pairSheet("2 Mercado", s.market),
      textSheet("2 Competencia", s.competitors),
      textSheet("3 Costos", s.costs),
      textSheet("3 Inversión", s.investment),
      textSheet("3 Depreciación", s.depreciation),
      pairSheet("4 Financiación", s.financingSummary),
      textSheet("4 Resumen anual", s.annual),
      textSheet("4 Amortización mensual", s.monthly),
      textSheet("5 Flujo de caja", s.flow),
      pairSheet("5 Indicadores", s.indicators),
      textSheet("6 Tornado", s.tornado),
      textSheet("6 Escenarios", s.scenarios),
    ]);
    if (saved) void record("xlsx").catch(() => undefined);
  };

  const ledger: Indicator[] = [
    { label: "VPN del proyecto", value: money(ind.npv), tone: good ? "good" : "bad" },
    { label: "TIR", value: pct(ind.irr) },
    { label: "Recuperación", value: years(ind.paybackSimple) },
    { label: "Beneficio / costo", value: times(ind.benefitCostRatio) },
    { label: "Cuota mensual", value: money(result.financing.installment) },
    { label: "Cobertura mínima", value: result.financing.minCoverage === null ? "sin cuota" : times(result.financing.minCoverage), ...(result.financing.coverageAlert ? { tone: "bad" as const } : {}) },
  ];

  return (
    <>
      <Button variant="secondary" size={size} onClick={() => void exportPdf()} loading={recordExport.isPending && !printing} title="Abre el diálogo de impresión: elija «Guardar como PDF»">
        PDF
      </Button>
      <Button variant="secondary" size={size} onClick={() => void exportExcel()}>
        Excel
      </Button>

      {/* Hoja del informe: no se ve en pantalla, solo se usa para imprimir. */}
      <div ref={paperRef} className={styles.printOnly} aria-hidden="true">
        <ReportPaper
          code="S-01"
          title="Simulador financiero ·"
          accent={name}
          meta={["Ampliación del local · cifras de ejemplo, no del negocio real", generated]}
          folio={folio}
          summary={
            <>
              <p>
                <strong>{verdict}</strong> Inversión de {money(result.investment.total)}, {pct(input.financing.creditPct)} con crédito a {int(input.financing.termMonths)} meses; precio de{" "}
                {money(result.costs.price)} y {int(result.competition.annualUnits)} unidades el primer año.
              </p>
              {notes.map((n) => (
                <p key={n.slice(0, 24)}>{n}</p>
              ))}
            </>
          }
          params={s.assumptions.map(([label, value]) => ({ label, value }))}
          indicators={ledger}
          note="Cifras calculadas por el servidor con los supuestos del proyecto; son las mismas de la pantalla. Es un apoyo para decidir, no un concepto financiero."
        >
          <PaperBlock label="1. Resumen y supuestos">
            <PairTable rows={[...s.indicators, ...s.assumptions]} />
          </PaperBlock>
          <PaperBlock label="2. Mercado y competencia" hint={s.competitors.note}>
            <PairTable rows={s.market} />
            <TextTable headers={s.competitors.headers} rows={s.competitors.rows} />
          </PaperBlock>
          <PaperBlock label="3. Costos e inversión" hint={s.costs.note}>
            <TextTable headers={s.costs.headers} rows={s.costs.rows} />
            <TextTable headers={s.investment.headers} rows={s.investment.rows} />
            <TextTable headers={s.depreciation.headers} rows={s.depreciation.rows} />
          </PaperBlock>
          <PaperBlock label="4. Financiación y amortización">
            <PairTable rows={s.financingSummary} />
            <TextTable headers={s.annual.headers} rows={s.annual.rows} />
            <TextTable headers={s.monthly.headers} rows={s.monthly.rows} />
          </PaperBlock>
          <PaperBlock label="5. Flujo de caja e indicadores">
            <TextTable headers={s.flow.headers} rows={s.flow.rows} />
            <PairTable rows={s.indicators} />
          </PaperBlock>
          <PaperBlock label="6. Riesgos y escenarios">
            <TextTable headers={s.tornado.headers} rows={s.tornado.rows} />
            <TextTable headers={s.scenarios.headers} rows={s.scenarios.rows} />
          </PaperBlock>
        </ReportPaper>
      </div>
    </>
  );
};
