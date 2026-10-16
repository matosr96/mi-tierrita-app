import { Button, EmptyState, Pagination, QueryState } from "@/components/ui";
import { money } from "@/lib/format";
import type { Page, Sale } from "@/types/api";
import styles from "./SaleTimeline.module.css";

type Query = {
  data: Page<Sale> | undefined;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
};
type Props = {
  query: Query;
  singleDay: boolean;
  onOpen: (id: number) => void;
  onPage: (page: number) => void;
  onPeriod: (days: number) => void;
};
type DayGroup = { key: string; date: Date; sales: Sale[] };

const PAYMENT_LABELS = { CASH: "Contado", CREDIT: "Crédito" } as const;

const pad = (n: number): string => String(n).padStart(2, "0");
const dayKey = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hourOf = (d: Date): string =>
  d.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
const dayTitle = (d: Date): string =>
  d.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/** Agrupa para mostrar (sin sumar nada): la página llega ordenada de la más reciente a la más antigua. */
const groupByDay = (sales: Sale[]): DayGroup[] => {
  const groups: DayGroup[] = [];
  for (const sale of sales) {
    const date = new Date(sale.createdAt);
    const key = dayKey(date);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.sales.push(sale);
    else groups.push({ key, date, sales: [sale] });
  }
  return groups;
};

const relativeTag = (key: string): string | null => {
  const now = new Date();
  if (key === dayKey(now)) return "Hoy";
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return key === dayKey(yesterday) ? "Ayer" : null;
};

/** Fila de venta: hora, factura y cliente, forma de pago y el total que devolvió la API. */
const SaleTicket = ({ sale, onOpen }: { sale: Sale; onOpen: (id: number) => void }) => {
  const voided = sale.status === "VOIDED";
  const credit = sale.paymentType === "CREDIT";
  return (
    <li className={styles.item}>
      <button
        type="button"
        className={[styles.ticket, voided ? styles.voided : ""].join(" ")}
        onClick={() => onOpen(sale.id)}
        aria-label={`Factura ${sale.invoiceNumber}, ${sale.customerName ?? "consumidor final"}, ${money(sale.total)}${voided ? ", anulada" : ""}. Ver detalle`}
      >
        <span className={styles.time}>{hourOf(new Date(sale.createdAt))}</span>
        <span className={styles.body}>
          <span className={styles.invoice}>{sale.invoiceNumber}</span>
          <span className={styles.customer}>{sale.customerName ?? "Consumidor final"}</span>
          <span className={styles.by}>Registró {sale.username}</span>
        </span>
        <span className={[styles.pay, credit ? styles.payCredit : styles.payCash].join(" ")}>{PAYMENT_LABELS[sale.paymentType]}</span>
        <span className={styles.amount}>
          <strong>{money(sale.total)}</strong>
          <span className={voided ? styles.stateVoid : styles.stateOk}>{voided ? "Anulada" : "Completada"}</span>
        </span>
        <span className={styles.chevron} aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7h8M7.5 3.5 11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
    </li>
  );
};

/** Historial agrupado por día: encabezado por fecha y una fila por venta. */
export const SaleTimeline = ({ query, singleDay, onOpen, onPage, onPeriod }: Props) => (
  <div role="region" className={styles.wrap} aria-labelledby="sales-timeline-title">
    <header className={styles.head}>
      <h2 id="sales-timeline-title" className={styles.title}>
        Movimientos {singleDay ? "del día" : "del período"}
      </h2>
      <p className={styles.lead}>Cada venta queda asociada al usuario que la registró. Toque una venta para ver su detalle.</p>
    </header>

    <QueryState
      query={query}
      isEmpty={(p) => p.items.length === 0}
      empty={
        <EmptyState
          title={singleDay ? "Sin ventas en el día" : "Sin ventas en el período"}
          text="Amplíe el rango de fechas o quite los filtros para ver más registros."
          action={
            <div className={styles.emptyActions}>
              <Button variant="secondary" size="sm" onClick={() => onPeriod(30)}>
                Ver los últimos 30 días
              </Button>
              <Button variant="secondary" size="sm" onClick={() => onPeriod(365)}>
                Ver el último año
              </Button>
            </div>
          }
        />
      }
    >
      {(p) => (
        <>
          <div className={styles.days}>
            {groupByDay(p.items).map((g) => {
              const tag = relativeTag(g.key);
              return (
                <div key={g.key} className={styles.day}>
                  <h3 className={styles.dayHead}>
                    <span className={styles.dayName}>{dayTitle(g.date)}</span>
                    {tag ? <span className={styles.dayTag}>{tag}</span> : null}
                  </h3>
                  <ol className={styles.list}>
                    {g.sales.map((s) => (
                      <SaleTicket key={s.id} sale={s} onOpen={onOpen} />
                    ))}
                  </ol>
                </div>
              );
            })}
          </div>
          <div className={styles.pager}>
              <Pagination page={p} onPage={onPage} />
            </div>
        </>
      )}
    </QueryState>
  </div>
);
