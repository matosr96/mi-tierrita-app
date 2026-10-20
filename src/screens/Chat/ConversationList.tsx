import { useEffect, useState } from "react";
import { useChatSearch } from "@/hooks/chat";
import { int } from "@/lib/format";
import { ROLE_LABELS } from "@/stores/session";
import type { ChatMember, ChatMessage, ChatTeam } from "@/types/api";
import { Avatar } from "./Avatar";
import { normalize, previewText, whenLabel } from "./chatFormat";
import styles from "./ConversationList.module.css";

const Unread = ({ count, mentions }: { count: number; mentions: number }) =>
  count > 0 ? (
    <span className={[styles.unread, mentions > 0 ? styles.mention : ""].join(" ")} aria-label={`${count} sin leer${mentions > 0 ? `, ${mentions} con mención` : ""}`}>
      {mentions > 0 ? "@ " : ""}
      {count}
    </span>
  ) : null;

type Props = {
  team: ChatTeam | undefined;
  loading: boolean;
  meId: number | undefined;
  peerId: number | null;
  onOpen: (peerId: number | null) => void;
  onOpenResult: (m: ChatMessage) => void;
};

/**
 * Bandeja: canal general y privados con lo que falta por leer (las menciones se distinguen) y un buscador que filtra
 * personas y, desde 2 letras, busca en los mensajes de todas las conversaciones que la persona puede ver.
 */
export const ConversationList = ({ team, loading, meId, peerId, onOpen, onOpenResult }: Props) => {
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  useEffect(() => {
    const t = window.setTimeout(() => setTerm(search.trim()), 300);
    return () => window.clearTimeout(t);
  }, [search]);
  const results = useChatSearch(term, "all");
  const members = team?.members ?? [];
  const q = normalize(search.trim());
  const visible = q ? members.filter((m) => normalize(`${m.firstName} ${m.lastName} ${m.username}`).includes(q)) : members;
  const nameOf = (id: number) => {
    const m = members.find((x) => x.id === id);
    return m ? `${m.firstName} ${m.lastName}` : "una persona";
  };
  const whereOf = (m: ChatMessage) =>
    m.recipientId === null ? `#general${m.threadRootId ? " · hilo" : ""}` : `Privado con ${nameOf(m.userId === meId ? m.recipientId : m.userId)}${m.threadRootId ? " · hilo" : ""}`;

  const conv = (m: ChatMember) => (
    <button key={m.id} type="button" className={[styles.conv, peerId === m.id ? styles.on : ""].join(" ")} onClick={() => onOpen(m.id)} aria-current={peerId === m.id ? "page" : undefined}>
      <Avatar first={m.firstName} last={m.lastName} online={m.online} />
      <span className={styles.text}>
        <strong>
          {m.firstName} {m.lastName}
        </strong>
        <small>{previewText(m.lastMessage, ROLE_LABELS[m.role])}</small>
      </span>
      {peerId !== m.id ? <Unread count={m.unread} mentions={m.mentions} /> : null}
    </button>
  );

  return (
    <nav className={styles.inbox} aria-label="Conversaciones">
      <h2 className={styles.title}>Mensajes</h2>
      <input className={styles.search} type="search" placeholder="Buscar personas o mensajes" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar personas o mensajes" />

      {term.length >= 2 ? (
        <>
          <span className={styles.group}>Mensajes que coinciden</span>
          {results.isPending ? <p className={styles.muted}>Buscando…</p> : null}
          {results.isError ? <p className={styles.muted}>No se pudo buscar. Intente de nuevo.</p> : null}
          {results.data && results.data.items.length === 0 ? <p className={styles.muted}>Ningún mensaje coincide con «{term}».</p> : null}
          {results.data
            ? [...results.data.items].reverse().map((m) => (
                <button key={m.id} type="button" className={styles.result} onClick={() => onOpenResult(m)}>
                  <small>
                    {whereOf(m)} · {whenLabel(m.createdAt).toLowerCase()}
                  </small>
                  <strong>{m.userId === meId ? "Usted" : `${m.firstName} ${m.lastName}`}</strong>
                  <span>{m.body || `📎 ${m.attachments.map((a) => a.name).join(", ")}`}</span>
                </button>
              ))
            : null}
          {results.data && results.data.items.length > 0 ? <p className={styles.muted}>{int(results.data.items.length)} resultados (los más recientes primero)</p> : null}
        </>
      ) : null}

      <span className={styles.group}>Canales</span>
      <button type="button" className={[styles.conv, peerId === null ? styles.on : ""].join(" ")} onClick={() => onOpen(null)} aria-current={peerId === null ? "page" : undefined}>
        <span className={styles.hash} aria-hidden="true">
          #
        </span>
        <span className={styles.text}>
          <strong>general</strong>
          <small>{previewText(team?.general.lastMessage ?? null, "Todo el equipo")}</small>
        </span>
        {team && peerId !== null ? <Unread count={team.general.unread} mentions={team.general.mentions} /> : null}
      </button>

      <span className={styles.group}>Mensajes privados</span>
      {loading ? <p className={styles.muted}>Cargando equipo…</p> : null}
      {visible.map(conv)}
      {team && visible.length === 0 ? <p className={styles.muted}>{members.length === 0 ? "Aún no hay más personas en el equipo." : "Nadie coincide con la búsqueda."}</p> : null}
    </nav>
  );
};
