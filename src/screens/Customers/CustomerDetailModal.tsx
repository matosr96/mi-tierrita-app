import { useEffect, useState, type FormEvent } from "react";
import { useCustomerBalance, useRegisterPayment } from "@/hooks/customers";
import { Badge, Button, Callout, Card, Field, Input, Modal, QueryState } from "@/components/ui";
import { fieldErrors } from "@/lib/errors";
import { dateTime, int, money } from "@/lib/format";
import type { Customer } from "@/types/api";
import styles from "./CustomersScreen.module.css";

type Props = { customer: Customer | null; onClose: () => void; onEdit: (customer: Customer) => void };

const balanceClass = (balance: number, creditLimit: number) => (balance > 0 && balance > 0.8 * creditLimit ? styles.balanceBad : balance > 0 ? styles.balanceWarn : styles.balanceGood);

/** Estado de cartera de un cliente (RF-04.4) y registro de abonos (CU-12). */
export const CustomerDetailModal = ({ customer, onClose, onEdit }: Props) => {
  const id = customer?.id ?? null;
  const balance = useCustomerBalance(id);
  const payment = useRegisterPayment();
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState<string | undefined>(undefined);

  useEffect(() => {
    setAmount("");
    setAmountError(undefined);
    payment.reset();
  }, [id]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (id === null) return;
    const value = Number(amount);
    if (amount.trim() === "" || !Number.isFinite(value) || value <= 0) {
      setAmountError("Ingrese un monto mayor que cero.");
      return;
    }
    setAmountError(undefined);
    await payment.mutateAsync({ id, amount: value }).then(
      () => setAmount(""),
      () => undefined,
    );
  };

  const serverError = payment.error ? (fieldErrors(payment.error).amount ?? payment.error.message) : undefined;
  const hasBalance = (balance.data?.balance ?? 0) > 0;

  return (
    <Modal
      open={customer !== null}
      title={customer?.name ?? "Cliente"}
      description={customer ? `Documento ${customer.documentId}${customer.phone ? ` · Tel. ${customer.phone}` : ""}` : undefined}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          {customer ? (
            <Button onClick={() => onEdit(customer)}>Editar</Button>
          ) : null}
        </>
      }
    >
      {customer ? (
        <div className={styles.section}>
          <div className={styles.overdueRow}>
            <Badge tone={customer.active ? "good" : "neutral"}>{customer.active ? "Activo" : "Inactivo"}</Badge>
            {balance.data?.overdue ? <Badge tone="bad">Cartera vencida · {int(balance.data.overdueDays)} días sin abonar</Badge> : null}
          </div>

          <QueryState query={balance} empty={null}>
            {(b) => (
              <>
                <div className={styles.balanceBox}>
                  <div className={styles.balanceItem}>
                    <span className={styles.balanceLabel}>Saldo</span>
                    <span className={[styles.balanceValue, balanceClass(b.balance, b.creditLimit)].join(" ")}>{money(b.balance)}</span>
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

          <Card title="Registrar abono" subtitle={hasBalance ? "El saldo baja con cada abono." : "El cliente no tiene saldo pendiente."}>
            <form className={styles.paymentForm} onSubmit={submit} noValidate>
              <Field label="Monto" htmlFor="payment-amount" error={amountError ?? serverError} hint="No puede superar el saldo actual.">
                <Input
                  id="payment-amount"
                  type="number"
                  min={1}
                  step={1000}
                  inputMode="numeric"
                  placeholder="0"
                  value={amount}
                  disabled={!hasBalance || !customer.active}
                  invalid={amountError !== undefined || serverError !== undefined}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setAmountError(undefined);
                    if (payment.error) payment.reset();
                  }}
                />
              </Field>
              <Button type="submit" loading={payment.isPending} disabled={!hasBalance || !customer.active}>
                Registrar abono
              </Button>
            </form>
            {payment.data ? (
              <div className={styles.paymentResult}>
                <Callout tone="good">
                  Abono de {money(payment.data.amount)} registrado el {dateTime(payment.data.createdAt)}. Saldo después del abono: <strong>{money(payment.data.balanceAfter)}</strong>.
                </Callout>
              </div>
            ) : null}
          </Card>
        </div>
      ) : null}
    </Modal>
  );
};
