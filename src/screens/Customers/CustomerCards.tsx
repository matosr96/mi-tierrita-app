import { money } from "@/lib/format";
import type { Customer, ReceivableRow } from "@/types/api";
import { Monogram } from "./Monogram";
import { CustomerStatusBadge } from "./CustomerStatusBadge";
import { customerStatusOf } from "./customerStatus";
import styles from "./CustomerCards.module.css";

type Props = {
  customers: Customer[];
  /** Filas del reporte de cartera (solo ADMIN); undefined para SALES o mientras carga. */
  receivables: Map<number, ReceivableRow> | undefined;
  onOpen: (id: number) => void;
  onPay: (customer: Customer) => void;
};

/** Clientes en tarjetas: iniciales, nombre, saldo, cupo y estado; la tarjeta abre la ficha y «Abonar» queda encima. */
export const CustomerCards = ({ customers, receivables, onOpen, onPay }: Props) => (
  <ul className={styles.grid}>
    {customers.map((c) => {
      const status = customerStatusOf(c, receivables?.get(c.id));
      const canPay = c.active && c.balance > 0;
      return (
        <li key={c.id} className={[styles.tile, c.active ? "" : styles.inactive].join(" ")}>
          <button type="button" className={styles.hit} onClick={() => onOpen(c.id)} aria-label={`Ver la cartera de ${c.name}`} />
          <div className={styles.head}>
            <Monogram name={c.name} muted={!c.active} />
            <div className={styles.identity}>
              <span className={styles.name}>{c.name}</span>
              <span className={styles.doc}>{c.documentId}</span>
            </div>
          </div>
          <dl className={styles.figures}>
            <div>
              <dt>Saldo</dt>
              <dd>{money(c.balance)}</dd>
            </div>
            <div>
              <dt>Cupo</dt>
              <dd>{c.creditLimit > 0 ? money(c.creditLimit) : "Solo contado"}</dd>
            </div>
          </dl>
          <div className={styles.foot}>
            <CustomerStatusBadge id={c.id} status={status} />
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
