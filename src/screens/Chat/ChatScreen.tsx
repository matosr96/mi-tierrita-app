import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/AppShell";
import { Button, Modal } from "@/components/ui";
import { useChatMessages, useChatPins, useChatTeam, useDeleteChatMessage, useEditChatMessage, usePinChatMessage, type ChatItem } from "@/hooks/chat";
import { int } from "@/lib/format";
import { useChatLiveStore } from "@/stores/chatLive";
import { ROLE_LABELS, useSessionStore } from "@/stores/session";
import type { ChatMember, ChatMessage } from "@/types/api";
import { Avatar } from "./Avatar";
import { Composer, type MentionCandidate } from "./Composer";
import { ConversationList } from "./ConversationList";
import { InfoPanel } from "./InfoPanel";
import type { MessageActions } from "./MessageItem";
import { MessageList } from "./MessageList";
import { PinnedBar } from "./PinnedBar";
import { PinsPanel } from "./PinsPanel";
import { ReceiptsModal } from "./ReceiptsModal";
import { SearchPanel } from "./SearchPanel";
import { TeamPanel } from "./TeamPanel";
import { ThreadPanel } from "./ThreadPanel";
import { bodyOrFiles, sinceLabel } from "./chatFormat";
import styles from "./ChatScreen.module.css";

const HeadIcon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
    <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const HEAD_ICONS = {
  back: "M12 4 6 10l6 6",
  search: "M9 15.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM13.8 13.8 17.5 17.5",
  pin: "M12.5 3 17 7.5l-2.6.9-3.3 3.3.3 3.3-1.3 1.3-6-6 1.3-1.3 3.3.3 3.3-3.3zM6.5 13.5 3 17",
  info: "M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM10 9v4.5M10 6.5v.3",
};

