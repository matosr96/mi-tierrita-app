import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "system" | "light" | "dark";

type ThemeState = { mode: ThemeMode; setMode: (mode: ThemeMode) => void };

const apply = (mode: ThemeMode) => {
  const root = document.documentElement;
  if (mode === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", mode);
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "system",
      setMode: (mode) => {
        apply(mode);
        set({ mode });
      },
    }),
    { name: "mi-tierrita-theme", onRehydrateStorage: () => (state) => apply(state?.mode ?? "system") },
  ),
);
