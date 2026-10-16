import { Link } from "react-router-dom";
import { Card, EmptyState, QueryState } from "@/components/ui";
import { useSales } from "@/hooks/sales";
import { initials, money } from "@/lib/format";
import { whenShort } from "./homeDates";
import styles from "./HomeScreen.module.css";

/** Tonos de los avatares de la actividad (se reparten por cliente para distinguirlos de un vistazo). */
const TONES = [styles.avA, styles.avB, styles.avC, styles.avD];

/** Actividad reciente (como la lista "Activity" de la referencia): últimas ventas con cliente, forma de pago y total. */
export const ActivityCard = ({ userId, title = "Actividad", subtitle = "Últimas ventas registradas" }: { userId?: number; title?: string; subtitle?: string }) => {
  const recent = useSales({ limit: 5, ...(userId ? { userId } : {}) });
  return (
    <Card
      title={title}
      subtitle={subtitle}
      actions={
        <Link to="/ventas/historial" className={styles.cardLink}>
          Ver todo
        </Link>
      }
    >
      <QueryState query={recent} isEmpty={(p) => p.items.length === 0} empty={<EmptyState title="Aún no hay ventas" />}>
        {(page) => (
          <ul className={styles.activity}>
            {page.items.map((s, i) => {
              const name = s.customerName ?? "Consumidor final";
              const [first = "", last = ""] = name.split(" ");
              return (
                <li key={s.id} className={styles.activityRow}>
                  <span className={[styles.av, TONES[(s.customerId ?? i) % TONES.length]].join(" ")} aria-hidden="true">
                    {initials(first, last || first.slice(1))}
                  </span>
                  <span className={styles.activityText}>
                    <strong>{name}</strong>
                    <small>
                      {s.paymentType === "CASH" ? "Contado" : "Crédito"} · {whenShort(s.createdAt)} · {s.invoiceNumber}
                    </small>
                  </span>
                  <span className={[styles.activityAmount, s.status === "VOIDED" ? styles.amountVoid : s.paymentType === "CREDIT" ? styles.amountCredit : ""].join(" ")}>
                    {s.status === "VOIDED" ? "Anulada" : `+${money(s.total)}`}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </QueryState>
    </Card>
  );
};
