import { EmptyState, QueryState } from "@/components/ui";
import type { UseQueryResult } from "@tanstack/react-query";
import type { ChatMessage } from "@/types/api";
import { SidePanel } from "./SidePanel";
import { whenLabel } from "./chatFormat";
import styles from "./PinsPanel.module.css";

/** Lista de mensajes fijados de la conversación: ir a cada uno y, si la persona puede, desfijarlo. */
export const PinsPanel = ({
  pins,
  where,
  canUnpin,
  onOpen,
  onUnpin,
  onClose,
}: {
  pins: UseQueryResult<{ items: ChatMessage[] }>;
  where: string;
  canUnpin: boolean;
  onOpen: (m: ChatMessage) => void;
  onUnpin: (m: ChatMessage) => void;
  onClose: () => void;
}) => (
  <SidePanel title="Mensajes fijados" subtitle={where} onClose={onClose}>
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
                  <span>{m.body || `📎 ${m.attachments.map((a) => a.name).join(", ")}`}</span>
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
  </SidePanel>
);
