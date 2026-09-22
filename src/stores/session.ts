import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role, User } from "@/types/api";

/** Estado global de cliente: sesión y rol activo (documento 02, sección 4). */
type SessionState = {
  token: string | null;
  user: User | null;
  signin: (token: string, user: User) => void;
  setUser: (user: User) => void;
  clear: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      signin: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      clear: () => set({ token: null, user: null }),
    }),
    { name: "mi-tierrita-session" },
  ),
);

export const ROLE_LABELS: Record<Role, string> = { ADMIN: "Administrador", SALES: "Secretaria", WAREHOUSE: "Bodega" };
