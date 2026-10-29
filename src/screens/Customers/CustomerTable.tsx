import { DataTable, type Column } from "@/components/ui";
import { money } from "@/lib/format";
import type { Customer, ReceivableRow } from "@/types/api";
import { CustomerStatusBadge } from "./CustomerStatusBadge";
import { customerStatusOf } from "./customerStatus";
import styles from "./CustomerTable.module.css";

type Props = {
  customers: Customer[];
  /** Filas del reporte de cartera (solo ADMIN); undefined para SALES o mientras carga. */
  receivables: Map<number, ReceivableRow> | undefined;
  onOpen: (id: number) => void;
  onPay: (customer: Customer) => void;
};

/** Clientes en tabla: nombre, documento, cupo, saldo y estado; la fila abre la ficha. */
export const CustomerTable = ({ customers, receivables, onOpen, onPay }: Props) => {
  const columns: Column<Customer>[] = [
    { key: "name", header: "Cliente", render: (c) => <span className={[styles.name, c.active ? "" : styles.inactive].join(" ")}>{c.name}</span> },
    { key: "doc", header: "Documento", align: "left", render: (c) => <span className={styles.code}>{c.documentId}</span> },
    { key: "limit", header: "Cupo", align: "right", render: (c) => money(c.creditLimit) },
    { key: "balance", header: "Saldo", align: "right", render: (c) => money(c.balance) },
    { key: "status", header: "Estado", align: "left", render: (c) => <CustomerStatusBadge id={c.id} status={customerStatusOf(c, receivables?.get(c.id))} /> },
    {
      key: "actions",
      header: <span className="sr-only">Acciones</span>,
      align: "right",
      render: (c) =>
        c.active && c.balance > 0 ? (
          <button
            type="button"
            className={styles.pay}
            onClick={(e) => {
              e.stopPropagation();
              onPay(c);
            }}
            aria-label={`Abonar a ${c.name}`}
          >
            Abonar
          </button>
        ) : null,
    },
  ];

  return (
    <div className={styles.frame}>
      <DataTable columns={columns} rows={customers} rowKey={(c) => c.id} onRowClick={(c) => onOpen(c.id)} />
    </div>
  );
};
