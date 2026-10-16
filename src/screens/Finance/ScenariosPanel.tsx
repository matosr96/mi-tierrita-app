import { useMemo, type CSSProperties, type ReactNode } from "react";
import { useBivariate, useCompareScenarios, useTornado } from "@/hooks/financial";
import type { ScenarioDetail, ScenarioSummary } from "@/types/api";
import { Badge, EmptyState, QueryState } from "@/components/ui";
import { money, moneyCompact, num2, pct, times, years } from "@/lib/format";
import { breakEven, formatPoints, letterOf, marginPoints, sameValue, scenarioStatuses, signedText, TORNADO_LABELS, type ScenarioStatus } from "./financeShared";
import { useSalesSensitivity } from "./useSalesSensitivity";
import { SensitivityChart } from "./SensitivityChart";
import { TornadoBars } from "./TornadoBars";
import styles from "./ScenariosPanel.module.css";

type Props = { scenario: ScenarioDetail; scenarios: ScenarioSummary[]; onSelect?: (id: number) => void };

const MAX_COMPARED = 6;

type Tone = "good" | "warn" | "bad" | "muted" | undefined;
type Cell = { text: string; tone?: Tone; strong?: boolean };
/** `best` solo ordena los valores que devuelve la API para señalar el extremo preferible; no calcula nada. */
type Best = { dir: "max" | "min"; value: (s: ScenarioSummary) => number | null };
type Row = { key: string; label: string; strong?: boolean; band?: boolean; best?: Best; cell: (s: ScenarioSummary) => Cell; diff?: (ref: ScenarioSummary, other: ScenarioSummary) => Cell };

const neg = (v: number): Tone => (v < 0 ? "bad" : undefined);
const costDiff = (d: number): Cell => ({ text: signedText(d, money), tone: d > 0 ? "bad" : d < 0 ? "good" : "muted" });
const valueDiff = (d: number, format: (v: number) => string): Cell => ({ text: signedText(d, format), tone: d > 0 ? "good" : d < 0 ? "bad" : "muted" });
const coverageTone = (c: number | null): Tone => (c === null ? "muted" : c < 1 ? "bad" : c < 1.5 ? "warn" : undefined);

/** "−$ 4.840.059" con signo tipográfico para negativos; positivos sin signo. */
const signedMoney = (v: number): string => (v < 0 ? `−${money(Math.abs(v))}` : money(v));

