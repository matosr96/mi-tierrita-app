import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useAmortization } from "@/hooks/financial";
import type { AmortizationRow, ScenarioDetail } from "@/types/api";
import { EmptyState, QueryState, Tabs, type TabOption } from "@/components/ui";
import { int, money, moneyCompact, pct } from "@/lib/format";
import { InterestCapitalChart } from "./InterestCapitalChart";
import styles from "./CashFlowPanel.module.css";

type Props = { scenario: ScenarioDetail };

type FlowRow = { key: string; label: string; strong?: boolean; cells: (number | null)[] };
type YearRow = { year: number; months: number; installment: number; interest: number; principal: number; balance: number };
type AmortView = "resumen" | "todos" | "anio";
type Series = "flow" | "investor";

const PREVIEW_MONTHS = 6;

const SERIES_LABEL: Record<Series, string> = { flow: "Flujo neto del proyecto", investor: "Flujo del inversionista" };

/** Celda del flujo: sin "$" como en el lienzo, negativos en rojo, cero o ausente "—". */
const flowCell = (v: number | null, strong = false): ReactNode => {
  if (v === null || v === 0) return <span className={styles.muted}>—</span>;
  const text = v < 0 ? `−${int(Math.abs(v))}` : int(v);
  return <span className={v < 0 ? styles.bad : undefined}>{strong ? <strong>{text}</strong> : text}</span>;
};

/** Cifra con signo tipográfico en millones (los positivos llevan "+"). */
const signedCompact = (v: number): string => (v > 0 ? `+${moneyCompact(v)}` : moneyCompact(v));

/** Proporción para el ancho o alto de una barra (solo presentación; ninguna cifra sale de aquí). */
const share = (v: number, max: number): number => (max > 0 ? Math.min(Math.abs(v) / max, 1) : 0);

