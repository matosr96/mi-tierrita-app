import { useEffect, useState } from "react";
import { useChatSearch } from "@/hooks/chat";
import { int } from "@/lib/format";
import type { ChatMessage } from "@/types/api";
import { SidePanel } from "./SidePanel";
import { whenLabel } from "./chatFormat";
import styles from "./SearchPanel.module.css";

/** Búsqueda dentro de la conversación abierta (texto, autor o nombre de un adjunto; sin tildes), hilos incluidos. */
export const SearchPanel = ({ peerId, where, meId, onOpen, onClose }: { peerId: number | null; where: string; meId: number | undefined; onOpen: (m: ChatMessage) => void; onClose: () => void }) => {
  const [text, setText] = useState("");
  const [term, setTerm] = useState("");
  useEffect(() => {
    const t = window.setTimeout(() => setTerm(text.trim()), 300);
    return () => window.clearTimeout(t);
  }, [text]);
  const results = useChatSearch(term, { peerId });
  const items = results.data ? [...results.data.items].reverse() : [];

  return (
    <SidePanel title="Buscar en la conversación" subtitle={where} onClose={onClose}>
      <div className={styles.body}>
        <input className={styles.input} type="search" autoFocus placeholder="Palabra, persona o archivo" value={text} onChange={(e) => setText(e.target.value)} aria-label={`Buscar en ${where}`} />
        {term.length < 2 ? <p className={styles.muted}>Escriba al menos 2 letras.</p> : null}
        {term.length >= 2 && results.isPending ? <p className={styles.muted}>Buscando…</p> : null}
        {results.isError ? <p className={styles.muted}>No se pudo buscar. Intente de nuevo.</p> : null}
        {term.length >= 2 && results.data && items.length === 0 ? <p className={styles.muted}>Nada coincide con «{term}» en esta conversación.</p> : null}
        {items.length > 0 ? <p className={styles.muted}>{int(items.length)} resultados, los más recientes primero</p> : null}
        <ul>
          {items.map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => onOpen(m)}>
                <small>
                  {m.userId === meId ? "Usted" : `${m.firstName} ${m.lastName}`} · {whenLabel(m.createdAt).toLowerCase()}
                  {m.threadRootId ? " · en un hilo" : ""}
                </small>
                <span>{m.body || `📎 ${m.attachments.map((a) => a.name).join(", ")}`}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </SidePanel>
  );
};
