import { useState, type FormEvent } from "react";
import { useCreatePayrollPeriod } from "@/hooks/payroll";
import { fieldErrors } from "@/lib/errors";
import { Button, Callout, Field, FieldRow, Input, Modal, Select } from "@/components/ui";
import type { PayFrequency } from "@/types/api";
import { FREQUENCY_LABELS } from "./payrollLabels";
import styles from "./PayrollScreen.module.css";

type Props = { onClose: () => void; onCreated: (periodId: number) => void };

/** Nuevo periodo: la API crea el borrador con una línea por empleado activo de esa frecuencia. */
export const PeriodFormModal = ({ onClose, onCreated }: Props) => {
  const [frequency, setFrequency] = useState<PayFrequency>("BIWEEKLY");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [payDate, setPayDate] = useState("");
  const [local, setLocal] = useState<Record<string, string>>({});
  const create = useCreatePayrollPeriod();
  const errs = { ...(create.error ? fieldErrors(create.error) : {}), ...local };
  const general = create.error && Object.keys(fieldErrors(create.error)).length === 0 ? create.error.message : undefined;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!periodStart) next.periodStart = "Elija la fecha de inicio.";
    if (!periodEnd) next.periodEnd = "Elija la fecha de fin.";
    else if (periodStart && periodEnd < periodStart) next.periodEnd = "Debe ser igual o posterior al inicio.";
    if (!payDate) next.payDate = "Elija la fecha de pago.";
    setLocal(next);
    if (Object.keys(next).length > 0) return;
    try {
      const period = await create.mutateAsync({ frequency, periodStart, periodEnd, payDate });
      onCreated(period.id);
    } catch {
      /* el error queda en la mutación y se pinta en el formulario */
    }
  };

  return (
    <Modal
      open
      title="Nuevo periodo de nómina"
      description="Se crea en borrador con todos los empleados activos de la frecuencia elegida. Luego puede escribir horas extra, bonificaciones, auxilio y descuentos."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="payroll-period-form" loading={create.isPending}>
            Crear periodo
          </Button>
        </>
      }
    >
      <form id="payroll-period-form" className={styles.form} onSubmit={submit} noValidate>
        {general ? <Callout tone="bad">{general}</Callout> : null}
        <Field label="Frecuencia" htmlFor="period-frequency" hint="Quincenal liquida la mitad del salario mensual" error={errs.frequency}>
          <Select id="period-frequency" value={frequency} onChange={(e) => setFrequency(e.target.value as PayFrequency)}>
            {(Object.keys(FREQUENCY_LABELS) as PayFrequency[]).map((f) => (
              <option key={f} value={f}>
                {FREQUENCY_LABELS[f]}
              </option>
            ))}
          </Select>
        </Field>
        <FieldRow>
          <Field label="Inicio del periodo" htmlFor="period-start" error={errs.periodStart}>
            <Input id="period-start" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} invalid={Boolean(errs.periodStart)} />
          </Field>
          <Field label="Fin del periodo" htmlFor="period-end" error={errs.periodEnd}>
            <Input id="period-end" type="date" value={periodEnd} min={periodStart || undefined} onChange={(e) => setPeriodEnd(e.target.value)} invalid={Boolean(errs.periodEnd)} />
          </Field>
        </FieldRow>
        <Field label="Fecha de pago" htmlFor="period-paydate" hint="Aparece en el calendario y en los avisos hasta que se marque pagado" error={errs.payDate}>
          <Input id="period-paydate" type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} invalid={Boolean(errs.payDate)} />
        </Field>
      </form>
    </Modal>
  );
};
