import { create } from "zustand";
import type { AiAttachment, AiHandoff, AiProposal, AiSource } from "@/types/api";
import { useSessionStore } from "@/stores/session";

/** Un mensaje de la conversación con el asistente (las fuentes y borradores solo los trae el asistente). */
/** Estado de cada tarjeta de acción de un mensaje (por índice): pendiente, ejecutando, hecha, fallida o descartada. */
export type ActionState = { status: "idle" | "running" | "done" | "failed" | "dismissed"; note?: string };

/**
 * Un mensaje de la conversación. `event` es una nota del sistema (por ejemplo, "Confirmado: crear cliente…"): se muestra
 * pequeña y se le pasa a Tita como contexto en la siguiente pregunta.
 */
export type AiMessage = {
  id: number;
  role: "user" | "assistant" | "event";
  content: string;
  sources?: AiSource[];
  proposals?: AiProposal[];
  actions?: Record<number, ActionState>;
  attachments?: AiAttachment[];
  error?: boolean;
};

type AiState = {
  open: boolean;
  messages: AiMessage[];
  /** Tita está respondiendo (compartido entre el panel rápido y la página /tita). */
  pending: boolean;
  setPending: (pending: boolean) => void;
  /** Pregunta que otra pantalla deja lista para enviar al abrir el panel (por ejemplo, desde una recomendación). */
  pendingPrompt: string | null;
  /** Borrador que el asistente preparó y que la pantalla de destino toma al montarse (venta, abono o compra). */
  draft: AiHandoff | null;
  setOpen: (open: boolean) => void;
  ask: (prompt: string) => void;
  takePrompt: () => string | null;
  push: (m: Omit<AiMessage, "id">) => void;
  reset: () => void;
  handOff: (draft: AiHandoff) => void;
  setAction: (messageId: number, index: number, state: ActionState) => void;
  /** Lee el borrador si es del tipo de la pantalla, sin borrarlo (seguro dentro de un inicializador de estado). */
  peekDraft: <T extends AiHandoff["type"]>(type: T) => Extract<AiHandoff, { type: T }> | null;
  /** Borra el borrador una vez que la pantalla lo tomó (desde un efecto). */
  clearDraft: () => void;
};

let nextId = 1;

/** Estado del asistente. La conversación vive solo en esta pestaña: no se guarda en el navegador ni en el servidor. */
export const useAiStore = create<AiState>()((set, get) => ({
  open: false,
  messages: [],
  pending: false,
  setPending: (pending) => set({ pending }),
  pendingPrompt: null,
  draft: null,
  setOpen: (open) => set({ open }),
  ask: (prompt) => set({ open: true, pendingPrompt: prompt }),
  takePrompt: () => {
    const p = get().pendingPrompt;
    if (p !== null) set({ pendingPrompt: null });
    return p;
  },
  push: (m) => set((s) => ({ messages: [...s.messages, { ...m, id: nextId++ }] })),
  reset: () => set({ messages: [] }),
  handOff: (draft) => set({ draft, open: false }),
  setAction: (messageId, index, state) =>
    set((s) => ({ messages: s.messages.map((m) => (m.id === messageId ? { ...m, actions: { ...m.actions, [index]: state } } : m)) })),
  peekDraft: (type) => {
    const d = get().draft;
    return d !== null && d.type === type ? (d as Extract<AiHandoff, { type: typeof type }>) : null;
  },
  clearDraft: () => set({ draft: null }),
}));

// Al cerrar sesión se borra la conversación: otra persona podría usar el mismo equipo.
useSessionStore.subscribe((s, prev) => {
  if (prev.token !== null && s.token === null) useAiStore.setState({ open: false, messages: [], pending: false, pendingPrompt: null, draft: null });
});
