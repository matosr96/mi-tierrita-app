import { Badge } from "@/components/ui";
import { dateOnly } from "@/lib/format";
import type { Order } from "@/types/api";
import { dueText, dueTone } from "./orderLabels";
import styles from "./OrderList.module.css";

/** Fecha comprometida con su aviso: vencido en rojo, a dos días o menos en ámbar (según la API). */
export const OrderDue = ({ order }: { order: Order }) => {
  const tone = dueTone(order);
  const text = dueText(order);
  return (
    <span className={styles.due}>
      <span className={styles.dueDate}>{dateOnly(order.dueDate)}</span>
      {tone && text ? <Badge tone={tone}>{text}</Badge> : null}
    </span>
  );
};
