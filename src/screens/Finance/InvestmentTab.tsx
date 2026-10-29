import { Card, DataTable, type Column } from "@/components/ui";
import { HBarChart } from "@/components/charts";
import { int, money, moneyCompact, pct } from "@/lib/format";
import type { SimDepreciationYear } from "@/types/api";
import { SimField } from "./SimField";
import { errorAt, patchSection, type TabProps } from "./simShared";
import styles from "./FinanceScreen.module.css";

const scheduleColumns: Column<SimDepreciationYear>[] = [
  { key: "year", header: "Año", render: (d) => int(d.year) },
  { key: "dep", header: "Depreciación", align: "right", render: (d) => money(d.depreciation) },
  { key: "amort", header: "Amortización de diferidos", align: "right", render: (d) => money(d.amortization) },
  { key: "charge", header: "Cargo anual", align: "right", render: (d) => <strong>{money(d.charge)}</strong> },
  { key: "net", header: "Valor neto de los activos", align: "right", render: (d) => money(d.netBookValue) },
  { key: "deferred", header: "Valor neto de los diferidos", align: "right", render: (d) => money(d.deferredNetValue) },
];

/** 4. Inversión inicial, su composición y la tabla de depreciación y amortización. */
export const InvestmentTab = ({ input, result, onChange, errors }: TabProps) => {
  const inv = input.investment;
  const r = result.investment;
  const set = (patch: Partial<typeof inv>) => onChange(patchSection(input, "investment", patch));
  const last = r.schedule[r.schedule.length - 1];
  return (
    <div className={styles.split}>
      <Card title="Supuestos de la inversión">
        <div className={styles.fields}>
          <SimField label="Activos fijos" unit="money" hint="Local, estantería, equipos" value={inv.fixedAssets} onChange={(v) => set({ fixedAssets: v })} error={errorAt(errors, "investment.fixedAssets")} />
          <SimField label="Capital de trabajo" unit="money" hint="Inventario y caja; se recupera el último año" value={inv.workingCapital} onChange={(v) => set({ workingCapital: v })} error={errorAt(errors, "investment.workingCapital")} />
          <SimField label="Diferidos" unit="money" hint="Licencias, permisos, estudios" value={inv.deferred} onChange={(v) => set({ deferred: v })} error={errorAt(errors, "investment.deferred")} />
          <SimField label="Imprevistos" unit="money" value={inv.contingencies} onChange={(v) => set({ contingencies: v })} error={errorAt(errors, "investment.contingencies")} />
          <SimField label="Vida útil de los activos" unit="int" suffix="años" value={inv.depreciationYears} onChange={(v) => set({ depreciationYears: Math.round(v) })} error={errorAt(errors, "investment.depreciationYears")} />
          <SimField label="Amortización de diferidos" unit="int" suffix="años" value={inv.deferredAmortizationYears} onChange={(v) => set({ deferredAmortizationYears: Math.round(v) })} error={errorAt(errors, "investment.deferredAmortizationYears")} />
        </div>
        {errorAt(errors, "investment") ? <p className={styles.errorLine}>{errorAt(errors, "investment")}</p> : null}
      </Card>

      <div className={styles.stack}>
        <Card title={`Inversión total: ${money(r.total)}`} subtitle="Composición de lo que se necesita al inicio.">
          <HBarChart title="Composición de la inversión" data={r.items.map((i) => ({ label: `${i.label.split(" (")[0]} · ${pct(i.share)}`, value: i.amount }))} format={moneyCompact} formatTip={money} />
        </Card>
        <Card
          title="Depreciación y amortización"
          subtitle={`Línea recta: ${money(r.annualDepreciation)} al año de depreciación y ${money(r.annualAmortization)} de diferidos. No es salida de caja, pero baja la utilidad gravable y el impuesto.`}
          flush
        >
          <DataTable columns={scheduleColumns} rows={r.schedule} rowKey={(d) => d.year} scroll />
          {last ? (
            <p className={[styles.formula, styles.padded].join(" ")}>
              Salvamento del año {int(last.year)}: valor neto en libros de los activos fijos, {money(last.netBookValue)}.
            </p>
          ) : null}
        </Card>
      </div>
    </div>
  );
};
