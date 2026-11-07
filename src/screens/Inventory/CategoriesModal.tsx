import { useEffect, useState, type FormEvent } from "react";
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from "@/hooks/categories";
import { Badge, Button, EmptyState, Field, Input, Modal, QueryState } from "@/components/ui";
import type { Category } from "@/types/api";
import styles from "./InventoryScreen.module.css";

type Props = { open: boolean; isAdmin: boolean; onClose: () => void };

/** «Vacunas, Desparasitantes» → ["Vacunas", "Desparasitantes"]; sin vacíos ni repetidos. */
export const parseTagsInput = (raw: string): string[] => {
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const value = part.trim();
    if (value !== "" && !out.some((t) => t.toLowerCase() === value.toLowerCase())) out.push(value);
  }
  return out;
};

const sameTags = (a: string[], b: string[]): boolean => a.length === b.length && a.every((t, i) => t === b[i]);

/**
 * Mantenimiento de categorías: crear, editar (nombre, descripción y subfamilias), activar/desactivar y (ADMIN) eliminar.
 * Las seis líneas con código son las de la página pública: lo que se edite aquí se ve allá.
 */
export const CategoriesModal = ({ open, isAdmin, onClose }: Props) => {
  const categories = useCategories();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState("");
  const [confirmId, setConfirmId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setNewName("");
    setEditingId(null);
    setConfirmId(null);
    create.reset();
  }, [open]);

  const submitCreate = async (e: FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (name === "") return;
    await create.mutateAsync({ name }).then(() => setNewName(""), () => undefined);
  };

  const startEdit = (c: Category) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditDescription(c.description ?? "");
    setEditTags(c.tags.join(", "));
    setConfirmId(null);
  };

  const saveEdit = async (c: Category) => {
    const name = editName.trim();
    const description = editDescription.trim();
    const tags = parseTagsInput(editTags);
    if (name === "") return;
    const input: { id: number; name?: string; description?: string | null; tags?: string[] } = { id: c.id };
    if (name !== c.name) input.name = name;
    if (description !== (c.description ?? "")) input.description = description === "" ? null : description;
    if (!sameTags(tags, c.tags)) input.tags = tags;
    if (Object.keys(input).length === 1) {
      setEditingId(null);
      return;
    }
    await update.mutateAsync(input).then(() => setEditingId(null), () => undefined);
  };

  const busy = update.isPending || remove.isPending;

  return (
    <Modal
      open={open}
      title="Categorías"
      description="Las seis líneas con código son las de la página pública: su nombre, descripción y subfamilias se muestran allá. Las categorías inactivas no aparecen en los filtros ni al crear productos."
      onClose={onClose}
    >
      <form className={styles.inlineForm} onSubmit={submitCreate}>
        <Input placeholder="Nueva categoría" value={newName} onChange={(e) => setNewName(e.target.value)} aria-label="Nombre de la nueva categoría" invalid={create.isError} />
        <Button type="submit" loading={create.isPending} disabled={newName.trim() === ""}>
          Agregar
        </Button>
      </form>
      {create.error ? <p className={styles.formError}>{create.error.message}</p> : null}
      <QueryState query={categories} isEmpty={(page) => page.items.length === 0} empty={<EmptyState title="Aún no hay categorías" text="Cree la primera con el formulario de arriba." />}>
        {(page) => (
          <ul className={styles.catList}>
            {page.items.map((c) => (
              <li key={c.id} className={styles.catRow}>
                {editingId === c.id ? (
                  <>
                    <div className={styles.catEdit}>
                      <Field label="Nombre" htmlFor={`cat-name-${c.id}`}>
                        <Input id={`cat-name-${c.id}`} value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus onKeyDown={(e) => e.key === "Enter" && void saveEdit(c)} />
                      </Field>
                      <Field label="Descripción" htmlFor={`cat-description-${c.id}`} hint={c.code !== null ? "Se muestra bajo el nombre en la página pública." : "Opcional."}>
                        <Input id={`cat-description-${c.id}`} value={editDescription} maxLength={200} onChange={(e) => setEditDescription(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void saveEdit(c)} />
                      </Field>
                      <Field label="Subfamilias" htmlFor={`cat-tags-${c.id}`} hint="Separadas por coma, por ejemplo: Vacunas, Desparasitantes, Vitaminas.">
                        <Input id={`cat-tags-${c.id}`} value={editTags} onChange={(e) => setEditTags(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void saveEdit(c)} />
                      </Field>
                      {update.error ? <p className={styles.formError}>{update.error.message}</p> : null}
                    </div>
                    <div className={styles.catActions}>
                      <Button size="sm" onClick={() => void saveEdit(c)} loading={update.isPending} disabled={editName.trim() === ""}>
                        Guardar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} disabled={update.isPending}>
                        Cancelar
                      </Button>
                    </div>
                  </>
                ) : confirmId === c.id ? (
                  <>
                    <span className={styles.catName}>
                      ¿Eliminar <strong>{c.name}</strong>? Solo es posible si no tiene productos.
                    </span>
                    <div className={styles.catActions}>
                      <Button size="sm" variant="danger" loading={remove.isPending} onClick={() => void remove.mutateAsync(c.id).then(() => setConfirmId(null), () => setConfirmId(null))}>
                        Sí, eliminar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmId(null)} disabled={remove.isPending}>
                        No
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.catInfo}>
                      <span className={styles.catName}>
                        {c.name} <Badge tone={c.active ? "good" : "neutral"}>{c.active ? "Activa" : "Inactiva"}</Badge>
                      </span>
                      {c.code !== null || c.tags.length > 0 ? (
                        <span className={styles.catMeta}>
                          {c.code !== null ? <span className={styles.catCode}>L-{c.code} · Página pública</span> : null}
                          {c.code !== null && c.tags.length > 0 ? " · " : ""}
                          {c.tags.join(" · ")}
                        </span>
                      ) : null}
                      {c.description !== null ? <span className={styles.catMeta}>{c.description}</span> : null}
                    </div>
                    <div className={styles.catActions}>
                      <Button size="sm" variant="ghost" onClick={() => startEdit(c)} disabled={busy}>
                        Editar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => update.mutate({ id: c.id, active: !c.active })} disabled={busy}>
                        {c.active ? "Desactivar" : "Activar"}
                      </Button>
                      {isAdmin ? (
                        <Button size="sm" variant="danger" onClick={() => setConfirmId(c.id)} disabled={busy}>
                          Eliminar
                        </Button>
                      ) : null}
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </Modal>
  );
};
