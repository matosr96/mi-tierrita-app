import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { openChatStream } from "@/services/chat";
import { emitChatEvent, useChatLiveStore } from "@/stores/chatLive";
import { useSessionStore } from "@/stores/session";
import { notify } from "@/stores/toasts";
import type { ChatLiveEvent } from "@/types/api";

/** Ruta de una conversación del chat (y el hilo, si lo hay). */
export const chatPath = (peerId: number | null, threadRootId: number | null = null, messageId?: number): string => {
  const p = new URLSearchParams();
  if (peerId !== null) p.set("con", String(peerId));
  if (threadRootId !== null) p.set("hilo", String(threadRootId));
  if (messageId !== undefined) p.set("m", String(messageId));
  const qs = p.toString();
  return qs ? `/chat?${qs}` : "/chat";
};

/**
 * Conexión en vivo del chat para toda la app (se monta una vez en el armazón). Con cada aviso refresca los contadores
 * del equipo, lo reparte a las pantallas abiertas y, si el mensaje no es de una conversación que la persona está
 * viendo, la avisa: dentro de la app con un aviso breve y, con la pestaña en segundo plano y permiso concedido, con
 * una notificación del navegador.
 */
export const useChatRealtime = () => {
  const token = useSessionStore((s) => s.token);
  const me = useSessionStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || me === undefined) return;
    const refreshTeam = () => void queryClient.invalidateQueries({ queryKey: [...keys.chat, "team"] });
    const onEvent = (event: ChatLiveEvent) => {
      // Contadores al día con cualquier aviso (con "bye", la consulta revela si la sesión se cerró).
      refreshTeam();
      if (event.type === "bye") return;
      if (event.type === "update" || event.type === "ready") {
        void queryClient.invalidateQueries({ queryKey: [...keys.chat, "receipts"] });
        void queryClient.invalidateQueries({ queryKey: [...keys.chat, "pins"] });
      }
      emitChatEvent(event);

      if (event.type !== "message" || event.authorId === me) return;
      const viewing = useChatLiveStore.getState().viewing;
      const looking =
        document.visibilityState === "visible" &&
        viewing !== null &&
        viewing.peerId === event.peerId &&
        (event.threadRootId === null || viewing.threadRootId === event.threadRootId);
      if (looking) return;
      const where = event.peerId === null ? (event.threadRootId ? "en un hilo de #general" : "en #general") : event.threadRootId ? "en un hilo" : "por privado";
      const title = `${event.mentionsMe ? "Lo mencionó " : ""}${event.authorName} ${where}`;
      const to = chatPath(event.peerId, event.threadRootId, event.id);
      if (document.visibilityState === "hidden" && "Notification" in window && Notification.permission === "granted") {
        const n = new Notification(title, { body: event.preview, tag: `chat-${event.peerId ?? "general"}`, icon: "/favicon.svg" });
        n.onclick = () => {
          window.focus();
          navigate(to);
          n.close();
        };
      } else if (document.visibilityState === "visible") {
        notify.info(`${title}: ${event.preview}`);
      }
    };
    return openChatStream(onEvent, (live) => useChatLiveStore.getState().setLive(live));
  }, [token, me, queryClient, navigate]);
};
