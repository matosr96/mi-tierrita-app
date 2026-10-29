import { useState, type FormEvent } from "react";
import { Button, Callout, Field, FieldRow, Input, Modal, Select } from "@/components/ui";
import { useCreateAlarm, useUpdateAlarm } from "@/hooks/alarms";
import { fieldErrors } from "@/lib/errors";
import { todayIso } from "@/lib/format";
import type { Alarm, AlarmArea, AlarmInput, AlarmRepeat } from "@/types/api";
import { AREA_LABELS, REPEAT_LABELS, WEEKDAY_LABELS } from "./alarmLabels";
import styles from "./AlarmsScreen.module.css";

type Props = { alarm: Alarm | null; onClose: () => void };

const REPEATS = Object.keys(REPEAT_LABELS) as AlarmRepeat[];
const AREAS = Object.keys(AREA_LABELS) as AlarmArea[];

/** Alta y edición de una alarma. El padre lo monta solo mientras está abierto, así el formulario arranca limpio. */
export const AlarmFormModal = ({ alarm, onClose }: Props) => {
  const editing = alarm !== null;
  const [title, setTitle] = useState(alarm?.title ?? "");
  const [description, setDescription] = useState(alarm?.description ?? "");
  const [timeOfDay, setTimeOfDay] = useState(alarm?.timeOfDay ?? "07:30");
  const [repeat, setRepeat] = useState<AlarmRepeat>(alarm?.repeat ?? "DAILY");
  // Al pasar a «Cada semana» una alarma que no lo era, arranca con lunes a viernes marcados.
  const [weekdays, setWeekdays] = useState<number[]>(alarm && alarm.weekdays.length > 0 ? alarm.weekdays : [1, 2, 3, 4, 5]);
  const [date, setDate] = useState(alarm?.date ?? todayIso());
  const [area, setArea] = useState<AlarmArea | "">(alarm?.area ?? "");
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  const create = useCreateAlarm();
  const update = useUpdateAlarm();
  const mutation = editing ? update : create;
  const serverErrors = mutation.error ? fieldErrors(mutation.error) : {};
  const errors = { ...serverErrors, ...clientErrors };
  const generalError = mutation.error && (mutation.error.code !== "400" || Object.keys(serverErrors).length === 0) ? mutation.error.message : null;

  const toggleDay = (d: number) => setWeekdays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "El título es obligatorio.";
    if (!/^\d{2}:\d{2}$/.test(timeOfDay)) next.timeOfDay = "Elija una hora.";
    if (repeat === "WEEKLY" && weekdays.length === 0) next.weekdays = "Elija al menos un día.";
    if (repeat === "ONCE" && !date) next.date = "Elija la fecha.";
    setClientErrors(next);
    if (Object.keys(next).length > 0) return;
    const input: AlarmInput = {
      title: title.trim(),
      ...(description.trim() ? { description: description.trim() } : {}),
      timeOfDay,
      repeat,
      ...(repeat === "WEEKLY" ? { weekdays } : {}),
      ...(repeat === "ONCE" ? { date } : {}),
      ...(area ? { area } : {}),
    };
    const done = () => onClose();
    const ignore = () => undefined;
    if (alarm) await update.mutateAsync({ id: alarm.id, ...input }).then(done, ignore);
    else await create.mutateAsync(input).then(done, ignore);
  };

  return (
    <Modal
      open
      title={editing ? "Editar alarma" : "Nueva alarma"}
      description="La hora es la de Colombia. Al sonar, el aviso aparece en pantalla y, si lo activó, en este dispositivo."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="alarm-form" loading={mutation.isPending}>
            {editing ? "Guardar cambios" : "Crear alarma"}
          </Button>
        </>
      }
    >
      <form id="alarm-form" className={styles.form} onSubmit={submit} noValidate>
        <Field label="Título" htmlFor="alarm-title" error={errors.title}>
          <Input id="alarm-title" value={title} onChange={(e) => setTitle(e.target.value)} invalid={errors.title !== undefined} maxLength={120} autoFocus required placeholder="Cierre de caja" />
        </Field>
        <Field label="Descripción" htmlFor="alarm-description" error={errors.description} hint="Opcional. Se muestra en el aviso.">
          <Input id="alarm-description" value={description} onChange={(e) => setDescription(e.target.value)} invalid={errors.description !== undefined} maxLength={400} placeholder="Contar el efectivo y cuadrar con las ventas del día" />
        </Field>
        <FieldRow>
          <Field label="Hora" htmlFor="alarm-time" error={errors.timeOfDay}>
            <Input id="alarm-time" type="time" value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)} invalid={errors.timeOfDay !== undefined} required />
          </Field>
          <Field label="Repetición" htmlFor="alarm-repeat" error={errors.repeat}>
            <Select id="alarm-repeat" value={repeat} onChange={(e) => setRepeat(e.target.value as AlarmRepeat)}>
              {REPEATS.map((r) => (
                <option key={r} value={r}>
                  {REPEAT_LABELS[r]}
                </option>
              ))}
            </Select>
          </Field>
        </FieldRow>
        {repeat === "WEEKLY" ? (
          <Field label="Días de la semana" error={errors.weekdays}>
            <div className={styles.days} role="group" aria-label="Días de la semana">
              {WEEKDAY_LABELS.map((label, d) => (
                <button key={label} type="button" className={[styles.day, weekdays.includes(d) ? styles.dayOn : ""].join(" ")} aria-pressed={weekdays.includes(d)} onClick={() => toggleDay(d)}>
                  {label}
                </button>
              ))}
            </div>
          </Field>
        ) : null}
        {repeat === "ONCE" ? (
          <Field label="Fecha" htmlFor="alarm-date" error={errors.date}>
            <Input id="alarm-date" type="date" value={date} min={todayIso()} onChange={(e) => setDate(e.target.value)} invalid={errors.date !== undefined} required />
          </Field>
        ) : null}
        <Field label="Área del sistema" htmlFor="alarm-area" error={errors.area} hint="A qué pantalla lleva el aviso.">
          <Select id="alarm-area" value={area} onChange={(e) => setArea(e.target.value as AlarmArea | "")}>
            <option value="">Sin área (Alarmas)</option>
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {AREA_LABELS[a]}
              </option>
            ))}
          </Select>
        </Field>
        {generalError ? <Callout tone="bad">{generalError}</Callout> : null}
      </form>
    </Modal>
  );
};
