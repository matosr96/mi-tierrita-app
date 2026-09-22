import { useMemo, useState, type ReactNode } from "react";
import { useAmortization } from "@/hooks/financial";
import type { AmortizationRow, ScenarioDetail } from "@/types/api";
import { Button, EmptyState, QueryState } from "@/components/ui";
import { int, money, moneyCompact, pct } from "@/lib/format";
import { InterestCapitalChart } from "./InterestCapitalChart";
import styles from "./FinanceScreen.module.css";

type Props = { scenario: ScenarioDetail };

type FlowRow = { key: string; label: string; strong?: boolean; cells: (number | null)[] };
type YearRow = { year: number; months: number; installment: number; interest: number; principal: number; balance: number };
type AmortView = "resumen" | "todos" | "anio";

const PREVIEW_MONTHS = 6;

/** Celda del flujo: sin "$" como en el lienzo, negativos en rojo, cero o ausente "—". */
const flowCell = (v: number | null, strong = false): ReactNode => {
  if (v === null || v === 0) return <span className={styles.textMuted}>—</span>;
  const text = v < 0 ? `−${int(Math.abs(v))}` : int(v);
  const node = <span className={v < 0 ? styles.textBad : undefined}>{strong ? <strong>{text}</strong> : text}</span>;
  return node;
};

/** Pestaña "Flujo y amortización": Tabla 5 (flujo incremental por año) y la tabla del crédito mes a mes. */
export const CashFlowPanel = ({ scenario }: Props) => {
  const { results, indicators: ind } = scenario;
  const amortization = useAmortization(scenario.id);
  const [view, setView] = useState<AmortView>("resumen");

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

  return (
    <div className={styles.stack}>
      <section className={styles.card}>
        <div className={styles.cardHead}>
          <h2>Flujo de caja incremental del proyecto</h2>
          <span className={styles.cardSub}>{scenario.name} · solo lo que agrega la ampliación · pesos colombianos</span>
        </div>
        {yearsCount === 0 ? (
          <EmptyState title="Sin flujos" text="La API no devolvió flujos para este escenario." />
        ) : (
          <div className={styles.tableWrap}>
            <table className={[styles.table, styles.tableTight].join(" ")}>
              <thead>
                <tr>
                  <th>Concepto</th>
                  {yearIdx.map((y) => (
                    <th key={y}>Año {y}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {flowRows.map((r) => (
                  <tr key={r.key} className={r.strong ? styles.band : undefined}>
                    <td>{r.strong ? <strong>{r.label}</strong> : r.label}</td>
                    {yearIdx.map((y) => (
                      <td key={y}>{flowCell(r.cells[y] ?? null, r.strong)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className={styles.cardFoot}>{flowReading} El flujo del proyecto no depende de cómo se financie; el del inversionista descuenta las cuotas del crédito.</div>
      </section>

      <QueryState query={amortization} isEmpty={(d) => d.rows.length === 0} empty={<EmptyState title="Sin tabla de amortización" text="El escenario no tiene crédito o la API no devolvió cuotas." />}>
        {(data) => {
          const n = data.rows.length;
          const preview = n > PREVIEW_MONTHS + 1 ? data.rows.slice(0, PREVIEW_MONTHS) : data.rows;
          const last = n > PREVIEW_MONTHS + 1 ? data.rows[n - 1] : undefined;
          return (
            <div className={styles.amortGrid}>
              <section className={styles.card}>
                <div className={styles.cardHead}>
                  <h2>Tabla de amortización</h2>
                  <span className={styles.cardSub}>
                    {money(data.credit)} · {pct(scenario.assumptions.creditRateEA)} EA · {int(data.termMonths)} cuotas fijas
                  </span>
                </div>
                <div className={styles.tableWrap}>
                  {view === "anio" ? (
                    <table className={[styles.table, styles.tableTight].join(" ")}>
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
                            <td>Año {g.year}</td>
                            <td>{int(g.months)}</td>
                            <td>{int(g.installment)}</td>
                            <td>{int(g.interest)}</td>
                            <td>{int(g.principal)}</td>
                            <td>{int(g.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <table className={[styles.table, styles.tableTight].join(" ")}>
                      <thead>
                        <tr>
                          <th>Mes</th>
                          <th>Cuota</th>
                          <th>Interés</th>
                          <th>Abono a capital</th>
                          <th>Saldo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(view === "todos" ? data.rows : preview).map((r) => (
                          <MonthRow key={r.month} row={r} />
                        ))}
                        {view === "resumen" && last ? (
                          <>
                            <tr>
                              <td colSpan={5} className={styles.ellipsis}>
                                meses {int(PREVIEW_MONTHS + 1)} a {int(n - 1)}
                              </td>
                            </tr>
                            <MonthRow row={last} />
                          </>
                        ) : null}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className={styles.btnRow}>
                  {view === "resumen" ? (
                    <Button variant="secondary" size="sm" onClick={() => setView("todos")}>
                      Ver los {int(n)} meses
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => setView("resumen")}>
                      Ver solo los primeros meses
                    </Button>
                  )}
                  {view === "anio" ? (
                    <Button variant="secondary" size="sm" onClick={() => setView("resumen")}>
                      Mes a mes
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => setView("anio")}>
                      Resumen por año
                    </Button>
                  )}
                  {view === "anio" ? <span className={styles.noteSmall}>suma de la tabla</span> : null}
                </div>
                <div className={styles.cardFootMuted}>
                  Cuota fija de {money(data.installment)} durante los {int(data.termMonths)} meses. Intereses totales: {money(data.totalInterest)}.
                </div>
              </section>

              <section className={styles.card}>
                <div className={styles.cardHead}>
                  <h2>A qué se va cada cuota</h2>
                  <div className={[styles.legend, styles.pushRight].join(" ")}>
                    <span>
                      <i className={[styles.swatch, styles.swatchAccent].join(" ")} />
                      Interés
                    </span>
                    <span>
                      <i className={[styles.swatch, styles.swatchGood].join(" ")} />
                      Capital
                    </span>
                  </div>
                </div>
                <div className={styles.cardSubBlock}>
                  Millones de pesos pagados cada año (suma de la tabla).{annualDebt !== undefined ? ` El total anual es el mismo: ${moneyCompact(Math.abs(annualDebt))}.` : ""}
                </div>
                <InterestCapitalChart years={yearly} format={moneyCompact} caption={`Intereses totales del crédito: ${money(ind.totalInterest)}`} />
              </section>
            </div>
          );
        }}
      </QueryState>
    </div>
  );
};

const MonthRow = ({ row }: { row: AmortizationRow }) => (
  <tr>
    <td>{int(row.month)}</td>
    <td>{int(row.installment)}</td>
    <td>{int(row.interest)}</td>
    <td>{int(row.principal)}</td>
    <td>{int(row.balance)}</td>
  </tr>
);
