import { Card, Disclosure } from "@/components/ui";
import { VBarChart } from "@/components/charts";
import { int, pct } from "@/lib/format";
import { SimField } from "./SimField";
import { Highlight } from "./Highlight";
import { TabIntro } from "./TabIntro";
import { anyErrorAt, errorAt, patchSection, points, signed, type TabProps } from "./simShared";
import styles from "./FinanceScreen.module.css";

const ADVANCED = ["market.gdpGrowth", "market.gdpSensitivity", "market.unemploymentChange", "market.unemploymentSensitivity"];

/** 1. Mercado: demanda = población × disposición × consumo, y crecimiento por PIB y desempleo (decisión 1). */
export const MarketTab = ({ input, result, onChange, errors }: TabProps) => {
  const m = input.market;
  const r = result.market;
  const set = (patch: Partial<typeof m>) => onChange(patchSection(input, "market", patch));
  return (
    <div className={styles.stack}>
      <TabIntro tab="mercado" />
      <div className={styles.split}>
        <Card title="Supuestos del mercado" subtitle="Población y consumo son supuestos: falta la fuente (DANE o gremio).">
          <div className={styles.fields}>
            <SimField label="Población objetivo" unit="int" suffix="personas" value={m.population} onChange={(v) => set({ population: Math.round(v) })} error={errorAt(errors, "market.population")} />
            <SimField label="Disposición a comprar" unit="pct" value={m.purchaseIntent} onChange={(v) => set({ purchaseIntent: v })} error={errorAt(errors, "market.purchaseIntent")} />
            <SimField label="Consumo por persona" unit="decimal" suffix="unidades / mes" value={m.consumptionPerPerson} onChange={(v) => set({ consumptionPerPerson: v })} error={errorAt(errors, "market.consumptionPerPerson")} />
          </div>
          <Disclosure title="Avanzado" hint="Crecimiento anual de la demanda (PIB y desempleo)" forceOpen={anyErrorAt(errors, ADVANCED)}>
            <div className={styles.fields}>
              <SimField label="Crecimiento del PIB" unit="pct" value={m.gdpGrowth} onChange={(v) => set({ gdpGrowth: v })} error={errorAt(errors, "market.gdpGrowth")} />
              <SimField label="Sensibilidad al PIB" unit="decimal" value={m.gdpSensitivity} onChange={(v) => set({ gdpSensitivity: v })} error={errorAt(errors, "market.gdpSensitivity")} />
              <SimField label="Variación del desempleo" unit="points" value={m.unemploymentChange} onChange={(v) => set({ unemploymentChange: v })} error={errorAt(errors, "market.unemploymentChange")} />
              <SimField label="Sensibilidad al desempleo" unit="decimal" value={m.unemploymentSensitivity} onChange={(v) => set({ unemploymentSensitivity: v })} error={errorAt(errors, "market.unemploymentSensitivity")} />
            </div>
          </Disclosure>
        </Card>

        <div className={styles.stack}>
          <Highlight
            items={[{ label: "Demanda anual del mercado", value: `${int(r.annualDemand)} unidades`, hint: `${int(r.monthlyDemand)} unidades al mes · crece ${pct(r.growth)} cada año` }]}
            note={
              <>
                {int(m.population)} personas × {pct(m.purchaseIntent)} × {signed(m.consumptionPerPerson)} = {int(r.monthlyDemand)} unidades al mes; × 12 = {int(r.annualDemand)} al año.
              </>
            }
          />
          <Card title="Crecimiento anual de la demanda" subtitle="Dos términos: la economía (PIB) y el empleo (decisión 1).">
            <dl className={styles.figures}>
              <div>
                <dt>Por el PIB</dt>
                <dd>{pct(r.gdpTerm)}</dd>
              </div>
              <div>
                <dt>Por el desempleo</dt>
                <dd>{pct(r.unemploymentTerm)}</dd>
              </div>
              <div>
                <dt>Crecimiento anual</dt>
                <dd className={styles.figureAccent}>{pct(r.growth)}</dd>
              </div>
            </dl>
            <p className={styles.formula}>
              {pct(m.gdpGrowth)} × {signed(m.gdpSensitivity)} = {pct(r.gdpTerm)}; {points(m.unemploymentChange)} × ({signed(m.unemploymentSensitivity)}) = {pct(r.unemploymentTerm)}; total <strong>{pct(r.growth)}</strong>.
            </p>
          </Card>
          <Card title="Demanda a cinco años" subtitle="Unidades al año del mercado completo, antes de la cuota que capta Mi Tierrita (pestaña Competencia).">
            <VBarChart title="Demanda del mercado por año" data={r.years.map((y) => ({ label: `Año ${y.year}`, value: y.demand }))} format={(v) => int(v)} />
          </Card>
        </div>
      </div>
    </div>
  );
};