const positive = (raw: string | null): number | null => {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const NARROW = "(max-width: 900px)";

/** true en pantallas angostas (bajo 900 px), donde la bandeja y la sala se turnan la pantalla. */
const useNarrow = (): boolean => {
  const [narrow, setNarrow] = useState(() => window.matchMedia(NARROW).matches);
  useEffect(() => {
    const mq = window.matchMedia(NARROW);
    const on = () => setNarrow(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return narrow;
};

/** Permiso de notificaciones del navegador ("default" = aún no se ha preguntado). */
const notificationPermission = (): NotificationPermission | "unsupported" => ("Notification" in window ? Notification.permission : "unsupported");

/**
 * Chat del equipo (administración, secretaría y bodega): canal general y privados en vivo, con chulitos de enviado,
 * entregado, visto y reproducido (y el detalle por persona), respuestas citando, hilos, respuestas por privado,
 * fijados, menciones, adjuntos y notas de voz, búsqueda por texto y día, información de la conversación y avisos de
 * lo que falta por leer. URL: `?con=<persona>&hilo=<mensaje>&m=<mensaje a mostrar>`. Bajo 900 px la bandeja y la sala
 * se turnan la pantalla completa (`roomOpen`): la sala se monta en `document.body` con un portal porque el `main` del
 * armazón (`view-transition-name`) es un contexto de apilamiento y desde dentro nada taparía la barra; los paneles
 * laterales y los modales van entonces dentro de la sala.
 */
export const ChatScreen = () => {
  const me = useSessionStore((s) => s.user);
  const live = useChatLiveStore((s) => s.live);
  const setViewing = useChatLiveStore((s) => s.setViewing);
  const [params, setParams] = useSearchParams();
  const team = useChatTeam(30_000);
  const members = useMemo(() => team.data?.members ?? [], [team.data]);

  const rawPeer = positive(params.get("con"));
  const peer: ChatMember | null = members.find((m) => m.id === rawPeer) ?? null;
  // Mientras llega el equipo se respeta el id de la URL para no cargar dos veces.
  const peerId = rawPeer !== null && (peer !== null || team.isPending) ? rawPeer : null;
  const threadId = positive(params.get("hilo"));
  const focusParam = positive(params.get("m"));
  const general = peerId === null;

  // Mensaje al que hay que llevar la vista: en el hilo si viene con `hilo`, si no en la conversación.
  const [mainFocus, setMainFocus] = useState<number | null>(null);
  const threadFocus = threadId !== null ? focusParam : null;
  useEffect(() => {
    if (focusParam !== null && threadId === null) setMainFocus(focusParam);
    if (focusParam !== null) setRoomOpen(true);
  }, [focusParam, threadId]);

  const main = useChatMessages({ peerId, threadRootId: null }, { active: true, around: threadId === null ? (focusParam ?? undefined) : (threadId ?? undefined), enabled: !team.isPending || rawPeer === null });
  const pins = useChatPins(peerId);
  const pin = usePinChatMessage();
  const editMsg = useEditChatMessage();
  const deleteMsg = useDeleteChatMessage();
  const [toDelete, setToDelete] = useState<ChatMessage | null>(null);
  const narrow = useNarrow();
  const [side, setSide] = useState<"team" | "pins" | "search" | "info">("team");
  // En pantallas angostas: la sala ocupa toda la pantalla cuando hay una conversación abierta; si no, la bandeja.
  const [roomOpen, setRoomOpen] = useState(() => params.has("con") || params.has("m") || params.has("hilo"));
  const [replyTo, setReplyTo] = useState<{ key: string; message: ChatMessage } | null>(null);
  const [info, setInfo] = useState<ChatMessage | null>(null);
  const [permission, setPermission] = useState(notificationPermission);
  const convKey = `${peerId ?? "general"}`;

  useEffect(() => {
    setViewing({ peerId, threadRootId: threadId });
    return () => setViewing(null);
  }, [peerId, threadId, setViewing]);
  useEffect(() => setSide("team"), [peerId]);

  const navigate = useCallback(
    (next: { con?: number | null; hilo?: number | null; m?: number | null }) => {
      const p: Record<string, string> = {};
      const con = next.con === undefined ? peerId : next.con;
      const hilo = next.hilo === undefined ? threadId : next.hilo;
      if (con !== null) p["con"] = String(con);
      if (hilo !== null) p["hilo"] = String(hilo);
      if (next.m) p["m"] = String(next.m);
      setParams(p);
    },
    [peerId, threadId, setParams],
  );
  const open = (id: number | null) => {
    navigate({ con: id, hilo: null });
    setRoomOpen(true);
  };
  /**
   * Lleva la vista a un mensaje de esta conversación dejando `?m=` en la URL (y lo carga si hace falta). En pantallas
   * angostas cierra el panel lateral, que de otro modo taparía el mensaje.
   */
  const goToMessage = useCallback(
    (id: number) => {
      navigate({ m: id });
      void main.jumpTo(id);
      setRoomOpen(true);
      if (narrow) setSide("team");
    },
    [navigate, main, narrow],
  );
  const clearFocusParam = useCallback(() => {
    if (params.has("m")) {
      const p = new URLSearchParams(params);
      p.delete("m");
      setParams(p, { replace: true });
    }
  }, [params, setParams]);
  const onMainFocused = useCallback(() => {
    setMainFocus(null);
    clearFocusParam();
  }, [clearFocusParam]);

  /** Lleva la conversación principal a un mensaje (lo carga si hace falta). */
  const focusMain = useCallback(
    (id: number) => {
      void main.jumpTo(id).then(() => setMainFocus(id));
    },
    [main],
  );

  const canPinHere = general ? me?.role === "ADMIN" : true;
  const memberIds = useMemo(() => new Set(members.map((m) => m.id)), [members]);

  const common = useCallback(
    (m: ChatMessage, inThread: boolean): Pick<MessageActions, "onPrivateReply" | "onPin" | "onInfo" | "onEdit" | "onDelete"> => ({
      // Responder por privado: solo a mensajes de otra persona (activa) en el canal general.
      onPrivateReply:
        general && m.userId !== me?.id && memberIds.has(m.userId)
          ? (msg) => {
              setReplyTo({ key: String(msg.userId), message: msg });
              navigate({ con: msg.userId, hilo: null });
            }
          : undefined,
      onPin: canPinHere && !inThread && m.threadRootId === null ? (msg, pinned) => pin.mutate({ id: msg.id, pinned }) : undefined,
      onInfo: setInfo,
      // Editar: solo lo propio. Eliminar: lo propio y, en #general, la administración también.
      onEdit:
        m.userId === me?.id
          ? async (msg, body) => {
              try {
                main.replace(await editMsg.mutateAsync({ id: msg.id, body }));
                return true;
              } catch {
                return false;
              }
            }
          : undefined,
      onDelete: m.userId === me?.id || (general && me?.role === "ADMIN") ? setToDelete : undefined,
    }),
    [general, me?.id, me?.role, memberIds, navigate, canPinHere, pin, editMsg, main],
  );

  const mainActions = (m: ChatItem): MessageActions => ({
    ...common(m, false),
    onReply: (msg) => setReplyTo({ key: convKey, message: msg }),
    onThread: (msg) => navigate({ hilo: msg.id }),
    onQuote: (id, inThread) => (inThread ? navigate({ hilo: null, m: id }) : focusMain(id)),
    onRetry: main.retry,
    onDiscard: main.discard,
  });

  // Personas a las que se puede mencionar: todo el equipo en #general, solo la otra persona en un privado.
  const candidates: MentionCandidate[] = general ? members : peer ? [peer] : [];
  const where = peer ? `${peer.firstName}` : "#general";
  const reply = replyTo?.key === convKey ? replyTo.message : null;
  const pinList = pins.data?.items ?? [];

  const openResult = (m: ChatMessage) => {
    const con = m.recipientId === null ? null : m.userId === me?.id ? m.recipientId : m.userId;
    if (m.threadRootId !== null) navigate({ con, hilo: m.threadRootId, m: m.id });
    else if (con === peerId) {
      navigate({ con, hilo: threadId });
      focusMain(m.id);
    } else navigate({ con, hilo: null, m: m.id });
    setRoomOpen(true);
  };
  const toggleSide = (which: "pins" | "search" | "info") => setSide(side === which ? "team" : which);

  const askPermission = () => {
    void Notification.requestPermission().then(setPermission);
  };

  const panel =
    threadId !== null ? (
      <ThreadPanel
        key={`${convKey}-${threadId}`}
        peerId={peerId}
        rootId={threadId}
        where={peer ? `Privado con ${peer.firstName}` : "#general"}
        focusId={threadFocus}
        onFocused={clearFocusParam}
        meId={me?.id}
        myUsername={me?.username}
        candidates={candidates}
        common={common}
        onQuoteOutside={focusMain}
        onClose={() => navigate({ hilo: null })}
      />
    ) : side === "pins" ? (
      <PinsPanel
        pins={pins}
        where={peer ? `Privado con ${peer.firstName}` : "#general"}
        canUnpin={canPinHere}
        onOpen={(m) => focusMain(m.id)}
        onUnpin={(m) => pin.mutate({ id: m.id, pinned: false })}
        onClose={() => setSide("team")}
      />
    ) : side === "search" ? (
      <SearchPanel
        key={convKey}
        peerId={peerId}
        where={peer ? `Privado con ${peer.firstName}` : "#general"}
        meId={me?.id}
        onOpen={(m) => (m.threadRootId !== null ? navigate({ hilo: m.threadRootId, m: m.id }) : goToMessage(m.id))}
        onClose={() => setSide("team")}
      />
    ) : side === "info" ? (
      <InfoPanel
        key={convKey}
        peerId={peerId}
        peer={peer}
        me={me}
        members={members}
        where={peer ? `Privado con ${peer.firstName}` : "#general"}
        pins={pins}
        canUnpin={canPinHere}
        onOpenMessage={goToMessage}
        onOpenPin={(m) => goToMessage(m.id)}
        onUnpin={(m) => pin.mutate({ id: m.id, pinned: false })}
        onOpenPerson={open}
        onClose={() => setSide("team")}
      />
    ) : (
      <TeamPanel me={me} members={members} onOpen={open} />
    );

  const room = (
    <section className={[styles.room, narrow && roomOpen ? styles.roomFull : ""].join(" ")} aria-label={peer ? `Conversación con ${peer.firstName} ${peer.lastName}` : "Canal general"}>
      <header className={styles.roomHead}>
        <button type="button" className={styles.back} onClick={() => setRoomOpen(false)} aria-label="Atrás, a la bandeja" title="Atrás">
          <HeadIcon d={HEAD_ICONS.back} />
          <span>Atrás</span>
        </button>
        {peer ? (
          <Avatar first={peer.firstName} last={peer.lastName} online={peer.online} />
        ) : (
          <span className={styles.hash} aria-hidden="true">
            #
          </span>
        )}
        <div className={styles.roomTitle}>
          <h2>{peer ? `${peer.firstName} ${peer.lastName}` : "general"}</h2>
          <span>
            {peer
              ? `${ROLE_LABELS[peer.role]} · ${peer.online ? "En línea" : sinceLabel(peer.lastSeenAt)} · solo ustedes dos ven esta conversación`
              : `Canal de todo el equipo · ${int(team.data?.onlineCount ?? 1)} en línea`}
          </span>
        </div>
        <span className={[styles.live, live ? styles.liveOn : ""].join(" ")} title={live ? "Los mensajes llegan al instante" : "Reconectando; mientras tanto se consulta cada pocos segundos"}>
          {live ? "En vivo" : "Reconectando…"}
        </span>
        <div className={styles.headActions}>
          <Button variant="ghost" size="sm" className={styles.headBtn} onClick={() => toggleSide("search")} aria-pressed={side === "search"} aria-label="Buscar mensajes" title="Buscar mensajes">
            <HeadIcon d={HEAD_ICONS.search} />
            <span>Buscar mensajes</span>
          </Button>
          <Button variant="ghost" size="sm" className={styles.headBtn} onClick={() => toggleSide("pins")} aria-pressed={side === "pins"} aria-label="Mensajes fijados" title="Mensajes fijados">
            <HeadIcon d={HEAD_ICONS.pin} />
            <span>Fijados{pinList.length > 0 ? ` · ${int(pinList.length)}` : ""}</span>
          </Button>
          <Button variant="ghost" size="sm" className={styles.headBtn} onClick={() => toggleSide("info")} aria-pressed={side === "info"} aria-label="Información de la conversación" title="Información de la conversación">
            <HeadIcon d={HEAD_ICONS.info} />
            <span>Info</span>
          </Button>
        </div>
      </header>

      <PinnedBar pins={pinList} onOpen={(m) => goToMessage(m.id)} onShowAll={() => setSide("pins")} />

      <MessageList
        key={`lista-${convKey}`}
        items={main.items}
        status={main.status}
        hasMoreBefore={main.hasMoreBefore}
        hasMoreAfter={main.hasMoreAfter}
        loadingOlder={main.loadingOlder}
        firstUnreadId={main.firstUnreadId}
        onLoadOlder={() => void main.loadOlder()}
        onJumpLatest={() => void main.jumpToLatest()}
        focusId={mainFocus}
        onFocused={onMainFocused}
        meId={me?.id}
        myUsername={me?.username}
        general={general}
        actionsFor={mainActions}
        label={peer ? `Mensajes con ${peer.firstName}` : "Mensajes de #general"}
        empty={{
          title: peer ? `Aún no le ha escrito a ${peer.firstName}` : "Aún no hay mensajes",
          text: peer ? "Lo que escriba aquí solo lo verán ustedes dos." : "Escriba el primero: un aviso, una pregunta o un pendiente para el equipo.",
        }}
      />

      <Composer
        key={`caja-${convKey}`}
        scopeKey={convKey}
        label={`Mensaje para ${where}`}
        placeholder={`Escriba un mensaje para ${where}`}
        candidates={candidates}
        allowEveryone={general}
        replyTo={reply}
        privateReply={reply !== null && reply.recipientId === null && !general}
        onCancelReply={() => setReplyTo(null)}
        onSend={main.send}
      />
      {narrow && side !== "team" ? panel : null}
      {/* Dentro de la sala: en pantallas angostas la sala es el contexto de apilamiento que tapa al armazón. */}
      <ReceiptsModal message={info} onClose={() => setInfo(null)} />
      <Modal
        open={toDelete !== null}
        title="¿Eliminar este mensaje?"
        description={
          toDelete && toDelete.userId !== me?.id
            ? `Se eliminará para todo el equipo el mensaje de ${toDelete.firstName}. En su lugar quedará «Se eliminó este mensaje».`
            : "Se eliminará para todos, con sus archivos. En su lugar quedará «Se eliminó este mensaje»."
        }
        onClose={() => setToDelete(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={deleteMsg.isPending}
              onClick={() => {
                if (!toDelete) return;
                deleteMsg.mutate(toDelete.id, {
                  onSuccess: (m) => {
                    main.replace(m);
                    setToDelete(null);
                  },
                });
              }}
            >
              Eliminar para todos
            </Button>
          </>
        }
      >
        {toDelete ? <blockquote className={styles.deleteQuote}>{bodyOrFiles(toDelete)}</blockquote> : null}
      </Modal>
    </section>
  );

  return (
    <>
      <PageHeader
        title="Chat del equipo"
        subtitle="Administración, secretaría y bodega en un solo lugar: canal general, privados, hilos y avisos importantes fijados."
        actions={
          permission === "default" ? (
            <Button variant="secondary" size="sm" onClick={askPermission}>
              Activar avisos del navegador
            </Button>
          ) : undefined
        }
      />

      <div className={[styles.layout, threadId !== null || side !== "team" ? styles.withPanel : "", roomOpen ? styles.roomOpen : ""].join(" ")}>
        <ConversationList team={team.data} loading={team.isPending} meId={me?.id} peerId={peerId} onOpen={open} onOpenResult={openResult} />

        {narrow && roomOpen ? createPortal(room, document.body) : room}
        {!narrow || side === "team" ? panel : null}
      </div>
    </>
  );
};
