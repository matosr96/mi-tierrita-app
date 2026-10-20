import { int } from "@/lib/format";
import type { ChatMessage } from "@/types/api";
import styles from "./PinnedBar.module.css";

/** Franja bajo el encabezado con el último mensaje fijado; lleva a él y abre la lista de fijados. */
export const PinnedBar = ({ pins, onOpen, onShowAll }: { pins: ChatMessage[]; onOpen: (m: ChatMessage) => void; onShowAll: () => void }) => {
  const top = pins[0];
  if (!top) return null;
  return (
    <div className={styles.bar}>
      <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
        <path d="M12.5 3 17 7.5l-2.6.9-3.3 3.3.3 3.3-1.3 1.3-6-6 1.3-1.3 3.3.3 3.3-3.3zM6.5 13.5 3 17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <button type="button" className={styles.main} onClick={() => onOpen(top)} title="Ir al mensaje fijado">
        <strong>
          {top.firstName}: {top.body || `📎 ${top.attachments.length === 1 ? top.attachments[0]!.name : `${top.attachments.length} archivos`}`}
        </strong>
      </button>
      <button type="button" className={styles.all} onClick={onShowAll}>
        {pins.length === 1 ? "Fijado" : `Ver los ${int(pins.length)} fijados`}
      </button>
    </div>
  );
};
