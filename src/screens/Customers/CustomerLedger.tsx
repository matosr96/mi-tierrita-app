import type { CSSProperties } from "react";
import { useCustomerBalance } from "@/hooks/customers";
import { Badge } from "@/components/ui";
import { dateOnly, int, money } from "@/lib/format";
import type { Customer, ReceivableRow } from "@/types/api";
import { Monogram } from "./Monogram";
import styles from "./CustomerLedger.module.css";

type Status = "inactive" | "overdue" | "over" | "balance" | "clear";

type Props = {
  customers: Customer[];
  /** Filas del reporte de cartera (solo ADMIN); undefined para SALES o mientras carga. */
  receivables: Map<number, ReceivableRow> | undefined;
  onOpen: (id: number) => void;
  onPay: (customer: Customer) => void;
};

/** Estado de la fila con la misma prioridad del lienzo: Inactivo, Vencida (reporte), Excedió cupo, Con saldo, Al día. */
const statusOf = (c: Customer, row: ReceivableRow | undefined): Status => {
  if (!c.active) return "inactive";
  if (row?.overdue) return "overdue";
  if (c.availableCredit < 0) return "over";
  if (c.balance > 0) return "balance";
  return "clear";
};

const LABEL: Record<Status, { text: string; tone: "neutral" | "good" | "warn" | "bad" }> = {
  inactive: { text: "Inactivo", tone: "neutral" },
  overdue: { text: "Vencida", tone: "bad" },
  over: { text: "Excedió cupo", tone: "bad" },
  balance: { text: "Con saldo", tone: "warn" },
  clear: { text: "Al día", tone: "good" },
};

/** Los días sin abonar los da GET /customers/:id/balance; solo se pide para las filas vencidas. */
const OverdueBadge = ({ id }: { id: number }) => {
  const balance = useCustomerBalance(id);
  return <Badge tone="bad">{balance.data ? `Vencida · ${int(balance.data.overdueDays)} días` : "Vencida"}</Badge>;
};

/** Lista de cartera: una fila por cliente con iniciales, medidor de cupo usado, disponible y abono rápido. */
export const CustomerLedger = ({ customers, receivables, onOpen, onPay }: Props) => (
  <ul className={styles.ledger}>
    {customers.map((c) => {
      const row = receivables?.get(c.id);
      const status = statusOf(c, row);
      // Proporción solo visual del medidor: saldo frente al cupo, ambos de la API.
      const fill = c.creditLimit > 0 ? Math.min(1, Math.max(0, c.balance / c.creditLimit)) : c.balance > 0 ? 1 : 0;
      const cashOnly = c.creditLimit === 0 && c.balance === 0;
      const canPay = c.active && c.balance > 0;
      return (
        <li key={c.id} data-row="" className={[styles.row, styles[status]].join(" ")} style={{ "--fill": fill } as CSSProperties}>
          <button type="button" className={styles.hit} onClick={() => onOpen(c.id)} aria-label={`Ver la cartera de ${c.name}`} />

          <div className={styles.who}>
            <Monogram name={c.name} muted={!c.active} />
            <div className={styles.identity}>
              <span className={styles.name}>{c.name}</span>
              <span className={styles.meta}>
                <span>
                  Doc. <span className={styles.code}>{c.documentId}</span>
                </span>
                {c.phone ? (
                  <span>
                    Tel. <span className={styles.code}>{c.phone}</span>
                  </span>
                ) : null}
              </span>
              {row ? <span className={styles.lastPay}>{row.lastPaymentAt ? `Último abono ${dateOnly(row.lastPaymentAt)}` : "Sin abonos registrados"}</span> : null}
            </div>
          </div>

          <div className={styles.credit}>
            {cashOnly ? (
              <span className={styles.cash}>Solo contado, sin cupo</span>
            ) : (
              <>
                <div className={styles.meterHead}>
                  <span>
                    Saldo <strong>{money(c.balance)}</strong>
                  </span>
                  <span>Cupo {money(c.creditLimit)}</span>
                </div>
                <div className={styles.meter} role="meter" aria-valuemin={0} aria-valuemax={Math.max(c.creditLimit, c.balance)} aria-valuenow={c.balance} aria-label={`Saldo de ${c.name} frente a su cupo`}>
                  <span className={styles.meterFill} />
                </div>
              </>
            )}
          </div>

          <div className={styles.available}>
            <span className={styles.availableLabel}>Disponible</span>
            <span className={[styles.availableValue, c.availableCredit < 0 ? styles.negative : ""].join(" ")}>{money(c.availableCredit)}</span>
          </div>

          <div className={styles.end}>
            {status === "overdue" ? <OverdueBadge id={c.id} /> : <Badge tone={LABEL[status].tone}>{LABEL[status].text}</Badge>}
            {canPay ? (
              <button type="button" className={styles.pay} onClick={() => onPay(c)} aria-label={`Abonar a ${c.name}`}>
                Abonar
              </button>
            ) : null}
          </div>
        </li>
      );
    })}
  </ul>
);
