import { useState, type CSSProperties } from "react";
import { useCustomers } from "@/hooks/customers";
import { useReceivablesReport } from "@/hooks/reports";
import { Odometer, TopoField } from "@/components/motion";
import { Button } from "@/components/ui";
import { int, money, moneyCompact } from "@/lib/format";
import type { ReceivableRow } from "@/types/api";
import styles from "./CarteraAside.module.css";

/** Barras de "mayores saldos" que caben en la tarjeta. */
const BARS = 28;

/** Tarjeta oscura de cartera (ADMIN, CU-20): cifras de GET /reports/receivables tal como llegan y los mayores saldos. */
export const AdminCartera = ({ onOpen }: { onOpen: (customerId: number) => void }) => {
  const report = useReceivablesReport();
  const active = useCustomers({ active: true, limit: 1 });
  const [hover, setHover] = useState<ReceivableRow | null>(null);
  const r = report.data;

  const top = r ? [...r.items].filter((row) => row.balance > 0).sort((a, b) => b.balance - a.balance).slice(0, BARS) : [];
  // Escala solo visual: el mayor saldo llena la barra.
  const max = top[0]?.balance ?? 0;
  // Proporción solo visual de la franja: cartera vencida frente a la total, ambas de la API.
  const overdueShare = r && r.totalBalance > 0 ? Math.min(1, r.overdueBalance / r.totalBalance) : 0;

  return (
    <aside className={styles.aside} aria-labelledby="cartera-title">
      <TopoField className={styles.topo} rings={11} signal={6} seed={2.3} />
      <div className={styles.label}>Cartera{r ? ` · corte a ${int(r.overdueDays)} días` : ""}</div>
      <h2 id="cartera-title" className={styles.title}>
        Lo que <em>nos deben</em>
      </h2>

      {report.isError ? (
        <div className={styles.error}>
          <p>No se pudo cargar el reporte de cartera.</p>
          <Button variant="secondary" size="sm" onClick={() => report.refetch()}>
            Reintentar
          </Button>
        </div>
      ) : (
        <>
          <div className={styles.hero} aria-live="polite">
            {r ? <Odometer value={moneyCompact(r.totalBalance)} /> : <span className={styles.heroPending}>$ ··</span>}
          </div>
          <p className={styles.heroHint}>{r ? `${int(r.customersWithBalance)} ${r.customersWithBalance === 1 ? "cliente" : "clientes"} con crédito` : "Consultando la cartera…"}</p>

          <div className={styles.split} aria-hidden="true">
            <span className={styles.splitOverdue} style={{ "--share": overdueShare } as CSSProperties} />
          </div>
          <dl className={styles.figures}>
            <div className={r && r.overdueBalance > 0 ? styles.figureBad : ""}>
              <dt>Vencida</dt>
              <dd>{r ? moneyCompact(r.overdueBalance) : "—"}</dd>
            </div>
            <div className={r && r.overdueCustomers > 0 ? styles.figureBad : ""}>
              <dt>Clientes vencidos</dt>
              <dd>{r ? int(r.overdueCustomers) : "—"}</dd>
            </div>
            <div>
              <dt>Activos</dt>
              <dd>{active.data ? int(active.data.count) : "—"}</dd>
            </div>
          </dl>

          <div className={styles.barsHead}>
            <span>Mayores saldos</span>
            <span className={styles.barsLegend}>
              <i className={styles.dotBad} aria-hidden="true" /> vencida
            </span>
          </div>
          {r && top.length === 0 ? (
            <p className={styles.barsEmpty}>Nadie debe hoy: la cartera está en cero.</p>
          ) : (
            <div className={styles.bars} role="list" aria-label="Clientes con mayor saldo" onPointerLeave={() => setHover(null)}>
              {top.map((row, i) => (
                <button
                  key={row.customerId}
                  type="button"
                  role="listitem"
                  className={[styles.bar, row.overdue ? styles.barBad : ""].join(" ")}
                  style={{ "--h": max > 0 ? row.balance / max : 0, "--i": i } as CSSProperties}
                  aria-label={`${row.name}: saldo ${money(row.balance)}${row.overdue ? ", cartera vencida" : ""}`}
                  onPointerEnter={() => setHover(row)}
                  onFocus={() => setHover(row)}
                  onBlur={() => setHover(null)}
                  onClick={() => onOpen(row.customerId)}
                />
              ))}
            </div>
          )}
          {top.length > 0 ? (
            <p className={styles.caption} aria-hidden="true">
              {hover ? (
                <>
                  <strong>{hover.name}</strong> · {money(hover.balance)}
                  {hover.overdue ? <span className={styles.captionBad}> · vencida</span> : null}
                </>
              ) : (
                "Pase el cursor por una barra; un clic abre la cartera del cliente."
              )}
            </p>
          ) : null}
        </>
      )}

      <p className={styles.note}>Vender no es cobrar. Si la empresa asume la cuota del crédito bancario, la liquidez para pagarla depende de que esta cartera se mantenga sana.</p>
    </aside>
  );
};
