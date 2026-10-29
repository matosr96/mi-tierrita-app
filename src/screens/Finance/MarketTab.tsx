import { Card } from "@/components/ui";
import { VBarChart } from "@/components/charts";
import { int, pct } from "@/lib/format";
import { SimField } from "./SimField";
import { errorAt, patchSection, points, signed, type TabProps } from "./simShared";
import styles from "./FinanceScreen.module.css";

/** 1. Mercado: demanda = población × disposición × consumo, y crecimiento por PIB y desempleo (decisión 1). */
export const MarketTab = ({ input, result, onChange, errors }: TabProps) => {
  const m = input.market;
  const r = result.market;
  const set = (patch: Partial<typeof m>) => onChange(patchSection(input, "market", patch));
  return (
    <div className={styles.split}>
      <Card title="Supuestos del mercado" subtitle="Población y consumo son supuestos: falta la fuente (DANE o gremio).">
        <div className={styles.fields}>
          <SimField label="Población objetivo" unit="int" suffix="personas" value={m.population} onChange={(v) => set({ population: Math.round(v) })} error={errorAt(errors, "market.population")} />
          <SimField label="Disposición a comprar" unit="pct" value={m.purchaseIntent} onChange={(v) => set({ purchaseIntent: v })} error={errorAt(errors, "market.purchaseIntent")} />
          <SimField label="Consumo por persona" unit="decimal" suffix="unidades / mes" value={m.consumptionPerPerson} onChange={(v) => set({ consumptionPerPerson: v })} error={errorAt(errors, "market.consumptionPerPerson")} />
          <SimField label="Crecimiento del PIB" unit="pct" value={m.gdpGrowth} onChange={(v) => set({ gdpGrowth: v })} error={errorAt(errors, "market.gdpGrowth")} />
          <SimField label="Sensibilidad al PIB" unit="decimal" value={m.gdpSensitivity} onChange={(v) => set({ gdpSensitivity: v })} error={errorAt(errors, "market.gdpSensitivity")} />
          <SimField label="Variación del desempleo" unit="points" value={m.unemploymentChange} onChange={(v) => set({ unemploymentChange: v })} error={errorAt(errors, "market.unemploymentChange")} />
          <SimField label="Sensibilidad al desempleo" unit="decimal" value={m.unemploymentSensitivity} onChange={(v) => set({ unemploymentSensitivity: v })} error={errorAt(errors, "market.unemploymentSensitivity")} />
        </div>
      </Card>

      <div className={styles.stack}>
        <Card title="Demanda del mercado">
          <dl className={styles.figures}>
            <div>
              <dt>Demanda mensual</dt>
              <dd>{int(r.monthlyDemand)} unidades</dd>
            </div>
            <div>
              <dt>Demanda anual</dt>
              <dd>{int(r.annualDemand)} unidades</dd>
            </div>
            <div>
              <dt>Crecimiento anual</dt>
              <dd>{pct(r.growth)}</dd>
            </div>
          </dl>
          <p className={styles.formula}>
            {int(m.population)} personas × {pct(m.purchaseIntent)} × {signed(m.consumptionPerPerson)} = {int(r.monthlyDemand)} unidades al mes.
          </p>
          <p className={styles.formula}>
            Crecimiento = {pct(m.gdpGrowth)} × {signed(m.gdpSensitivity)} = {pct(r.gdpTerm)}; {points(m.unemploymentChange)} × ({signed(m.unemploymentSensitivity)}) = {pct(r.unemploymentTerm)}; total{" "}
            <strong>{pct(r.growth)}</strong>.
          </p>
        </Card>
        <Card title="Demanda a cinco años" subtitle="Unidades al año del mercado completo, antes de la cuota que capta Mi Tierrita (pestaña Competencia).">
          <VBarChart title="Demanda del mercado por año" data={r.years.map((y) => ({ label: `Año ${y.year}`, value: y.demand }))} format={(v) => int(v)} />
        </Card>
      </div>
    </div>
  );
};
