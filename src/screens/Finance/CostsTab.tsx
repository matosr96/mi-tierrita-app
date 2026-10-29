import { Button, Card, DataTable, Input, type Column } from "@/components/ui";
import { int, money, pct } from "@/lib/format";
import type { SimCostYear, SimFixedCost } from "@/types/api";
import { SimField } from "./SimField";
import { errorAt, patchSection, type TabProps } from "./simShared";
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
        <div className={styles.fields}>
          <SimField label="Costo variable por unidad vendida" unit="money" hint="Sale del costo de la mercancía en inventario" value={k.variableUnitCost} onChange={(v) => set({ variableUnitCost: v })} error={errorAt(errors, "costs.variableUnitCost")} />
          <SimField label="IPC anual" unit="pct" value={k.inflation} onChange={(v) => set({ inflation: v })} error={errorAt(errors, "costs.inflation")} />
          <SimField label="Margen sobre el costo" unit="pct" value={k.marginOnCost} onChange={(v) => set({ marginOnCost: v })} error={errorAt(errors, "costs.marginOnCost")} />
        </div>
      </Card>

      <div className={styles.stack}>
        <Card title="Precio automático" subtitle="Se recalcula solo al cambiar costos, unidades o margen.">
          <dl className={styles.figures}>
            <div>
              <dt>Costo unitario (año 1)</dt>
              <dd>{money(r.unitCost)}</dd>
            </div>
            <div>
              <dt>Precio de venta</dt>
              <dd className={styles.figureAccent}>{money(r.price)}</dd>
            </div>
            <div>
              <dt>Margen sobre el precio</dt>
              <dd>{pct(r.marginOnPrice)}</dd>
            </div>
          </dl>
          <p className={styles.formula}>
            Precio = {money(r.unitCost)} × (1 + {pct(r.marginOnCost)}) = <strong>{money(r.price)}</strong>. Desde el año 2 el precio sube con el IPC, igual que los costos. El margen sobre el
            precio ({pct(r.marginOnPrice)}) es solo informativo.
          </p>
        </Card>
        <Card title="Costos por unidades vendidas" subtitle="Costo unitario = (fijos + variables) ÷ unidades vendidas." flush>
          <DataTable columns={columns} rows={rows} rowKey={(row) => row.key} scroll />
        </Card>
      </div>
    </div>
  );
};
