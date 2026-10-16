import { Fragment, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { PageHeader } from "@/components/layout/AppShell";
import { Button, EmptyState, ErrorState, Loading } from "@/components/ui";
import { useChatMessages, useSendChatMessage } from "@/hooks/chat";
import { initials } from "@/lib/format";
import { ROLE_LABELS, useSessionStore } from "@/stores/session";
import type { ChatMessage } from "@/types/api";
import styles from "./ChatScreen.module.css";

const dayLabel = (iso: string): string => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Hoy";
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
};
const timeLabel = (iso: string): string => new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

/** Mensajes seguidos de la misma persona en menos de 5 minutos se agrupan bajo un solo encabezado. */
const startsGroup = (m: ChatMessage, prev: ChatMessage | undefined): boolean =>
  !prev || prev.userId !== m.userId || new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() > 5 * 60_000 || dayLabel(prev.createdAt) !== dayLabel(m.createdAt);

/** Chat del equipo (prototipo 11): canal general para caja, bodega y administración. Se actualiza cada pocos segundos. */
export const ChatScreen = () => {
  const me = useSessionStore((s) => s.user);
  const { items, status, push } = useChatMessages();
  const send = useSendChatMessage();
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  // Baja al último mensaje cuando llegan nuevos, salvo que la persona esté leyendo más arriba.
  useEffect(() => {
    const el = listRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [items.length]);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const body = text.trim();
    if (!body || send.isPending) return;
    try {
      const msg = await send.mutateAsync(body);
      push(msg);
      setText("");
      stickToBottom.current = true;
    } catch {
      /* el error se notifica con un aviso y el texto se conserva */
    }
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  const participants = [...new Map(items.map((m) => [m.userId, m])).values()];

  return (
    <>
      <PageHeader title="Chat del *equipo*" subtitle="Caja, bodega y administración coordinados en un solo canal, con los avisos del negocio." />

      <div className={styles.layout}>
        <section className={styles.room} aria-label="Canal general">
          <header className={styles.roomHead}>
            <span className={styles.hash} aria-hidden="true">
              #
            </span>
            <div>
              <h2>general</h2>
              <span>Canal de todo el equipo · se actualiza cada pocos segundos</span>
            </div>
          </header>

          <div
            ref={listRef}
            className={styles.messages}
            onScroll={(e) => {
              const el = e.currentTarget;
              stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
            }}
            aria-live="polite"
          >
            {status === "pending" ? <Loading text="Cargando mensajes…" /> : null}
            {status === "error" ? <ErrorState error={{ code: "500", message: "No se pudo cargar el chat." }} /> : null}
            {status === "ready" && items.length === 0 ? <EmptyState title="Aún no hay mensajes" text="Escriba el primero: un aviso, una pregunta o un pendiente para el equipo." /> : null}
            {items.map((m, i) => {
              const prev = items[i - 1];
              const mine = m.userId === me?.id;
              const newDay = !prev || dayLabel(prev.createdAt) !== dayLabel(m.createdAt);
              return (
                <Fragment key={m.id}>
                  {newDay ? <div className={styles.day}>{dayLabel(m.createdAt)}</div> : null}
                  <div className={[styles.msg, mine ? styles.mine : "", startsGroup(m, prev) ? styles.first : ""].join(" ")}>
                    {startsGroup(m, prev) ? (
                      <div className={styles.meta}>
                        {!mine ? <span className={styles.avatar}>{initials(m.firstName, m.lastName)}</span> : null}
                        <strong>{mine ? "Usted" : `${m.firstName} ${m.lastName}`}</strong>
                        {!mine ? <span className={styles.role}>{ROLE_LABELS[m.role]}</span> : null}
                        <time dateTime={m.createdAt}>{timeLabel(m.createdAt)}</time>
                      </div>
                    ) : null}
                    <p className={styles.bubble}>{m.body}</p>
                  </div>
                </Fragment>
              );
            })}
          </div>

          <form className={styles.composer} onSubmit={submit}>
            <label htmlFor="chat-input" className="sr-only">
              Mensaje para #general
            </label>
            <textarea id="chat-input" rows={1} maxLength={1000} placeholder="Escriba un mensaje para #general" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} />
            <Button type="submit" loading={send.isPending} disabled={!text.trim()}>
              Enviar
            </Button>
          </form>
          <p className={styles.hint}>Enter para enviar · Shift + Enter para un salto de línea</p>
        </section>

        <aside className={styles.team} aria-label="Quiénes han escrito">
          <h3>Equipo</h3>
          <p className={styles.teamNote}>Quienes han escrito en el canal.</p>
          <ul>
            {participants.map((p) => (
              <li key={p.userId}>
                <span className={styles.avatar}>{initials(p.firstName, p.lastName)}</span>
                <span>
                  <strong>
                    {p.firstName} {p.lastName}
                  </strong>
                  <small>{ROLE_LABELS[p.role]}</small>
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
};
