import { create } from "zustand";
import type { ErrorKind } from "@/lib/errors";
import type { AiAttachment, AiConversationDetail, AiHandoff, AiProposal, AiSource } from "@/types/api";
import { useSessionStore } from "@/stores/session";

/** Estado de cada tarjeta de acción de un mensaje (por índice): pendiente, ejecutando, hecha, fallida o descartada. */
export type ActionState = { status: "idle" | "running" | "done" | "failed" | "dismissed"; note?: string };

/**
 * Un mensaje de la conversación. `event` es una nota del sistema (por ejemplo, "Confirmado: crear cliente…"): se muestra
 * pequeña y se le pasa a Tita como contexto en la siguiente pregunta. `serverId` es su id en el historial guardado.
 */
export type AiMessage = {
  id: number;
  serverId?: number;
  role: "user" | "assistant" | "event";
  content: string;
  sources?: AiSource[];
  proposals?: AiProposal[];
  actions?: Record<number, ActionState>;
  attachments?: AiAttachment[];
  /** Nombres de los adjuntos de un mensaje retomado del historial (el archivo no se guarda). */
  attachmentNames?: string[];
  error?: boolean;
  /** Qué pasó cuando Tita no respondió: tardó demasiado, sin conexión o un error con código reportable. */
  errorKind?: ErrorKind;
  errorCode?: string;
  /** Pregunta que se puede volver a enviar desde la burbuja de error. */
  retryOf?: { content: string; attachments: AiAttachment[] };
};

type AiState = {
  open: boolean;
  messages: AiMessage[];
  /** Conversación guardada en el servidor a la que pertenecen los mensajes (null hasta la primera respuesta). */
  conversationId: number | null;
  /** Tita está respondiendo (compartido entre el panel rápido y la página /tita). */
  pending: boolean;
  /** Qué está haciendo mientras se espera ("Tita está revisando los datos…", "Sin conexión, reintentando…"). */
  pendingNote: string | null;
  setPending: (pending: boolean, note?: string | null) => void;
  /** Pregunta que otra pantalla deja lista para enviar al abrir el panel (por ejemplo, desde una recomendación). */
  pendingPrompt: string | null;
  /** Borrador que el asistente preparó y que la pantalla de destino toma al montarse (venta, abono o compra). */
  draft: AiHandoff | null;
  setOpen: (open: boolean) => void;
  ask: (prompt: string) => void;
  takePrompt: () => string | null;
  push: (m: Omit<AiMessage, "id">) => number;
  patch: (id: number, changes: Partial<AiMessage>) => void;
  remove: (id: number) => void;
  setConversationId: (id: number | null) => void;
  /** Retoma una conversación del historial: reemplaza los mensajes en pantalla. */
  load: (conversation: AiConversationDetail) => void;
  reset: () => void;
  handOff: (draft: AiHandoff) => void;
  setAction: (messageId: number, index: number, state: ActionState) => void;
  /** Lee el borrador si es del tipo de la pantalla, sin borrarlo (seguro dentro de un inicializador de estado). */
  peekDraft: <T extends AiHandoff["type"]>(type: T) => Extract<AiHandoff, { type: T }> | null;
  /** Borra el borrador una vez que la pantalla lo tomó (desde un efecto). */
  clearDraft: () => void;
};

let nextId = 1;

/** Estado del asistente. La conversación en pantalla vive en esta pestaña; el servidor guarda el historial por persona. */
export const useAiStore = create<AiState>()((set, get) => ({
  open: false,
  messages: [],
  conversationId: null,
  pending: false,
  pendingNote: null,
  setPending: (pending, note = null) => set({ pending, pendingNote: pending ? note : null }),
  pendingPrompt: null,
  draft: null,
  setOpen: (open) => set({ open }),
  ask: (prompt) => set({ open: true, pendingPrompt: prompt }),
  takePrompt: () => {
    const p = get().pendingPrompt;
    if (p !== null) set({ pendingPrompt: null });
    return p;
  },
  push: (m) => {
    const id = nextId++;
    set((s) => ({ messages: [...s.messages, { ...m, id }] }));
    return id;
  },
  patch: (id, changes) => set((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, ...changes } : m)) })),
  remove: (id) => set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),
  setConversationId: (conversationId) => set({ conversationId }),
  load: (c) =>
    set({
      conversationId: c.id,
      pending: false,
      pendingNote: null,
      messages: c.items.map((m) => ({
        id: nextId++,
        serverId: m.id,
        role: m.role,
        content: m.content,
        ...(m.sources ? { sources: m.sources } : {}),
        ...(m.proposals ? { proposals: m.proposals } : {}),
        ...(m.actions ? { actions: Object.fromEntries(Object.entries(m.actions).map(([k, v]) => [Number(k), v])) } : {}),
        ...(m.attachments?.length ? { attachmentNames: m.attachments.map((a) => a.name) } : {}),
        ...(m.error ? { error: true } : {}),
      })),
    }),
  reset: () => set({ messages: [], conversationId: null, pending: false, pendingNote: null }),
  handOff: (draft) => set({ draft, open: false }),
  setAction: (messageId, index, state) =>
    set((s) => ({ messages: s.messages.map((m) => (m.id === messageId ? { ...m, actions: { ...m.actions, [index]: state } } : m)) })),
  peekDraft: (type) => {
    const d = get().draft;
    return d !== null && d.type === type ? (d as Extract<AiHandoff, { type: typeof type }>) : null;
  },
  clearDraft: () => set({ draft: null }),
}));

// Al cerrar sesión se vacía la pantalla: otra persona podría usar el mismo equipo (el historial sigue en el servidor).
useSessionStore.subscribe((s, prev) => {
  if (prev.token !== null && s.token === null) useAiStore.setState({ open: false, messages: [], conversationId: null, pending: false, pendingNote: null, pendingPrompt: null, draft: null });
});
