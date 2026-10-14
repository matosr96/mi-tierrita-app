import type { CSSProperties } from "react";
import { useCustomer, useCustomerBalance } from "@/hooks/customers";
import { Odometer, TopoField } from "@/components/motion";
import { Badge, Button, Loading, Modal, QueryState } from "@/components/ui";
import { dateOnly, dateTime, int, money } from "@/lib/format";
import type { Customer } from "@/types/api";
import { Monogram } from "./Monogram";
import { PaymentForm } from "./PaymentForm";
import styles from "./CustomerDetailModal.module.css";

type Props = { customerId: number | null; onClose: () => void; onEdit: (customer: Customer) => void };

const balanceTone = (balance: number, availableCredit: number) => (availableCredit < 0 ? styles.toneBad : balance > 0 ? styles.toneWarn : styles.toneGood);

/** Estado de cartera de un cliente (RF-04.4) y registro de abonos (CU-12): héroe oscuro con el saldo, ficha y abono. */
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
          <div className={styles.wrap}>
            <section className={styles.hero} aria-label="Saldo del cliente">
              <TopoField className={styles.topo} rings={10} signal={5} seed={cust.id * 0.77} />
              <div className={styles.heroTop}>
                <Monogram id={cust.id} name={cust.name} size="lg" muted={!cust.active} onDark />
                <div className={styles.heroWho}>
                  <span className={styles.label}>Estado de cartera</span>
                  <div className={styles.tags}>
                    <Badge tone={cust.active ? "good" : "neutral"}>{cust.active ? "Activo" : "Inactivo"}</Badge>
                    {balance.data?.overdue ? <Badge tone="bad">Cartera vencida · {int(balance.data.overdueDays)} días sin abonar</Badge> : null}
                    {cust.availableCredit < 0 ? <Badge tone="bad">Excedió cupo</Badge> : null}
                  </div>
                </div>
              </div>

              {balance.isPending ? (
                <Loading inline text="Consultando saldo…" />
              ) : balance.isError ? (
                <div className={styles.heroError}>
                  <span>No se pudo consultar el saldo.</span>
                  <Button variant="secondary" size="sm" onClick={() => balance.refetch()}>
                    Reintentar
                  </Button>
                </div>
              ) : (
                <>
                  <span className={styles.balanceLabel}>Saldo pendiente</span>
                  <div className={[styles.balance, balanceTone(balance.data.balance, balance.data.availableCredit)].join(" ")}>
                    <Odometer value={money(balance.data.balance)} />
                  </div>
                  {balance.data.creditLimit > 0 ? (
                    <div
                      className={styles.meter}
                      role="meter"
                      aria-valuemin={0}
                      aria-valuemax={Math.max(balance.data.creditLimit, balance.data.balance)}
                      aria-valuenow={balance.data.balance}
                      aria-label="Saldo frente al cupo autorizado"
                      // Proporción solo visual: saldo frente al cupo, ambos de la API.
                      style={{ "--fill": Math.min(1, Math.max(0, balance.data.balance / balance.data.creditLimit)) } as CSSProperties}
                    >
                      <span className={styles.meterFill} />
                    </div>
                  ) : (
                    <p className={styles.cashOnly}>Sin cupo de crédito: este cliente compra de contado.</p>
                  )}
                  <dl className={styles.pair}>
                    <div>
                      <dt>Cupo autorizado</dt>
                      <dd>{money(balance.data.creditLimit)}</dd>
                    </div>
                    <div>
                      <dt>Disponible</dt>
                      <dd className={balance.data.availableCredit < 0 ? styles.negative : ""}>{money(balance.data.availableCredit)}</dd>
                    </div>
                  </dl>
                </>
              )}
            </section>

            <dl className={styles.facts}>
              <div className={styles.fact}>
                <dt>Documento</dt>
                <dd className={styles.mono}>{cust.documentId}</dd>
              </div>
              <div className={styles.fact}>
                <dt>Teléfono</dt>
                <dd className={styles.mono}>{cust.phone ?? "—"}</dd>
              </div>
              <div className={styles.fact}>
                <dt>Cliente desde</dt>
                <dd>{dateOnly(cust.createdAt)}</dd>
              </div>
              <div className={styles.fact}>
                <dt>Última venta a crédito</dt>
                <dd>{balance.data ? dateTime(balance.data.lastCreditSaleAt) : "—"}</dd>
              </div>
              <div className={styles.fact}>
                <dt>Último abono</dt>
                <dd>{balance.data ? dateTime(balance.data.lastPaymentAt) : "—"}</dd>
              </div>
            </dl>

            <section className={styles.pay}>
              <header className={styles.payHead}>
                <span className={styles.payLabel}>Registrar abono</span>
                <span className={styles.payHint}>El saldo baja con cada abono</span>
              </header>
              <PaymentForm customerId={cust.id} active={cust.active} />
            </section>
          </div>
        )}
      </QueryState>
    </Modal>
  );
};
