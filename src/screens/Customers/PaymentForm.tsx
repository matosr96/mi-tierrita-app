import { useState, type FormEvent } from "react";
import { useCustomerBalance, useRegisterPayment } from "@/hooks/customers";
import { Button, Callout, Field, Input, Loading, ErrorState } from "@/components/ui";
import { fieldErrors } from "@/lib/errors";
import { dateTime, money } from "@/lib/format";
import styles from "./CustomersScreen.module.css";

type Props = { customerId: number; active: boolean; showBalance?: boolean };

/** Registro de abonos (CU-12): el saldo baja con cada abono y el servidor rechaza montos mayores al saldo (623). Se monta con key por cliente. */
export const PaymentForm = ({ customerId, active, showBalance = false }: Props) => {
  const balance = useCustomerBalance(customerId);
  const payment = useRegisterPayment();
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState<string | undefined>(undefined);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (amount.trim() === "" || !Number.isFinite(value) || value <= 0) {
      setAmountError("Ingrese un monto mayor que cero.");
      return;
    }
    setAmountError(undefined);
    await payment.mutateAsync({ id: customerId, amount: value }).then(
      () => setAmount(""),
      () => undefined,
    );
  };

  const serverError = payment.error ? (fieldErrors(payment.error).amount ?? payment.error.message) : undefined;
  const hasBalance = (balance.data?.balance ?? 0) > 0;
  const disabled = !hasBalance || !active;

  return (
    <div className={styles.section}>
      {showBalance ? (
        balance.isPending ? (
          <Loading inline text="Consultando saldo…" />
        ) : balance.isError ? (
          <ErrorState error={balance.error} onRetry={() => balance.refetch()} />
        ) : (
          <div className={styles.paymentBox}>
            <span>Saldo actual</span>
            <strong>{money(balance.data.balance)}</strong>
          </div>
        )
      ) : null}

      <form className={styles.paymentForm} onSubmit={submit} noValidate>
        <Field label="Monto del abono" htmlFor={`payment-amount-${customerId}`} error={amountError ?? serverError} hint={!active ? "El cliente está inactivo." : hasBalance ? "No puede superar el saldo actual." : "El cliente no tiene saldo pendiente."}>
          <Input
            id={`payment-amount-${customerId}`}
            type="number"
            min={1}
            step={1000}
            inputMode="numeric"
            placeholder="0"
            value={amount}
            disabled={disabled}
            invalid={amountError !== undefined || serverError !== undefined}
            onChange={(e) => {
              setAmount(e.target.value);
              setAmountError(undefined);
              if (payment.error) payment.reset();
            }}
          />
        </Field>
        <Button type="submit" loading={payment.isPending} disabled={disabled}>
          Registrar abono
        </Button>
      </form>

      {payment.data ? (
        <Callout tone="good">
          Abono de {money(payment.data.amount)} registrado el {dateTime(payment.data.createdAt)}. Saldo después del abono: <strong>{money(payment.data.balanceAfter)}</strong>.
        </Callout>
      ) : null}
    </div>
  );
};
