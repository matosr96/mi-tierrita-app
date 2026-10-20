import { useCallback, useEffect, useRef, useState } from "react";
import { chatService, type ChatListQuery } from "@/services/chat";
import { toApiError } from "@/lib/errors";
import { onChatEvent, useChatLiveStore } from "@/stores/chatLive";
import { useSessionStore } from "@/stores/session";
import { notify } from "@/stores/toasts";
import type { ChatAttachment, ChatMessage, SendChatMessageInput } from "@/types/api";

/** Conversación principal (canal general si `peerId` es null, privado si no) o, con `threadRootId`, un hilo. */
export type ChatScope = { peerId: number | null; threadRootId: number | null };

/**
 * Mensaje propio aún sin confirmar por el servidor; id negativo temporal. "queued": falló por la conexión y se reenvía
 * solo al volver; "failed": el servidor lo rechazó (hay que corregir o descartar).
 */
export type ChatItem = ChatMessage & { local?: "sending" | "queued" | "failed"; draft?: SendChatMessageInput };

export type ChatDraft = { body: string; replyTo: ChatMessage | null; attachments: ChatAttachment[] };

const PAGE = 50;
const POLL_MS = 6_000;
const RESEND_MS = 15_000;
let tempSeq = 0;

/** Sin respuesta o error del servidor: vale la pena reenviar solo cuando vuelva la conexión. */
const retriable = (err: unknown): boolean => {
  const code = toApiError(err).code;
  return code === "network" || code === "500" || /^5\d\d$/.test(code);
};

/** Primer texto legible de un error 400 (el detalle que da la API), o el mensaje general. */
const errorText = (err: unknown): string => {
  const e = toApiError(err);
  const first = Array.isArray(e.details) ? (e.details as { message?: string }[])[0]?.message : undefined;
  return first ?? e.message;
};

/**
 * Mensajes de una conversación o de un hilo, en vivo:
 * - carga los últimos 50 (o una ventana alrededor de `around`, para saltar a un resultado de búsqueda o a un fijado) y
 *   permite subir por el historial (`loadOlder`);
 * - con cada aviso en vivo pide solo lo nuevo (`?after=`) o el estado de los mensajes que cambiaron (chulitos, fijados,
 *   hilos); si la conexión en vivo está caída consulta cada 6 s;
 * - `send` muestra el mensaje al instante y lo confirma con un `clientId`: un reintento nunca lo duplica y lo que llega
 *   por el aviso en vivo se funde con él;
 * - con `active` (la persona tiene la conversación a la vista, con la pestaña al frente) marca como visto lo que hay.
 */
