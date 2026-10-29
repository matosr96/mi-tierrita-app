import { useState } from "react";
import { Callout, Card, DataTable, Tabs, type Column } from "@/components/ui";
import { int, money, pct, times } from "@/lib/format";
import type { AmortizationRow, SimCoverageYear, SimFinancingYear } from "@/types/api";
import { SimField } from "./SimField";
import { errorAt, patchSection, type TabProps } from "./simShared";
import styles from "./FinanceScreen.module.css";

type View = "annual" | "monthly";

const annualColumns: Column<SimFinancingYear>[] = [
  { key: "year", header: "Año", render: (d) => int(d.year) },
  { key: "inst", header: "Cuotas del año", align: "right", render: (d) => money(d.installments) },
  { key: "int", header: "Intereses", align: "right", render: (d) => money(d.interest) },
  { key: "prin", header: "Abono a capital", align: "right", render: (d) => money(d.principal) },
  { key: "bal", header: "Saldo al cierre", align: "right", render: (d) => money(d.balance) },
];

const monthlyColumns: Column<AmortizationRow>[] = [
  { key: "month", header: "Mes", render: (d) => int(d.month) },
  { key: "inst", header: "Cuota", align: "right", render: (d) => money(d.installment) },
  { key: "int", header: "Interés", align: "right", render: (d) => money(d.interest) },
  { key: "prin", header: "Abono a capital", align: "right", render: (d) => money(d.principal) },
  { key: "bal", header: "Saldo", align: "right", render: (d) => money(d.balance) },
];

const coverageColumns: Column<SimCoverageYear>[] = [
  { key: "year", header: "Año", render: (d) => int(d.year) },
  { key: "fcf", header: "Flujo libre", align: "right", render: (d) => money(d.freeCashFlow) },
  { key: "debt", header: "Cuotas del año", align: "right", render: (d) => money(d.debtService) },
  { key: "cov", header: "Cobertura", align: "right", render: (d) => (d.coverage === null ? "Sin cuota" : <span className={d.coverage < 1 ? styles.bad : ""}>{times(d.coverage)}</span>) },
];

/** 5. Financiación: crédito en sistema francés, barra deuda/patrimonio, tabla Anual/Mensual y cobertura de la cuota. */
export const FinancingTab = ({ input, result, onChange, errors }: TabProps) => {
  const f = input.financing;
  const r = result.financing;
  const [view, setView] = useState<View>("annual");
  const set = (patch: Partial<typeof f>) => onChange(patchSection(input, "financing", patch));
  const worst = r.coverage.find((c) => c.coverage !== null && c.coverage === r.minCoverage);
  return (
    <div className={styles.split}>
      <Card title="Supuestos del crédito" subtitle="El crédito no cambia el VPN del proyecto (decisión 4): solo la cuota y la cobertura.">
        <div className={styles.fields}>
          <SimField label="Parte con crédito" unit="pct" hint="El resto es aporte propio" value={f.creditPct} onChange={(v) => set({ creditPct: v })} error={errorAt(errors, "financing.creditPct")} />
          <SimField label="Tasa del crédito" unit="pct" suffix="% EA" value={f.creditRateEA} onChange={(v) => set({ creditRateEA: v })} error={errorAt(errors, "financing.creditRateEA")} />
          <SimField label="Plazo" unit="int" suffix="meses" value={f.termMonths} onChange={(v) => set({ termMonths: Math.round(v) })} error={errorAt(errors, "financing.termMonths")} />
        </div>
      </Card>

      <div className={styles.stack}>
        <Card title="De dónde sale la plata">
          <div className={styles.debtBar} role="img" aria-label={`Deuda ${pct(r.debtRatio)}, patrimonio ${pct(r.equityRatio)}`}>
            {r.debtRatio > 0 ? <span className={styles.debtPart} style={{ flexGrow: r.debtRatio }} /> : null}
            {r.equityRatio > 0 ? <span className={styles.equityPart} style={{ flexGrow: r.equityRatio }} /> : null}
          </div>
          <div className={styles.debtLegend}>
            <span>
              <i className={styles.debtDot} aria-hidden="true" /> Crédito {pct(r.debtRatio)} · {money(r.credit)}
            </span>
            <span>
              <i className={styles.equityDot} aria-hidden="true" /> Aporte propio {pct(r.equityRatio)} · {money(r.ownContribution)}
            </span>
          </div>
          <dl className={styles.figures}>
            <div>
              <dt>Cuota mensual fija</dt>
              <dd className={styles.figureAccent}>{money(r.installment)}</dd>
            </div>
            <div>
              <dt>Tasa mensual</dt>
              <dd>{pct(r.monthlyRate)}</dd>
            </div>
            <div>
              <dt>Intereses totales</dt>
              <dd>{money(r.totalInterest)}</dd>
            </div>
          </dl>
          <p className={styles.formula}>
            Tasa mensual = (1 + {pct(r.creditRateEA)})^(1/12) − 1 = {pct(r.monthlyRate)}. Cuota fija en sistema francés a {int(r.termMonths)} meses.
          </p>
        </Card>

        {r.coverageAlert && worst ? (
          <Callout tone="bad" title="La cuota supera el flujo libre">
            En el año {int(worst.year)} las cuotas suman {money(worst.debtService)} y el flujo libre es de {money(worst.freeCashFlow)}: cobertura de {times(worst.coverage)}. El proyecto no
            alcanza a pagar el crédito con lo que produce; la diferencia tendría que salir de la operación actual o de un plazo mayor.
          </Callout>
        ) : r.credit > 0 ? (
          <Callout tone="good" title="El flujo libre cubre la cuota">
            La cobertura mínima es de {times(r.minCoverage)}.
          </Callout>
        ) : null}

        <Card title="Cobertura de la cuota" subtitle="Flujo libre del año ÷ cuotas del año." flush>
          <DataTable columns={coverageColumns} rows={r.coverage} rowKey={(d) => d.year} scroll />
        </Card>

        <Card title="Tabla de amortización" actions={<Tabs options={[{ value: "annual", label: "Anual" }, { value: "monthly", label: "Mensual" }]} value={view} onChange={setView} ariaLabel="Vista de la tabla" />} flush>
          {r.credit <= 0 ? (
            <p className={[styles.formula, styles.padded].join(" ")}>Sin crédito: toda la inversión es aporte propio.</p>
          ) : view === "annual" ? (
            <DataTable columns={annualColumns} rows={r.annual} rowKey={(d) => d.year} scroll />
          ) : (
            <div className={styles.tallTable}>
              <DataTable columns={monthlyColumns} rows={r.monthly} rowKey={(d) => d.month} scroll />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
