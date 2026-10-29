import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { Button, Callout, Checkbox, Field, Input, Modal, Tabs, sizeLabel, type TabOption } from "@/components/ui";
import { useCreateLink, useUpdateLibraryItem, useUploadLibraryDocument } from "@/hooks/library";
import { fieldErrors } from "@/lib/errors";
import { ROLE_LABELS } from "@/stores/session";
import type { LibraryItem, Role } from "@/types/api";
import styles from "./LibraryScreen.module.css";

type Props = { open: boolean; item: LibraryItem | null; onClose: () => void };
type FormKind = "link" | "document";

const ROLES: Role[] = ["ADMIN", "SALES", "WAREHOUSE"];
/** Los mismos tipos que admite el servidor (los del chat, sin audio). */
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,.pdf,application/pdf,.csv,text/csv,.txt,text/plain,.xlsx,.xls,.docx,.doc";
const MAX_BYTES = 10 * 1024 * 1024;

const KIND_OPTIONS: TabOption<FormKind>[] = [
  { value: "link", label: "Enlace" },
  { value: "document", label: "Documento" },
];

/** Agregar (enlace o documento con arrastrar y soltar) o editar (título, descripción, roles y, en enlaces, la dirección). Solo ADMIN. */
export const LibraryFormModal = ({ open, item, onClose }: Props) => {
  const editing = item !== null;
  const [kind, setKind] = useState<FormKind>(item?.kind ?? "link");
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [url, setUrl] = useState(item?.url ?? "");
  const [roles, setRoles] = useState<Role[]>(item?.roles ?? []);
  const [file, setFile] = useState<File | null>(null);
  const [over, setOver] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const createLink = useCreateLink();
  const upload = useUploadLibraryDocument();
  const update = useUpdateLibraryItem();
  const active = editing ? update : kind === "link" ? createLink : upload;
  const errs: Record<string, string | undefined> = { ...(active.error ? fieldErrors(active.error) : {}), ...localErrors };
  const general = active.error && Object.keys(fieldErrors(active.error)).length === 0 ? active.error.message : undefined;

  const pick = (f: File | null) => {
    setLocalErrors((e) => ({ ...e, file: "" }));
    if (f && f.size > MAX_BYTES) {
      setLocalErrors((e) => ({ ...e, file: `${f.name} pesa más de 10 MB.` }));
      return;
    }
    setFile(f);
    if (f && title.trim() === "") setTitle(f.name.replace(/\.[^.]+$/, ""));
  };
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setOver(false);
    pick(e.dataTransfer.files[0] ?? null);
  };
  const toggleRole = (r: Role) => setRoles((rs) => (rs.includes(r) ? rs.filter((x) => x !== r) : [...rs, r]));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Ingrese un título.";
    if (!editing && kind === "link" && !url.trim()) next.url = "Ingrese la dirección.";
    if (editing && item.kind === "link" && !url.trim()) next.url = "Ingrese la dirección.";
    if (!editing && kind === "document" && !file) next.file = "Elija o arrastre un archivo.";
    setLocalErrors(next);
    if (Object.values(next).some((v) => v !== "")) return;
    try {
      if (editing) {
        await update.mutateAsync({ id: item.id, title: title.trim(), description: description.trim(), roles, ...(item.kind === "link" ? { url: url.trim() } : {}) });
      } else if (kind === "link") {
        await createLink.mutateAsync({ title: title.trim(), description: description.trim(), url: url.trim(), roles });
      } else {
        setProgress(0);
        await upload.mutateAsync({ file: file!, title: title.trim(), description: description.trim(), roles, onProgress: setProgress });
      }
      onClose();
    } catch {
      setProgress(null);
      /* el error queda en la mutación y se pinta en el formulario */
    }
  };

  const showUrl = editing ? item.kind === "link" : kind === "link";
  const showFile = !editing && kind === "document";

  return (
    <Modal
      open={open}
      title={editing ? "Editar" : "Agregar a la biblioteca"}
      description={editing ? (item.kind === "link" ? "Enlace" : `Documento · ${item.name ?? ""}`) : "Un enlace importante o un documento que el equipo deba tener a mano."}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={active.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="library-form" loading={active.isPending}>
            {editing ? "Guardar cambios" : kind === "link" ? "Agregar enlace" : "Subir documento"}
          </Button>
        </>
      }
    >
      <form id="library-form" className={styles.form} onSubmit={submit} noValidate>
        {general ? <Callout tone="bad">{general}</Callout> : null}
        {!editing ? <Tabs options={KIND_OPTIONS} value={kind} onChange={setKind} ariaLabel="Tipo" /> : null}
        {showFile ? (
          <Field label="Archivo" htmlFor="lib-file" hint="Fotos, PDF, Excel, Word, CSV o texto · hasta 10 MB" error={errs.file || undefined}>
            <div
              className={[styles.drop, over ? styles.dropOver : "", file ? styles.dropHas : ""].join(" ")}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(true);
              }}
              onDragLeave={() => setOver(false)}
              onDrop={onDrop}
            >
              <input ref={inputRef} id="lib-file" type="file" accept={ACCEPT} className={styles.fileInput} onChange={(e) => pick(e.target.files?.[0] ?? null)} />
              {file ? (
                <>
                  <strong>{file.name}</strong>
                  <span>{sizeLabel(file.size)}</span>
                  <Button size="sm" variant="ghost" onClick={() => pick(null)}>
                    Quitar
                  </Button>
                </>
              ) : (
                <>
                  <span>Arrastre el archivo aquí</span>
                  <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
                    Elegir archivo
                  </Button>
                </>
              )}
              {progress !== null && upload.isPending ? (
                <span className={styles.progress} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
                  <span style={{ width: `${Math.round(progress * 100)}%` }} />
                </span>
              ) : null}
            </div>
          </Field>
        ) : null}
        <Field label="Título" htmlFor="lib-title" error={errs.title || undefined}>
          <Input id="lib-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} invalid={Boolean(errs.title)} autoFocus={!showFile} />
        </Field>
        {showUrl ? (
          <Field label="Dirección" htmlFor="lib-url" hint="Debe empezar por http:// o https://" error={errs.url || undefined}>
            <Input id="lib-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" invalid={Boolean(errs.url)} />
          </Field>
        ) : null}
        <Field label="Descripción" htmlFor="lib-desc" hint="Opcional · para qué sirve o cuándo usarlo" error={errs.description || undefined}>
          <Input id="lib-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={400} invalid={Boolean(errs.description)} />
        </Field>
        <fieldset className={styles.rolesSet}>
          <legend>Quién lo ve</legend>
          <span className={styles.rolesHint}>Sin marcar ninguno lo ve todo el equipo.</span>
          <div className={styles.rolesRow}>
            {ROLES.map((r) => (
              <Checkbox key={r} label={ROLE_LABELS[r]} checked={roles.includes(r)} onChange={() => toggleRole(r)} />
            ))}
          </div>
          {errs.roles ? <span className={styles.rolesError}>{errs.roles}</span> : null}
        </fieldset>
      </form>
    </Modal>
  );
};
