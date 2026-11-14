import { Card, DataTable, type Column } from "@/components/ui";
import { VBarChart } from "@/components/charts";
import { int, pct } from "@/lib/format";
import { SimField } from "./SimField";
import { Highlight } from "./Highlight";
import { TabIntro } from "./TabIntro";
import { errorAt, patchSection, points, signed, type TabProps } from "./simShared";
import styles from "./FinanceScreen.module.css";

type DemandRow = { year: number; demand: number; how: string };

/** 1. Mercado: demanda = población × disposición × consumo, y crecimiento por PIB y desempleo (decisión 1). */
export const MarketTab = ({ input, result, onChange, errors }: TabProps) => {
  const m = input.market;
  const r = result.market;
  const set = (patch: Partial<typeof m>) => onChange(patchSection(input, "market", patch));
  const factor = signed(1 + r.growth, 4);

  // Solo texto: cada año es el anterior × (1 + crecimiento); las cifras vienen de la API.
  const rows: DemandRow[] = r.years.map((y, i) => ({
    year: y.year,
    demand: y.demand,
    how: i === 0 ? `${int(r.monthlyDemand)} al mes × 12` : `${int(r.years[i - 1]?.demand)} × ${factor} (crece ${pct(r.growth)})`,
  }));
  const columns: Column<DemandRow>[] = [
    { key: "year", header: "Año", render: (row) => `Año ${row.year}` },
    { key: "how", header: "Cómo se calcula", render: (row) => <span className={styles.muted}>{row.how}</span> },
    { key: "demand", header: "Unidades al año", align: "right", render: (row) => <strong>{int(row.demand)}</strong> },
  ];

  return (
    <div className={styles.stack}>
      <TabIntro tab="mercado" />
      <div className={styles.split}>
        <Card title="Supuestos del mercado" subtitle="Población y consumo son supuestos del estudio: falta la fuente (DANE o gremio).">
          <div className={styles.fields}>
            <span className={styles.listTitle}>¿Cuánta gente compra?</span>
            <SimField label="Población objetivo" unit="int" suffix="personas" hint="Personas en la zona de influencia" value={m.population} onChange={(v) => set({ population: Math.round(v) })} error={errorAt(errors, "market.population")} />
            <SimField label="Disposición a comprar" unit="pct" hint="De esas personas, cuántas comprarían" value={m.purchaseIntent} onChange={(v) => set({ purchaseIntent: v })} error={errorAt(errors, "market.purchaseIntent")} />
            <p className={styles.derived}>
              → <b>{int(r.buyers)} personas</b> comprarían: {int(m.population)} × {pct(m.purchaseIntent)}
            </p>
            <SimField label="Consumo por persona" unit="decimal" suffix="unidades / mes" hint="Cuánto compra cada una al mes" value={m.consumptionPerPerson} onChange={(v) => set({ consumptionPerPerson: v })} error={errorAt(errors, "market.consumptionPerPerson")} />
            <p className={styles.derived}>
              → <b>{int(r.monthlyDemand)} unidades al mes</b>: {int(r.buyers)} personas × {signed(m.consumptionPerPerson)}; al año {int(r.monthlyDemand)} × 12 = <b>{int(r.annualDemand)}</b>
            </p>
          </div>
          <div className={[styles.fields, styles.fieldsGap].join(" ")}>
            <span className={styles.listTitle}>¿Cuánto crece cada año?</span>
            <SimField label="Crecimiento del PIB" unit="pct" hint="Cuánto crece la economía al año" value={m.gdpGrowth} onChange={(v) => set({ gdpGrowth: v })} error={errorAt(errors, "market.gdpGrowth")} />
            <SimField label="Sensibilidad al PIB" unit="decimal" hint="Por cada 1 % que crece el PIB, cuánto % crece la demanda" value={m.gdpSensitivity} onChange={(v) => set({ gdpSensitivity: v })} error={errorAt(errors, "market.gdpSensitivity")} />
            <p className={styles.derived}>
              → Por la economía la demanda crece <b>{pct(r.gdpTerm)}</b>: {pct(m.gdpGrowth)} × {signed(m.gdpSensitivity)}
            </p>
            <SimField label="Variación del desempleo" unit="points" hint="Negativo: el desempleo baja" value={m.unemploymentChange} onChange={(v) => set({ unemploymentChange: v })} error={errorAt(errors, "market.unemploymentChange")} />
            <SimField label="Sensibilidad al desempleo" unit="decimal" hint="Negativa: si el desempleo sube, la demanda baja" value={m.unemploymentSensitivity} onChange={(v) => set({ unemploymentSensitivity: v })} error={errorAt(errors, "market.unemploymentSensitivity")} />
            <p className={styles.derived}>
              → Por el empleo la demanda crece <b>{pct(r.unemploymentTerm)}</b>: {points(m.unemploymentChange)} × ({signed(m.unemploymentSensitivity)})
              {m.unemploymentChange < 0 ? ". Menos desempleo, más gente con qué comprar" : ""}
            </p>
            <p className={styles.derivedTotal}>
              Crecimiento anual: <b>{pct(r.growth)}</b> = {pct(r.gdpTerm)} + {pct(r.unemploymentTerm)}
            </p>
          </div>
        </Card>

        <div className={styles.stack}>
          <Highlight
            items={[
              { label: "Demanda mensual del mercado", value: `${int(r.monthlyDemand)} unidades`, hint: "Pasa a la pestaña Competencia" },
              { label: "Demanda anual (año 1)", value: `${int(r.annualDemand)} unidades`, hint: `Crece ${pct(r.growth)} cada año` },
            ]}
          />

          <Card title="Demanda a cinco años" subtitle={`El año 1 es la demanda de arriba; cada año siguiente es el anterior más el ${pct(r.growth)} de crecimiento. Son unidades del mercado completo: la parte de Mi Tierrita sale en Competencia.`}>
            <VBarChart title="Demanda del mercado por año" data={r.years.map((y) => ({ label: `Año ${y.year}`, value: y.demand }))} format={(v) => int(v)} />
            <div className={styles.tableGap}>
              <DataTable columns={columns} rows={rows} rowKey={(row) => row.year} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
