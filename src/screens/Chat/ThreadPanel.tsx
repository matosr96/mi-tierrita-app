import { useCallback, useState } from "react";
import { useChatMessages, type ChatItem } from "@/hooks/chat";
import { int } from "@/lib/format";
import type { ChatMessage } from "@/types/api";
import { Composer, type MentionCandidate } from "./Composer";
import { MessageItem, type MessageActions } from "./MessageItem";
import { MessageList } from "./MessageList";
import { SidePanel } from "./SidePanel";
import styles from "./ThreadPanel.module.css";

type Props = {
  peerId: number | null;
  rootId: number;
  where: string;
  focusId: number | null;
  onFocused: () => void;
  meId: number | undefined;
  myUsername: string | undefined;
  candidates: MentionCandidate[];
  /** Acciones que no dependen del hilo (responder por privado, fijar, información, editar, eliminar). */
  common: (m: ChatMessage, inThread: boolean) => Pick<MessageActions, "onPrivateReply" | "onPin" | "onInfo" | "onEdit" | "onDelete">;
  /** La cita es de la conversación principal: la abre allá. */
  onQuoteOutside: (id: number) => void;
  onClose: () => void;
};

/** Hilo: el mensaje que lo abre, sus respuestas en vivo y una caja para responder solo dentro del hilo. */
export const ThreadPanel = ({ peerId, rootId, where, focusId, onFocused, meId, myUsername, candidates, common, onQuoteOutside, onClose }: Props) => {
  const thread = useChatMessages({ peerId, threadRootId: rootId }, { active: true, around: focusId ?? undefined });
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [localFocus, setLocalFocus] = useState<number | null>(null);
  const general = peerId === null;
  const root = thread.root;

  const onQuote = useCallback(
    (id: number) => {
      if (id === rootId || thread.items.some((m) => m.id === id)) setLocalFocus(id);
      else onQuoteOutside(id);
    },
    [rootId, thread.items, onQuoteOutside],
  );
  const actionsFor = (m: ChatItem): MessageActions => ({
    ...common(m, true),
    onReply: setReplyTo,
    onQuote,
    onRetry: thread.retry,
    onDiscard: thread.discard,
  });
  const rootActions = (m: ChatItem): MessageActions => ({ ...actionsFor(m), onPin: common(m, false).onPin });
  const handleFocused = useCallback(() => {
    setLocalFocus(null);
    onFocused();
  }, [onFocused]);

  const replies = thread.items.filter((m) => !m.local).length;
  return (
    <SidePanel
      title="Hilo"
      subtitle={where}
      onClose={onClose}
      footer={
        <Composer
          scopeKey={`hilo-${rootId}`}
          label="Responder en el hilo"
          placeholder="Responder en el hilo…"
          candidates={candidates}
          allowEveryone={false}
          replyTo={replyTo}
          privateReply={false}
          onCancelReply={() => setReplyTo(null)}
          onSend={thread.send}
          autoFocus
        />
      }
    >
      <MessageList
        items={thread.items}
        status={thread.status}
        hasMoreBefore={thread.hasMoreBefore}
        hasMoreAfter={thread.hasMoreAfter}
        loadingOlder={thread.loadingOlder}
        firstUnreadId={thread.firstUnreadId}
        onLoadOlder={() => void thread.loadOlder()}
        onJumpLatest={() => void thread.jumpToLatest()}
        focusId={localFocus ?? focusId}
        onFocused={handleFocused}
        meId={meId}
        myUsername={myUsername}
        general={general}
        actionsFor={actionsFor}
        label="Respuestas del hilo"
        empty={{ title: "Aún no hay respuestas", text: "Responda aquí: la conversación queda agrupada y no llena el canal." }}
        header={
          root ? (
            <div className={styles.root}>
              <MessageItem m={root} mine={root.userId === meId} first general={general} myUsername={myUsername} highlighted={false} actions={rootActions(root)} />
              <div className={styles.count}>
                <span>
                  {int(root.thread?.replies ?? replies)} {(root.thread?.replies ?? replies) === 1 ? "respuesta" : "respuestas"}
                </span>
              </div>
            </div>
          ) : null
        }
      />
    </SidePanel>
  );
};
