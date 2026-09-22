import { useSensitivity } from "@/hooks/financial";
import type { ScenarioDetail } from "@/types/api";
import { Callout, Card, EmptyState, QueryState, StatCard } from "@/components/ui";
import { LineChart, VBarChart } from "@/components/charts";
import { money, moneyCompact, pct, times, years } from "@/lib/format";
import { breakEven, pointsBetween } from "./financeShared";
import styles from "./FinanceScreen.module.css";

type Props = { scenario: ScenarioDetail; onOpenAssumptions: () => void };

/** Pestaña "Panel de decisión": la conclusión, cuatro indicadores y el margen de seguridad. */
export const DecisionPanel = ({ scenario, onOpenAssumptions }: Props) => {
  const { indicators: ind, assumptions: a, results } = scenario;
  const viable = ind.npv > 0;
  const coverage = ind.coverageIncremental;
  const coverageShort = coverage !== null && coverage < 1;
  const sensitivity = useSensitivity(scenario.id, "salesIncrease");

  const year1 = results.detail.find((d) => d.year === 1) ?? results.detail[0];
  const generatesMonthly = year1 ? year1.margin / 12 + year1.expenses / 12 : null;

  return (
    <div className={styles.panel}>
      <Callout
        tone={viable ? "good" : "bad"}
        title={viable ? "Conviene ampliar" : "No conviene con estos supuestos"}
        aside={
          <div className={styles.aside}>
            <span>Aporte propio</span>
            <strong>{money(ind.ownContribution)}</strong>
          </div>
        }
      >
        <span className={styles.calloutText}>
          {viable
            ? `Crea valor: VPN de ${moneyCompact(ind.npv)} con una TMAR de ${pct(a.tmarEA)} y recuperación descontada en ${years(ind.paybackDiscounted)}.`
            : `Destruye valor: VPN de ${moneyCompact(ind.npv)} con una TMAR de ${pct(a.tmarEA)}. Revise el aumento de ventas y el margen antes de firmar.`}
        </span>
      </Callout>

      <div className={styles.stats}>
        <StatCard label="Valor presente neto" value={moneyCompact(ind.npv)} tone={viable ? "good" : "bad"} hint={`TMAR ${pct(a.tmarEA)} · ${years(ind.paybackDiscounted)}`} />
        <StatCard label="Rentabilidad anual (TIR)" value={pct(ind.irr)} hint={`crédito ${pct(a.creditRateEA)} · exigido ${pct(a.tmarEA)}`} />
        <StatCard label="Cuota mensual" value={money(ind.installment)} hint={`${moneyCompact(ind.totalInterest)} en intereses`} />
        <StatCard label="La ampliación paga su cuota" value={times(coverage)} tone={coverageShort ? "bad" : "neutral"} hint={coverageShort ? "El negocio pone la diferencia" : "Cobertura incremental de la cuota"} />
      </div>

      <Card title="Margen de seguridad" subtitle="Cuánto pueden fallar las ventas antes de que la ampliación deje de convenir">
        <QueryState query={sensitivity} isEmpty={(d) => d.points.length === 0} empty={<EmptyState title="Sin puntos de sensibilidad" text="La API no devolvió puntos para el aumento de ventas." />}>
          {(data) => {
            const be = breakEven(data.points);
            const above = be !== null && scenario.salesIncrease >= be;
            return (
              <>
                <LineChart
                  points={data.points.map((p) => ({ x: p.value, y: p.npv }))}
                  formatX={pct}
                  formatY={moneyCompact}
                  marker={be !== null ? { x: be, label: `equilibrio aprox. ${pct(be)}` } : undefined}
                  highlightX={scenario.salesIncrease}
                />
                <p className={styles.caption}>VPN según el aumento de ventas atribuible a la ampliación · caso base {pct(scenario.salesIncrease)}</p>
                {be !== null ? (
                  <div className={[styles.reading, above ? styles.readingGood : styles.readingBad].join(" ")}>
                    {above ? (
                      <>
                        Las ventas pueden quedarse <strong>{pointsBetween(scenario.salesIncrease, be)} puntos</strong> por debajo de lo previsto antes de que la ampliación deje de convenir (equilibrio aprox. en {pct(be)}).
                      </>
                    ) : (
                      <>
                        Las ventas tendrían que subir <strong>{pointsBetween(scenario.salesIncrease, be)} puntos</strong> más de lo previsto para que la ampliación convenga (equilibrio aprox. en {pct(be)}).
                      </>
                    )}
                  </div>
                ) : (
                  <p className={styles.note}>El VPN no cruza cero dentro del rango evaluado: no hay punto de equilibrio en estos valores.</p>
                )}
              </>
            );
          }}
        </QueryState>
      </Card>

      <div className={styles.two}>
        <Card title="Cada mes" subtitle="Lo que deja la ampliación frente a lo que cobra el banco">
          {generatesMonthly === null ? (
            <EmptyState title="Sin detalle anual" text="La API no devolvió el flujo del año 1." />
          ) : (
            <>
              <VBarChart
                data={[
                  { label: "Genera", value: generatesMonthly },
                  { label: "Cuota", value: ind.installment, alt: true },
                ]}
                format={money}
              />
              <p className={styles.caption}>Estimado a partir del año 1: margen bruto adicional menos gastos fijos adicionales, repartido en 12 meses.</p>
              {coverageShort ? <p className={styles.note}>Cobertura incremental de {times(coverage)}: el negocio actual pone la diferencia de la cuota.</p> : null}
            </>
          )}
        </Card>
        <Card
          title="Supuestos clave"
          subtitle="Lo que más mueve el resultado"
          actions={
            <button type="button" className={styles.linkBtn} onClick={onOpenAssumptions}>
              Ver todos
            </button>
          }
        >
          <div className={styles.keyList}>
            <div className={styles.keyRow}>
              <span>Aumento de ventas</span>
              <strong>{pct(scenario.salesIncrease)}</strong>
            </div>
            <div className={styles.keyRow}>
              <span>Costo de ventas</span>
              <strong>{pct(a.costOfSalesPct)}</strong>
            </div>
            <div className={styles.keyRow}>
              <span>Rotación del inventario</span>
              <strong>{times(a.inventoryTurnover)} al año</strong>
            </div>
            <div className={styles.keyRow}>
              <span>Tasa del crédito</span>
              <strong>{pct(a.creditRateEA)} EA</strong>
            </div>
            <div className={styles.keyRow}>
              <span>Inversión fija</span>
              <strong>{money(scenario.fixedInvestment)}</strong>
            </div>
            <div className={styles.keyRow}>
              <span>Crédito</span>
              <strong>
                {pct(scenario.creditPct)} · {scenario.termMonths} meses
              </strong>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
