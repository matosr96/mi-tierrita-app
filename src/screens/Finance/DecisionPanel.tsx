import { useState } from "react";
import type { Range, ScenarioDetail } from "@/types/api";
import { useSensitivity } from "@/hooks/financial";
import { Badge, Callout, EmptyState, ErrorState, Loading, StatCard } from "@/components/ui";
import { int, money, moneyCompact, pct, times } from "@/lib/format";
import { breakEven, formatPoints, marginPoints } from "./financeShared";
import { useSalesSensitivity } from "./useSalesSensitivity";
import { SafetyMarginChart } from "./SafetyMarginChart";
import { MonthlyBarsChart } from "./MonthlyBarsChart";
import { ScenarioDial } from "./ScenarioDial";
import styles from "./FinanceScreen.module.css";

type Props = { scenario: ScenarioDetail; onOpenAssumptions: () => void; onNew: () => void };

/** Lista guía del estudio (capítulo 5): qué datos conviene confirmar antes de firmar. No se registra en el sistema. */
const CHECKS: { text: string; owner: string; tone: "bad" | "warn" | "good" }[] = [
  { text: "Ventas que hoy se pierden por falta de espacio", owner: "Agus", tone: "bad" },
  { text: "Margen bruto real por línea de negocio", owner: "Agus", tone: "bad" },
  { text: "Cada cuánto se repone el alimento balanceado", owner: "Bodega", tone: "warn" },
  { text: "Costo de la obra con dos cotizaciones", owner: "Maestro", tone: "warn" },
  { text: "Tasa que ofrece el banco", owner: "Confirmado", tone: "good" },
];

const DIALS = {
  sales: { min: 0.1, max: 0.32, minLabel: "10 %", maxLabel: "32 %" },
  turnover: { min: 3, max: 12, minLabel: "3 ×/año", maxLabel: "12 ×/año" },
  term: { min: 24, max: 84, minLabel: "24 m", maxLabel: "84 m" },
};

/** Rejilla que se pide a la API para simular la rotación (misma escala del dial, paso de media vuelta). */
const TURNOVER_RANGE: Range = { from: DIALS.turnover.min, to: DIALS.turnover.max, step: 0.5 };

type SimKey = "sales" | "turnover";
type SensPoint = { value: number; npv: number };

/** Punto de la serie de la API más cercano al valor de la perilla: una búsqueda, no un cálculo. */
const nearestPoint = (points: SensPoint[], v: number): SensPoint | null =>
  points.reduce<SensPoint | null>((best, p) => (best === null || Math.abs(p.value - v) < Math.abs(best.value - v) ? p : best), null);

const gridIn = (points: SensPoint[] | undefined, min: number, max: number): number[] | null =>
  points
    ? points
        .map((p) => p.value)
        .filter((v) => v >= min - 1e-9 && v <= max + 1e-9)
        .sort((a, b) => a - b)
    : null;

const turnoverText = (v: number): string => `${times(v)}/año`;

