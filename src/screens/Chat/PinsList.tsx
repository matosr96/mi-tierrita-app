import { EmptyState, QueryState } from "@/components/ui";
import type { UseQueryResult } from "@tanstack/react-query";
import type { ChatMessage } from "@/types/api";
import { bodyOrFiles, whenLabel } from "./chatFormat";
import styles from "./PinsList.module.css";

/** Lista de mensajes fijados (la usan el panel de fijados y la pestaña "Fijados" de la información): ir a cada uno y, si se puede, desfijarlo. */
export const PinsList = ({ pins, canUnpin, onOpen, onUnpin }: { pins: UseQueryResult<{ items: ChatMessage[] }>; canUnpin: boolean; onOpen: (m: ChatMessage) => void; onUnpin: (m: ChatMessage) => void }) => (
  <div className={styles.list}>
    <QueryState
      query={pins}
      isEmpty={(d) => d.items.length === 0}
      empty={<EmptyState title="No hay mensajes fijados" text={canUnpin ? "Fije un mensaje importante desde sus acciones para tenerlo siempre a mano." : "La administración fija aquí los avisos importantes."} />}
    >
      {(d) => (
        <ul>
          {d.items.map((m) => (
            <li key={m.id}>
              <button type="button" className={styles.item} onClick={() => onOpen(m)}>
                <strong>
                  {m.firstName} {m.lastName}
                </strong>
                <span>{bodyOrFiles(m)}</span>
                <small>{m.pinned ? `Fijado por ${m.pinned.by.name} · ${whenLabel(m.pinned.at).toLowerCase()}` : ""}</small>
              </button>
              {canUnpin ? (
                <button type="button" className={styles.unpin} onClick={() => onUnpin(m)}>
                  Desfijar
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </QueryState>
  </div>
);
