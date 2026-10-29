import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useComments, useCreateComment, useDeleteComment } from "@/hooks/comments";
import { useSessionStore, ROLE_LABELS } from "@/stores/session";
import { Button, EmptyState, QueryState } from "@/components/ui";
import { dateTime, initials } from "@/lib/format";
import { TitaAvatar } from "@/components/ai/TitaAvatar";
import { RichText } from "@/components/ai/RichText";
import { TitaProposalCards } from "@/components/ai/TitaProposalCards";
import { commentsService } from "@/services/comments";
import { PersonName } from "@/components/people/PersonName";
import type { CommentEntity, RecordComment } from "@/types/api";
import styles from "./CommentsPanel.module.css";

type Props = { entity: CommentEntity; entityId: number };

const BODY_MAX = 1000;

/**
 * Comentarios de un registro con «responder a» (brief 33): lista cronológica, cita del comentario al que se
 * responde encima del cuadro (como en el chat) y eliminación del comentario propio (la administración, de cualquiera).
 */
export const CommentsPanel = ({ entity, entityId }: Props) => {
  const user = useSessionStore((s) => s.user);
  // Tras mencionar a @Tita se consulta cada 2 s hasta que llegue su respuesta (máximo 90 s).
  const [waitingTita, setWaitingTita] = useState<{ since: number; replyTo: number } | null>(null);
  const comments = useComments(entity, entityId, waitingTita ? 2_000 : false);
  const create = useCreateComment();
  const remove = useDeleteComment();
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<RecordComment | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setBody("");
    setReplyTo(null);
    setConfirmId(null);
  }, [entity, entityId]);
  useEffect(() => {
    if (replyTo) inputRef.current?.focus();
  }, [replyTo]);
  useEffect(() => {
    if (!waitingTita) return;
    const answered = comments.data?.items.some((c) => c.tita && c.replyTo?.id === waitingTita.replyTo);
    if (answered || Date.now() - waitingTita.since > 90_000) setWaitingTita(null);
  }, [comments.data, waitingTita]);

  const send = async () => {
    const text = body.trim();
    if (text === "" || create.isPending) return;
    await create.mutateAsync({ entity, entityId, body: text, ...(replyTo ? { replyToId: replyTo.id } : {}) }).then(
      (created) => {
        setBody("");
        setReplyTo(null);
        if (/(^|[^\p{L}\p{N}_@])@tita\b/iu.test(text)) setWaitingTita({ since: Date.now(), replyTo: created.id });
      },
      () => undefined,
    );
  };
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    } else if (e.key === "Escape" && replyTo) {
      e.preventDefault();
      setReplyTo(null);
    }
  };
  const canDelete = (c: RecordComment) => user !== null && (user.role === "ADMIN" || c.author.id === user.id);

  return (
    <section className={styles.panel} aria-label="Comentarios">
      <QueryState query={comments} isEmpty={(d) => d.items.length === 0} empty={<EmptyState title="Sin comentarios" text="Escriba el primero: una nota, una aclaración o un pendiente sobre este registro." />}>
        {(data) => (
          <ol className={styles.list}>
            {data.items.map((c) => (
              <li key={c.id} className={styles.item}>
                {c.tita ? (
                  <TitaAvatar size={30} />
                ) : (
                  <span className={styles.avatar} aria-hidden="true">
                    {initials(c.author.firstName, c.author.lastName)}
                  </span>
                )}
                <div className={styles.bubble}>
                  <header className={styles.head}>
                    <strong className={styles.name}>{c.tita ? "Tita" : <PersonName userId={c.author.id}>{`${c.author.firstName} ${c.author.lastName}`}</PersonName>}</strong>
                    <span className={styles.role}>{c.tita ? `le responde a ${c.author.firstName}` : ROLE_LABELS[c.author.role]}</span>
                    <time className={styles.when} dateTime={c.createdAt}>
                      {dateTime(c.createdAt)}
                    </time>
                  </header>
                  {c.replyTo ? (
                    <blockquote className={styles.quote}>
                      <strong>
                        {c.replyTo.author.firstName} {c.replyTo.author.lastName}
                      </strong>
                      <span>{c.replyTo.deleted ? "Comentario eliminado" : c.replyTo.excerpt}</span>
                    </blockquote>
                  ) : null}
                  {c.tita ? (
                    <div className={styles.body}>
                      <RichText text={c.body} />
                      <TitaProposalCards proposals={c.titaProposals ?? []} actions={c.titaActions} canAct={user?.id === c.author.id} ownerName={c.author.firstName} persist={(input) => commentsService.titaAction(c.id, input)} />
                    </div>
                  ) : (
                    <p className={styles.body}>{c.body}</p>
                  )}
                  <div className={styles.actions}>
                    <button type="button" className={styles.action} onClick={() => setReplyTo(c)}>
                      Responder
                    </button>
                    {canDelete(c) ? (
                      confirmId === c.id ? (
                        <span className={styles.confirm}>
                          <span>¿Eliminar?</span>
                          <button
                            type="button"
                            className={[styles.action, styles.danger].join(" ")}
                            disabled={remove.isPending}
                            onClick={() => remove.mutate(c.id, { onSettled: () => setConfirmId(null) })}
                          >
                            Sí
                          </button>
                          <button type="button" className={styles.action} onClick={() => setConfirmId(null)}>
                            No
                          </button>
                        </span>
                      ) : (
                        <button type="button" className={[styles.action, styles.danger].join(" ")} onClick={() => setConfirmId(c.id)}>
                          Eliminar
                        </button>
                      )
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </QueryState>

      <form
        className={styles.composer}
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        {replyTo ? (
          <div className={styles.reply}>
            <div>
              <strong>
                Respondiendo a {replyTo.author.firstName} {replyTo.author.lastName}
              </strong>
              <span>{replyTo.body}</span>
            </div>
            <button type="button" onClick={() => setReplyTo(null)} aria-label="Quitar la cita" title="Quitar la cita (Esc)">
              ×
            </button>
          </div>
        ) : null}
        <textarea
          ref={inputRef}
          className={styles.input}
          value={body}
          maxLength={BODY_MAX}
          rows={2}
          placeholder={replyTo ? "Escriba su respuesta…" : "Escriba un comentario…"}
          aria-label="Nuevo comentario"
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <div className={styles.composerFoot}>
          <span className={styles.hint}>{waitingTita ? "Tita está preparando su respuesta…" : "Enter envía · Shift+Enter salto de línea · @Tita para preguntarle"}</span>
          <Button type="submit" size="sm" loading={create.isPending} disabled={body.trim() === ""}>
            {replyTo ? "Responder" : "Comentar"}
          </Button>
        </div>
      </form>
    </section>
  );
};
