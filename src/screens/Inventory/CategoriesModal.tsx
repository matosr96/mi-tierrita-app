import { useEffect, useState, type FormEvent } from "react";
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from "@/hooks/categories";
import { Badge, Button, EmptyState, Input, Modal, QueryState } from "@/components/ui";
import type { Category } from "@/types/api";
import styles from "./InventoryScreen.module.css";

type Props = { open: boolean; isAdmin: boolean; onClose: () => void };

/** Mantenimiento de categorías: crear, renombrar, activar/desactivar y (ADMIN) eliminar. */
export const CategoriesModal = ({ open, isAdmin, onClose }: Props) => {
  const categories = useCategories();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
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
    await create.mutateAsync(name).then(() => setNewName(""), () => undefined);
  };

  const startEdit = (c: Category) => {
    setEditingId(c.id);
    setEditName(c.name);
    setConfirmId(null);
  };

  const saveEdit = async (c: Category) => {
    const name = editName.trim();
    if (name === "" || name === c.name) {
      setEditingId(null);
      return;
    }
    await update.mutateAsync({ id: c.id, name }).then(() => setEditingId(null), () => undefined);
  };

  const busy = update.isPending || remove.isPending;

  return (
    <Modal open={open} title="Categorías" description="Las categorías inactivas no aparecen en los filtros ni al crear productos." onClose={onClose}>
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
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} aria-label="Nuevo nombre" autoFocus onKeyDown={(e) => e.key === "Enter" && void saveEdit(c)} />
                    <div className={styles.catActions}>
                      <Button size="sm" onClick={() => void saveEdit(c)} loading={update.isPending}>
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
                    <span className={styles.catName}>
                      {c.name} <Badge tone={c.active ? "good" : "neutral"}>{c.active ? "Activa" : "Inactiva"}</Badge>
                    </span>
                    <div className={styles.catActions}>
                      <Button size="sm" variant="ghost" onClick={() => startEdit(c)} disabled={busy}>
                        Renombrar
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
