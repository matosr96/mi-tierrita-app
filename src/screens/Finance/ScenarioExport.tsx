import { useRef } from "react";
import { Button, DataTable, type Column } from "@/components/ui";
import { useAmortization } from "@/hooks/financial";
import { dateOnly, int, money, pct, times, todayIso, years } from "@/lib/format";
import { printElement } from "@/lib/print";
import { downloadXlsx, type XlsxCell, type XlsxSheet } from "@/lib/xlsx";
import { ROLE_LABELS, useSessionStore } from "@/stores/session";
import type { Amortization, CashFlowDetail, ScenarioDetail } from "@/types/api";
import { ReportPaper, type Indicator } from "@/screens/Reports/ReportPaper";
import { PaperBlock } from "@/screens/Reports/PaperBlock";
import { ASSUMPTION_FIELDS, formatValue } from "./financeShared";
import styles from "./FinanceScreen.module.css";

const flowColumns: Column<CashFlowDetail>[] = [
  { key: "year", header: "Año", render: (d) => int(d.year) },
  { key: "margin", header: "Margen", align: "right", render: (d) => money(d.margin) },
  { key: "expenses", header: "Gastos", align: "right", render: (d) => money(d.expenses) },
  { key: "wc", header: "Capital de trabajo", align: "right", render: (d) => money(d.workingCapitalDelta) },
  { key: "salvage", header: "Salvamento", align: "right", render: (d) => money(d.salvage + d.workingCapitalRecovery) },
  { key: "flow", header: "Flujo neto", align: "right", render: (d) => money(d.flow) },
];

/** Indicadores del escenario tal como los calcula la API, con el mismo vocabulario de la terminal. */
const indicatorRows = (s: ScenarioDetail): [string, string][] => {
  const i = s.indicators;
  return [
    ["Inversión fija", money(s.fixedInvestment)],
    ["Capital de trabajo", money(i.workingCapital)],
    ["Inversión total", money(i.totalInvestment)],
    ["Crédito", money(i.credit)],
    ["Aporte propio", money(i.ownContribution)],
    ["Cuota mensual", money(i.installment)],
    ["Intereses totales", money(i.totalInterest)],
    ["VPN del proyecto", money(i.npv)],
    ["TIR del proyecto", pct(i.irr)],
    ["VPN del inversionista", money(i.investorNpv)],
    ["TIR del inversionista", pct(i.investorIrr)],
    ["Recuperación simple", years(i.paybackSimple)],
    ["Recuperación descontada", years(i.paybackDiscounted)],
    ["Índice de rentabilidad", times(i.profitabilityIndex)],
    ["Relación beneficio/costo", times(i.benefitCostRatio)],
    ["Cobertura de la cuota (incremental)", times(i.coverageIncremental)],
  ];
};

const amortizationSheet = (am: Amortization): XlsxSheet => ({
  name: "Amortización",
  title: [`Crédito de ${money(am.credit)} a ${int(am.termMonths)} meses · cuota ${money(am.installment)}`],
  headers: ["Mes", "Cuota", "Interés", "Abono a capital", "Saldo"],
  formats: ["int", "money", "money", "money", "money"],
  rows: am.rows.map((r) => [r.month, r.installment, r.interest, r.principal, r.balance]),
  footer: ["Total intereses", null, am.totalInterest, null, null],
});

const fileBase = (s: ScenarioDetail, letter: string) =>
  `escenario-${letter}_${s.name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 40)}`;

/**
 * Exportar escenario (prototipo 10 del Figma): PDF con la hoja del escenario (se arma oculta y se imprime) y Excel con
 * indicadores, supuestos, flujo de caja y tabla de amortización. Todas las cifras vienen de la API.
 */
