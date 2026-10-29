import { useState } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { EmptyState, Pagination, QueryState, Tabs, type TabOption } from "@/components/ui";
import { useChatMedia, useDownloadChatAttachment } from "@/hooks/chat";
import { ROLE_LABELS } from "@/stores/session";
import type { ChatMediaKind, ChatMember, ChatMessage, User } from "@/types/api";
import { Avatar } from "./Avatar";
import { MediaThumb } from "./MediaThumb";
import { PinsList } from "./PinsList";
import { SidePanel } from "./SidePanel";
import { durationLabel, presenceLabel, sizeLabel, whenLabel } from "./chatFormat";
import styles from "./InfoPanel.module.css";

type Tab = ChatMediaKind | "pins" | "people";
const TABS: TabOption<Tab>[] = [
  { value: "image", label: "Multimedia" },
  { value: "file", label: "Archivos" },
  { value: "audio", label: "Audios" },
  { value: "link", label: "Enlaces" },
  { value: "pins", label: "Fijados" },
  { value: "people", label: "Personas" },
];
const EMPTY: Record<ChatMediaKind, { title: string; text: string }> = {
  image: { title: "Sin fotos", text: "Las fotos que se envíen en esta conversación aparecerán aquí." },
  file: { title: "Sin archivos", text: "Los PDF, hojas de cálculo y documentos compartidos aparecerán aquí." },
  audio: { title: "Sin notas de voz", text: "Las notas de voz de esta conversación aparecerán aquí." },
  link: { title: "Sin enlaces", text: "Las direcciones web escritas en los mensajes aparecerán aquí." },
};

type Props = {
  peerId: number | null;
  peer: ChatMember | null;
  me: User | null;
  members: ChatMember[];
  where: string;
  pins: UseQueryResult<{ items: ChatMessage[] }>;
  canUnpin: boolean;
  onOpenMessage: (id: number) => void;
  onOpenPin: (m: ChatMessage) => void;
  onUnpin: (m: ChatMessage) => void;
  onOpenPerson: (id: number) => void;
  onClose: () => void;
};

/** Contenido de una pestaña de `GET /chat/media` (fotos en mosaico; archivos, audios y enlaces en lista), paginado. */
const MediaTab = ({ peerId, kind, onOpenMessage, meId }: { peerId: number | null; kind: ChatMediaKind; onOpenMessage: (id: number) => void; meId: number | undefined }) => {
  const [page, setPage] = useState(1);
  const media = useChatMedia({ peerId }, kind, page, kind === "image" ? 30 : 20);
  const download = useDownloadChatAttachment();
  const who = (id: number, first: string, last: string) => (id === meId ? "Usted" : `${first} ${last}`);
  return (
    <QueryState query={media} isEmpty={(d) => d.items.length === 0} empty={<EmptyState title={EMPTY[kind].title} text={EMPTY[kind].text} />}>
      {(d) => (
        <>
          {kind === "image" ? (
            <div className={styles.mosaic}>
              {d.items.map((it) =>
                it.kind === "image" ? <MediaThumb key={it.attachment.id} file={it.attachment} caption={`${who(it.author.id, it.author.firstName, it.author.lastName)} · ${whenLabel(it.createdAt).toLowerCase()}`} onOpen={() => onOpenMessage(it.messageId)} /> : null,
              )}
            </div>
          ) : (
            <ul className={styles.items}>
              {d.items.map((it, i) => (
                <li key={it.kind === "link" ? `${it.messageId}-${i}` : it.attachment.id}>
                  {it.kind === "link" ? (
                    <a href={it.url} target="_blank" rel="noopener noreferrer" className={styles.link} title={it.url}>
                      {it.url}
                    </a>
                  ) : (
                    <button type="button" className={styles.name} onClick={() => onOpenMessage(it.messageId)} title="Ir al mensaje">
                      {it.kind === "audio" ? `Nota de voz · ${durationLabel(it.attachment.durationMs)}` : it.attachment.name}
                      {it.kind === "file" ? <small> · {sizeLabel(it.attachment.size)}</small> : null}
                    </button>
                  )}
                  <span className={styles.meta}>
                    <button type="button" className={styles.goto} onClick={() => onOpenMessage(it.messageId)}>
                      {who(it.author.id, it.author.firstName, it.author.lastName)} · {whenLabel(it.createdAt).toLowerCase()}
                    </button>
                    {it.kind === "file" || it.kind === "audio" ? (
                      <button type="button" className={styles.action} onClick={() => download.mutate({ file: it.attachment })} disabled={download.isPending}>
                        Descargar
                      </button>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Pagination page={d} onPage={setPage} />
        </>
      )}
    </QueryState>
  );
};

/**
 * Información de la conversación: multimedia, archivos, notas de voz, enlaces, fijados y personas (en el canal, todo
 * el equipo; en un privado, las dos personas) con su rol y presencia.
 */
export const InfoPanel = ({ peerId, peer, me, members, where, pins, canUnpin, onOpenMessage, onOpenPin, onUnpin, onOpenPerson, onClose }: Props) => {
  const [tab, setTab] = useState<Tab>("image");
  const people: { id: number; firstName: string; lastName: string; role: User["role"]; online: boolean; lastSeenAt: string | null; me: boolean }[] = [
    ...(me ? [{ id: me.id, firstName: me.firstName, lastName: me.lastName, role: me.role, online: true, lastSeenAt: null, me: true }] : []),
    ...(peerId === null ? members : peer ? [peer] : []).map((m) => ({ id: m.id, firstName: m.firstName, lastName: m.lastName, role: m.role, online: m.online, lastSeenAt: m.lastSeenAt, me: false })),
  ];
  return (
    <SidePanel title="Información" subtitle={where} onClose={onClose}>
      <div className={styles.tabs}>
        <Tabs options={TABS} value={tab} onChange={setTab} ariaLabel="Contenido de la conversación" />
      </div>
      <div className={styles.body}>
        {tab === "pins" ? (
          <PinsList pins={pins} canUnpin={canUnpin} onOpen={onOpenPin} onUnpin={onUnpin} />
        ) : tab === "people" ? (
          <ul className={styles.people} aria-label="Personas de la conversación">
            {people.map((p) => (
              <li key={p.id}>
                {p.me ? (
                  <span className={styles.person}>
                    <Avatar first={p.firstName} last={p.lastName} online />
                    <span>
                      <strong>
                        {p.firstName} {p.lastName} (usted)
                      </strong>
                      <small>{ROLE_LABELS[p.role]} · Activo ahora</small>
                    </span>
                  </span>
                ) : (
                  <button type="button" className={styles.person} onClick={() => onOpenPerson(p.id)} title={`Escribirle a ${p.firstName}`}>
                    <Avatar first={p.firstName} last={p.lastName} online={p.online} />
                    <span>
                      <strong>
                        {p.firstName} {p.lastName}
                      </strong>
                      <small>
                        {ROLE_LABELS[p.role]} · {presenceLabel(p.online, p.lastSeenAt)}
                      </small>
                    </span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <MediaTab key={`${peerId ?? "general"}-${tab}`} peerId={peerId} kind={tab} onOpenMessage={onOpenMessage} meId={me?.id} />
        )}
      </div>
    </SidePanel>
  );
};
