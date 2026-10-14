import { Odometer, TopoField } from "@/components/motion";
import { QueryState } from "@/components/ui";
import { VBarChart } from "@/components/charts";
import { dateOnly, int, money, moneyCompact } from "@/lib/format";
import type { SalesReport, SalesReportDayRow } from "@/types/api";
import styles from "./PeriodLedger.module.css";

type Query = { data: SalesReport | undefined; isPending: boolean; isError: boolean; error: unknown; refetch: () => unknown };

const shortDay = (iso: string): string => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
/** Más barras que esto no caben con su valor encima: se dejan solo las etiquetas flotantes. */
const MAX_LABELED_BARS = 8;
const MAX_BARS = 21;

/**
 * Cierre del período: banda siempre oscura con la cifra estrella (total vendido) y el gráfico de ventas por día.
 * Todas las cifras salen tal cual del reporte de ventas de la API (sin ventas anuladas).
 */
export const PeriodLedger = ({ report, from, to }: { report: Query; from: string; to: string }) => {
  const singleDay = from === to;
  return (
    <div role="region" className={styles.band} aria-labelledby="ledger-title">
      <TopoField className={styles.topo} rings={10} signal={6} seed={2.3} />
      <div className={styles.glow} aria-hidden="true" />

      <header className={styles.head}>
        <span id="ledger-title" className={styles.label}>
          {singleDay ? "Cierre del día" : "Cierre del período"}
        </span>
        <span className={styles.range}>{singleDay ? dateOnly(from) : `${dateOnly(from)} – ${dateOnly(to)}`}</span>
      </header>

      <QueryState query={report} empty={null}>
        {(r) => {
          const rows = (r.rows as SalesReportDayRow[]).slice(-MAX_BARS);
          return (
            <>
              <div className={styles.hero}>
                <span className={styles.heroLabel}>Total vendido</span>
                <strong className={styles.heroValue}>
                  <Odometer value={moneyCompact(r.total)} />
                </strong>
                <span className={styles.heroHint}>
                  {int(r.salesCount)} {r.salesCount === 1 ? "ticket" : "tickets"} · {int(r.units)} {r.units === 1 ? "unidad" : "unidades"} · {money(r.total)}
                </span>
              </div>

              <dl className={styles.split}>
                <div className={styles.cell}>
                  <dt>De contado</dt>
                  <dd>{moneyCompact(r.cashTotal)}</dd>
                </div>
                <div className={[styles.cell, r.creditTotal > 0 ? styles.cellWarn : ""].join(" ")}>
                  <dt>A crédito</dt>
                  <dd>{moneyCompact(r.creditTotal)}</dd>
                  {r.creditTotal > 0 ? <span className={styles.cellHint}>suma a la cartera</span> : null}
                </div>
                <div className={styles.cell}>
                  <dt>Unidades</dt>
                  <dd>{int(r.units)}</dd>
                </div>
              </dl>

              <div className={styles.chart}>
                <div className={styles.chartHead}>
                  <span className={styles.label}>Ventas por día</span>
                  <span className={styles.chartHint}>pesos vendidos · sin anuladas</span>
                </div>
                {rows.length === 0 ? (
                  <p className={styles.chartEmpty}>Cuando haya ventas registradas verá aquí el valor vendido por día.</p>
                ) : (
                  <VBarChart
                    title="Ventas por día"
                    data={rows.map((row) => ({ label: shortDay(row.date), value: row.total }))}
                    format={rows.length <= MAX_LABELED_BARS ? moneyCompact : () => ""}
                    formatTip={moneyCompact}
                  />
                )}
                {r.rows.length > MAX_BARS ? <p className={styles.chartNote}>Se muestran los últimos {int(MAX_BARS)} días con ventas del rango.</p> : null}
              </div>
            </>
          );
        }}
      </QueryState>
    </div>
  );
};
