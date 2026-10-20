import { http } from "@/lib/http";
import { useSessionStore } from "@/stores/session";
import type { ChatAttachment, ChatLiveEvent, ChatMessage, ChatPage, ChatReceipts, ChatTeam, SendChatMessageInput } from "@/types/api";

/** Conversación: sin `with`, canal general; con `with`, el privado; con `thread`, las respuestas de ese hilo. */
export type ChatListQuery = { with?: number; thread?: number; after?: number; before?: number; around?: number; limit?: number };

export const chatService = {
  list: async (query: ChatListQuery): Promise<ChatPage> => (await http.get<ChatPage>("/chat/messages", { params: query })).data,
  /** Estado actual (acuses, fijado, hilo) de mensajes ya cargados. */
  state: async (ids: number[]): Promise<{ items: ChatMessage[] }> => (await http.get<{ items: ChatMessage[] }>("/chat/messages/state", { params: { ids: ids.join(",") } })).data,
  send: async (input: SendChatMessageInput): Promise<ChatMessage> => (await http.post<ChatMessage>("/chat/messages", input)).data,
  markRead: async (input: { with?: number; threadRootId?: number; upTo?: number; includeThreads?: boolean }): Promise<{ updated: number }> =>
    (await http.post<{ updated: number }>("/chat/read", input)).data,
  edit: async (id: number, body: string): Promise<ChatMessage> => (await http.patch<ChatMessage>(`/chat/messages/${id}`, { body })).data,
  remove: async (id: number): Promise<ChatMessage> => (await http.delete<ChatMessage>(`/chat/messages/${id}`)).data,
  receipts: async (id: number): Promise<ChatReceipts> => (await http.get<ChatReceipts>(`/chat/messages/${id}/receipts`)).data,
  pin: async (id: number): Promise<ChatMessage> => (await http.put<ChatMessage>(`/chat/messages/${id}/pin`)).data,
  unpin: async (id: number): Promise<ChatMessage> => (await http.delete<ChatMessage>(`/chat/messages/${id}/pin`)).data,
  pins: async (peerId: number | null): Promise<{ items: ChatMessage[] }> =>
    (await http.get<{ items: ChatMessage[] }>("/chat/pins", { params: peerId === null ? {} : { with: peerId } })).data,
  search: async (query: { q: string; with?: number; general?: boolean }): Promise<{ items: ChatMessage[] }> =>
    (await http.get<{ items: ChatMessage[] }>("/chat/search", { params: query })).data,
  /** Sube un archivo como cuerpo binario; queda listo para adjuntarlo al siguiente mensaje. */
  upload: async (file: File, onProgress?: (fraction: number) => void): Promise<ChatAttachment> =>
    (
      await http.post<ChatAttachment>("/chat/attachments", file, {
        headers: { "Content-Type": file.type || "application/octet-stream", "X-File-Name": encodeURIComponent(file.name) },
        timeout: 120_000,
        onUploadProgress: (e) => (onProgress && e.total ? onProgress(e.loaded / e.total) : undefined),
      })
    ).data,
  /** El archivo con la sesión (el navegador no puede pedirlo con el token en un <img> o un enlace). */
  attachment: async (id: number): Promise<Blob> => (await http.get<Blob>(`/chat/attachments/${id}`, { responseType: "blob", timeout: 120_000 })).data,
  team: async (): Promise<ChatTeam> => (await http.get<ChatTeam>("/chat/team")).data,
};

/**
 * Conexión en vivo (`GET /chat/stream`, Server-Sent Events). Se abre con `fetch` y no con `EventSource` porque esta
 * necesita el token en la cabecera. Reconecta sola con espera creciente; `onStatus` informa si está en vivo para que
 * la app use la consulta periódica mientras tanto. Devuelve la función que la cierra.
 */
export const openChatStream = (onEvent: (event: ChatLiveEvent) => void, onStatus: (live: boolean) => void): (() => void) => {
  const base = http.defaults.baseURL ?? "/api/v1";
  let controller: AbortController | null = null;
  let stopped = false;
  let retryMs = 1_000;
  let timer: number | undefined;

  const schedule = () => {
    if (stopped) return;
    onStatus(false);
    timer = window.setTimeout(() => void run(), retryMs);
    retryMs = Math.min(retryMs * 2, 30_000);
  };

  const run = async () => {
    const token = useSessionStore.getState().token;
    if (!token || stopped) return;
    controller = new AbortController();
    try {
      const res = await fetch(`${base}/chat/stream`, { headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" }, signal: controller.signal, cache: "no-store" });
      if (res.status === 401) {
        // Sesión vencida: una consulta normal hará que la app vuelva a Iniciar sesión.
        onStatus(false);
        onEvent({ type: "bye" });
        return;
      }
      if (!res.ok || !res.body) throw new Error(`stream ${res.status}`);
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      read: for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        let cut: number;
        while ((cut = buffer.indexOf("\n\n")) >= 0) {
          const block = buffer.slice(0, cut);
          buffer = buffer.slice(cut + 2);
          const data = block
            .split("\n")
            .filter((l) => l.startsWith("data:"))
            .map((l) => l.slice(5).trimStart())
            .join("\n");
          if (!data) continue;
          const event = JSON.parse(data) as ChatLiveEvent;
          if (event.type === "ready") {
            retryMs = 1_000;
            onStatus(true);
          }
          onEvent(event);
          // "bye": el servidor cerró (se reinició o la sesión ya no vale). Se reintenta; si la sesión venció, el
          // reintento recibe 401 y se detiene ahí.
          if (event.type === "bye") {
            controller.abort();
            break read;
          }
        }
      }
    } catch {
      /* red caída o cierre: se reintenta abajo */
    }
    schedule();
  };

  void run();
  return () => {
    stopped = true;
    window.clearTimeout(timer);
    controller?.abort();
    onStatus(false);
  };
};
