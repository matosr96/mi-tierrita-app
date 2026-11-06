import { Card, DataTable, Disclosure, type Column } from "@/components/ui";
import { HBarChart } from "@/components/charts";
import { int, money, moneyCompact, pct } from "@/lib/format";
import type { SimDepreciationYear } from "@/types/api";
import { SimField } from "./SimField";
import { Highlight } from "./Highlight";
import { TabIntro } from "./TabIntro";
import { anyErrorAt, errorAt, patchSection, type TabProps } from "./simShared";
import styles from "./FinanceScreen.module.css";

/** Tabla de depreciación de activos fijos (línea recta). */
const depreciationColumns: Column<SimDepreciationYear>[] = [
  { key: "year", header: "Año", render: (d) => int(d.year) },
  { key: "dep", header: "Depreciación", align: "right", render: (d) => money(d.depreciation) },
  { key: "net", header: "Valor neto de los activos", align: "right", render: (d) => money(d.netBookValue) },
];

/** Tabla de amortización de diferidos: aparte, porque es otra tabla (otro activo y otro plazo). */
const amortizationColumns: Column<SimDepreciationYear>[] = [
  { key: "year", header: "Año", render: (d) => int(d.year) },
  { key: "amort", header: "Amortización", align: "right", render: (d) => money(d.amortization) },
  { key: "deferred", header: "Valor neto de los diferidos", align: "right", render: (d) => money(d.deferredNetValue) },
];

/** 4. Inversión inicial, su composición, la tabla de depreciación y la tabla de amortización de diferidos. */
export const InvestmentTab = ({ input, result, onChange, errors }: TabProps) => {
  const inv = input.investment;
  const r = result.investment;
  const set = (patch: Partial<typeof inv>) => onChange(patchSection(input, "investment", patch));
  const last = r.schedule[r.schedule.length - 1];
  const first = r.schedule[0];
  return (
    <div className={styles.stack}>
      <TabIntro tab="inversion" />
      <div className={styles.split}>
        <Card title="Supuestos de la inversión">
          <div className={styles.fields}>
            <SimField label="Activos fijos" unit="money" hint="Local, estantería, equipos" value={inv.fixedAssets} onChange={(v) => set({ fixedAssets: v })} error={errorAt(errors, "investment.fixedAssets")} />
            <SimField label="Capital de trabajo" unit="money" hint="Inventario y caja; se recupera el último año" value={inv.workingCapital} onChange={(v) => set({ workingCapital: v })} error={errorAt(errors, "investment.workingCapital")} />
            <SimField label="Diferidos" unit="money" hint="Licencias, permisos, estudios" value={inv.deferred} onChange={(v) => set({ deferred: v })} error={errorAt(errors, "investment.deferred")} />
            <SimField label="Imprevistos" unit="money" value={inv.contingencies} onChange={(v) => set({ contingencies: v })} error={errorAt(errors, "investment.contingencies")} />
          </div>
          {errorAt(errors, "investment") ? <p className={styles.errorLine}>{errorAt(errors, "investment")}</p> : null}
          <Disclosure title="Avanzado" hint="Plazos de depreciación y de amortización" forceOpen={anyErrorAt(errors, ["investment.depreciationYears", "investment.deferredAmortizationYears"])}>
            <div className={styles.fields}>
              <SimField label="Vida útil de los activos" unit="int" suffix="años" hint="Depreciación en línea recta" value={inv.depreciationYears} onChange={(v) => set({ depreciationYears: Math.round(v) })} error={errorAt(errors, "investment.depreciationYears")} />
              <SimField label="Amortización de diferidos" unit="int" suffix="años" value={inv.deferredAmortizationYears} onChange={(v) => set({ deferredAmortizationYears: Math.round(v) })} error={errorAt(errors, "investment.deferredAmortizationYears")} />
            </div>
          </Disclosure>
        </Card>

        <div className={styles.stack}>
          <Highlight items={[{ label: "Inversión total", value: money(r.total), hint: r.items.map((i) => `${i.label.split(" (")[0]} ${pct(i.share)}`).join(" · ") }]} />
          <Card title="Composición de la inversión" subtitle="Lo que se necesita al inicio (año 0 del flujo de caja).">
            <HBarChart title="Composición de la inversión" data={r.items.map((i) => ({ label: `${i.label.split(" (")[0]} · ${pct(i.share)}`, value: i.amount }))} format={moneyCompact} formatTip={money} />
          </Card>

          <Card title="Depreciación de activos fijos" subtitle={`Línea recta a ${int(inv.depreciationYears)} años: ${money(r.annualDepreciation)} al año sobre ${money(inv.fixedAssets)} de activos fijos.`} flush>
            <DataTable
              columns={depreciationColumns}
              rows={r.schedule}
              rowKey={(d) => d.year}
              scroll
              footer={
                <tr className={styles.footRow}>
                  <td>Total del horizonte</td>
                  <td className="num">{money(r.depreciationTotal)}</td>
                  <td />
                </tr>
              }
            />
            {last ? (
              <p className={[styles.formula, styles.padded].join(" ")}>
                Salvamento del año {int(last.year)}: valor neto en libros de los activos fijos, {money(last.netBookValue)} (decisión 7). Entra al flujo de caja del último año.
              </p>
            ) : null}
          </Card>

          <Card title="Amortización de diferidos" subtitle={`A ${int(inv.deferredAmortizationYears)} años: ${money(r.annualAmortization)} al año sobre ${money(inv.deferred)} de diferidos (licencias, permisos, estudios).`} flush>
            <DataTable
              columns={amortizationColumns}
              rows={r.schedule}
              rowKey={(d) => d.year}
              scroll
              footer={
                <tr className={styles.footRow}>
                  <td>Total del horizonte</td>
                  <td className="num">{money(r.amortizationTotal)}</td>
                  <td />
                </tr>
              }
            />
            {last ? <p className={[styles.formula, styles.padded].join(" ")}>Los diferidos quedan en {money(last.deferredNetValue)} al cierre del año {int(last.year)}: no tienen valor de salvamento.</p> : null}
          </Card>

          <Card title="Cargo anual por depreciación y amortización" subtitle="Resumen de las dos tablas. No es salida de caja, pero baja la utilidad gravable y el impuesto (Flujo de caja).">
            <dl className={styles.figures}>
              <div>
                <dt>Depreciación al año</dt>
                <dd>{money(r.annualDepreciation)}</dd>
              </div>
              <div>
                <dt>Amortización al año</dt>
                <dd>{money(r.annualAmortization)}</dd>
              </div>
              <div>
                <dt>Cargo anual (año 1)</dt>
                <dd className={styles.figureAccent}>{money(first?.charge)}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
};
