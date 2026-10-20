import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { EmptyState, ErrorState, Loading } from "@/components/ui";
import type { ChatItem } from "@/hooks/chat";
import { MessageItem, type MessageActions } from "./MessageItem";
import { dayLabel } from "./chatFormat";
import styles from "./MessageList.module.css";

/** Mensajes seguidos de la misma persona en menos de 5 minutos se agrupan bajo un solo encabezado. */
const startsGroup = (m: ChatItem, prev: ChatItem | undefined): boolean =>
  !prev || prev.userId !== m.userId || new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() > 5 * 60_000 || dayLabel(prev.createdAt) !== dayLabel(m.createdAt);

type Props = {
  items: ChatItem[];
  status: "pending" | "ready" | "error";
  hasMoreBefore: boolean;
  hasMoreAfter: boolean;
  loadingOlder: boolean;
  firstUnreadId: number | null;
  onLoadOlder: () => void;
  onJumpLatest: () => void;
  /** Mensaje al que hay que llevar la vista (búsqueda, fijados, cita, notificación). */
  focusId: number | null;
  onFocused: () => void;
  meId: number | undefined;
  myUsername: string | undefined;
  general: boolean;
  actionsFor: (m: ChatItem) => MessageActions;
  empty: { title: string; text: string };
  /** Contenido fijo arriba de la lista (el mensaje que abre un hilo). */
  header?: ReactNode;
  label: string;
};

/**
 * Lista de mensajes con su desplazamiento: se queda al final mientras la persona está ahí (también cuando cargan
 * fotos), conserva la posición al cargar historial arriba, abre en "Mensajes nuevos" si hay sin leer y resalta el
 * mensaje al que se salta.
 */
export const MessageList = (p: Props) => {
  const listRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const prevFirst = useRef<number | undefined>(undefined);
  const prevHeight = useRef(0);
  const opened = useRef(false);
  const [atBottom, setAtBottom] = useState(true);
  const [highlight, setHighlight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const firstId = p.items[0]?.id;
    const last = p.items.at(-1);
    if (prevFirst.current !== undefined && firstId !== prevFirst.current && p.items.some((m) => m.id === prevFirst.current)) {
      // Se cargó historial arriba: la vista no salta.
      el.scrollTop += el.scrollHeight - prevHeight.current;
    } else if (stick.current || last?.local === "sending") {
      el.scrollTop = el.scrollHeight;
      stick.current = true;
    }
    prevFirst.current = firstId;
    prevHeight.current = el.scrollHeight;
  }, [p.items]);

  // Al abrir: en el separador de nuevos si hay sin leer; si no, al final.
  useLayoutEffect(() => {
    if (opened.current || p.status !== "ready") return;
    opened.current = true;
    const el = listRef.current;
    const divider = el?.querySelector<HTMLElement>("[data-unread-divider]");
    if (el && divider && p.focusId === null) {
      el.scrollTop = Math.max(0, divider.offsetTop - 24);
      stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    }
  }, [p.status, p.focusId]);

  // Fotos que terminan de cargar o texto que cambia de alto: si estaba al final, sigue al final.
  useEffect(() => {
    const el = listRef.current;
    const inner = innerRef.current;
    if (!el || !inner || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      if (stick.current) el.scrollTop = el.scrollHeight;
      prevHeight.current = el.scrollHeight;
    });
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  const { focusId, onFocused } = p;
  useEffect(() => {
    if (focusId === null) return;
    const target = listRef.current?.querySelector<HTMLElement>(`[data-message-id="${focusId}"]`);
    if (!target) return;
    stick.current = false;
    target.scrollIntoView({ block: "center" });
    setHighlight(focusId);
    onFocused();
    const t = window.setTimeout(() => setHighlight(null), 2_500);
    return () => window.clearTimeout(t);
  }, [focusId, onFocused, p.items]);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    stick.current = bottom && !p.hasMoreAfter;
    setAtBottom(bottom);
    if (el.scrollTop < 80 && p.hasMoreBefore && !p.loadingOlder) p.onLoadOlder();
  };

  const jumpLatest = () => {
    if (p.hasMoreAfter) p.onJumpLatest();
    stick.current = true;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  return (
    <div className={styles.wrap}>
      <div ref={listRef} className={styles.list} onScroll={onScroll} role="log" aria-live="polite" aria-relevant="additions" aria-label={p.label}>
        <div ref={innerRef} className={styles.inner}>
          {p.header}
          {p.hasMoreBefore ? (
            <button type="button" className={styles.older} onClick={p.onLoadOlder} disabled={p.loadingOlder}>
              {p.loadingOlder ? "Cargando mensajes anteriores…" : "Cargar mensajes anteriores"}
            </button>
          ) : p.status === "ready" && p.items.length > 0 && !p.header ? (
            <p className={styles.start}>Este es el comienzo de la conversación.</p>
          ) : null}
          {p.status === "pending" ? <Loading text="Cargando mensajes…" /> : null}
          {p.status === "error" ? <ErrorState error={{ code: "500", message: "No se pudo cargar la conversación." }} /> : null}
          {p.status === "ready" && p.items.length === 0 ? <EmptyState title={p.empty.title} text={p.empty.text} /> : null}
          {p.items.map((m, i) => {
            const prev = p.items[i - 1];
            const newDay = !prev || dayLabel(prev.createdAt) !== dayLabel(m.createdAt);
            const unreadStart = m.id === p.firstUnreadId;
            return (
              <Fragment key={m.clientId ?? m.id}>
                {newDay ? <div className={styles.day}>{dayLabel(m.createdAt)}</div> : null}
                {unreadStart ? (
                  <div className={styles.unread} data-unread-divider>
                    <span>Mensajes nuevos</span>
                  </div>
                ) : null}
                <MessageItem
                  m={m}
                  mine={m.userId === p.meId}
                  first={startsGroup(m, prev) || unreadStart}
                  general={p.general}
                  myUsername={p.myUsername}
                  highlighted={highlight === m.id}
                  actions={p.actionsFor(m)}
                />
              </Fragment>
            );
          })}
        </div>
      </div>
      {!atBottom || p.hasMoreAfter ? (
        <button type="button" className={styles.latest} onClick={jumpLatest}>
          Ir a lo más reciente ↓
        </button>
      ) : null}
    </div>
  );
};