export const ScenarioExport = ({ scenario, letter }: { scenario: ScenarioDetail; letter: string }) => {
  const user = useSessionStore((s) => s.user);
  const paperRef = useRef<HTMLDivElement>(null);
  const amortization = useAmortization(scenario.id);
  const ind = scenario.indicators;
  const a = scenario.assumptions;
  const viable = ind.npv >= 0;
  const generated = user ? `Generado por ${user.firstName} ${user.lastName}, ${ROLE_LABELS[user.role]}, el ${dateOnly(todayIso())}` : `Generado el ${dateOnly(todayIso())}`;

  const ledger: Indicator[] = indicatorRows(scenario)
    .filter(([label]) => ["Inversión total", "Crédito", "Aporte propio", "Cuota mensual", "VPN del proyecto", "TIR del proyecto", "VPN del inversionista", "Cobertura de la cuota (incremental)", "Recuperación descontada"].includes(label))
    .map(([label, value]) => ({
      label,
      value,
      ...(label === "VPN del proyecto" ? { tone: viable ? ("good" as const) : ("bad" as const) } : {}),
    }));

  const exportExcel = () => {
    const title = [`Agropecuaria Mi Tierrita · Escenario ${letter}: ${scenario.name}`, `${viable ? "Conviene" : "No conviene"} ampliar · VPN ${money(ind.npv)} a la TMAR de ${pct(a.tmarEA)}`, generated];
    const flows: XlsxCell[][] = scenario.results.detail.map((d) => [d.year, d.margin, d.expenses, d.workingCapitalDelta, d.salvage, d.workingCapitalRecovery, d.flow]);
    downloadXlsx(`${fileBase(scenario, letter)}.xlsx`, [
      {
        name: "Indicadores",
        title,
        headers: ["Indicador", "Valor"],
        rows: indicatorRows(scenario).map(([label, text]) => [label, text]),
      },
      {
        name: "Supuestos",
        headers: ["Grupo", "Supuesto", "Valor", "Como se muestra"],
        formats: ["text", "text", "decimal", "text"],
        rows: ASSUMPTION_FIELDS.map((f) => [f.group, f.label, a[f.key], formatValue(f.kind, a[f.key])]),
      },
      {
        name: "Flujo de caja",
        headers: ["Año", "Margen", "Gastos", "Variación capital de trabajo", "Salvamento", "Recuperación capital de trabajo", "Flujo neto"],
        formats: ["int", "money", "money", "money", "money", "money", "money"],
        rows: flows,
      },
      ...(amortization.data ? [amortizationSheet(amortization.data)] : []),
    ]);
  };

  return (
    <>
      <Button variant="secondary" onClick={() => printElement(paperRef.current?.querySelector("article") ?? null, `${fileBase(scenario, letter)}.pdf`)}>
        PDF
      </Button>
      <Button variant="secondary" onClick={exportExcel} loading={amortization.isPending}>
        Excel
      </Button>

      {/* Hoja del escenario: no se ve en pantalla, solo se usa para imprimir. */}
      <div ref={paperRef} className={styles.printOnly} aria-hidden="true">
        <ReportPaper
          code={`F-${letter}`}
          title={`Escenario ${letter} ·`}
          accent={scenario.name}
          meta={["Ampliación del local con crédito bancario", generated]}
          summary={
            <>
              <p>
                <strong>{viable ? "Conviene ampliar." : "No conviene ampliar."}</strong> Con una inversión total de {money(ind.totalInvestment)}, financiada {pct(scenario.creditPct)} con
                crédito a {int(scenario.termMonths)} meses, el proyecto tiene un VPN de <strong>{money(ind.npv)}</strong> a la TMAR de {pct(a.tmarEA)} y una TIR de {pct(ind.irr)}.
              </p>
              <p>
                La cuota mensual es de {money(ind.installment)} y el aporte propio de {money(ind.ownContribution)}. Supone un aumento de ventas de {pct(scenario.salesIncrease)} y{" "}
                {money(scenario.additionalExpensesMonth)} de gastos adicionales al mes.
              </p>
            </>
          }
          params={ASSUMPTION_FIELDS.map((f) => ({ label: f.label, value: formatValue(f.kind, a[f.key]) }))}
          indicators={ledger}
          note="Indicadores calculados por el sistema con los supuestos del escenario. Es un apoyo para decidir, no un concepto financiero."
        >
          <PaperBlock label="Flujo de caja del proyecto" hint={`${int(scenario.results.detail.length)} años`}>
            <DataTable columns={flowColumns} rows={scenario.results.detail} rowKey={(d) => d.year} />
          </PaperBlock>
        </ReportPaper>
      </div>
    </>
  );
};
