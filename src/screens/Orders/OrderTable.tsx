import { Badge, DataTable, type Column } from "@/components/ui";
import { int, money } from "@/lib/format";
import type { Order, OrderKind } from "@/types/api";
import { OrderDue } from "./OrderDue";
import { COUNTERPART_LABEL, DUE_LABEL, statusLabel, statusTone } from "./orderLabels";
import styles from "./OrderTable.module.css";

type Props = { kind: OrderKind; orders: Order[]; onOpen: (order: Order) => void };

/** Pedidos en tabla (bajo 640 px se apila en tarjetas rotuladas). Tocar la fila abre el detalle. */
export const OrderTable = ({ kind, orders, onOpen }: Props) => {
  const columns: Column<Order>[] = [
    { key: "id", header: "N.º", render: (o) => <span className={styles.code}>#{o.id}</span>, width: "1%" },
    { key: "who", header: COUNTERPART_LABEL[kind], render: (o) => <span className={styles.name}>{o.counterpartName}</span> },
    { key: "due", header: DUE_LABEL[kind], render: (o) => <OrderDue order={o} /> },
    { key: "lines", header: "Productos", align: "right", render: (o) => int(o.lineCount) },
    { key: "total", header: "Total", align: "right", render: (o) => <span className={styles.money}>{money(o.total)}</span> },
    { key: "status", header: "Estado", render: (o) => <Badge tone={statusTone(o.status)}>{statusLabel(o.status)}</Badge> },
  ];
  return (
    <div className={styles.frame}>
      <DataTable columns={columns} rows={orders} rowKey={(o) => o.id} onRowClick={onOpen} />
    </div>
  );
};
