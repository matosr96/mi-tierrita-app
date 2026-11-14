import { Button, Card, DataTable, Disclosure, Input, type Column } from "@/components/ui";
import { int, money, num2, pct } from "@/lib/format";
import type { SimCostYear, SimFixedCost } from "@/types/api";
import { SimField } from "./SimField";
import { Highlight } from "./Highlight";
import { TabIntro } from "./TabIntro";
import { anyErrorAt, errorAt, patchSection, type TabProps } from "./simShared";
import styles from "./FinanceScreen.module.css";

/** Años que muestra la tabla de costos (el brief pide tres; los cinco están en Flujo de caja). */
const COST_YEARS = 3;

type ConceptRow = { key: string; label: string; strong?: boolean; value: (y: SimCostYear) => string };

/**
 * 3. Costos por unidades vendidas (decisión 5: Mi Tierrita comercializa, no fabrica) con IPC desde el año 2, y el
 * precio automático = costo unitario × (1 + margen sobre el costo) (decisión 2).
 */
export const CostsTab = ({ input, result, onChange, errors }: TabProps) => {
  const k = input.costs;
  const r = result.costs;
  const set = (patch: Partial<typeof k>) => onChange(patchSection(input, "costs", patch));
  const setFixed = (list: SimFixedCost[]) => set({ fixedCosts: list });
  const years = r.years.slice(0, COST_YEARS);
  const year1 = r.years[0];
  const names = years[0]?.fixedCosts.map((f) => f.name) ?? [];

  const rows: ConceptRow[] = [
    ...names.map((name, i) => ({ key: `fixed-${i}`, label: name, value: (y: SimCostYear) => money(y.fixedCosts[i]?.amount) })),
    { key: "fixedTotal", label: "Costos fijos", strong: true, value: (y) => money(y.fixedTotal) },
    { key: "units", label: "Unidades vendidas", value: (y) => int(y.units) },
    { key: "varUnit", label: "Costo variable por unidad", value: (y) => money(y.variableUnitCost) },
    { key: "varTotal", label: "Costos variables", strong: true, value: (y) => money(y.variableTotal) },
    { key: "total", label: "Costo total", strong: true, value: (y) => money(y.total) },
    { key: "fixedUnit", label: "Parte fija por unidad", value: (y) => money(y.fixedUnitCost) },
    { key: "unitCost", label: "Costo unitario", strong: true, value: (y) => money(y.unitCost) },
  ];
  const columns: Column<ConceptRow>[] = [
    { key: "label", header: "Concepto", render: (row) => (row.strong ? <strong>{row.label}</strong> : row.label) },
    ...years.map((y) => ({ key: `y${y.year}`, header: `Año ${y.year}`, align: "right" as const, render: (row: ConceptRow) => row.value(y) })),
  ];

  return (
    <div className={styles.stack}>
      <TabIntro tab="costos" />
      <div className={styles.split}>
        <Card title="Supuestos de costos" subtitle="Valores del año 1. Fijos y variable suben cada año con el IPC.">
          <div className={styles.listEditor}>
            <span className={styles.listTitle}>Costos fijos al año</span>
            {k.fixedCosts.map((f, i) => (
              <div key={i} className={styles.listRow}>
                <Input aria-label={`Nombre del costo fijo ${i + 1}`} value={f.name} onChange={(e) => setFixed(k.fixedCosts.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} invalid={errorAt(errors, `costs.fixedCosts[${i}].name`) !== undefined} />
                <SimField label="Valor anual" unit="money" value={f.annual} onChange={(v) => setFixed(k.fixedCosts.map((x, j) => (j === i ? { ...x, annual: v } : x)))} error={errorAt(errors, `costs.fixedCosts[${i}].annual`)} />
                <Button variant="ghost" size="sm" onClick={() => setFixed(k.fixedCosts.filter((_, j) => j !== i))}>
                  Quitar
                </Button>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={() => setFixed([...k.fixedCosts, { name: "Otro costo fijo", annual: 0 }])} disabled={k.fixedCosts.length >= 20}>
              Agregar costo fijo
            </Button>
          </div>
          <dl className={styles.assumptionTotals}>
            <div>
              <dt>Total costos fijos al año</dt>
              <dd>{money(year1?.fixedTotal)}</dd>
            </div>
            <div>
              <dt>
                Unidades vendidas al año
                <span>Supuesto de trabajo: {int(result.competition.monthlyUnits)} al mes × 12 (sale de Competencia)</span>
              </dt>
              <dd>{int(year1?.units)}</dd>
            </div>
          </dl>
          <div className={styles.fields}>
            <SimField label="Costo variable por unidad vendida" unit="money" hint="Lo que me cuesta comprar cada producto (mercancía en inventario)" value={k.variableUnitCost} onChange={(v) => set({ variableUnitCost: v })} error={errorAt(errors, "costs.variableUnitCost")} />
            <SimField label="Margen sobre el costo" unit="pct" hint="Lo que se le suma al costo de cada producto para el precio de venta" value={k.marginOnCost} onChange={(v) => set({ marginOnCost: v })} error={errorAt(errors, "costs.marginOnCost")} />
          </div>
          <Disclosure title="Avanzado" hint="IPC con el que suben los costos desde el año 2" forceOpen={anyErrorAt(errors, ["costs.inflation"])}>
            <div className={styles.fields}>
              <SimField label="IPC anual" unit="pct" value={k.inflation} onChange={(v) => set({ inflation: v })} error={errorAt(errors, "costs.inflation")} />
            </div>
          </Disclosure>
        </Card>

        <div className={styles.stack}>
          <Highlight
            items={[
              { label: "Lo que me cuesta cada producto (año 1)", value: money(r.unitCost), hint: year1 ? `${money(year1.fixedUnitCost)} de parte fija + ${money(year1.variableUnitCost)} variable` : undefined },
              { label: "Precio de venta", value: money(r.price), hint: `Costo + ${pct(r.marginOnCost)} de margen` },
            ]}
          />
          {year1 ? (
            <Card title="De dónde sale el precio de venta" subtitle="Se recalcula solo al cambiar los costos, las unidades o el margen. Valores del año 1.">
              <dl className={styles.compCardLines}>
                <div>
                  <dt>1. Costos fijos al año</dt>
                  <dd>
                    <b>{money(year1.fixedTotal)}</b>
                    <span>{year1.fixedCosts.map((f) => `${f.name} ${money(f.amount)}`).join(" + ")}</span>
                  </dd>
                </div>
                <div>
                  <dt>2. Parte fija por unidad</dt>
                  <dd>
                    <b>{money(year1.fixedUnitCost)}</b>
                    <span>
                      {money(year1.fixedTotal)} ÷ {int(year1.units)} unidades vendidas al año
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>3. Costo por producto (precio base)</dt>
                  <dd>
                    <b>{money(year1.unitCost)}</b>
                    <span>
                      {money(year1.fixedUnitCost)} de parte fija + {money(year1.variableUnitCost)} de costo variable por unidad
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>4. Margen de ganancia</dt>
                  <dd>
                    <b>{money(r.price - r.unitCost)}</b>
                    <span>
                      {pct(r.marginOnCost)} sobre {money(r.unitCost)}
                    </span>
                  </dd>
                </div>
              </dl>
              <div className={styles.compCardResult}>
                <span>Precio de venta</span>
                <b>{money(r.price)}</b>
                <small>
                  {money(r.unitCost)} + {pct(r.marginOnCost)} = {money(r.unitCost)} × {num2(1 + r.marginOnCost)}. Sobre el precio, la ganancia es el {pct(r.marginOnPrice)}. Desde el año 2 costos y precio suben
                  con el IPC.
                </small>
              </div>
            </Card>
          ) : null}
          <Card title="Costos por unidades vendidas" subtitle="Costo unitario = (fijos + variables) ÷ unidades vendidas. Tres años; los cinco están en Flujo de caja." flush>
            <DataTable columns={columns} rows={rows} rowKey={(row) => row.key} scroll />
          </Card>
        </div>
      </div>
    </div>
  );
};
