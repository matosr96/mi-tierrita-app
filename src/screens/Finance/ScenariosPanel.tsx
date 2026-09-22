import { useMemo, type ReactNode } from "react";
import { useBivariate, useCompareScenarios, useTornado } from "@/hooks/financial";
import type { ScenarioDetail, ScenarioSummary } from "@/types/api";
import { Badge, EmptyState, QueryState } from "@/components/ui";
import { money, moneyCompact, num2, pct, times, years } from "@/lib/format";
import { breakEven, formatPoints, letterOf, marginPoints, sameValue, scenarioStatuses, signedText, TORNADO_LABELS, type ScenarioStatus } from "./financeShared";
import { useSalesSensitivity } from "./useSalesSensitivity";
import { SensitivityChart } from "./SensitivityChart";
import { TornadoBars } from "./TornadoBars";
import styles from "./FinanceScreen.module.css";

type Props = { scenario: ScenarioDetail; scenarios: ScenarioSummary[] };

const MAX_COMPARED = 6;

type Tone = "good" | "warn" | "bad" | "muted" | undefined;
type Cell = { text: string; tone?: Tone; strong?: boolean };
type Row = { key: string; label: string; strong?: boolean; band?: boolean; cell: (s: ScenarioSummary) => Cell; diff?: (ref: ScenarioSummary, other: ScenarioSummary) => Cell };

const neg = (v: number): Tone => (v < 0 ? "bad" : undefined);
const costDiff = (d: number): Cell => ({ text: signedText(d, money), tone: d > 0 ? "bad" : d < 0 ? "good" : "muted" });
const valueDiff = (d: number, format: (v: number) => string): Cell => ({ text: signedText(d, format), tone: d > 0 ? "good" : d < 0 ? "bad" : "muted" });
const coverageTone = (c: number | null): Tone => (c === null ? "muted" : c < 1 ? "bad" : c < 1.5 ? "warn" : undefined);

const ROWS: Row[] = [
  { key: "totalInvestment", label: "Inversión total", cell: (s) => ({ text: money(s.indicators.totalInvestment) }), diff: () => ({ text: "—", tone: "muted" }) },
  { key: "credit", label: "Crédito", cell: (s) => ({ text: money(s.indicators.credit) }), diff: (r, o) => ({ text: signedText(o.indicators.credit - r.indicators.credit, money), tone: "muted" }) },
  {
    key: "ownContribution",
    label: "Aporte propio requerido",
    strong: true,
    band: true,
    cell: (s) => ({ text: money(s.indicators.ownContribution), strong: true, tone: s.indicators.ownContribution === 0 ? "good" : undefined }),
    diff: (r, o) => costDiff(o.indicators.ownContribution - r.indicators.ownContribution),
  },
  { key: "installment", label: "Cuota mensual", cell: (s) => ({ text: money(s.indicators.installment) }), diff: (r, o) => costDiff(o.indicators.installment - r.indicators.installment) },
  { key: "totalInterest", label: "Intereses totales", cell: (s) => ({ text: money(s.indicators.totalInterest) }), diff: (r, o) => costDiff(o.indicators.totalInterest - r.indicators.totalInterest) },
  { key: "npv", label: "VPN del proyecto", cell: (s) => ({ text: signedMoney(s.indicators.npv), tone: neg(s.indicators.npv) }), diff: (r, o) => valueDiff(o.indicators.npv - r.indicators.npv, money) },
  {
    key: "irr",
    label: "TIR del proyecto",
    cell: (s) => ({ text: pct(s.indicators.irr), tone: s.indicators.irr !== null && s.indicators.npv < 0 ? "bad" : undefined }),
    diff: (r, o) => (r.indicators.irr === null || o.indicators.irr === null ? { text: "—", tone: "muted" } : valueDiff((o.indicators.irr - r.indicators.irr) * 100, (v) => `${num2(v)} pp`)),
  },
  {
    key: "paybackDiscounted",
    label: "Recuperación descontada",
    cell: (s) => ({ text: years(s.indicators.paybackDiscounted), tone: s.indicators.paybackDiscounted === null ? "bad" : undefined }),
    diff: () => ({ text: "—", tone: "muted" }),
  },
  {
    key: "profitabilityIndex",
    label: "Índice de rentabilidad",
    cell: (s) => ({ text: num2(s.indicators.profitabilityIndex), tone: s.indicators.profitabilityIndex < 1 ? "bad" : undefined }),
    diff: (r, o) => valueDiff(o.indicators.profitabilityIndex - r.indicators.profitabilityIndex, num2),
  },
  {
    key: "benefitCostRatio",
    label: "Relación B/C convencional",
    cell: (s) => ({ text: num2(s.indicators.benefitCostRatio), tone: s.indicators.benefitCostRatio < 1 ? "bad" : undefined }),
    diff: (r, o) => valueDiff(o.indicators.benefitCostRatio - r.indicators.benefitCostRatio, num2),
  },
  { key: "investorNpv", label: "VPN del inversionista", cell: (s) => ({ text: signedMoney(s.indicators.investorNpv), tone: neg(s.indicators.investorNpv) }), diff: (r, o) => valueDiff(o.indicators.investorNpv - r.indicators.investorNpv, money) },
  {
    key: "coverageIncremental",
    label: "Cobertura incremental",
    cell: (s) => ({ text: times(s.indicators.coverageIncremental), tone: coverageTone(s.indicators.coverageIncremental) }),
    diff: (r, o) => (r.indicators.coverageIncremental === null || o.indicators.coverageIncremental === null ? { text: "—", tone: "muted" } : valueDiff(o.indicators.coverageIncremental - r.indicators.coverageIncremental, times)),
  },
];

