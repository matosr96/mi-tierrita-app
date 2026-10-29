import { useEffect, useState } from "react";
import { MiniCalendar } from "@/components/ui";
import { useChatSearch } from "@/hooks/chat";
import { dateOnly, int } from "@/lib/format";
import type { ChatMessage } from "@/types/api";
import { SidePanel } from "./SidePanel";
import { bodyOrFiles, whenLabel } from "./chatFormat";
import styles from "./SearchPanel.module.css";

/**
 * Búsqueda dentro de la conversación abierta: por texto (mensaje, autor o nombre de un adjunto; sin tildes) y/o por el
 * día elegido en el mini calendario; hilos incluidos. Elegir un resultado lleva al mensaje.
 */
export const SearchPanel = ({ peerId, where, meId, onOpen, onClose }: { peerId: number | null; where: string; meId: number | undefined; onOpen: (m: ChatMessage) => void; onClose: () => void }) => {
  const [text, setText] = useState("");
  const [term, setTerm] = useState("");
  const [day, setDay] = useState<string | null>(null);
  const [calendar, setCalendar] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setTerm(text.trim()), 300);
    return () => window.clearTimeout(t);
  }, [text]);
  const results = useChatSearch(term, { peerId }, day);
  const active = term.length >= 2 || day !== null;
  const items = results.data ? [...results.data.items].reverse() : [];
  const what = [term.length >= 2 ? `«${term}»` : "", day !== null ? `el ${dateOnly(day)}` : ""].filter(Boolean).join(" ");

  return (
    <SidePanel title="Buscar mensajes" subtitle={where} onClose={onClose}>
      <div className={styles.body}>
        <input className={styles.input} type="search" autoFocus placeholder="Palabra, persona o archivo" value={text} onChange={(e) => setText(e.target.value)} aria-label={`Buscar en ${where}`} />
        <div className={styles.dayRow}>
          <button type="button" className={[styles.dayBtn, day !== null ? styles.dayOn : ""].join(" ")} onClick={() => setCalendar((v) => !v)} aria-expanded={calendar} aria-controls="chat-search-calendar">
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <rect x="2" y="3" width="12" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            {day !== null ? dateOnly(day) : "Elegir un día"}
          </button>
          {day !== null ? (
            <button type="button" className={styles.clearDay} onClick={() => setDay(null)} aria-label="Quitar el día">
              ×
            </button>
          ) : null}
        </div>
        {calendar ? (
          <div id="chat-search-calendar" className={styles.calendar}>
            <MiniCalendar
              value={day}
              onChange={(iso) => {
                setDay(iso);
                setCalendar(false);
              }}
              ariaLabel="Día de los mensajes"
            />
          </div>
        ) : null}
        {!active ? <p className={styles.muted}>Escriba al menos 2 letras o elija un día.</p> : null}
        {active && results.isPending ? <p className={styles.muted}>Buscando…</p> : null}
        {results.isError ? <p className={styles.muted}>No se pudo buscar. Intente de nuevo.</p> : null}
        {active && results.data && items.length === 0 ? <p className={styles.muted}>Nada coincide con {what} en esta conversación.</p> : null}
        {items.length > 0 ? <p className={styles.muted}>{int(items.length)} resultados, los más recientes primero</p> : null}
        <ul>
          {items.map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => onOpen(m)}>
                <small>
                  {m.userId === meId ? "Usted" : `${m.firstName} ${m.lastName}`} · {whenLabel(m.createdAt).toLowerCase()}
                  {m.threadRootId ? " · en un hilo" : ""}
                </small>
                <span>{bodyOrFiles(m)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </SidePanel>
  );
};
