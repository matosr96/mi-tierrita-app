import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Notificaciones ya vistas (por clave y texto: si el pendiente cambia, vuelve a contar como nueva).
 * Se guardan en este navegador; las notificaciones mismas salen de los pendientes que devuelve la API.
 */
type NotificationsState = {
  seen: string[];
  markSeen: (ids: string[]) => void;
};

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      seen: [],
      // Se conservan solo las últimas 200 para no crecer sin límite.
      markSeen: (ids) => set({ seen: [...new Set([...get().seen, ...ids])].slice(-200) }),
    }),
    { name: "mi-tierrita-notificaciones" },
  ),
);
