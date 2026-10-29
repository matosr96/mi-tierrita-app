import { useState } from "react";
import { Button, Modal, Pagination, QueryState } from "@/components/ui";
import { useAiConversations, useDeleteAiConversation, useOpenAiConversation } from "@/hooks/ai";
import { useAiStore } from "@/stores/ai";
import { dateTime } from "@/lib/format";
import styles from "./TitaHistory.module.css";

const SCREEN_LABEL: Record<string, string> = {
  inicio: "Inicio",
  inventario: "Inventario",
  lotes: "Lotes",
  ventas: "Ventas",
  clientes: "Clientes",
  proveedores: "Proveedores",
  finanzas: "Finanzas",
  reportes: "Reportes",
  tita: "Tita",
  chat: "Chat",
  contactos: "Contactos",
  usuarios: "Usuarios",
  auditoria: "Auditoría",
  alarmas: "Alarmas",
  perfil: "Perfil",
};

/**
 * Historial de conversaciones con Tita (brief de octubre de 2026, punto 3): ver las anteriores, retomar una (se carga en
 * la misma conversación compartida por el panel y la página) o borrarla. Solo las propias.
 */
export const TitaHistory = ({ open, onClose, onOpened }: { open: boolean; onClose: () => void; onOpened?: (() => void) | undefined }) => {
  const [page, setPage] = useState(1);
  const list = useAiConversations({ page, limit: 8 });
  const openConversation = useOpenAiConversation();
  const remove = useDeleteAiConversation();
  const current = useAiStore((s) => s.conversationId);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const reopen = (id: number) => {
    openConversation.mutate(id, {
      onSuccess: () => {
        onClose();
        onOpened?.();
      },
    });
  };

  return (
    <Modal open={open} title="Historial de conversaciones" description="Toque una para retomarla. Solo usted ve sus conversaciones." onClose={onClose}>
      <QueryState query={list} isEmpty={(d) => d.items.length === 0} empty={<p className={styles.empty}>Aún no hay conversaciones guardadas. Pregúntele algo a Tita y aparecerá aquí.</p>}>
        {(data) => (
          <>
            <ul className={styles.list}>
              {data.items.map((c) => (
                <li key={c.id} className={[styles.item, c.id === current ? styles.current : ""].join(" ")}>
                  <button type="button" className={styles.openBtn} onClick={() => reopen(c.id)} disabled={openConversation.isPending} aria-current={c.id === current ? "true" : undefined}>
                    <span className={styles.title}>{c.title}</span>
                    <span className={styles.meta}>
                      {dateTime(c.updatedAt)} · {c.messages} {c.messages === 1 ? "mensaje" : "mensajes"}
                      {c.screen ? ` · desde ${SCREEN_LABEL[c.screen] ?? c.screen}` : ""}
                      {c.id === current ? " · en pantalla" : ""}
                    </span>
                  </button>
                  {confirmId === c.id ? (
                    <span className={styles.confirm}>
                      <Button size="sm" variant="danger" loading={remove.isPending} onClick={() => remove.mutate(c.id, { onSuccess: () => setConfirmId(null) })}>
                        Eliminar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmId(null)}>
                        No
                      </Button>
                    </span>
                  ) : (
                    <button type="button" className={styles.deleteBtn} onClick={() => setConfirmId(c.id)} aria-label={`Eliminar la conversación ${c.title}`} title="Eliminar">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path d="M4 6 h12 M8 6 V4.5 h4 V6 M6 6 l.8 10 h6.4 L14 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <Pagination page={data} onPage={setPage} />
          </>
        )}
      </QueryState>
    </Modal>
  );
};
