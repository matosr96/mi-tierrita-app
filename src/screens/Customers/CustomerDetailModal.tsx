import { useCustomer, useCustomerBalance } from "@/hooks/customers";
import { Badge, Button, Card, Modal, QueryState } from "@/components/ui";
import { dateTime, int, money } from "@/lib/format";
import type { Customer } from "@/types/api";
import { PaymentForm } from "./PaymentForm";
import styles from "./CustomersScreen.module.css";

type Props = { customerId: number | null; onClose: () => void; onEdit: (customer: Customer) => void };

const balanceClass = (balance: number, availableCredit: number) => (availableCredit < 0 ? styles.balanceBad : balance > 0 ? styles.balanceWarn : styles.balanceGood);

/** Estado de cartera de un cliente (RF-04.4) y registro de abonos (CU-12). */
export const CustomerDetailModal = ({ customerId, onClose, onEdit }: Props) => {
  const customer = useCustomer(customerId);
  const balance = useCustomerBalance(customerId);
  const c = customer.data;

  return (
    <Modal
      open={customerId !== null}
      title={c?.name ?? "Cliente"}
      description={c ? `Documento ${c.documentId}${c.phone ? ` · Tel. ${c.phone}` : ""}` : undefined}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          {c ? <Button onClick={() => onEdit(c)}>Editar</Button> : null}
        </>
      }
    >
      <QueryState query={customer} empty={null}>
        {(cust) => (
          <div className={styles.section}>
            <div className={styles.tagsRow}>
              <Badge tone={cust.active ? "good" : "neutral"}>{cust.active ? "Activo" : "Inactivo"}</Badge>
              {balance.data?.overdue ? <Badge tone="bad">Cartera vencida · {int(balance.data.overdueDays)} días sin abonar</Badge> : null}
              {cust.availableCredit < 0 ? <Badge tone="bad">Excedió cupo</Badge> : null}
            </div>

            <QueryState query={balance} empty={null}>
              {(b) => (
                <>
                  <div className={styles.balanceBox}>
                    <div className={styles.balanceItem}>
                      <span className={styles.balanceLabel}>Saldo</span>
                      <span className={[styles.balanceValue, balanceClass(b.balance, b.availableCredit)].join(" ")}>{money(b.balance)}</span>
                    </div>
                    <div className={styles.balanceItem}>
                      <span className={styles.balanceLabel}>Cupo autorizado</span>
                      <span className={styles.balanceValue}>{money(b.creditLimit)}</span>
                    </div>
                    <div className={styles.balanceItem}>
                      <span className={styles.balanceLabel}>Disponible</span>
                      <span className={styles.balanceValue}>{money(b.availableCredit)}</span>
                    </div>
                  </div>
                  <div className={styles.factGrid}>
                    <div className={styles.fact}>
                      <span className={styles.factLabel}>Última venta a crédito</span>
                      <span className={styles.factValue}>{dateTime(b.lastCreditSaleAt)}</span>
                    </div>
                    <div className={styles.fact}>
                      <span className={styles.factLabel}>Último abono</span>
                      <span className={styles.factValue}>{dateTime(b.lastPaymentAt)}</span>
                    </div>
                  </div>
                </>
              )}
            </QueryState>

            <Card title="Registrar abono" subtitle="El saldo baja con cada abono">
              <PaymentForm customerId={cust.id} active={cust.active} />
            </Card>
          </div>
        )}
      </QueryState>
    </Modal>
  );
};