/** Pestaña "Panel": veredicto, supuestos del escenario, cuatro indicadores, margen de seguridad y lectura mensual. */
export const DecisionPanel = ({ scenario, onOpenAssumptions, onNew }: Props) => {
  const { indicators: ind, assumptions: a, results } = scenario;
  const sensitivity = useSalesSensitivity(scenario);
  const be = sensitivity.data ? breakEven(sensitivity.data.points) : null;
  const margin = be !== null ? marginPoints(scenario.salesIncrease, be) : null;
  const viable = ind.npv > 0;
  const coverage = ind.coverageIncremental;

  // Simulación con los diales: la serie de rotación se pide a la API solo cuando alguien se acerca al dial.
  const [sim, setSim] = useState<{ key: SimKey; value: number } | null>(null);
  const [turnoverArmed, setTurnoverArmed] = useState(false);
  const turnover = useSensitivity(turnoverArmed ? scenario.id : null, "inventoryTurnover", TURNOVER_RANGE);
  const series = { sales: sensitivity, turnover } as const;
  const simQuery = sim ? series[sim.key] : null;
  const simPoint = sim && simQuery?.data ? nearestPoint(simQuery.data.points, sim.value) : null;
  const simFormat = sim?.key === "turnover" ? turnoverText : pct;
  const change = (key: SimKey) => (value: number | null) => setSim(value === null ? null : { key, value });

  const tone: "good" | "warn" | "bad" = !viable ? "bad" : margin !== null && margin < 2 ? "warn" : "good";
  const reason = (() => {
    if (sensitivity.isPending) return "Calculando el punto de equilibrio de las ventas…";
    if (!viable) {
      return be !== null
        ? `Con estas cifras la ampliación destruye valor. Las ventas tendrían que subir ${pct(be)}, no ${pct(scenario.salesIncrease)}.`
        : `Con estas cifras la ampliación destruye valor: VPN de ${moneyCompact(ind.npv)} a la TMAR de ${pct(a.tmarEA)}.`;
    }
    if (margin === null) return `Crea valor: VPN de ${moneyCompact(ind.npv)} a la TMAR de ${pct(a.tmarEA)}.`;
    if (margin < 2) return `Crea valor, pero el margen es de apenas ${formatPoints(margin, 2)} puntos sobre el punto de equilibrio.`;
    return `Las ventas pueden quedarse ${formatPoints(margin, 1)} puntos por debajo de lo previsto y aún así conviene.`;
  })();

  const irrTone: "neutral" | "bad" = ind.irr !== null && ind.irr < a.creditRateEA ? "bad" : "neutral";
  const coverageTone: "neutral" | "good" | "warn" | "bad" = coverage === null ? "neutral" : coverage >= 1.5 ? "good" : coverage >= 1 ? "warn" : "bad";
  const coverageNote = coverage === null ? "Sin cuota que cubrir" : coverage >= 1.5 ? "Con holgura" : coverage >= 1 ? "Justo, sin margen" : "El negocio pone la diferencia";

  const year1 = results.detail.find((d) => d.year === 1);
  const generates = year1 ? (year1.margin + year1.expenses) / 12 : null;

  const marginText = margin === null ? null : `${margin >= 0 ? "+" : "−"}${formatPoints(margin, 2)} puntos`;
  const marginClass = margin === null ? styles.textMuted : margin < 0 ? styles.textBad : margin < 2 ? styles.textWarn : styles.textGood;

  return (
    <div className={styles.decision}>
      <div className={styles.verdict}>
        <Callout
          tone={tone}
          title={viable ? "Conviene ampliar" : "No conviene ampliar"}
          aside={
            <div className={styles.aside}>
              <div className={styles.asideLabel}>Aporte propio</div>
              <div className={styles.asideValue}>{money(ind.ownContribution)}</div>
            </div>
          }
        >
          <span>{reason}</span>
        </Callout>
      </div>

      <section className={[styles.card, styles.dials].join(" ")} aria-label="Supuestos del escenario">
        <div className={styles.dialGrid}>
          <ScenarioDial
            label="Aumento de ventas"
            value={pct(scenario.salesIncrease)}
            base={scenario.salesIncrease}
            min={DIALS.sales.min}
            max={DIALS.sales.max}
            minLabel={DIALS.sales.minLabel}
            maxLabel={DIALS.sales.maxLabel}
            sim={{
              values: gridIn(sensitivity.data?.points, DIALS.sales.min, DIALS.sales.max),
              current: sim?.key === "sales" ? sim.value : null,
              format: pct,
              onArm: () => undefined,
              onChange: change("sales"),
            }}
          />
          <ScenarioDial
            label="Rotación del inventario"
            value={turnoverText(a.inventoryTurnover)}
            base={a.inventoryTurnover}
            min={DIALS.turnover.min}
            max={DIALS.turnover.max}
            minLabel={DIALS.turnover.minLabel}
            maxLabel={DIALS.turnover.maxLabel}
            sim={{
              values: gridIn(turnover.data?.points, DIALS.turnover.min, DIALS.turnover.max),
              current: sim?.key === "turnover" ? sim.value : null,
              format: turnoverText,
              onArm: () => setTurnoverArmed(true),
              onChange: change("turnover"),
            }}
          />
          <ScenarioDial
            label="Plazo del crédito"
            value={`${int(scenario.termMonths)} meses`}
            base={scenario.termMonths}
            min={DIALS.term.min}
            max={DIALS.term.max}
            minLabel={DIALS.term.minLabel}
            maxLabel={DIALS.term.maxLabel}
          />
        </div>
        <div className={styles.simReadout} role="status" aria-live="polite">
          {sim === null ? (
            <div className={styles.dialNote}>
              Arrastre la perilla de las ventas o de la rotación para leer el VPN que la API calculó con otro valor; el plazo no se simula porque la API no calcula sensibilidad al plazo. Para cambiar
              los supuestos, cree un escenario nuevo.{" "}
              <button type="button" className={styles.linkBtn} onClick={onNew}>
                Nuevo escenario
              </button>
            </div>
          ) : simQuery?.isError ? (
            <div className={styles.dialNote}>La API no devolvió la sensibilidad de esta variable. Suelte la perilla para volver al caso base.</div>
          ) : simPoint === null ? (
            <div className={styles.dialNote}>Consultando a la API la sensibilidad del VPN…</div>
          ) : (
            <>
              <div className={styles.simMain}>
                <span className={styles.simLabel}>Simulación: VPN con {simFormat(simPoint.value)}</span>
                <strong className={[styles.simValue, simPoint.npv > 0 ? styles.textGood : styles.textBad].join(" ")}>
                  {moneyCompact(simPoint.npv)}
                </strong>
              </div>
              <div className={styles.simAside}>
                <span>
                  Caso base <b>{moneyCompact(ind.npv)}</b>
                </span>
                <span className={styles.simHint}>Lectura de la sensibilidad que calcula la API · el escenario no se modifica · suelte o pulse Esc para volver</span>
              </div>
            </>
          )}
        </div>
      </section>

      <div className={styles.kpis}>
        <StatCard label="Valor presente neto" value={moneyCompact(ind.npv)} tone={viable ? "good" : "bad"} />
        <StatCard label="Rentabilidad anual" value={pct(ind.irr)} tone={irrTone} hint={`Crédito ${pct(a.creditRateEA)} · exigido ${pct(a.tmarEA)}`} />
        <StatCard label="Cuota mensual" value={money(ind.installment)} hint={`${moneyCompact(ind.totalInterest)} en intereses`} />
        <StatCard label="La ampliación paga su cuota" value={times(coverage)} tone={coverageTone} hint={coverageNote} />
      </div>

      <section className={[styles.card, styles.margin].join(" ")}>
        <div className={styles.cardHead}>
          <h2>Margen de seguridad</h2>
          <span className={styles.cardSub}>Cuánto pueden fallar las ventas antes de que la ampliación deje de convenir</span>
          {marginText !== null ? <strong className={[styles.marginValue, marginClass].join(" ")}>{marginText}</strong> : null}
        </div>
        {sensitivity.isPending ? (
          <Loading inline text="Calculando sensibilidad…" />
        ) : sensitivity.isError ? (
          <ErrorState error={sensitivity.error} onRetry={() => sensitivity.refetch()} />
        ) : !sensitivity.data || sensitivity.data.points.length === 0 ? (
          <EmptyState title="Sin puntos de sensibilidad" text="La API no devolvió puntos para el aumento de ventas." />
        ) : (
          <>
            <SafetyMarginChart
              from={sensitivity.data.range.from}
              to={sensitivity.data.range.to}
              fromLabel={pct(sensitivity.data.range.from)}
              toLabel={pct(sensitivity.data.range.to)}
              current={scenario.salesIncrease}
              currentLabel={pct(scenario.salesIncrease)}
              breakEven={be}
              breakEvenLabel={be !== null ? pct(be) : ""}
              allGood={viable}
            />
            {be === null ? <p className={styles.note}>El VPN no cambia de signo dentro del rango evaluado: no hay punto de equilibrio en estos valores.</p> : null}
          </>
        )}
      </section>

      <div className={styles.bottom}>
        <section className={[styles.card, styles.monthly].join(" ")}>
          <h2>Cada mes</h2>
          <div className={styles.cardSubBlock}>Lo que deja la ampliación frente a lo que cobra el banco</div>
          {generates === null ? (
            <EmptyState title="Sin detalle anual" text="La API no devolvió el flujo del año 1." />
          ) : (
            <>
              <MonthlyBarsChart
                generates={generates}
                installment={ind.installment}
                generatesLabel={money(generates)}
                installmentLabel={money(ind.installment)}
                differenceLabel={generates >= ind.installment ? `Sobran ${money(generates - ind.installment)} cada mes` : `Faltan ${money(ind.installment - generates)} cada mes`}
              />
              <p className={styles.noteSmall}>Estimado del año 1: margen bruto adicional menos gastos fijos adicionales, repartido en 12 meses.</p>
            </>
          )}
        </section>

        <section className={[styles.card, styles.cardSoft, styles.checks].join(" ")}>
          <div className={styles.cardHead}>
            <h2>Qué hay que verificar</h2>
            <Badge>Guía</Badge>
            <button type="button" className={[styles.linkBtn, styles.pushRight].join(" ")} onClick={onOpenAssumptions}>
              Abrir supuestos
            </button>
          </div>
          <div className={styles.checkList}>
            {CHECKS.map((c) => (
              <div key={c.text} className={styles.checkItem}>
                <span className={[styles.dot, styles[`dot_${c.tone}`]].join(" ")} />
                <span className={styles.checkText}>{c.text}</span>
                <span className={c.tone === "good" ? styles.checkOwnerGood : styles.checkOwner}>{c.owner}</span>
              </div>
            ))}
          </div>
          <div className={styles.checkFoot}>Lista guía del estudio, no se registra en el sistema · el resultado cambia cuando reemplace los supuestos por datos verificados</div>
        </section>
      </div>
    </div>
  );
};
