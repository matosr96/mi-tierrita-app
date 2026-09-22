import { useMemo, useState, type ReactNode } from "react";
import { useAmortization } from "@/hooks/financial";
import type { AmortizationRow, ScenarioDetail } from "@/types/api";
import { Card, Chips, DataTable, EmptyState, QueryState, type Column } from "@/components/ui";
import { VBarChart } from "@/components/charts";
import { int, money, moneyCompact, pct } from "@/lib/format";
import styles from "./FinanceScreen.module.css";

type Props = { scenario: ScenarioDetail };

type FlowRow = { key: string; label: string; strong?: boolean; cells: (number | null)[] };
type YearRow = { year: number; months: number; installment: number; interest: number; principal: number; balance: number };
type AmortView = "mes" | "anio";

const cell = (v: number | null | undefined, strong = false): ReactNode => {
  if (v === null || v === undefined) return <span className="muted">—</span>;
  const text = money(v);
  const node = v < 0 ? <span className="negative">{text}</span> : text;
  return strong ? <strong>{node}</strong> : node;
};

/** Pestaña "Flujo y amortización": Tabla 5 (flujo incremental por año) y la tabla del crédito mes a mes. */
export const CashFlowPanel = ({ scenario }: Props) => {
  const { results } = scenario;
  const amortization = useAmortization(scenario.id);
  const [view, setView] = useState<AmortView>("anio");

  const yearsCount = Math.max(results.flows.length, results.investorFlows.length, results.debtService.length, results.detail.length);
  const yearIdx = Array.from({ length: yearsCount }, (_, i) => i);
  const byYear = new Map(results.detail.map((d) => [d.year, d]));

  const flowRows: FlowRow[] = [
    { key: "margin", label: "Margen bruto adicional", cells: yearIdx.map((y) => byYear.get(y)?.margin ?? null) },
    { key: "expenses", label: "Gastos fijos adicionales", cells: yearIdx.map((y) => byYear.get(y)?.expenses ?? null) },
    { key: "wc", label: "Inversión en capital de trabajo (Δ)", cells: yearIdx.map((y) => byYear.get(y)?.workingCapitalDelta ?? null) },
    { key: "salvage", label: "Valor de salvamento", cells: yearIdx.map((y) => byYear.get(y)?.salvage ?? null) },
    { key: "wcRecovery", label: "Recuperación del capital de trabajo", cells: yearIdx.map((y) => byYear.get(y)?.workingCapitalRecovery ?? null) },
    { key: "flow", label: "Flujo neto del proyecto", strong: true, cells: yearIdx.map((y) => results.flows[y] ?? null) },
    { key: "debt", label: "Cuotas del crédito", cells: yearIdx.map((y) => results.debtService[y] ?? null) },
    { key: "investor", label: "Flujo del inversionista", strong: true, cells: yearIdx.map((y) => results.investorFlows[y] ?? null) },
  ];
  const flowColumns: Column<FlowRow>[] = [
    { key: "label", header: "Concepto", render: (r) => (r.strong ? <strong>{r.label}</strong> : r.label) },
    ...yearIdx.map<Column<FlowRow>>((y) => ({ key: `y${y}`, header: `Año ${y}`, align: "right", render: (r) => cell(r.cells[y], r.strong) })),
  ];

  const monthColumns: Column<AmortizationRow>[] = [
    { key: "month", header: "Mes", render: (r) => r.month },
    { key: "installment", header: "Cuota", align: "right", render: (r) => money(r.installment) },
    { key: "interest", header: "Interés", align: "right", render: (r) => money(r.interest) },
    { key: "principal", header: "Abono a capital", align: "right", render: (r) => money(r.principal) },
    { key: "balance", header: "Saldo", align: "right", render: (r) => money(r.balance) },
  ];
  const yearColumns: Column<YearRow>[] = [
    { key: "year", header: "Año", render: (r) => `Año ${r.year}` },
    { key: "months", header: "Meses", align: "right", render: (r) => int(r.months) },
    { key: "installment", header: "Cuotas pagadas", align: "right", render: (r) => money(r.installment) },
    { key: "interest", header: "Interés", align: "right", render: (r) => money(r.interest) },
    { key: "principal", header: "Abono a capital", align: "right", render: (r) => money(r.principal) },
    { key: "balance", header: "Saldo al cierre", align: "right", render: (r) => money(r.balance) },
  ];

  const yearly = useMemo<YearRow[]>(() => {
    const rows = amortization.data?.rows ?? [];
    const map = new Map<number, YearRow>();
    for (const r of rows) {
      const y = Math.ceil(r.month / 12);
      const g = map.get(y) ?? { year: y, months: 0, installment: 0, interest: 0, principal: 0, balance: r.balance };
      g.months += 1;
      g.installment += r.installment;
      g.interest += r.interest;
      g.principal += r.principal;
      g.balance = r.balance;
      map.set(y, g);
    }
    return [...map.values()].sort((a, b) => a.year - b.year);
  }, [amortization.data]);

  return (
    <div className={styles.panel}>
      <Card title="Flujo de caja incremental del proyecto" subtitle={`${scenario.name} · solo lo que agrega la ampliación · pesos colombianos`} flush>
        {yearsCount === 0 ? (
          <EmptyState title="Sin flujos" text="La API no devolvió flujos para este escenario." />
        ) : (
          <DataTable<FlowRow> columns={flowColumns} rows={flowRows} rowKey={(r) => r.key} />
        )}
        <div className={styles.cardFoot} style={{ padding: "12px 20px 16px" }}>
          El flujo del proyecto no depende de cómo se financie; el del inversionista descuenta las cuotas del crédito. Año 0 recoge la inversión fija y el capital de trabajo inicial.
        </div>
      </Card>

      <QueryState query={amortization} isEmpty={(d) => d.rows.length === 0} empty={<EmptyState title="Sin tabla de amortización" text="El escenario no tiene crédito o la API no devolvió cuotas." />}>
        {(data) => (
          <div className={styles.two}>
            <Card title="Tabla de amortización" subtitle={`${money(data.credit)} · ${pct(scenario.assumptions.creditRateEA)} EA · ${data.termMonths} cuotas fijas`} flush>
              <div className={styles.toggleRow} style={{ padding: "0 20px" }}>
                <Chips<AmortView>
                  options={[
                    { value: "anio", label: "Resumen por año" },
                    { value: "mes", label: `Mes a mes (${data.rows.length})` },
                  ]}
                  value={view}
                  onChange={setView}
                />
                {view === "anio" ? <span className={styles.note}>suma de la tabla</span> : null}
              </div>
              {view === "anio" ? <DataTable<YearRow> columns={yearColumns} rows={yearly} rowKey={(r) => r.year} /> : <DataTable<AmortizationRow> columns={monthColumns} rows={data.rows} rowKey={(r) => r.month} />}
              <div className={styles.cardFoot} style={{ padding: "12px 20px 16px" }}>
                Cuota fija de {money(data.installment)} durante {data.termMonths} meses. Intereses totales: {money(data.totalInterest)}.
              </div>
            </Card>
            <Card title="A qué se va cada cuota" subtitle="Interés y abono a capital pagados cada año (suma de la tabla)">
              <VBarChart
                data={yearly.flatMap((g) => [
                  { label: `Int. año ${g.year}`, value: g.interest, alt: true },
                  { label: `Cap. año ${g.year}`, value: g.principal },
                ])}
                format={moneyCompact}
              />
              <div className={styles.legend}>
                <span>
                  <i className={[styles.swatch, styles.swatchAlt].join(" ")} />
                  Interés
                </span>
                <span>
                  <i className={styles.swatch} />
                  Abono a capital
                </span>
              </div>
              <p className={styles.note} style={{ marginTop: 10 }}>
                Con cuota fija, al principio la mayor parte va a intereses y al final casi todo a capital.
              </p>
            </Card>
          </div>
        )}
      </QueryState>
    </div>
  );
};
