import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/AppShell";
import { Button, Chips, DocumentViewer, EmptyState, Input, Modal, Pagination, QueryState } from "@/components/ui";
import { useDeleteLibraryItem, useDownloadLibraryFile, useLibrary, useLibraryFile } from "@/hooks/library";
import { useSessionStore } from "@/stores/session";
import type { LibraryItem, LibraryKind } from "@/types/api";
import { LibraryFormModal } from "./LibraryFormModal";
import { LibraryItemCard } from "./LibraryItemCard";
import styles from "./LibraryScreen.module.css";

type Filter = "all" | LibraryKind;
const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Todo" },
  { value: "document", label: "Documentos" },
  { value: "link", label: "Enlaces" },
];
const LIMIT = 12;

/** Biblioteca (brief 2.5, punto 35): documentos y enlaces importantes del equipo, con vista previa. Solo ADMIN agrega, edita y elimina. */
export const LibraryScreen = () => {
  const role = useSessionStore((s) => s.user?.role);
  const canManage = role === "ADMIN";
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<{ open: boolean; item: LibraryItem | null }>({ open: false, item: null });
  const [toDelete, setToDelete] = useState<LibraryItem | null>(null);
  const [viewing, setViewing] = useState<LibraryItem | null>(null);

  // La búsqueda viaja al servidor con una pequeña espera para no pedir en cada tecla.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(t);
  }, [search]);

  const query = useLibrary({ page, limit: LIMIT, ...(filter === "all" ? {} : { kind: filter }), ...(q.length > 0 ? { q } : {}) });
  const remove = useDeleteLibraryItem();
  const download = useDownloadLibraryFile();
  const file = useLibraryFile(viewing?.id ?? null, viewing?.updatedAt);

  // Anterior / siguiente entre los documentos de la página actual.
  const documents = useMemo(() => (query.data?.items ?? []).filter((i) => i.kind === "document"), [query.data]);
  const viewIndex = viewing ? documents.findIndex((d) => d.id === viewing.id) : -1;

  const confirmDelete = async () => {
    if (!toDelete) return;
    await remove.mutateAsync(toDelete.id);
    setToDelete(null);
  };

  return (
    <>
      <PageHeader
        title="Biblioteca"
        subtitle="Documentos y enlaces importantes del equipo, en un solo lugar y con vista previa."
        actions={
          canManage ? (
            <Button onClick={() => setForm({ open: true, item: null })}>Agregar</Button>
          ) : undefined
        }
      />
      <div className={styles.bar}>
        <Chips
          options={FILTERS}
          value={filter}
          onChange={(v) => {
            setFilter(v);
            setPage(1);
          }}
        />
        <Input type="search" className={styles.search} placeholder="Buscar por título, descripción o archivo" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar en la biblioteca" />
      </div>
      <QueryState
        query={query}
        isEmpty={(p) => p.items.length === 0}
        empty={
          <EmptyState
            title={q ? "Sin coincidencias" : "La biblioteca está vacía"}
            text={q ? "Pruebe con otra palabra o quite el filtro." : canManage ? "Agregue el primer documento o enlace que el equipo deba tener a mano." : "Cuando el administrador agregue documentos o enlaces, aparecerán aquí."}
            action={canManage && !q ? <Button onClick={() => setForm({ open: true, item: null })}>Agregar</Button> : undefined}
          />
        }
      >
        {(p) => (
          <>
            <ul className={styles.grid}>
              {p.items.map((item) => (
                <LibraryItemCard key={item.id} item={item} canManage={canManage} onView={setViewing} onEdit={(i) => setForm({ open: true, item: i })} onDelete={setToDelete} />
              ))}
            </ul>
            <Pagination page={p} onPage={setPage} />
          </>
        )}
      </QueryState>

      <div className={styles.overlays}>
        {form.open ? <LibraryFormModal key={form.item?.id ?? "new"} open item={form.item} onClose={() => setForm({ open: false, item: null })} /> : null}
        <Modal
          open={toDelete !== null}
          title="Eliminar de la biblioteca"
          description={toDelete ? `«${toDelete.title}» dejará de estar disponible para el equipo.` : undefined}
          onClose={() => setToDelete(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setToDelete(null)} disabled={remove.isPending}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={confirmDelete} loading={remove.isPending}>
                Eliminar
              </Button>
            </>
          }
        >
          <p className={styles.confirmText}>Esta acción no se puede deshacer.</p>
        </Modal>
        <DocumentViewer
          open={viewing !== null}
          name={viewing?.name ?? viewing?.title ?? ""}
          mime={viewing?.mime ?? ""}
          src={file.data ?? null}
          size={viewing?.size ?? null}
          error={file.isError ? "No se pudo descargar el documento." : null}
          onClose={() => setViewing(null)}
          onDownload={viewing ? () => download.mutate(viewing) : undefined}
          items={documents.map((d) => ({ name: d.name ?? d.title, mime: d.mime ?? "", size: d.size }))}
          index={viewIndex >= 0 ? viewIndex : undefined}
          onNavigate={(i) => setViewing(documents[i] ?? null)}
        />
      </div>
    </>
  );
};
