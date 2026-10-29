import { create } from "zustand";

/** Rectángulo del elemento tocado, para anclar la ficha en escritorio. */
export type PersonAnchor = { top: number; left: number; bottom: number; right: number };

type PersonCardState = {
  userId: number | null;
  anchor: PersonAnchor | null;
  /** Elemento que abrió la ficha, para devolverle el foco al cerrar. */
  opener: HTMLElement | null;
  open: (userId: number, el?: HTMLElement | null) => void;
  close: () => void;
};

/** Ficha de persona abierta (una a la vez, desde cualquier pantalla). */
export const usePersonCardStore = create<PersonCardState>()((set, get) => ({
  userId: null,
  anchor: null,
  opener: null,
  open: (userId, el) => {
    const r = el?.getBoundingClientRect();
    set({ userId, opener: el ?? null, anchor: r ? { top: r.top, left: r.left, bottom: r.bottom, right: r.right } : null });
  },
  close: () => {
    const opener = get().opener;
    set({ userId: null, anchor: null, opener: null });
    if (opener?.isConnected) opener.focus();
  },
}));

/** Abre la ficha de una persona anclada al elemento que se tocó. */
export const openPersonCard = (userId: number, el?: HTMLElement | null) => usePersonCardStore.getState().open(userId, el);