const ROWS: Row[] = [
  { key: "totalInvestment", label: "Inversión total", cell: (s) => ({ text: money(s.indicators.totalInvestment) }), diff: () => ({ text: "—", tone: "muted" }) },
  { key: "credit", label: "Crédito", cell: (s) => ({ text: money(s.indicators.credit) }), diff: (r, o) => ({ text: signedText(o.indicators.credit - r.indicators.credit, money), tone: "muted" }) },
  {
    key: "ownContribution",
    label: "Aporte propio requerido",
    strong: true,
    band: true,
    best: { dir: "min", value: (s) => s.indicators.ownContribution },
    cell: (s) => ({ text: money(s.indicators.ownContribution), strong: true, tone: s.indicators.ownContribution === 0 ? "good" : undefined }),
    diff: (r, o) => costDiff(o.indicators.ownContribution - r.indicators.ownContribution),
  },
  { key: "installment", label: "Cuota mensual", best: { dir: "min", value: (s) => s.indicators.installment }, cell: (s) => ({ text: money(s.indicators.installment) }), diff: (r, o) => costDiff(o.indicators.installment - r.indicators.installment) },
  { key: "totalInterest", label: "Intereses totales", best: { dir: "min", value: (s) => s.indicators.totalInterest }, cell: (s) => ({ text: money(s.indicators.totalInterest) }), diff: (r, o) => costDiff(o.indicators.totalInterest - r.indicators.totalInterest) },
  { key: "npv", label: "VPN del proyecto", best: { dir: "max", value: (s) => s.indicators.npv }, cell: (s) => ({ text: signedMoney(s.indicators.npv), tone: neg(s.indicators.npv) }), diff: (r, o) => valueDiff(o.indicators.npv - r.indicators.npv, money) },
  {
    key: "irr",
    label: "TIR del proyecto",
    best: { dir: "max", value: (s) => s.indicators.irr },
    cell: (s) => ({ text: pct(s.indicators.irr), tone: s.indicators.irr !== null && s.indicators.npv < 0 ? "bad" : undefined }),
    diff: (r, o) => (r.indicators.irr === null || o.indicators.irr === null ? { text: "—", tone: "muted" } : valueDiff((o.indicators.irr - r.indicators.irr) * 100, (v) => `${num2(v)} pp`)),
  },
  {
    key: "paybackDiscounted",
    label: "Recuperación descontada",
    best: { dir: "min", value: (s) => s.indicators.paybackDiscounted },
    cell: (s) => ({ text: years(s.indicators.paybackDiscounted), tone: s.indicators.paybackDiscounted === null ? "bad" : undefined }),
    diff: () => ({ text: "—", tone: "muted" }),
  },
  {
    key: "profitabilityIndex",
    label: "Índice de rentabilidad",
    best: { dir: "max", value: (s) => s.indicators.profitabilityIndex },
    cell: (s) => ({ text: num2(s.indicators.profitabilityIndex), tone: s.indicators.profitabilityIndex < 1 ? "bad" : undefined }),
    diff: (r, o) => valueDiff(o.indicators.profitabilityIndex - r.indicators.profitabilityIndex, num2),
  },
  {
    key: "benefitCostRatio",
    label: "Relación B/C convencional",
    best: { dir: "max", value: (s) => s.indicators.benefitCostRatio },
    cell: (s) => ({ text: num2(s.indicators.benefitCostRatio), tone: s.indicators.benefitCostRatio < 1 ? "bad" : undefined }),
    diff: (r, o) => valueDiff(o.indicators.benefitCostRatio - r.indicators.benefitCostRatio, num2),
  },
  {
    key: "investorNpv",
    label: "VPN del inversionista",
    strong: true,
    band: true,
    best: { dir: "max", value: (s) => s.indicators.investorNpv },
    cell: (s) => ({ text: signedMoney(s.indicators.investorNpv), tone: neg(s.indicators.investorNpv), strong: true }),
    diff: (r, o) => valueDiff(o.indicators.investorNpv - r.indicators.investorNpv, money),
  },
  {
    key: "coverageIncremental",
    label: "Cobertura incremental",
    best: { dir: "max", value: (s) => s.indicators.coverageIncremental },
    cell: (s) => ({ text: times(s.indicators.coverageIncremental), tone: coverageTone(s.indicators.coverageIncremental) }),
    diff: (r, o) => (r.indicators.coverageIncremental === null || o.indicators.coverageIncremental === null ? { text: "—", tone: "muted" } : valueDiff(o.indicators.coverageIncremental - r.indicators.coverageIncremental, times)),
  },
];

/** Escenarios con el valor preferible de la fila (orden de los valores de la API). Vacío si todos empatan. */
const bestIds = (list: ScenarioSummary[], best: Best | undefined): Set<number> => {
  if (!best || list.length < 2) return new Set();
  const vals = list.map((s) => ({ id: s.id, v: best.value(s) })).filter((x): x is { id: number; v: number } => x.v !== null);
  if (vals.length === 0) return new Set();
  const sorted = [...vals].sort((a, b) => (best.dir === "max" ? b.v - a.v : a.v - b.v));
  const top = sorted[0]!.v;
  const winners = vals.filter((x) => x.v === top);
  return winners.length === list.length ? new Set() : new Set(winners.map((x) => x.id));
};

const toneClass = (tone: Tone): string => (tone === "good" ? styles.good : tone === "warn" ? styles.warn : tone === "bad" ? styles.bad : tone === "muted" ? styles.muted : undefined) ?? "";

const CellText = ({ cell }: { cell: Cell }) => {
  const node: ReactNode = cell.strong ? <strong>{cell.text}</strong> : cell.text;
  return <span className={toneClass(cell.tone)}>{node}</span>;
};

const Eyebrow = ({ children }: { children: ReactNode }) => <span className={styles.eyebrow}>{children}</span>;

