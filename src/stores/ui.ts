import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Estado de interfaz compartido: menú lateral expandido o en riel de iconos. */
type UiState = { navOpen: boolean; toggleNav: () => void; setNavOpen: (open: boolean) => void };

export const useUiStore = create<UiState>()(
  persist((set) => ({ navOpen: true, toggleNav: () => set((s) => ({ navOpen: !s.navOpen })), setNavOpen: (navOpen) => set({ navOpen }) }), { name: "mi-tierrita-ui" }),
);
