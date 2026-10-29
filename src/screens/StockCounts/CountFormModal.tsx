import { useState, type FormEvent } from "react";
import { Button, Callout, Field, FieldRow, Input, Modal, Select } from "@/components/ui";
import { useCategories } from "@/hooks/categories";
import { useCreateStockCount, useUpdateStockCount } from "@/hooks/stock-counts";
import { fieldErrors } from "@/lib/errors";
import { todayIso } from "@/lib/format";
import type { StockCount, StockCountScope } from "@/types/api";
import { scopeLabel } from "./stockCountLabels";
import styles from "./StockCountsScreen.module.css";

type Props = { count: StockCount | null; onClose: () => void; onCreated: (id: number) => void };

/** Programar un conteo (título, fecha, alcance) o editar uno programado (título, fecha y nota; el alcance queda fijo). */
export const CountFormModal = ({ count, onClose, onCreated }: Props) => {
  const editing = count !== null;
  const [title, setTitle] = useState(count?.title ?? "");
  const [scheduledDate, setScheduledDate] = useState(count?.scheduledDate ?? todayIso());
  const [scope, setScope] = useState<StockCountScope>(count?.scope ?? "ALL");
  const [categoryId, setCategoryId] = useState<string>(count?.categoryId ? String(count.categoryId) : "");
  const [note, setNote] = useState(count?.note ?? "");
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const categories = useCategories({ active: true, limit: 100 });

  const create = useCreateStockCount();
  const update = useUpdateStockCount();
  const mutation = editing ? update : create;
  const serverErrors = mutation.error ? fieldErrors(mutation.error) : {};
  const errors = { ...serverErrors, ...clientErrors };
  const generalError = mutation.error && (mutation.error.code !== "400" || Object.keys(serverErrors).length === 0) ? mutation.error.message : null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "El título es obligatorio.";
    if (!scheduledDate) next.scheduledDate = "Elija la fecha.";
    if (!editing && scope === "CATEGORY" && !categoryId) next.categoryId = "Elija la categoría.";
    setClientErrors(next);
    if (Object.keys(next).length > 0) return;
    const ignore = () => undefined;
    if (count) {
      await update.mutateAsync({ id: count.id, title: title.trim(), scheduledDate, note: note.trim() || null }).then(onClose, ignore);
    } else {
      await create
        .mutateAsync({ title: title.trim(), scheduledDate, scope, ...(scope === "CATEGORY" ? { categoryId: Number(categoryId) } : {}), ...(note.trim() ? { note: note.trim() } : {}) })
        .then((created) => onCreated(created.id), ignore);
    }
  };

  return (
    <Modal
      open
      title={editing ? "Editar conteo" : "Programar conteo"}
      description="Al iniciarlo, el sistema toma el stock de cada producto del alcance como punto de partida."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="count-form" loading={mutation.isPending}>
            {editing ? "Guardar cambios" : "Programar"}
          </Button>
        </>
      }
    >
      <form id="count-form" className={styles.form} onSubmit={submit} noValidate>
        <Field label="Título" htmlFor="count-title" error={errors.title}>
          <Input id="count-title" value={title} onChange={(e) => setTitle(e.target.value)} invalid={errors.title !== undefined} maxLength={120} autoFocus placeholder="Conteo mensual de bodega" />
        </Field>
        <FieldRow>
          <Field label="Fecha programada" htmlFor="count-date" error={errors.scheduledDate}>
            <Input id="count-date" type="date" value={scheduledDate} min={todayIso()} onChange={(e) => setScheduledDate(e.target.value)} invalid={errors.scheduledDate !== undefined} />
          </Field>
          {editing ? (
            <Field label="Alcance" hint="No cambia una vez programado.">
              <span className={styles.fixedValue}>{scopeLabel(count)}</span>
            </Field>
          ) : (
            <Field label="Alcance" htmlFor="count-scope" error={errors.scope}>
              <Select id="count-scope" value={scope} onChange={(e) => setScope(e.target.value as StockCountScope)}>
                <option value="ALL">Todo el inventario</option>
                <option value="CATEGORY">Una categoría</option>
              </Select>
            </Field>
          )}
        </FieldRow>
        {!editing && scope === "CATEGORY" ? (
          <Field label="Categoría" htmlFor="count-category" error={errors.categoryId}>
            <Select id="count-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} invalid={errors.categoryId !== undefined}>
              <option value="">{categories.isPending ? "Cargando categorías…" : "Elija una categoría"}</option>
              {categories.data?.items.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
        <Field label="Nota" htmlFor="count-note" error={errors.note} hint="Opcional. Por ejemplo, quién cuenta o qué estantes.">
          <Input id="count-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={400} />
        </Field>
        {generalError ? <Callout tone="bad">{generalError}</Callout> : null}
      </form>
    </Modal>
  );
};
