import { Callout, Card, DataTable, StatCard, StatGrid, type Column } from "@/components/ui";
import { int, money, moneyCompact, pct, times, years } from "@/lib/format";
import type { SimCashFlowYear } from "@/types/api";
import { SimField } from "./SimField";
import { errorAt, patchSection, points, type TabProps } from "./simShared";
import styles from "./FinanceScreen.module.css";

type FlowRow = { key: string; label: string; strong?: boolean; year0?: number; value: (y: SimCashFlowYear) => number; format?: (v: number) => string };

/** 6. Flujo de caja libre del proyecto (sin deuda) e indicadores: VPN, TIR, recuperación y beneficio/costo. */
export const CashFlowTab = ({ input, result, onChange, errors }: TabProps) => {
  const e = input.evaluation;
  const ind = result.indicators;
  const set = (patch: Partial<typeof e>) => onChange(patchSection(input, "evaluation", patch));
  const cash = result.cashFlow;
  const total = result.investment.total;

  const rows: FlowRow[] = [
    { key: "units", label: "Unidades vendidas", value: (y) => y.units, format: int },
    { key: "price", label: "Precio", value: (y) => y.price },
    { key: "revenue", label: "Ingresos", value: (y) => y.revenue },
    { key: "fixed", label: "Costos fijos", value: (y) => -y.fixedCosts },
    { key: "variable", label: "Costos variables", value: (y) => -y.variableCosts },
    { key: "ebitda", label: "EBITDA", strong: true, value: (y) => y.ebitda },
    { key: "da", label: "Depreciación y amortización", value: (y) => -y.depreciationAmortization },
    { key: "taxable", label: "Utilidad gravable", value: (y) => y.taxableIncome },
    { key: "tax", label: `Impuesto (${pct(e.taxRate)})`, value: (y) => -y.tax },
    { key: "fcf", label: "Flujo libre", strong: true, value: (y) => y.freeCashFlow },
    { key: "wc", label: "Recuperación del capital de trabajo", value: (y) => y.workingCapitalRecovery },
    { key: "salvage", label: "Salvamento (valor en libros)", value: (y) => y.salvage },
    { key: "net", label: "Flujo neto", strong: true, year0: cash.flows[0] ?? -total, value: (y) => y.netFlow },
  ];
  const columns: Column<FlowRow>[] = [
    { key: "label", header: "Concepto", render: (row) => (row.strong ? <strong>{row.label}</strong> : row.label) },
    { key: "y0", header: "Año 0", align: "right", render: (row) => (row.year0 !== undefined ? <strong>{money(row.year0)}</strong> : "") },
    ...cash.years.map((y) => ({
      key: `y${y.year}`,
      header: `Año ${y.year}`,
      align: "right" as const,
      render: (row: FlowRow) => {
        const text = (row.format ?? money)(row.value(y));
        return row.strong ? <strong>{text}</strong> : text;
      },
    })),
  ];

  const good = ind.npv >= 0;
  return (
    <div className={styles.stack}>
      <StatGrid>
        <StatCard label="VPN del proyecto" value={moneyCompact(ind.npv)} tone={good ? "good" : "bad"} hint={`a la tasa mínima de ${pct(ind.discountRate)}`} />
        <StatCard label="TIR" value={pct(ind.irr)} tone={ind.irr !== null && ind.irr >= ind.discountRate ? "good" : "bad"} hint={`crédito al ${pct(input.financing.creditRateEA)}`} />
        <StatCard label="Recuperación" value={years(ind.paybackSimple)} hint={`descontada: ${years(ind.paybackDiscounted)}`} />
        <StatCard label="Beneficio / costo" value={times(ind.benefitCostRatio)} tone={ind.benefitCostRatio >= 1 ? "good" : "bad"} />
      </StatGrid>

      <Callout tone={good ? (ind.irrOverCredit !== null && ind.irrOverCredit < 0.02 ? "warn" : "good") : "bad"} title={good ? "El proyecto deja ganancia" : "El proyecto no alcanza la tasa mínima"}>
        {good
          ? `Con una inversión de ${money(total)}, el flujo libre descontado al ${pct(ind.discountRate)} deja ${money(ind.npv)} por encima de lo exigido.`
          : `Descontado al ${pct(ind.discountRate)}, el flujo libre queda ${money(Math.abs(ind.npv))} por debajo de lo exigido.`}{" "}
        {ind.irrOverCredit !== null
          ? `La TIR (${pct(ind.irr)}) ${ind.irrOverCredit >= 0 ? "supera" : "queda por debajo de"} la tasa del crédito (${pct(input.financing.creditRateEA)}) por ${points(Math.abs(ind.irrOverCredit))}.`
          : "La TIR no está definida para estos flujos."}
      </Callout>

      <Card title="Supuestos de la evaluación">
        <div className={styles.fieldsInline}>
          <SimField label="Tasa mínima exigida" unit="pct" suffix="% EA" value={e.discountRate} onChange={(v) => set({ discountRate: v })} error={errorAt(errors, "evaluation.discountRate")} />
          <SimField label="Impuesto de renta" unit="pct" value={e.taxRate} onChange={(v) => set({ taxRate: v })} error={errorAt(errors, "evaluation.taxRate")} />
          <SimField label="Horizonte" unit="int" suffix="años" value={e.horizonYears} onChange={(v) => set({ horizonYears: Math.round(v) })} error={errorAt(errors, "evaluation.horizonYears")} />
        </div>
      </Card>

      <Card title="Flujo de caja libre del proyecto" subtitle="Sin deuda: el crédito solo entra en Financiación y en la cobertura. Impuesto = (EBITDA − depreciación y amortización) × tasa." flush>
        <DataTable columns={columns} rows={rows} rowKey={(row) => row.key} scroll />
      </Card>
    </div>
  );
};
