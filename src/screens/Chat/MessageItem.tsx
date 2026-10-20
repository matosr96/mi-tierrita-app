import { useState, type KeyboardEvent } from "react";
import type { ChatItem } from "@/hooks/chat";
import { int } from "@/lib/format";
import { notify } from "@/stores/toasts";
import { ROLE_LABELS } from "@/stores/session";
import type { ChatMessage } from "@/types/api";
import { Avatar } from "./Avatar";
import { AttachmentView } from "./AttachmentView";
import { MessageBody } from "./MessageBody";
import { Ticks, ticksLabel } from "./Ticks";
import { timeLabel, whenLabel } from "./chatFormat";
import styles from "./MessageItem.module.css";

export type MessageActions = {
  onReply: (m: ChatMessage) => void;
  onThread?: ((m: ChatMessage) => void) | undefined;
  onPrivateReply?: ((m: ChatMessage) => void) | undefined;
  onPin?: ((m: ChatMessage, pinned: boolean) => void) | undefined;
  onInfo: (m: ChatMessage) => void;
  /** Corrige el texto; devuelve true si se guardó. */
  onEdit?: ((m: ChatMessage, body: string) => Promise<boolean>) | undefined;
  onDelete?: ((m: ChatMessage) => void) | undefined;
  onQuote: (id: number, inThread: boolean) => void;
  onRetry: (m: ChatItem) => void;
  onDiscard: (m: ChatItem) => void;
};

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
    <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ICONS = {
  reply: "M8 5 3.5 9.5 8 14M4 9.5h7.5a5 5 0 0 1 5 5V16",
  thread: "M3.5 4.5h10v7h-6l-3 2.5v-2.5h-1zM13.5 8h3v7h-1v2.2L13 15h-4.5",
  private: "M6.5 9V6.8a3.5 3.5 0 0 1 7 0V9M5 9h10v7.5H5z",
  pin: "M12.5 3 17 7.5l-2.6.9-3.3 3.3.3 3.3-1.3 1.3-6-6 1.3-1.3 3.3.3 3.3-3.3zM6.5 13.5 3 17",
  info: "M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM10 9v4.5M10 6.5v.3",
  copy: "M7 7h9v10H7zM4 13V3h9",
  edit: "M13 3.5 16.5 7 7 16.5H3.5V13zM11 5.5 14.5 9",
  trash: "M4 6h12M8 6V4h4v2M5.5 6l.8 10.5h7.4L14.5 6",
};

type Props = {
  m: ChatItem;
  mine: boolean;
  first: boolean;
  general: boolean;
  myUsername: string | undefined;
  highlighted: boolean;
  actions: MessageActions;
};

