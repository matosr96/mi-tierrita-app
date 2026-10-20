import { create } from "zustand";
import type { ChatLiveEvent } from "@/types/api";

/**
 * Estado en vivo del chat (solo en memoria): si la conexión de avisos está activa y qué conversación tiene la persona
 * a la vista (para no avisarle de lo que ya está leyendo). Los avisos se reparten a quien los escuche con
 * `onChatEvent`; la conexión la abre una sola vez `useChatRealtime` en el armazón de la app.
 */
export type ChatViewing = { peerId: number | null; threadRootId: number | null } | null;

type ChatLiveState = {
  live: boolean;
  viewing: ChatViewing;
  setLive: (live: boolean) => void;
  setViewing: (viewing: ChatViewing) => void;
};

export const useChatLiveStore = create<ChatLiveState>()((set) => ({
  live: false,
  viewing: null,
  setLive: (live) => set({ live }),
  setViewing: (viewing) => set({ viewing }),
}));

const listeners = new Set<(event: ChatLiveEvent) => void>();

export const onChatEvent = (fn: (event: ChatLiveEvent) => void): (() => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

export const emitChatEvent = (event: ChatLiveEvent): void => {
  for (const fn of listeners) fn(event);
};
