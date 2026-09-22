import { useState, type FormEvent } from "react";
import { useCreateSupplier, useUpdateSupplier } from "@/hooks/suppliers";
import { fieldErrors } from "@/lib/errors";
import { Button, Callout, Checkbox, Field, FieldRow, Input, Modal } from "@/components/ui";
import type { Supplier } from "@/types/api";
import styles from "./SuppliersScreen.module.css";

type Props = { supplier: Supplier | null; onClose: () => void };

/** Alta y edición de proveedor. Se monta solo mientras está abierto, así el estado arranca limpio. */
export const SupplierFormModal = ({ supplier, onClose }: Props) => {
  const editing = supplier !== null;
  const [name, setName] = useState(supplier?.name ?? "");
  const [taxId, setTaxId] = useState(supplier?.taxId ?? "");
  const [phone, setPhone] = useState(supplier?.phone ?? "");
  const [active, setActive] = useState(supplier?.active ?? true);
  const [nameError, setNameError] = useState<string | undefined>();

  const create = useCreateSupplier();
  const update = useUpdateSupplier();
  const pending = create.isPending || update.isPending;
  const error = editing ? update.error : create.error;
  const errs = error ? fieldErrors(error) : {};
  const general = error && Object.keys(errs).length === 0 ? error.message : undefined;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("El nombre es obligatorio.");
      return;
    }
    setNameError(undefined);
    const trimmedTaxId = taxId.trim();
    const trimmedPhone = phone.trim();
    try {
      if (supplier) {
        await update.mutateAsync({ id: supplier.id, name: trimmedName, taxId: trimmedTaxId || null, phone: trimmedPhone || null, active });
      } else {
        await create.mutateAsync({ name: trimmedName, ...(trimmedTaxId ? { taxId: trimmedTaxId } : {}), ...(trimmedPhone ? { phone: trimmedPhone } : {}) });
      }
      onClose();
    } catch {
      /* el error queda en la mutación y se pinta en el formulario */
    }
  };

  return (
    <Modal
      open
      title={editing ? "Editar proveedor" : "Nuevo proveedor"}
      description={editing ? supplier.name : "Solo el nombre es obligatorio; el NIT y el teléfono pueden completarse después."}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" form="supplier-form" loading={pending}>
            {editing ? "Guardar cambios" : "Crear proveedor"}
          </Button>
        </>
      }
    >
      <form id="supplier-form" className={styles.form} onSubmit={submit} noValidate>
        {general ? <Callout tone="bad">{general}</Callout> : null}
        <Field label="Nombre" htmlFor="supplier-name" error={nameError ?? errs.name}>
          <Input id="supplier-name" value={name} onChange={(e) => setName(e.target.value)} invalid={Boolean(nameError ?? errs.name)} autoFocus maxLength={120} />
        </Field>
        <FieldRow>
          <Field label="NIT" htmlFor="supplier-taxid" hint="Opcional" error={errs.taxId}>
            <Input id="supplier-taxid" value={taxId} onChange={(e) => setTaxId(e.target.value)} invalid={Boolean(errs.taxId)} maxLength={30} />
          </Field>
          <Field label="Teléfono" htmlFor="supplier-phone" hint="Opcional" error={errs.phone}>
            <Input id="supplier-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} invalid={Boolean(errs.phone)} maxLength={30} />
          </Field>
        </FieldRow>
        {editing ? (
          <Field label="Estado" error={errs.active}>
            <Checkbox label="Proveedor activo (disponible para registrar compras)" checked={active} onChange={(e) => setActive(e.target.checked)} />
          </Field>
        ) : null}
      </form>
    </Modal>
  );
};