/** "−$ 4.840.059" con signo tipográfico para negativos; positivos sin signo. */
function signedMoney(v: number): string {
  return v < 0 ? `−${money(Math.abs(v))}` : money(v);
}

const toneClass = (tone: Tone): string => (tone === "good" ? styles.textGood : tone === "warn" ? styles.textWarn : tone === "bad" ? styles.textBad : tone === "muted" ? styles.textMuted : undefined) ?? "";

const CellText = ({ cell }: { cell: Cell }) => {
  const node: ReactNode = cell.strong ? <strong>{cell.text}</strong> : cell.text;
  return <span className={toneClass(cell.tone)}>{node}</span>;
};

/** Pestaña "Escenarios": comparación completa, sensibilidad de ventas, tornado y bivariante, como en el lienzo. */
export const ScenariosPanel = ({ scenario, scenarios }: Props) => {
  const compareIds = useMemo(() => [scenario.id, ...scenarios.filter((s) => s.id !== scenario.id).map((s) => s.id)].slice(0, MAX_COMPARED), [scenario.id, scenarios]);
  const compare = useCompareScenarios(compareIds);
  const sensitivity = useSalesSensitivity(scenario);
  const tornado = useTornado(scenario.id);
  const bivariate = useBivariate(scenario.id, "salesIncrease", "inventoryTurnover");

  const be = sensitivity.data ? breakEven(sensitivity.data.points) : null;
  const margin = be !== null ? marginPoints(scenario.salesIncrease, be) : null;
  const ordered = useMemo(() => scenarios.filter((s) => compareIds.includes(s.id)).sort((x, y) => x.createdAt.localeCompare(y.createdAt)), [scenarios, compareIds]);
  const currentLetter = ordered.length > 1 ? letterOf(Math.max(0, ordered.findIndex((s) => s.id === scenario.id))) : "actual";

  const renderComparison = (unordered: ScenarioSummary[]) => {
    const list = [...unordered].sort((x, y) => x.createdAt.localeCompare(y.createdAt));
    const statuses = scenarioStatuses(list);
    const refIndex = Math.max(0, list.findIndex((s) => s.id === scenario.id));
    const ref = list[refIndex] ?? scenario;
    const recommended = list.find((s) => statuses.get(s.id)?.label === "Recomendado");
    const other = list.length >= 2 ? (recommended && recommended.id !== ref.id ? recommended : [...list].reverse().find((s) => s.id !== ref.id) ?? null) : null;
    const otherIndex = other ? list.indexOf(other) : -1;
    return (
      <>
        <div className={styles.cardHead}>
          <h2>Comparación completa</h2>
          <span className={styles.cardSub}>{other ? `La columna de diferencia toma el escenario ${letterOf(refIndex)} como referencia` : "Cree otro escenario para comparar alternativas"}</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Indicador</th>
                {list.map((s, i) => (
                  <th key={s.id} className={s.id === scenario.id ? styles.current : undefined}>
                    {letterOf(i)} · {s.name}
                  </th>
                ))}
                {other ? (
                  <th className={styles.textMuted}>
                    {letterOf(otherIndex)} − {letterOf(refIndex)}
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.key} className={r.band ? styles.band : undefined}>
                  <td>{r.strong ? <strong>{r.label}</strong> : r.label}</td>
                  {list.map((s) => (
                    <td key={s.id}>
                      <CellText cell={r.cell(s)} />
                    </td>
                  ))}
                  {other && r.diff ? (
                    <td>
                      <CellText cell={r.diff(ref, other)} />
                    </td>
                  ) : null}
                </tr>
              ))}
              <tr>
                <td>Estado</td>
                {list.map((s) => {
                  const st = statuses.get(s.id);
                  return <td key={s.id}>{st ? <Badge tone={st.tone}>{st.label}</Badge> : null}</td>;
                })}
                {other ? <td /> : null}
              </tr>
            </tbody>
          </table>
        </div>
        <div className={styles.cardFoot}>{explanation(list, statuses)}</div>
      </>
    );
  };

  const fine = sensitivity.data?.points ?? [];
  const labeled = (x: number) => Math.abs(Math.round((x - scenario.salesIncrease) * 100)) % 4 === 0;

  return (
    <div className={styles.stack}>
      <section className={styles.card}>
        {compareIds.length >= 2 ? (
          <QueryState query={compare} isEmpty={(d) => d.scenarios.length === 0} empty={<EmptyState title="Nada que comparar" text="La API no devolvió escenarios." />}>
            {(data) => renderComparison(data.scenarios)}
          </QueryState>
        ) : (
          renderComparison([scenario])
        )}
      </section>

      <div className={styles.twoCols}>
        <section className={styles.card}>
          <h2>Cuánto pueden fallar las ventas</h2>
          <div className={styles.cardSubBlock}>VPN del escenario {currentLetter} según el aumento de ventas que produzca la ampliación</div>
          <QueryState query={sensitivity} isEmpty={(d) => d.points.length === 0} empty={<EmptyState title="Sin puntos" text="La API no devolvió puntos para el aumento de ventas." />}>
            {() => (
              <>
                <SensitivityChart
                  points={fine}
                  baseX={scenario.salesIncrease}
                  breakEven={be}
                  formatX={pct}
                  formatY={moneyCompact}
                  labeled={labeled}
                  isBase={(x) => sameValue(x, scenario.salesIncrease)}
                  axisTitle="Aumento de ventas atribuible a la ampliación"
                />
                {margin !== null && be !== null ? (
                  margin >= 0 ? (
                    <div className={[styles.reading, margin < 2 ? styles.readingWarn : styles.readingGood].join(" ")}>
                      Las ventas pueden quedarse <strong>{formatPoints(margin, 2)} puntos</strong> por debajo de lo esperado antes de que la ampliación destruya valor. {margin < 2 ? "Es un margen estrecho." : "Es un margen holgado."}
                    </div>
                  ) : (
                    <div className={[styles.reading, styles.readingBad].join(" ")}>
                      Las ventas tendrían que subir <strong>{formatPoints(margin, 2)} puntos</strong> más de lo previsto (hasta {pct(be)}) para que la ampliación cree valor.
                    </div>
                  )
                ) : (
                  <div className={[styles.reading, scenario.indicators.npv > 0 ? styles.readingGood : styles.readingBad].join(" ")}>El VPN no cambia de signo en el rango evaluado: no hay punto de equilibrio en estos valores.</div>
                )}
              </>
            )}
          </QueryState>
        </section>

        <section className={styles.card}>
          <h2>Qué supuesto mueve más el resultado</h2>
          <QueryState query={tornado} isEmpty={(d) => d.bars.length === 0} empty={<EmptyState title="Sin tornado" text="La API no devolvió barras." />}>
            {(data) => {
              const rows = [...data.bars].sort((x, y) => y.amplitude - x.amplitude).map((b) => ({ label: TORNADO_LABELS[b.variable] ?? b.variable, low: b.npvLow, high: b.npvHigh, amplitude: b.amplitude }));
              const top = rows[0];
              const second = rows[1];
              const flat = rows.filter((r) => r.amplitude === 0).map((r) => r.label);
              return (
                <>
                  <div className={styles.cardSubBlock}>VPN cuando cada supuesto se mueve ±{pct(data.delta)} y los demás quedan en su valor base</div>
                  <TornadoBars rows={rows} base={data.baseNpv} baseLabel={moneyCompact(data.baseNpv)} />
                  <div className={styles.cardFoot}>
                    {top ? (
                      <>
                        El <strong>{top.label.toLowerCase()}</strong> es el supuesto que más mueve el VPN
                        {second && second.amplitude > 0 ? `, seguido de ${second.label.toLowerCase()}` : ""}.
                      </>
                    ) : null}
                    {flat.length > 0 ? ` ${flat.join(" y ")} no cambia${flat.length > 1 ? "n" : ""} la rentabilidad de la ampliación, solo lo que cuesta financiarla.` : ""}
                  </div>
                </>
              );
            }}
          </QueryState>
        </section>
      </div>

      <section className={styles.card}>
        <div className={styles.cardHead}>
          <h2>Las dos variables juntas</h2>
          <span className={styles.cardSub}>VPN en millones de pesos · los valores negativos están en rojo</span>
        </div>
        <QueryState query={bivariate} isEmpty={(d) => d.xValues.length === 0 || d.yValues.length === 0} empty={<EmptyState title="Sin cuadrícula" text="La API no devolvió la sensibilidad bivariante." />}>
          {(data) => {
            const minRotIndex = data.yValues.reduce((best, v, i, arr) => (v < (arr[best] ?? Infinity) ? i : best), 0);
            const minRot = data.yValues[minRotIndex];
            const beMinRot = breakEven(data.xValues.map((x, xi) => ({ value: x, npv: data.npv[minRotIndex]?.[xi] ?? 0 })));
            const tight = beMinRot !== null && marginPoints(scenario.salesIncrease, beMinRot) < 2;
            return (
              <>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Aumento de ventas</th>
                        {data.yValues.map((y) => (
                          <th key={y}>Rotación {times(y)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.xValues.map((x, xi) => {
                        const baseRow = sameValue(x, scenario.salesIncrease);
                        return (
                          <tr key={x} className={baseRow ? styles.band : undefined}>
                            <td>{baseRow ? <strong>+{pct(x)} (base)</strong> : `+${pct(x)}`}</td>
                            {data.yValues.map((y, yi) => {
                              const v = data.npv[yi]?.[xi];
                              const baseCell = baseRow && sameValue(y, scenario.assumptions.inventoryTurnover);
                              const text = v === undefined ? "—" : moneyCompact(v);
                              return (
                                <td key={y} className={v !== undefined && v < 0 ? styles.textBad : undefined}>
                                  {baseCell ? <strong>{text}</strong> : text}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className={styles.cardFoot}>
                  {minRot !== undefined && beMinRot !== null ? (
                    <>
                      Si la mercancía rota lento —{times(minRot)} al año— hace falta inmovilizar más inventario y el umbral de ventas queda en <strong>{pct(beMinRot)}</strong>.{tight ? " El pronóstico tendría que acertar casi exacto para que la ampliación valga la pena." : ""}
                    </>
                  ) : (
                    "Cada celda es el VPN del proyecto para esa combinación de aumento de ventas y rotación del inventario, con los demás supuestos en su valor base."
                  )}
                </div>
              </>
            );
          }}
        </QueryState>
      </section>
    </div>
  );
};

/** Párrafo de lectura de la tabla, armado con los valores reales de cada escenario. */
const explanation = (list: ScenarioSummary[], statuses: Map<number, ScenarioStatus>): ReactNode => {
  const letter = (s: ScenarioSummary) => letterOf(list.indexOf(s));
  const by = (label: ScenarioStatus["label"]) => list.filter((s) => statuses.get(s.id)?.label === label);
  const recommended = by("Recomendado")[0];
  const viable = by("Viable");
  const evaluate = by("Evaluar");
  const discarded = by("Descartado");
  const names = (xs: ScenarioSummary[]) => xs.map(letter).join(", ").replace(/, ([^,]*)$/, " y $1");
  return (
    <>
      {recommended ? (
        <>
          <strong>{letter(recommended)} es el recomendado:</strong> VPN del inversionista de {money(recommended.indicators.investorNpv)} y lo que genera la ampliación cubre {times(recommended.indicators.coverageIncremental)} la cuota.{" "}
        </>
      ) : null}
      {viable.length > 0 ? <>{names(viable)} también crea{viable.length > 1 ? "n" : ""} valor y cubre{viable.length > 1 ? "n" : ""} su cuota: cambia cuánto pone la empresa y cuánto cuesta el crédito. </> : null}
      {evaluate.map((s) => (
        <span key={s.id}>
          <strong>{letter(s)} queda por evaluar:</strong> crea valor, pero lo que genera cubre {times(s.indicators.coverageIncremental)} la cuota y el negocio actual pondría la diferencia.{" "}
        </span>
      ))}
      {discarded.map((s) => (
        <span key={s.id}>
          <strong>{letter(s)} no alcanza:</strong> {s.indicators.irr !== null ? `rinde ${pct(s.indicators.irr)}, por debajo de lo exigido,` : `destruye valor (VPN de ${moneyCompact(s.indicators.npv)})`} y lo que genera cubre {times(s.indicators.coverageIncremental)} la cuota. Habría que sacar dinero de la operación actual para pagarla.{" "}
        </span>
      ))}
    </>
  );
};