/** Un mensaje: cita, texto con menciones, adjuntos, hora y chulitos; acciones al pasar el cursor o con el teclado. */
export const MessageItem = ({ m, mine, first, general, myUsername, highlighted, actions }: Props) => {
  const sent = !m.local && m.id > 0 && !m.deleted;
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (editing === null || !actions.onEdit) return;
    setSaving(true);
    const ok = await actions.onEdit(m, editing.trim());
    setSaving(false);
    if (ok) setEditing(null);
  };
  const onEditKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") setEditing(null);
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void save();
    }
  };
  const copy = () =>
    void navigator.clipboard.writeText(m.body).then(
      () => notify.success("Texto copiado"),
      () => notify.error("No se pudo copiar"),
    );
  const participants = m.thread?.participants ?? [];

  return (
    <div
      id={sent ? `chat-msg-${m.id}` : undefined}
      className={[styles.msg, mine ? styles.mine : "", first ? styles.first : "", highlighted ? styles.highlight : ""].join(" ")}
      data-message-id={sent ? m.id : undefined}
    >
      {first ? (
        <div className={styles.meta}>
          {!mine ? <Avatar first={m.firstName} last={m.lastName} /> : null}
          <strong>{mine ? "Usted" : `${m.firstName} ${m.lastName}`}</strong>
          {!mine && general ? <span className={styles.role}>{ROLE_LABELS[m.role]}</span> : null}
        </div>
      ) : null}

      <div className={styles.row}>
        <div className={[styles.bubble, m.pinned ? styles.pinned : ""].join(" ")}>
          {m.pinned ? (
            <span className={styles.pinTag} title={`Fijado por ${m.pinned.by.name} · ${whenLabel(m.pinned.at)}`}>
              <Icon d={ICONS.pin} /> Fijado
            </span>
          ) : null}
          {m.replyTo ? (
            <button type="button" className={styles.quote} onClick={() => actions.onQuote(m.replyTo!.id, m.replyTo!.inThread)} title="Ir al mensaje citado">
              <strong>
                {m.replyTo.author.firstName} {m.replyTo.author.lastName}
                {m.replyTo.privateReply ? <em> · respuesta privada a #general</em> : null}
              </strong>
              <span>{m.replyTo.deleted ? <em>Se eliminó este mensaje</em> : m.replyTo.body || (m.replyTo.attachments > 0 ? `📎 ${int(m.replyTo.attachments)} ${m.replyTo.attachments === 1 ? "archivo" : "archivos"}` : "")}</span>
            </button>
          ) : null}
          {m.deleted ? (
            <p className={[styles.text, styles.deleted].join(" ")}>Se eliminó este mensaje</p>
          ) : editing !== null ? (
            <div className={styles.editor}>
              <label htmlFor={`editar-${m.id}`} className="sr-only">
                Editar mensaje
              </label>
              <textarea id={`editar-${m.id}`} value={editing} maxLength={1000} autoFocus onChange={(e) => setEditing(e.target.value)} onKeyDown={onEditKey} />
              <span>
                <small>Enter para guardar · Esc para cancelar</small>
                <button type="button" onClick={() => setEditing(null)}>
                  Cancelar
                </button>
                <button type="button" className={styles.saveBtn} onClick={() => void save()} disabled={saving || (editing.trim() === "" && m.attachments.length === 0)}>
                  {saving ? "Guardando…" : "Guardar"}
                </button>
              </span>
            </div>
          ) : m.body ? (
            <p className={styles.text}>
              <MessageBody body={m.body} mentions={m.mentions} myUsername={myUsername} general={general} />
            </p>
          ) : null}
          {m.attachments.length > 0 ? (
            <div className={styles.files}>
              {m.attachments.map((a) => (
                <AttachmentView key={a.id} file={a} />
              ))}
            </div>
          ) : null}
          <span className={styles.foot}>
            {m.editedAt && !m.deleted ? <span title={`Editado ${whenLabel(m.editedAt).toLowerCase()}`}>editado ·</span> : null}
            <time dateTime={m.createdAt} title={whenLabel(m.createdAt)}>
              {timeLabel(m.createdAt)}
            </time>
            {mine && !m.deleted ? (
              sent ? (
                <button type="button" className={styles.ticksBtn} onClick={() => actions.onInfo(m)} title={`${ticksLabel(m.local, m.receipts)} · ver detalle`}>
                  <Ticks local={m.local} receipts={m.receipts} />
                </button>
              ) : (
                <Ticks local={m.local} receipts={m.receipts} />
              )
            ) : null}
          </span>
        </div>

        {sent && editing === null ? (
          <div className={styles.toolbar} role="toolbar" aria-label="Acciones del mensaje">
            <button type="button" onClick={() => actions.onReply(m)} title="Responder citando" aria-label="Responder citando">
              <Icon d={ICONS.reply} />
            </button>
            {actions.onThread ? (
              <button type="button" onClick={() => actions.onThread!(m)} title="Responder en un hilo" aria-label="Responder en un hilo">
                <Icon d={ICONS.thread} />
              </button>
            ) : null}
            {actions.onPrivateReply ? (
              <button type="button" onClick={() => actions.onPrivateReply!(m)} title={`Responder por privado a ${m.firstName}`} aria-label={`Responder por privado a ${m.firstName}`}>
                <Icon d={ICONS.private} />
              </button>
            ) : null}
            {actions.onPin ? (
              <button type="button" onClick={() => actions.onPin!(m, !m.pinned)} title={m.pinned ? "Desfijar" : "Fijar mensaje"} aria-label={m.pinned ? "Desfijar" : "Fijar mensaje"} aria-pressed={Boolean(m.pinned)}>
                <Icon d={ICONS.pin} />
              </button>
            ) : null}
            {mine ? (
              <button type="button" onClick={() => actions.onInfo(m)} title="Quién lo recibió y lo leyó" aria-label="Quién lo recibió y lo leyó">
                <Icon d={ICONS.info} />
              </button>
            ) : null}
            {actions.onEdit && editing === null ? (
              <button type="button" onClick={() => setEditing(m.body)} title="Editar" aria-label="Editar mensaje">
                <Icon d={ICONS.edit} />
              </button>
            ) : null}
            {actions.onDelete ? (
              <button type="button" onClick={() => actions.onDelete!(m)} title="Eliminar para todos" aria-label="Eliminar mensaje">
                <Icon d={ICONS.trash} />
              </button>
            ) : null}
            {m.body ? (
              <button type="button" onClick={copy} title="Copiar texto" aria-label="Copiar texto">
                <Icon d={ICONS.copy} />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {m.thread && actions.onThread ? (
        <button type="button" className={styles.thread} onClick={() => actions.onThread!(m)}>
          <span className={styles.threadPeople} aria-hidden="true">
            {participants.slice(0, 3).map((p) => (
              <Avatar key={p.id} first={p.firstName} last={p.lastName} size="sm" />
            ))}
          </span>
          <strong>
            {int(m.thread.replies)} {m.thread.replies === 1 ? "respuesta" : "respuestas"}
          </strong>
          {m.thread.unread > 0 ? <span className={styles.threadUnread}>{int(m.thread.unread)} sin leer</span> : null}
          <small>Última {whenLabel(m.thread.lastReplyAt).toLowerCase()}</small>
        </button>
      ) : null}

      {m.local === "queued" ? (
        <span className={styles.queued}>
          Sin conexión: se enviará solo al volver.
          <button type="button" onClick={() => actions.onDiscard(m)}>
            Descartar
          </button>
        </span>
      ) : null}
      {m.local === "failed" ? (
        <span className={styles.failed}>
          No se envió.
          <button type="button" onClick={() => actions.onRetry(m)}>
            Reintentar
          </button>
          <button type="button" onClick={() => actions.onDiscard(m)}>
            Descartar
          </button>
        </span>
      ) : null}
    </div>
  );
};
