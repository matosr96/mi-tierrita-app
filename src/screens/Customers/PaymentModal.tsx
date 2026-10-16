import { useState } from "react";
import { useCustomers } from "@/hooks/customers";
import { Button, ErrorState, Field, Loading, Modal, Select } from "@/components/ui";
import { money } from "@/lib/format";
import type { Customer } from "@/types/api";
import { PaymentForm } from "./PaymentForm";
import styles from "./CustomersScreen.module.css";

/** Con `customer` (botón «Abonar» de una fila) el cliente queda fijo; sin él se elige en el formulario. */
type Props = { open: boolean; customer?: Customer | null; onClose: () => void; initialAmount?: number; aiSuggested?: boolean };

/** Botón "Registrar abono" del encabezado: elige un cliente con saldo y registra el abono sin salir del listado. */
export const PaymentModal = ({ open, customer = null, onClose, initialAmount, aiSuggested }: Props) => {
  const [customerId, setCustomerId] = useState<number | null>(null);
  const customers = useCustomers({ withBalance: true, active: true, limit: 100 });
  const selected = customers.data?.items.find((c) => c.id === customerId) ?? null;

  const close = () => {
    setCustomerId(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Registrar abono"
      description={customer ? `Cliente: ${customer.name} · documento ${customer.documentId}` : "Solo aparecen los clientes activos con saldo pendiente."}
      onClose={close}
      footer={
        <Button variant="secondary" onClick={close}>
          Cerrar
        </Button>
      }
    >
      {customer ? (
        <>
          {aiSuggested ? <p className={styles.aiNote}>Monto preparado por Tita. Revíselo antes de registrar el abono.</p> : null}
          <PaymentForm key={customer.id} customerId={customer.id} active={customer.active} showBalance initialAmount={initialAmount} aiSuggested={aiSuggested} />
        </>
      ) : (
        <div className={styles.section}>
          <Field label="Cliente" htmlFor="payment-customer">
            {customers.isPending ? (
              <Loading inline text="Cargando clientes…" />
            ) : customers.isError ? (
              <ErrorState error={customers.error} onRetry={() => customers.refetch()} />
            ) : (
              <Select id="payment-customer" value={customerId ?? ""} onChange={(e) => setCustomerId(e.target.value === "" ? null : Number(e.target.value))} autoFocus>
                <option value="">{customers.data.items.length === 0 ? "Ningún cliente tiene saldo pendiente" : "Seleccione un cliente"}</option>
                {customers.data.items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · saldo {money(c.balance)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          {selected ? <PaymentForm key={selected.id} customerId={selected.id} active={selected.active} showBalance /> : null}
        </div>
      )}
    </Modal>
  );
};
