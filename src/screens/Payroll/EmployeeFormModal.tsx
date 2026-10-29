import { useState, type FormEvent } from "react";
import { useCreatePayrollEmployee, useUpdatePayrollEmployee } from "@/hooks/payroll";
import { useUsers } from "@/hooks/users";
import { fieldErrors } from "@/lib/errors";
import { Button, Callout, Checkbox, Field, FieldRow, Input, Modal, Select } from "@/components/ui";
import type { PayFrequency, PayrollEmployee } from "@/types/api";
import { FREQUENCY_LABELS } from "./payrollLabels";
import styles from "./PayrollScreen.module.css";

type Props = { employee: PayrollEmployee | null; onClose: () => void };

/** Alta y edición de un empleado de nómina. Se monta solo mientras está abierto. */
export const EmployeeFormModal = ({ employee, onClose }: Props) => {
  const editing = employee !== null;
  const [firstName, setFirstName] = useState(employee?.firstName ?? "");
  const [lastName, setLastName] = useState(employee?.lastName ?? "");
  const [documentId, setDocumentId] = useState(employee?.documentId ?? "");
  const [position, setPosition] = useState(employee?.position ?? "");
  const [salary, setSalary] = useState(employee ? String(employee.baseSalary) : "");
  const [frequency, setFrequency] = useState<PayFrequency>(employee?.payFrequency ?? "BIWEEKLY");
  const [userId, setUserId] = useState(employee?.userId ? String(employee.userId) : "");
  const [active, setActive] = useState(employee?.active ?? true);
  const [local, setLocal] = useState<Record<string, string>>({});

  const users = useUsers({ limit: 100 });
  const create = useCreatePayrollEmployee();
  const update = useUpdatePayrollEmployee();
  const pending = create.isPending || update.isPending;
  const error = editing ? update.error : create.error;
  const errs = { ...(error ? fieldErrors(error) : {}), ...local };
  const general = error && Object.keys(fieldErrors(error)).length === 0 ? error.message : undefined;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = "Escriba el nombre.";
    if (!lastName.trim()) next.lastName = "Escriba el apellido.";
    if (!documentId.trim()) next.documentId = "Escriba el documento.";
    if (!position.trim()) next.position = "Escriba el cargo.";
    const baseSalary = Number(salary);
    if (!salary.trim() || !Number.isFinite(baseSalary) || baseSalary <= 0) next.baseSalary = "Escriba el salario mensual en pesos.";
    setLocal(next);
    if (Object.keys(next).length > 0) return;
    const input = { firstName: firstName.trim(), lastName: lastName.trim(), documentId: documentId.trim(), position: position.trim(), baseSalary, payFrequency: frequency };
    try {
      if (employee) await update.mutateAsync({ id: employee.id, ...input, active, userId: userId ? Number(userId) : null });
      else await create.mutateAsync({ ...input, ...(userId ? { userId: Number(userId) } : {}) });
      onClose();
    } catch {
      /* el error queda en la mutación y se pinta en el formulario */
    }
  };

  return (
    <Modal
      open
      title={editing ? "Editar empleado" : "Nuevo empleado"}
      description={editing ? `${employee.firstName} ${employee.lastName}` : "El salario es el mensual pactado; en pago quincenal la API liquida la mitad por periodo."}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" form="payroll-employee-form" loading={pending}>
            {editing ? "Guardar cambios" : "Crear empleado"}
          </Button>
        </>
      }
    >
      <form id="payroll-employee-form" className={styles.form} onSubmit={submit} noValidate>
        {general ? <Callout tone="bad">{general}</Callout> : null}
        <FieldRow>
          <Field label="Nombre" htmlFor="emp-first" error={errs.firstName}>
            <Input id="emp-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} invalid={Boolean(errs.firstName)} maxLength={80} autoFocus />
          </Field>
          <Field label="Apellido" htmlFor="emp-last" error={errs.lastName}>
            <Input id="emp-last" value={lastName} onChange={(e) => setLastName(e.target.value)} invalid={Boolean(errs.lastName)} maxLength={80} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="Documento" htmlFor="emp-doc" hint="Cédula u otro documento; no se repite" error={errs.documentId}>
            <Input id="emp-doc" value={documentId} onChange={(e) => setDocumentId(e.target.value)} invalid={Boolean(errs.documentId)} maxLength={20} inputMode="numeric" />
          </Field>
          <Field label="Cargo" htmlFor="emp-position" error={errs.position}>
            <Input id="emp-position" value={position} onChange={(e) => setPosition(e.target.value)} invalid={Boolean(errs.position)} maxLength={80} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="Salario mensual (pesos)" htmlFor="emp-salary" hint="El pactado en el contrato" error={errs.baseSalary}>
            <Input id="emp-salary" type="number" min={1} step={1} inputMode="numeric" value={salary} onChange={(e) => setSalary(e.target.value)} invalid={Boolean(errs.baseSalary)} />
          </Field>
          <Field label="Frecuencia de pago" htmlFor="emp-frequency" error={errs.payFrequency}>
            <Select id="emp-frequency" value={frequency} onChange={(e) => setFrequency(e.target.value as PayFrequency)}>
              {(Object.keys(FREQUENCY_LABELS) as PayFrequency[]).map((f) => (
                <option key={f} value={f}>
                  {FREQUENCY_LABELS[f]}
                </option>
              ))}
            </Select>
          </Field>
        </FieldRow>
        <Field label="Cuenta en el sistema" htmlFor="emp-user" hint="Opcional: si la persona también usa Mi Tierrita" error={errs.userId}>
          <Select id="emp-user" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Sin cuenta</option>
            {(users.data?.items ?? []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName} ({u.username})
              </option>
            ))}
          </Select>
        </Field>
        {editing ? (
          <Field label="Estado" error={errs.active}>
            <Checkbox label="Empleado activo (entra en los periodos nuevos)" checked={active} onChange={(e) => setActive(e.target.checked)} />
          </Field>
        ) : null}
      </form>
    </Modal>
  );
};
