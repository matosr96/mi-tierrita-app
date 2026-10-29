import { Badge } from "@/components/ui";
import { int, money } from "@/lib/format";
import type { Order } from "@/types/api";
import { OrderDue } from "./OrderDue";
import { dueTone, statusLabel, statusTone } from "./orderLabels";
import styles from "./OrderList.module.css";

type Props = { orders: Order[]; onOpen: (order: Order) => void };

const toneClass = (order: Order): string => {
  const tone = dueTone(order);
  return (tone === "bad" ? styles.overdue : tone === "warn" ? styles.soon : "") ?? "";
};

/** Pedidos en lista compacta: contraparte, fecha con aviso, líneas, total de la API y estado. Toda la fila abre el detalle. */
export const OrderList = ({ orders, onOpen }: Props) => (
  <ul className={styles.list}>
    {orders.map((o) => (
      <li key={o.id} className={[styles.row, toneClass(o)].join(" ")}>
        <button type="button" className={styles.rowButton} onClick={() => onOpen(o)} aria-label={`Abrir el pedido #${o.id} de ${o.counterpartName}`}>
          <span className={styles.who}>
            <span className={styles.name}>
              <span className={styles.code}>#{o.id}</span> {o.counterpartName}
            </span>
            <span className={styles.meta}>
              <OrderDue order={o} />
              <span>
                {int(o.lineCount)} {o.lineCount === 1 ? "producto" : "productos"}
              </span>
              {o.note ? <span className={styles.note}>{o.note}</span> : null}
            </span>
          </span>
          <span className={styles.side}>
            <span className={styles.total}>{money(o.total)}</span>
            <Badge tone={statusTone(o.status)}>{statusLabel(o.status)}</Badge>
          </span>
        </button>
      </li>
    ))}
  </ul>
);
