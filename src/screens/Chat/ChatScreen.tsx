import { Fragment, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/AppShell";
import { Button, EmptyState, ErrorState, Loading } from "@/components/ui";
import { useChatMessages, useChatTeam, useSendChatMessage } from "@/hooks/chat";
import { initials, int } from "@/lib/format";
import { ROLE_LABELS, useSessionStore } from "@/stores/session";
import type { ChatMember, ChatMessage, ChatPreview } from "@/types/api";
import styles from "./ChatScreen.module.css";

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

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

/** "hace 5 min", "hace 2 h", "ayer"…: última conexión de quien está desconectado. */
const sinceLabel = (iso: string | null): string => {
  if (!iso) return "Nunca se ha conectado";
  const min = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (min < 60) return `Última conexión hace ${int(min)} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Última conexión hace ${int(h)} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "Última conexión ayer" : `Última conexión hace ${int(d)} días`;
};

const previewText = (p: ChatPreview, empty: string): string => (p ? `${p.mine ? "Usted: " : ""}${p.body}` : empty);

/** Mensajes seguidos de la misma persona en menos de 5 minutos se agrupan bajo un solo encabezado. */
const startsGroup = (m: ChatMessage, prev: ChatMessage | undefined): boolean =>
  !prev || prev.userId !== m.userId || new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() > 5 * 60_000 || dayLabel(prev.createdAt) !== dayLabel(m.createdAt);

const Avatar = ({ first, last, online }: { first: string; last: string; online?: boolean | undefined }) => (
  <span className={styles.avatar}>
    {initials(first, last)}
    {online !== undefined ? <i className={[styles.presence, online ? styles.isOnline : ""].join(" ")} aria-label={online ? "En línea" : "Desconectado"} /> : null}
  </span>
);

/**
 * Chat del equipo (prototipo 11): canal general y mensajes privados, con quién está en línea y lo que falta por leer.
 * La conversación activa se consulta cada 4 s; el equipo, cada 5 s mientras la pantalla está abierta.
 */
export const ChatScreen = () => {
  const me = useSessionStore((s) => s.user);
  const [params, setParams] = useSearchParams();
  const team = useChatTeam(5_000);
  const members = team.data?.members ?? [];
  const rawPeer = Number(params.get("con"));
  const peer: ChatMember | null = members.find((m) => m.id === rawPeer) ?? null;
  // Mientras llega el equipo se respeta el id de la URL para no cargar dos veces.
  const peerId = Number.isInteger(rawPeer) && rawPeer > 0 && (peer !== null || team.isPending) ? rawPeer : null;
  const { items, status, push } = useChatMessages(peerId);
  const send = useSendChatMessage();
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  useEffect(() => {
    const el = listRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [items.length, peerId]);
  useEffect(() => {
    stickToBottom.current = true;
    setText("");
  }, [peerId]);

  const open = (id: number | null) => setParams(id === null ? {} : { con: String(id) });

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const body = text.trim();
    if (!body || send.isPending) return;
    try {
      const msg = await send.mutateAsync(peerId === null ? { body } : { body, recipientId: peerId });
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

  const q = normalize(search.trim());
  const visible = q ? members.filter((m) => normalize(`${m.firstName} ${m.lastName} ${m.username}`).includes(q)) : members;
  const online = members.filter((m) => m.online);
  const offline = members.filter((m) => !m.online);
  const where = peer ? `${peer.firstName}` : "#general";

  return (
    <>
      <PageHeader title="Chat del equipo" subtitle="Caja, bodega y administración coordinados: canal general, mensajes privados y quién está en línea." />

      <div className={styles.layout}>
        {/* ---------- conversaciones ---------- */}
        <nav className={styles.inbox} aria-label="Conversaciones">
          <h2 className={styles.inboxTitle}>Mensajes</h2>
          <input className={styles.search} type="search" placeholder="Buscar persona" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar persona" />

          <span className={styles.groupLabel}>Canales</span>
          <button type="button" className={[styles.conv, peerId === null ? styles.convOn : ""].join(" ")} onClick={() => open(null)} aria-current={peerId === null ? "page" : undefined}>
            <span className={styles.hashSmall} aria-hidden="true">
              #
            </span>
            <span className={styles.convText}>
              <strong>general</strong>
              <small>{previewText(team.data?.general.lastMessage ?? null, "Todo el equipo")}</small>
            </span>
            {team.data && team.data.general.unread > 0 && peerId !== null ? <span className={styles.unread}>{team.data.general.unread}</span> : null}
          </button>

          <span className={styles.groupLabel}>Mensajes privados</span>
          {team.isPending ? <p className={styles.muted}>Cargando equipo…</p> : null}
          {visible.map((m) => (
            <button key={m.id} type="button" className={[styles.conv, peerId === m.id ? styles.convOn : ""].join(" ")} onClick={() => open(m.id)} aria-current={peerId === m.id ? "page" : undefined}>
              <Avatar first={m.firstName} last={m.lastName} online={m.online} />
              <span className={styles.convText}>
                <strong>
                  {m.firstName} {m.lastName}
                </strong>
                <small>{previewText(m.lastMessage, ROLE_LABELS[m.role])}</small>
              </span>
              {m.unread > 0 && peerId !== m.id ? <span className={styles.unread}>{m.unread}</span> : null}
            </button>
          ))}
          {team.data && visible.length === 0 ? <p className={styles.muted}>Nadie coincide con la búsqueda.</p> : null}
        </nav>

        {/* ---------- conversación ---------- */}
        <section className={styles.room} aria-label={peer ? `Conversación con ${peer.firstName} ${peer.lastName}` : "Canal general"}>
          <header className={styles.roomHead}>
            {peer ? (
              <Avatar first={peer.firstName} last={peer.lastName} online={peer.online} />
            ) : (
              <span className={styles.hash} aria-hidden="true">
                #
              </span>
            )}
            <div>
              <h2>{peer ? `${peer.firstName} ${peer.lastName}` : "general"}</h2>
              <span>
                {peer
                  ? `${ROLE_LABELS[peer.role]} · ${peer.online ? "En línea" : sinceLabel(peer.lastSeenAt)} · solo ustedes dos ven esta conversación`
                  : `Canal de todo el equipo · ${int(team.data?.onlineCount ?? 1)} en línea`}
              </span>
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
            {status === "error" ? <ErrorState error={{ code: "500", message: "No se pudo cargar la conversación." }} /> : null}
            {status === "ready" && items.length === 0 ? (
              <EmptyState
                title={peer ? `Aún no le ha escrito a ${peer.firstName}` : "Aún no hay mensajes"}
                text={peer ? "Lo que escriba aquí solo lo verán ustedes dos." : "Escriba el primero: un aviso, una pregunta o un pendiente para el equipo."}
              />
            ) : null}
            {items.map((m, i) => {
              const prev = items[i - 1];
              const mine = m.userId === me?.id;
              const newDay = !prev || dayLabel(prev.createdAt) !== dayLabel(m.createdAt);
              const first = startsGroup(m, prev);
              return (
                <Fragment key={m.id}>
                  {newDay ? <div className={styles.day}>{dayLabel(m.createdAt)}</div> : null}
                  <div className={[styles.msg, mine ? styles.mine : "", first ? styles.first : ""].join(" ")}>
                    {first ? (
                      <div className={styles.meta}>
                        {!mine ? <Avatar first={m.firstName} last={m.lastName} /> : null}
                        <strong>{mine ? "Usted" : `${m.firstName} ${m.lastName}`}</strong>
                        {!mine && !peer ? <span className={styles.role}>{ROLE_LABELS[m.role]}</span> : null}
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
              Mensaje para {where}
            </label>
            <textarea id="chat-input" rows={1} maxLength={1000} placeholder={`Escriba un mensaje para ${where}`} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} />
            <Button type="submit" loading={send.isPending} disabled={!text.trim()}>
              Enviar
            </Button>
          </form>
          <p className={styles.hint}>Enter para enviar · Shift + Enter para un salto de línea</p>
        </section>

        {/* ---------- equipo ---------- */}
        <aside className={styles.team} aria-label="Equipo">
          <h3>Equipo</h3>
          <span className={styles.groupLabel}>En línea · {int(online.length + 1)}</span>
          <ul>
            {me ? (
              <li>
                <Avatar first={me.firstName} last={me.lastName} online />
                <span>
                  <strong>
                    {me.firstName} {me.lastName} (usted)
                  </strong>
                  <small>{ROLE_LABELS[me.role]}</small>
                </span>
              </li>
            ) : null}
            {online.map((m) => (
              <li key={m.id}>
                <button type="button" className={styles.teamBtn} onClick={() => open(m.id)} title={`Escribirle a ${m.firstName}`}>
                  <Avatar first={m.firstName} last={m.lastName} online />
                  <span>
                    <strong>
                      {m.firstName} {m.lastName}
                    </strong>
                    <small>{ROLE_LABELS[m.role]}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <span className={styles.groupLabel}>Desconectados · {int(offline.length)}</span>
          <ul>
            {offline.map((m) => (
              <li key={m.id}>
                <button type="button" className={styles.teamBtn} onClick={() => open(m.id)} title={`Escribirle a ${m.firstName}`}>
                  <Avatar first={m.firstName} last={m.lastName} online={false} />
                  <span>
                    <strong>
                      {m.firstName} {m.lastName}
                    </strong>
                    <small>{sinceLabel(m.lastSeenAt)}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
};