/** Pestaña "Escenarios": cara a cara, comparación completa, sensibilidad de ventas (héroe), tornado y bivariante. */
export const ScenariosPanel = ({ scenario, scenarios, onSelect }: Props) => {
  // Ids ordenados: cambiar de escenario en pantalla no cambia la consulta de comparación.
  const compareIds = useMemo(() => [scenario.id, ...scenarios.filter((s) => s.id !== scenario.id).map((s) => s.id)].slice(0, MAX_COMPARED).sort((a, b) => a - b), [scenario.id, scenarios]);
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
    const other = list.length >= 2 ? (recommended && recommended.id !== ref.id ? recommended : ([...list].reverse().find((s) => s.id !== ref.id) ?? null)) : null;
    const otherIndex = other ? list.indexOf(other) : -1;
    return (
      <>
        <section className={styles.block}>
          <header className={styles.blockHead}>
            <Eyebrow>Cara a cara</Eyebrow>
            <h2 className={styles.blockTitle}>{recommended ? `Conviene el escenario ${letterOf(list.indexOf(recommended))}` : "Ninguna alternativa convence"}</h2>
            <p className={styles.blockSub}>{list.length > 1 ? "Elija una tarjeta para ver ese escenario en todas las pestañas." : "Cree otro escenario para comparar alternativas."}</p>
          </header>
          <div className={styles.versus} style={{ "--cols": Math.min(list.length, 3) } as CSSProperties}>
            {list.map((s, i) => {
              const st = statuses.get(s.id);
              const isRec = st?.label === "Recomendado";
              const isCurrent = s.id === scenario.id;
              const ind = s.indicators;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={[styles.vsCard, isRec ? styles.vsRec : "", isCurrent ? styles.vsCurrent : ""].join(" ")}
                  onClick={() => onSelect?.(s.id)}
                  aria-pressed={isCurrent}
                  disabled={!onSelect}
                >
                  <span className={styles.vsTop}>
                    <span className={styles.vsLetter}>{letterOf(i)}</span>
                    {st ? <Badge tone={st.tone}>{st.label}</Badge> : null}
                    {isCurrent ? <span className={styles.vsNow}>En pantalla</span> : null}
                  </span>
                  <span className={styles.vsName}>{s.name}</span>
                  <span className={styles.vsHero}>
                    <span className={styles.vsHeroLabel}>VPN del inversionista</span>
                    <span className={[styles.vsHeroValue, ind.investorNpv < 0 ? styles.bad : ""].join(" ")}>{moneyCompact(ind.investorNpv)}</span>
                  </span>
                  <span className={styles.vsList}>
                    <span>
                      <i>VPN proyecto</i>
                      <b className={ind.npv < 0 ? styles.bad : undefined}>{moneyCompact(ind.npv)}</b>
                    </span>
                    <span>
                      <i>TIR</i>
                      <b>{pct(ind.irr)}</b>
                    </span>
                    <span>
                      <i>Cobertura</i>
                      <b className={toneClass(coverageTone(ind.coverageIncremental))}>{times(ind.coverageIncremental)}</b>
                    </span>
                    <span>
                      <i>Aporte propio</i>
                      <b>{moneyCompact(ind.ownContribution)}</b>
                    </span>
                    <span>
                      <i>Cuota</i>
                      <b>{moneyCompact(ind.installment)}</b>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className={styles.reading}>{explanation(list, statuses)}</p>
        </section>

        <section className={styles.block}>
          <header className={styles.blockHead}>
            <h2 className={styles.blockTitleSm}>Comparación completa</h2>
            <p className={styles.blockSub}>
              {other ? `La columna de diferencia toma el escenario ${letterOf(refIndex)} como referencia. ` : ""}
              {list.length > 1 ? (
                <>
                  <span className={styles.bestKey} aria-hidden="true" /> marca el valor preferible de cada fila.
                </>
              ) : null}
            </p>
          </header>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Indicador</th>
                  {list.map((s, i) => (
                    <th key={s.id} className={[s.id === scenario.id ? styles.thCurrent : "", statuses.get(s.id)?.label === "Recomendado" ? styles.thRec : ""].join(" ")}>
                      <span className={styles.thLetter}>{letterOf(i)}</span> {s.name}
                    </th>
                  ))}
                  {other ? (
                    <th className={styles.thDiff}>
                      {letterOf(otherIndex)} − {letterOf(refIndex)}
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => {
                  const winners = bestIds(list, r.best);
                  return (
                    <tr key={r.key} className={r.band ? styles.band : undefined}>
                      <th scope="row">{r.strong ? <strong>{r.label}</strong> : r.label}</th>
                      {list.map((s) => (
                        <td key={s.id} className={[winners.has(s.id) ? styles.best : "", s.id === scenario.id ? styles.tdCurrent : ""].join(" ")}>
                          <CellText cell={r.cell(s)} />
                        </td>
                      ))}
                      {other && r.diff ? (
                        <td className={styles.tdDiff}>
                          <CellText cell={r.diff(ref, other)} />
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
                <tr>
                  <th scope="row">Estado</th>
                  {list.map((s) => {
                    const st = statuses.get(s.id);
                    return (
                      <td key={s.id} className={s.id === scenario.id ? styles.tdCurrent : undefined}>
                        {st ? <Badge tone={st.tone}>{st.label}</Badge> : null}
                      </td>
                    );
                  })}
                  {other ? <td className={styles.tdDiff} /> : null}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </>
    );
  };

  const fine = sensitivity.data?.points ?? [];
  const labeled = (x: number) => Math.abs(Math.round((x - scenario.salesIncrease) * 100)) % 4 === 0;
  const marginTone = margin === null ? (scenario.indicators.npv > 0 ? "good" : "bad") : margin < 0 ? "bad" : margin < 2 ? "warn" : "good";

  return (
    <div className={styles.panel}>
      {compareIds.length >= 2 ? (
        <QueryState query={compare} isEmpty={(d) => d.scenarios.length === 0} empty={<EmptyState title="Nada que comparar" text="La API no devolvió escenarios." />}>
          {(data) => renderComparison(data.scenarios)}
        </QueryState>
      ) : (
        renderComparison([scenario])
      )}

      <section className={styles.hero}>
        <div className={styles.heroSide}>
          <Eyebrow>Sensibilidad del escenario {currentLetter}</Eyebrow>
          <h2 className={styles.heroTitle}>Cuánto pueden fallar las ventas</h2>
          <QueryState query={sensitivity} isEmpty={(d) => d.points.length === 0} empty={<EmptyState title="Sin puntos" text="La API no devolvió puntos para el aumento de ventas." />}>
            {() => (
              <>
                <div className={[styles.heroFigure, styles[`hero_${marginTone}`] ?? ""].join(" ")}>
                  <span className={styles.heroLabel}>{margin === null ? "Margen" : margin >= 0 ? "Margen de error" : "Faltan"}</span>
                  <span className={styles.heroValue}>{margin === null ? "—" : `${margin >= 0 ? "+" : "−"}${formatPoints(margin, 2)}`}</span>
                  <span className={styles.heroUnit}>puntos porcentuales</span>
                </div>
                <dl className={styles.heroFacts}>
                  <div>
                    <dt>Caso base</dt>
                    <dd>{pct(scenario.salesIncrease)}</dd>
                  </div>
                  <div>
                    <dt>Equilibrio aprox.</dt>
                    <dd>{be !== null ? pct(be) : "—"}</dd>
                  </div>
                  <div>
                    <dt>VPN base</dt>
                    <dd>{moneyCompact(scenario.indicators.npv)}</dd>
                  </div>
                </dl>
                <p className={styles.heroReading}>
                  {margin !== null && be !== null ? (
                    margin >= 0 ? (
                      <>
                        Las ventas pueden quedarse <strong>{formatPoints(margin, 2)} puntos</strong> por debajo de lo esperado antes de que la ampliación destruya valor. {margin < 2 ? "Es un margen estrecho." : "Es un margen holgado."}
                      </>
                    ) : (
                      <>
                        Las ventas tendrían que subir <strong>{formatPoints(margin, 2)} puntos</strong> más de lo previsto (hasta {pct(be)}) para que la ampliación cree valor.
                      </>
                    )
                  ) : (
                    "El VPN no cambia de signo en el rango evaluado: no hay punto de equilibrio en estos valores."
                  )}
                </p>
              </>
            )}
          </QueryState>
        </div>
        <div className={styles.heroChart}>
          {fine.length > 0 ? (
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
          ) : null}
          <span className={styles.heroHint}>Pase el cursor o use ← → para leer cada punto de la API</span>
        </div>
      </section>

      <div className={styles.pair}>
        <section className={styles.block}>
          <header className={styles.blockHead}>
            <Eyebrow>Tornado</Eyebrow>
            <h2 className={styles.blockTitleSm}>Qué supuesto mueve más el resultado</h2>
          </header>
          <QueryState query={tornado} isEmpty={(d) => d.bars.length === 0} empty={<EmptyState title="Sin tornado" text="La API no devolvió barras." />}>
            {(data) => {
              const rows = [...data.bars].sort((x, y) => y.amplitude - x.amplitude).map((b) => ({ label: TORNADO_LABELS[b.variable] ?? b.variable, low: b.npvLow, high: b.npvHigh, amplitude: b.amplitude }));
              const top = rows[0];
              const second = rows[1];
              const flat = rows.filter((r) => r.amplitude === 0).map((r) => r.label);
              return (
                <>
                  <p className={styles.blockSub}>VPN cuando cada supuesto se mueve ±{pct(data.delta)} y los demás quedan en su valor base</p>
                  <div className={styles.cardBody}>
                    <TornadoBars rows={rows} base={data.baseNpv} baseLabel={moneyCompact(data.baseNpv)} />
                  </div>
                  <p className={styles.foot}>
                    {top ? (
                      <>
                        El <strong>{top.label.toLowerCase()}</strong> es el supuesto que más mueve el VPN
                        {second && second.amplitude > 0 ? `, seguido de ${second.label.toLowerCase()}` : ""}.
                      </>
                    ) : null}
                    {flat.length > 0 ? ` ${flat.join(" y ")} no cambia${flat.length > 1 ? "n" : ""} la rentabilidad de la ampliación, solo lo que cuesta financiarla.` : ""}
                  </p>
                </>
              );
            }}
          </QueryState>
        </section>

        <section className={styles.block}>
          <header className={styles.blockHead}>
            <Eyebrow>Bivariante</Eyebrow>
            <h2 className={styles.blockTitleSm}>Las dos variables juntas</h2>
            <p className={styles.blockSub}>VPN del proyecto por aumento de ventas (filas) y rotación del inventario (columnas)</p>
          </header>
          <QueryState query={bivariate} isEmpty={(d) => d.xValues.length === 0 || d.yValues.length === 0} empty={<EmptyState title="Sin cuadrícula" text="La API no devolvió la sensibilidad bivariante." />}>
            {(data) => {
              const minRotIndex = data.yValues.reduce((best, v, i, arr) => (v < (arr[best] ?? Infinity) ? i : best), 0);
              const minRot = data.yValues[minRotIndex];
              const beMinRot = breakEven(data.xValues.map((x, xi) => ({ value: x, npv: data.npv[minRotIndex]?.[xi] ?? 0 })));
              const tight = beMinRot !== null && marginPoints(scenario.salesIncrease, beMinRot) < 2;
              return (
                <>
                  <div className={styles.tableWrap}>
                    <table className={[styles.table, styles.heat].join(" ")}>
                      <thead>
                        <tr>
                          <th>Ventas \ rotación</th>
                          {data.yValues.map((y) => (
                            <th key={y} className={sameValue(y, scenario.assumptions.inventoryTurnover) ? styles.thCurrent : undefined}>
                              {times(y)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.xValues.map((x, xi) => {
                          const baseRow = sameValue(x, scenario.salesIncrease);
                          return (
                            <tr key={x} className={baseRow ? styles.band : undefined}>
                              <th scope="row">{baseRow ? <strong>+{pct(x)} · base</strong> : `+${pct(x)}`}</th>
                              {data.yValues.map((y, yi) => {
                                const v = data.npv[yi]?.[xi];
                                const baseCell = baseRow && sameValue(y, scenario.assumptions.inventoryTurnover);
                                const text = v === undefined ? "—" : moneyCompact(v);
                                const sign = v === undefined ? "" : v < 0 ? styles.heatBad : styles.heatGood;
                                return (
                                  <td key={y} className={[sign, baseCell ? styles.heatBase : ""].join(" ")}>
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
                  <p className={styles.foot}>
                    {minRot !== undefined && beMinRot !== null ? (
                      <>
                        Si la mercancía rota lento —{times(minRot)} al año— hace falta inmovilizar más inventario y el umbral de ventas queda en <strong>{pct(beMinRot)}</strong>.{tight ? " El pronóstico tendría que acertar casi exacto para que la ampliación valga la pena." : ""}
                      </>
                    ) : (
                      "Cada celda es el VPN del proyecto para esa combinación de aumento de ventas y rotación del inventario, con los demás supuestos en su valor base."
                    )}
                  </p>
                </>
              );
            }}
          </QueryState>
        </section>
      </div>
    </div>
  );
};

/** Párrafo de lectura de la comparación, armado con los valores reales de cada escenario. */
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
