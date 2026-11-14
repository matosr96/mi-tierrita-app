import { Button, Card, Disclosure } from "@/components/ui";
import { int, pct } from "@/lib/format";
import type { SimCompetitor } from "@/types/api";
import { SimField } from "./SimField";
import { Highlight } from "./Highlight";
import { TabIntro } from "./TabIntro";
import { CompetitorCard } from "./CompetitorCard";
import { anyErrorAt, errorAt, patchSection, type TabProps } from "./simShared";
import styles from "./FinanceScreen.module.css";

/** 2. Competencia: cada competidor aporta cuota × (1 − satisfacción ÷ 5) × factor de conversión; la suma ajusta la demanda. */
export const CompetitionTab = ({ input, result, onChange, errors }: TabProps) => {
  const c = input.competition;
  const r = result.competition;
  const setList = (competitors: SimCompetitor[]) => onChange(patchSection(input, "competition", { competitors }));
  const setAt = (index: number, patch: Partial<SimCompetitor>) => setList(c.competitors.map((x, i) => (i === index ? { ...x, ...patch } : x)));
  const err = (i: number, field: string) => errorAt(errors, `competition.competitors[${i}].${field}`);

  return (
    <div className={styles.stack}>
      <TabIntro tab="competencia" />
      <Highlight
        items={[{ label: "Participación de Mi Tierrita en el mercado", value: pct(r.marketShare), hint: `${int(r.monthlyUnits)} unidades al mes · ${int(r.annualUnits)} al año` }]}
        note={
          <>
            Suma de lo que pasa a Mi Tierrita desde cada competidor:{" "}
            {r.competitors.map((x, i) => `${i > 0 ? " + " : ""}${int(x.capturedUnits)}`).join("")} = {int(r.monthlyUnits)} compras al mes, y {int(r.monthlyUnits)} ÷ {int(result.market.monthlyDemand)} del mercado ={" "}
            {pct(r.marketShare)}. «Otros» ({pct(r.othersShare)}) no aportan porque no se conoce su satisfacción. Esta cuota alimenta Costos y Flujo de caja.
          </>
        }
      />
      <Card
        title="Competidores"
        subtitle="Cada tarjeta muestra de dónde sale el aporte de ese competidor: a quien está menos contento con su tienda es más fácil quitarle clientes. Las cifras son de ejemplo y se pueden editar."
        actions={
          <Button variant="secondary" size="sm" onClick={() => setList([...c.competitors, { name: `Competidor ${c.competitors.length + 1}`, share: 0, satisfaction: 3 }])} disabled={c.competitors.length >= 20}>
            Agregar competidor
          </Button>
        }
      >
        {errorAt(errors, "competition.competitors") ? <p className={styles.errorLine}>{errorAt(errors, "competition.competitors")}</p> : null}
        <div className={styles.compCards}>
          {c.competitors.map((x, i) => (
            <CompetitorCard
              key={i}
              index={i}
              competitor={x}
              calc={r.competitors[i]}
              monthlyDemand={result.market.monthlyDemand}
              conversionFactor={c.conversionFactor}
              errors={{ name: err(i, "name"), share: err(i, "share"), satisfaction: err(i, "satisfaction") }}
              onChange={(patch) => setAt(i, patch)}
              onRemove={() => setList(c.competitors.filter((_, j) => j !== i))}
            />
          ))}
        </div>
        <Disclosure title="Avanzado" hint="Factor de conversión: cuántos descontentos se cambian de tienda (supuesto del estudio)" forceOpen={anyErrorAt(errors, ["competition.conversionFactor"])}>
          <div className={styles.fieldsInline}>
            <SimField label="Factor de conversión" unit="decimal" hint="Aporte = cuota × prob. de captar × factor" value={c.conversionFactor} onChange={(v) => onChange(patchSection(input, "competition", { conversionFactor: v }))} error={errorAt(errors, "competition.conversionFactor")} />
          </div>
        </Disclosure>
      </Card>
    </div>
  );
};