/** Pestaña "Flujo y amortización": línea de tiempo del flujo, Tabla 5 y la tabla del crédito mes a mes. */
export const CashFlowPanel = ({ scenario }: Props) => {
  const { results, indicators: ind } = scenario;
  const amortization = useAmortization(scenario.id);
  const [view, setView] = useState<AmortView>("resumen");
  const [series, setSeries] = useState<Series>("investor");
  const [activeYear, setActiveYear] = useState(1);

  const yearsCount = Math.max(results.flows.length, results.investorFlows.length, results.debtService.length, results.detail.length);
  const yearIdx = Array.from({ length: yearsCount }, (_, i) => i);
  const byYear = new Map(results.detail.map((d) => [d.year, d]));
  const negated = (v: number | null | undefined): number | null => (v === null || v === undefined ? null : -v);

  const flowRows: FlowRow[] = [
    { key: "fixed", label: "Inversión en obra y dotación", cells: yearIdx.map((y) => (y === 0 ? negated(results.fixedInvestment) : null)) },
    { key: "wc", label: "Inversión en capital de trabajo", cells: yearIdx.map((y) => byYear.get(y)?.workingCapitalDelta ?? null) },
    { key: "margin", label: "Margen bruto adicional", cells: yearIdx.map((y) => byYear.get(y)?.margin ?? null) },
    { key: "expenses", label: "Gastos fijos adicionales", cells: yearIdx.map((y) => byYear.get(y)?.expenses ?? null) },
    { key: "salvage", label: "Valor de salvamento", cells: yearIdx.map((y) => byYear.get(y)?.salvage ?? null) },
    { key: "wcRecovery", label: "Recuperación del capital de trabajo", cells: yearIdx.map((y) => byYear.get(y)?.workingCapitalRecovery ?? null) },
    { key: "flow", label: "Flujo neto del proyecto", strong: true, cells: yearIdx.map((y) => results.flows[y] ?? null) },
    { key: "debt", label: "Cuotas del crédito", cells: yearIdx.map((y) => results.debtService[y] ?? null) },
    { key: "investor", label: "Flujo del inversionista", strong: true, cells: yearIdx.map((y) => results.investorFlows[y] ?? null) },
  ];

  const negativeYears = results.investorFlows.slice(1).filter((v) => v < 0).length;
  const horizon = yearsCount - 1;
  const flowReading =
    negativeYears > 0
      ? `Los ${negativeYears === 1 ? "primer año" : `${int(negativeYears)} primeros años`} el flujo del inversionista es negativo: la ampliación no alcanza a cubrir su propia cuota y el negocio pone la diferencia. ${negativeYears < horizon ? `A partir del año ${int(negativeYears + 1)} se invierte, y ` : ""}el año ${int(horizon)} concentra el salvamento y la recuperación del inventario.`
      : `Desde el primer año la ampliación cubre su propia cuota. El año ${int(horizon)} concentra el salvamento y la recuperación del inventario.`;

  const yearly = useMemo<YearRow[]>(() => {
    const rows = amortization.data?.rows ?? [];
    const map = new Map<number, YearRow>();
    for (const r of rows) {
      const y = Math.ceil(r.month / 12);
      const g = map.get(y) ?? { year: y, months: 0, installment: 0, interest: 0, principal: 0, balance: r.balance };
      g.months += 1;
      g.installment += r.installment;
      g.interest += r.interest;
      g.principal += r.principal;
      g.balance = r.balance;
      map.set(y, g);
    }
    return [...map.values()].sort((a, b) => a.year - b.year);
  }, [amortization.data]);

  const annualDebt = results.debtService.find((v) => v !== 0);

  // Línea de tiempo: los valores de la API escalados al mayor de la serie (solo para dibujar).
  const values = series === "flow" ? results.flows : results.investorFlows;
  const maxAbs = Math.max(...values.map((v) => Math.abs(v)), 0);
  const year = Math.min(activeYear, Math.max(yearsCount - 1, 0));
  const part = (r: FlowRow) => ({ key: r.key, label: r.label, value: r.cells[year] ?? null });
  const parts = flowRows.filter((r) => !r.strong && r.key !== "debt").map(part);
  const debtRow = flowRows.find((r) => r.key === "debt");
  // Las cuotas llegan en positivo; en el desglose se muestran como salida (cambio de signo solo de presentación).
  const debtPart = debtRow ? part(debtRow) : null;
  const debt = series === "investor" && debtPart ? { ...debtPart, value: negated(debtPart.value) } : null;
  const partsMax = Math.max(...[...parts, ...(debt ? [debt] : [])].map((p) => Math.abs(p.value ?? 0)), 0);
  const partItem = (p: { key: string; label: string; value: number | null }) => (
    <li key={p.key} className={p.value === null || p.value === 0 ? styles.bdEmpty : ""}>
      <span className={styles.bdName}>{p.label}</span>
      <span className={styles.bdBar} aria-hidden="true">
        {p.value ? <i className={p.value < 0 ? styles.bdBarNeg : styles.bdBarPos} style={{ "--w": share(p.value, partsMax) } as CSSProperties} /> : null}
      </span>
      <span className={[styles.bdNum, p.value !== null && p.value < 0 ? styles.bad : ""].join(" ")}>{p.value ? signedCompact(p.value) : "—"}</span>
    </li>
  );

  return (
    <div className={styles.panel}>
      <section className={styles.hero}>
        <div className={styles.heroHead}>
          <div>
            <span className={styles.eyebrow}>Línea de tiempo · {scenario.name}</span>
            <h2 className={styles.heroTitle}>Año por año, qué entra y qué sale</h2>
          </div>
          <div className={styles.toggle} role="group" aria-label="Serie de la línea de tiempo">
            {(["investor", "flow"] as const).map((k) => (
              <button key={k} type="button" aria-pressed={series === k} className={[styles.toggleBtn, series === k ? styles.toggleOn : ""].join(" ")} onClick={() => setSeries(k)}>
                {k === "investor" ? "Inversionista" : "Proyecto"}
              </button>
            ))}
          </div>
        </div>

        {yearsCount === 0 ? (
          <EmptyState title="Sin flujos" text="La API no devolvió flujos para este escenario." />
        ) : (
          <div className={styles.heroBody}>
            <div className={styles.timeline} role="group" aria-label={`${SERIES_LABEL[series]} por año`} key={series}>
              {yearIdx.map((y) => {
                const v = values[y] ?? 0;
                const on = y === year;
                return (
                  <button
                    key={y}
                    type="button"
                    className={[styles.col, on ? styles.colOn : "", v < 0 ? styles.colNeg : ""].join(" ")}
                    style={{ "--h": share(v, maxAbs) } as CSSProperties}
                    aria-pressed={on}
                    aria-label={`Año ${y}: ${money(v)}`}
                    onMouseEnter={() => setActiveYear(y)}
                    onFocus={() => setActiveYear(y)}
                    onClick={() => setActiveYear(y)}
                  >
                    <span className={styles.colVal}>{v === 0 ? "—" : signedCompact(v)}</span>
                    <span className={styles.colPos}>{v > 0 ? <i /> : null}</span>
                    <span className={styles.colNegArea}>{v < 0 ? <i /> : null}</span>
                    <span className={styles.colYear}>Año {y}</span>
                  </button>
                );
              })}
            </div>

            <div className={styles.breakdown} aria-live="polite">
              <div className={styles.bdHead}>
                <span className={styles.bdYear}>Año {year}</span>
                <span className={styles.bdLabel}>{SERIES_LABEL[series]}</span>
                <span className={[styles.bdValue, (values[year] ?? 0) < 0 ? styles.bad : ""].join(" ")}>{money(values[year] ?? 0)}</span>
              </div>
              <ul className={styles.bdList}>
                {parts.map(partItem)}
                {debt ? (
                  <>
                    <li className={styles.bdTotal}>
                      <span className={styles.bdName}>Flujo neto del proyecto</span>
                      <span />
                      <span className={[styles.bdNum, (results.flows[year] ?? 0) < 0 ? styles.bad : ""].join(" ")}>{signedCompact(results.flows[year] ?? 0)}</span>
                    </li>
                    {partItem(debt)}
                  </>
                ) : null}
              </ul>
            </div>
          </div>
        )}
        <p className={styles.heroFoot}>
          {flowReading} El flujo del proyecto no depende de cómo se financie; el del inversionista descuenta las cuotas del crédito.
        </p>
      </section>

      {yearsCount > 0 ? (
        <section className={styles.block}>
          <header className={styles.blockHead}>
            <span className={styles.eyebrow}>Tabla 5</span>
            <h2 className={styles.blockTitle}>Flujo de caja incremental del proyecto</h2>
            <p className={styles.blockSub}>{scenario.name} · solo lo que agrega la ampliación · pesos colombianos</p>
          </header>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Concepto</th>
                  {yearIdx.map((y) => (
                    <th key={y} className={y === year ? styles.colActive : undefined}>
                      Año {y}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {flowRows.map((r) => (
                  <tr key={r.key} className={r.strong ? styles.band : undefined}>
                    <th scope="row">{r.strong ? <strong>{r.label}</strong> : r.label}</th>
                    {yearIdx.map((y) => (
                      <td key={y} className={y === year ? styles.colActive : undefined}>
                        {flowCell(r.cells[y] ?? null, r.strong)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <QueryState query={amortization} isEmpty={(d) => d.rows.length === 0} empty={<EmptyState title="Sin tabla de amortización" text="El escenario no tiene crédito o la API no devolvió cuotas." />}>
        {(data) => {
          const n = data.rows.length;
          const preview = n > PREVIEW_MONTHS + 1 ? data.rows.slice(0, PREVIEW_MONTHS) : data.rows;
          const last = n > PREVIEW_MONTHS + 1 ? data.rows[n - 1] : undefined;
          const viewOptions: TabOption<AmortView>[] = [
            { value: "resumen", label: "Primeros meses" },
            { value: "todos", label: `Los ${int(n)} meses` },
            { value: "anio", label: "Resumen por año" },
          ];
          return (
            <>
              <section className={styles.strip} aria-label="Condiciones del crédito">
                <h2 className={styles.stripTitle}>Crédito</h2>
                <dl className={styles.stripList}>
                  <div>
                    <dt>Monto</dt>
                    <dd>{money(data.credit)}</dd>
                  </div>
                  <div>
                    <dt>Tasa</dt>
                    <dd>{pct(scenario.assumptions.creditRateEA)} EA</dd>
                  </div>
                  <div>
                    <dt>Plazo</dt>
                    <dd>{int(data.termMonths)} cuotas</dd>
                  </div>
                  <div>
                    <dt>Intereses totales</dt>
                    <dd>{money(data.totalInterest)}</dd>
                  </div>
                  <div className={styles.stripStar}>
                    <dt>Cuota fija</dt>
                    <dd>{moneyCompact(data.installment)}</dd>
                  </div>
                </dl>
              </section>

              <div className={styles.amortGrid}>
                <section className={styles.block}>
                  <header className={styles.blockHeadRow}>
                    <div className={styles.blockHeadCol}>
                      <h2 className={styles.blockTitle}>Tabla de amortización</h2>
                      <p className={styles.blockSub}>Sistema francés · cuota fija de {money(data.installment)}</p>
                    </div>
                    <Tabs options={viewOptions} value={view} onChange={setView} />
                  </header>
                  <div className={styles.legend}>
                    <span>
                      <i className={styles.swInterest} />
                      Interés
                    </span>
                    <span>
                      <i className={styles.swCapital} />
                      Capital
                    </span>
                    <span>
                      <i className={styles.swPaid} />
                      Capital ya pagado
                    </span>
                  </div>
                  <div className={styles.scroller}>
                    {view === "anio" ? (
                      <table className={[styles.table, styles.amort].join(" ")}>
                        <thead>
                          <tr>
                            <th>Año</th>
                            <th>Meses</th>
                            <th>Cuotas pagadas</th>
                            <th>Interés</th>
                            <th>Abono a capital</th>
                            <th>Saldo al cierre</th>
                          </tr>
                        </thead>
                        <tbody>
                          {yearly.map((g) => (
                            <tr key={g.year}>
                              <th scope="row">Año {g.year}</th>
                              <td>{int(g.months)}</td>
                              <td>{int(g.installment)}</td>
                              <td>{int(g.interest)}</td>
                              <td>{int(g.principal)}</td>
                              <td>
                                <Balance balance={g.balance} credit={data.credit} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <table className={[styles.table, styles.amort].join(" ")}>
                        <thead>
                          <tr>
                            <th>Mes</th>
                            <th>Cuota</th>
                            <th>Interés</th>
                            <th>Abono a capital</th>
                            <th>Composición</th>
                            <th>Saldo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(view === "todos" ? data.rows : preview).map((r) => (
                            <MonthRow key={r.month} row={r} credit={data.credit} />
                          ))}
                          {view === "resumen" && last ? (
                            <>
                              <tr className={styles.gap}>
                                <td colSpan={6}>
                                  <button type="button" className={styles.gapBtn} onClick={() => setView("todos")}>
                                    Meses {int(PREVIEW_MONTHS + 1)} a {int(n - 1)} · ver todos
                                  </button>
                                </td>
                              </tr>
                              <MonthRow row={last} credit={data.credit} />
                            </>
                          ) : null}
                        </tbody>
                      </table>
                    )}
                  </div>
                  <p className={styles.foot}>
                    Cuota fija de {money(data.installment)} durante los {int(data.termMonths)} meses. Intereses totales: {money(data.totalInterest)}.{view === "anio" ? " El resumen por año es la suma de la tabla." : ""}
                  </p>
                </section>

                <section className={styles.block}>
                  <header className={styles.blockHead}>
                    <h2 className={styles.blockTitle}>A qué se va cada cuota</h2>
                    <p className={styles.blockSub}>
                      Millones de pesos pagados cada año (suma de la tabla).{annualDebt !== undefined ? ` El total anual es el mismo: ${moneyCompact(Math.abs(annualDebt))}.` : ""}
                    </p>
                  </header>
                  <div className={styles.chartBox}>
                    <InterestCapitalChart years={yearly} format={moneyCompact} caption={`Intereses totales del crédito: ${money(ind.totalInterest)}`} />
                  </div>
                </section>
              </div>
            </>
          );
        }}
      </QueryState>
    </div>
  );
};

/** Saldo con la barra del capital ya pagado (proporción de los valores de la API, solo para dibujar). */
const Balance = ({ balance, credit }: { balance: number; credit: number }) => (
  <span className={styles.balance}>
    <span className={styles.paid} aria-hidden="true">
      <i style={{ "--w": credit > 0 ? 1 - share(balance, credit) : 0 } as CSSProperties} />
    </span>
    {int(balance)}
  </span>
);

const MonthRow = ({ row, credit }: { row: AmortizationRow; credit: number }) => (
  <tr>
    <th scope="row">{int(row.month)}</th>
    <td>{int(row.installment)}</td>
    <td>{int(row.interest)}</td>
    <td>{int(row.principal)}</td>
    <td>
      <span className={styles.split} aria-hidden="true" style={{ "--w": share(row.interest, row.installment) } as CSSProperties}>
        <i />
      </span>
    </td>
    <td>
      <Balance balance={row.balance} credit={credit} />
    </td>
  </tr>
);
