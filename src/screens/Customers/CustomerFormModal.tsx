import { useState, type FormEvent } from "react";
import { useCreateCustomer, useUpdateCustomer } from "@/hooks/customers";
import { Button, Callout, Checkbox, Field, FieldRow, Input, Modal } from "@/components/ui";
import { fieldErrors } from "@/lib/errors";
import type { Customer } from "@/types/api";
import styles from "./CustomersScreen.module.css";

type Props = { customer: Customer | null; onClose: () => void };

/** Alta y edición de cliente. El padre lo monta solo mientras está abierto, así el formulario arranca limpio. */
export const CustomerFormModal = ({ customer, onClose }: Props) => {
  const editing = customer !== null;
  const [name, setName] = useState(customer?.name ?? "");
  const [documentId, setDocumentId] = useState(customer?.documentId ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [creditLimit, setCreditLimit] = useState(customer ? String(customer.creditLimit) : "0");
  const [active, setActive] = useState(customer?.active ?? true);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  const create = useCreateCustomer();
  const update = useUpdateCustomer();
  const mutation = editing ? update : create;
  const serverErrors = mutation.error ? fieldErrors(mutation.error) : {};
  const errors = { ...serverErrors, ...clientErrors };
  const generalError = mutation.error && mutation.error.code !== "400" ? mutation.error.message : mutation.error && Object.keys(serverErrors).length === 0 ? mutation.error.message : null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const limit = Number(creditLimit);
    if (!name.trim()) next.name = "El nombre es obligatorio.";
    if (!documentId.trim()) next.documentId = "El documento es obligatorio.";
    if (creditLimit.trim() === "" || !Number.isFinite(limit) || limit < 0) next.creditLimit = "Ingrese un cupo válido (0 o más).";
    setClientErrors(next);
    if (Object.keys(next).length > 0) return;

    const done = () => onClose();
    const ignore = () => undefined;
    if (customer) {
      await update.mutateAsync({ id: customer.id, name: name.trim(), documentId: documentId.trim(), phone: phone.trim() || null, creditLimit: limit, active }).then(done, ignore);
    } else {
      await create.mutateAsync({ name: name.trim(), documentId: documentId.trim(), creditLimit: limit, ...(phone.trim() ? { phone: phone.trim() } : {}) }).then(done, ignore);
    }
  };

  return (
    <Modal
      open
      title={editing ? "Editar cliente" : "Nuevo cliente"}
      description={editing ? `Documento ${customer.documentId}` : "El cupo de crédito define cuánto puede deber el cliente."}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="customer-form" loading={mutation.isPending}>
            {editing ? "Guardar cambios" : "Crear cliente"}
          </Button>
        </>
      }
    >
      <form id="customer-form" className={styles.form} onSubmit={submit} noValidate>
        <Field label="Nombre" htmlFor="customer-name" error={errors.name}>
          <Input id="customer-name" value={name} onChange={(e) => setName(e.target.value)} invalid={errors.name !== undefined} autoFocus required />
        </Field>
        <FieldRow>
          <Field label="Documento" htmlFor="customer-document" error={errors.documentId} hint="Cédula o NIT, sin puntos.">
            <Input id="customer-document" value={documentId} onChange={(e) => setDocumentId(e.target.value)} invalid={errors.documentId !== undefined} required />
          </Field>
          <Field label="Teléfono" htmlFor="customer-phone" error={errors.phone}>
            <Input id="customer-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} invalid={errors.phone !== undefined} />
          </Field>
        </FieldRow>
        <Field label="Cupo de crédito" htmlFor="customer-credit" error={errors.creditLimit} hint="En pesos. Con 0 el cliente solo compra de contado.">
          <Input id="customer-credit" type="number" min={0} step={1000} inputMode="numeric" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} invalid={errors.creditLimit !== undefined} />
        </Field>
        {editing ? <Checkbox label="Cliente activo" checked={active} onChange={(e) => setActive(e.target.checked)} /> : null}
        {generalError ? <Callout tone="bad">{generalError}</Callout> : null}
      </form>
    </Modal>
  );
};
