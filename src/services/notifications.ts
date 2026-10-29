import { http } from "@/lib/http";
import type { DueNotices } from "@/types/api";

export const notificationsService = {
  /** Avisos de vencimiento del rol, calculados en el servidor. */
  due: async (): Promise<DueNotices> => (await http.get<DueNotices>("/notifications/due")).data,
};