export const useChatMessages = (scope: ChatScope, options: { active: boolean; around?: number | undefined; enabled?: boolean }) => {
  const me = useSessionStore((s) => s.user);
  const live = useChatLiveStore((s) => s.live);
  const enabled = options.enabled ?? true;
  const [items, setItems] = useState<ChatItem[]>([]);
  const [root, setRoot] = useState<ChatMessage | null>(null);
  const [status, setStatus] = useState<"pending" | "ready" | "error">("pending");
  const [hasMoreBefore, setHasMoreBefore] = useState(false);
  const [hasMoreAfter, setHasMoreAfter] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [firstUnreadId, setFirstUnreadId] = useState<number | null>(null);
  const [attention, setAttention] = useState(0);

  const itemsRef = useRef<ChatItem[]>([]);
  itemsRef.current = items;
  const rootRef = useRef<ChatMessage | null>(null);
  rootRef.current = root;
  const moreAfterRef = useRef(false);
  moreAfterRef.current = hasMoreAfter;
  const gen = useRef(0);
  const fetching = useRef<Promise<void> | null>(null);
  const fetchAgain = useRef(false);
  const lastMarked = useRef(0);

  const { peerId, threadRootId } = scope;
  const base: ChatListQuery = threadRootId !== null ? { thread: threadRootId } : peerId !== null ? { with: peerId } : {};
  const baseRef = useRef(base);
  baseRef.current = base;

  /** Funde mensajes del servidor: reemplaza por id y quita los temporales que ya se confirmaron (mismo clientId). */
  const merge = useCallback((incoming: ChatMessage[], onlyKnown = false) => {
    if (incoming.length === 0) return;
    setItems((prev) => {
      const byId = new Map(prev.filter((m) => !m.local).map((m) => [m.id, m as ChatItem]));
      for (const m of incoming) if (!onlyKnown || byId.has(m.id)) byId.set(m.id, m);
      const confirmed = new Set(incoming.map((m) => m.clientId).filter((c): c is string => c !== null));
      const locals = prev.filter((m) => m.local && !(m.clientId !== null && confirmed.has(m.clientId)));
      return [...[...byId.values()].sort((a, b) => a.id - b.id), ...locals];
    });
  }, []);

  const load = useCallback(async (around?: number) => {
    const g = ++gen.current;
    try {
      const page = await chatService.list({ ...baseRef.current, limit: PAGE, ...(around !== undefined ? { around } : {}) });
      if (g !== gen.current) return;
      setItems((prev) => [...page.items, ...prev.filter((m) => m.local)]);
      setRoot(page.root ?? null);
      setHasMoreBefore(page.hasMoreBefore);
      setHasMoreAfter(page.hasMoreAfter);
      setFirstUnreadId((cur) => (around !== undefined && cur !== null ? cur : (page.items.find((m) => m.unread)?.id ?? null)));
      setStatus("ready");
    } catch (err) {
      if (g !== gen.current) return;
      setStatus((s) => (s === "pending" ? "error" : s));
      if (around !== undefined) notify.error(errorText(err));
    }
  }, []);

  /** Lo nuevo desde el último mensaje cargado (en tandas de 100). Si hay una consulta en curso, se repite al final. */
  const fetchNew = useCallback(async (): Promise<void> => {
    if (fetching.current) {
      fetchAgain.current = true;
      return fetching.current;
    }
    const run = async () => {
      do {
        fetchAgain.current = false;
        // Viendo una parte vieja del historial: lo nuevo se trae al volver al final.
        if (moreAfterRef.current) return;
        const g = gen.current;
        const known = itemsRef.current.filter((m) => !m.local);
        let after = known.at(-1)?.id;
        if (after === undefined) {
          await load();
          return;
        }
        for (let i = 0; i < 5; i++) {
          const page = await chatService.list({ ...baseRef.current, after, limit: 100 });
          if (g !== gen.current) return;
          merge(page.items);
          if (page.root) setRoot(page.root);
          if (!page.hasMoreAfter || page.items.length === 0) break;
          after = page.items.at(-1)!.id;
        }
      } while (fetchAgain.current);
    };
    fetching.current = run()
      .catch(() => undefined)
      .finally(() => {
        fetching.current = null;
      });
    return fetching.current;
  }, [load, merge]);

  /** Estado actual de mensajes ya cargados (chulitos, fijados, resumen de hilos). */
  const refreshState = useCallback(
    async (ids: number[]) => {
      const loaded = new Set(itemsRef.current.filter((m) => !m.local).map((m) => m.id));
      const rootId = rootRef.current?.id;
      const wanted = ids.filter((id) => loaded.has(id) || id === rootId).slice(-100);
      if (wanted.length === 0) return;
      const g = gen.current;
      try {
        const { items: fresh } = await chatService.state(wanted);
        if (g !== gen.current) return;
        const r = fresh.find((m) => m.id === rootId);
        if (r) setRoot(r);
        merge(
          fresh.filter((m) => m.id !== rootId),
          true,
        );
      } catch {
        /* se reintenta con el próximo aviso o consulta */
      }
    },
    [merge],
  );

  // Cambio de conversación: empieza de cero.
  const key = `${peerId ?? "g"}:${threadRootId ?? "-"}`;
  useEffect(() => {
    if (!enabled) return;
    gen.current++;
    setItems([]);
    setRoot(null);
    setStatus("pending");
    setHasMoreBefore(false);
    setHasMoreAfter(false);
    setFirstUnreadId(null);
    lastMarked.current = 0;
    void load(options.around);
    // `around` solo cuenta al abrir; luego se usa `jumpTo`.
  }, [key, enabled, load]);

  // Avisos en vivo.
  useEffect(() => {
    if (!enabled) return;
    return onChatEvent((event) => {
      if (event.type === "ready") {
        // Reconexión: lo que se haya perdido mientras tanto.
        void fetchNew();
        void refreshState(itemsRef.current.filter((m) => !m.local).map((m) => m.id));
        return;
      }
      if (event.type === "message") {
        if (event.peerId !== peerId) return;
        if (threadRootId !== null ? event.threadRootId === threadRootId : event.threadRootId === null) void fetchNew();
        // Respuesta en un hilo de esta conversación: el resumen del mensaje raíz cambia.
        else if (threadRootId === null && event.threadRootId !== null) void refreshState([event.threadRootId]);
        return;
      }
      if (event.type === "update" && event.peerId === peerId) void refreshState(event.ids);
    });
  }, [enabled, peerId, threadRootId, fetchNew, refreshState]);

  // Sin conexión en vivo: consulta periódica con la pestaña a la vista.
  useEffect(() => {
    if (!enabled || live) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void fetchNew();
      void refreshState(
        itemsRef.current
          .filter((m) => !m.local)
          .slice(-40)
          .map((m) => m.id),
      );
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [enabled, live, fetchNew, refreshState]);

  // Visto: solo con la conversación a la vista y la ventana al frente.
  useEffect(() => {
    const bump = () => setAttention((n) => n + 1);
    document.addEventListener("visibilitychange", bump);
    window.addEventListener("focus", bump);
    return () => {
      document.removeEventListener("visibilitychange", bump);
      window.removeEventListener("focus", bump);
    };
  }, []);
  useEffect(() => {
    if (!enabled || !options.active || status !== "ready" || document.visibilityState !== "visible" || !document.hasFocus()) return;
    const unread = items.filter((m) => m.unread && !m.local);
    const upTo = unread.at(-1)?.id;
    if (upTo === undefined || upTo <= lastMarked.current) return;
    const timer = window.setTimeout(() => {
      lastMarked.current = upTo;
      const ids = new Set(unread.map((m) => m.id));
      setItems((prev) => prev.map((m) => (ids.has(m.id) ? { ...m, unread: false } : m)));
      const where = threadRootId !== null ? { threadRootId } : peerId !== null ? { with: peerId } : {};
      chatService.markRead({ ...where, upTo }).catch(() => {
        lastMarked.current = 0;
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [enabled, options.active, status, items, attention, peerId, threadRootId]);

  const loadOlder = useCallback(async () => {
    const first = itemsRef.current.find((m) => !m.local)?.id;
    if (first === undefined || loadingOlder) return;
    const g = gen.current;
    setLoadingOlder(true);
    try {
      const page = await chatService.list({ ...baseRef.current, before: first, limit: PAGE });
      if (g !== gen.current) return;
      setItems((prev) => {
        const known = new Set(prev.map((m) => m.id));
        return [...page.items.filter((m) => !known.has(m.id)), ...prev];
      });
      setHasMoreBefore(page.hasMoreBefore);
    } catch (err) {
      notify.error(errorText(err));
    } finally {
      setLoadingOlder(false);
    }
  }, [loadingOlder]);

  /** Lleva la conversación hasta un mensaje (lo carga con su contexto si no estaba). */
  const jumpTo = useCallback(
    async (id: number) => {
      if (itemsRef.current.some((m) => m.id === id)) return;
      await load(id);
    },
    [load],
  );

  const deliver = useCallback(
    async (temp: ChatItem) => {
      try {
        const saved = await chatService.send(temp.draft!);
        merge([saved]);
      } catch (err) {
        // Sin conexión: queda en espera y se reenvía solo (mismo clientId, sin duplicar). Rechazado: hay que decidir.
        const queued = retriable(err);
        setItems((prev) => prev.map((m) => (m.clientId === temp.clientId && m.local ? { ...m, local: queued ? "queued" : "failed" } : m)));
        if (!queued) notify.error(`No se envió el mensaje: ${errorText(err)}`);
      }
    },
    [merge],
  );

  /** Envía un mensaje a esta conversación (o hilo); aparece al instante como "enviando". */
  const send = useCallback(
    async (draft: ChatDraft) => {
      if (!me) return;
      if (moreAfterRef.current) await load();
      const clientId = crypto.randomUUID();
      const input: SendChatMessageInput = {
        body: draft.body,
        clientId,
        ...(peerId !== null ? { recipientId: peerId } : {}),
        ...(threadRootId !== null ? { threadRootId } : {}),
        ...(draft.replyTo ? { replyToId: draft.replyTo.id } : {}),
        ...(draft.attachments.length > 0 ? { attachmentIds: draft.attachments.map((a) => a.id) } : {}),
      };
      const q = draft.replyTo;
      const temp: ChatItem = {
        id: -++tempSeq,
        clientId,
        userId: me.id,
        username: me.username,
        firstName: me.firstName,
        lastName: me.lastName,
        role: me.role,
        recipientId: peerId,
        body: draft.body,
        createdAt: new Date().toISOString(),
        threadRootId,
        replyTo: q
          ? {
              id: q.id,
              author: { id: q.userId, firstName: q.firstName, lastName: q.lastName },
              body: q.body.length > 160 ? `${q.body.slice(0, 159)}…` : q.body,
              attachments: q.attachments.length,
              inThread: q.threadRootId !== null,
              privateReply: q.recipientId === null && peerId !== null,
              deleted: false,
            }
          : null,
        editedAt: null,
        deleted: false,
        thread: null,
        pinned: null,
        mentions: [],
        attachments: draft.attachments,
        receipts: null,
        unread: false,
        mentionsMe: false,
        local: "sending",
        draft: input,
      };
      setItems((prev) => [...prev, temp]);
      await deliver(temp);
    },
    [me, peerId, threadRootId, load, deliver],
  );

  /** Reintenta un envío fallido con el mismo clientId (si el primero sí llegó, el servidor devuelve ese). */
  const retry = useCallback(
    (m: ChatItem) => {
      if (!m.draft) return;
      setItems((prev) => prev.map((x) => (x.clientId === m.clientId ? { ...x, local: "sending" } : x)));
      void deliver(m);
    },
    [deliver],
  );
  // Reenvío automático de lo que quedó en espera: al volver la red, al reconectar el aviso en vivo y cada 15 s.
  const resendQueued = useCallback(() => {
    const queued = itemsRef.current.filter((m) => m.local === "queued");
    if (queued.length === 0) return;
    setItems((prev) => prev.map((x) => (x.local === "queued" ? { ...x, local: "sending" } : x)));
    // En orden, para que lleguen como se escribieron.
    void queued.reduce<Promise<void>>((chain, m) => chain.then(() => deliver(m)), Promise.resolve());
  }, [deliver]);
  useEffect(() => {
    if (!enabled) return;
    const off = onChatEvent((e) => {
      if (e.type === "ready") resendQueued();
    });
    window.addEventListener("online", resendQueued);
    const timer = window.setInterval(resendQueued, RESEND_MS);
    return () => {
      off();
      window.removeEventListener("online", resendQueued);
      window.clearInterval(timer);
    };
  }, [enabled, resendQueued]);

  const discard = useCallback((m: ChatItem) => setItems((prev) => prev.filter((x) => x.clientId !== m.clientId || !x.local)), []);

  return {
    items,
    root,
    status,
    hasMoreBefore,
    hasMoreAfter,
    loadingOlder,
    firstUnreadId,
    loadOlder,
    jumpTo,
    jumpToLatest: () => load(),
    send,
    retry,
    discard,
    /** Aplica al instante un mensaje que cambió (editado, eliminado, fijado) sin esperar el aviso en vivo. */
    replace: (m: ChatMessage) => {
      if (m.id === rootRef.current?.id) setRoot(m);
      else merge([m], true);
    },
  };
};
