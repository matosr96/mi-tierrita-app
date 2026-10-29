import { http } from "@/lib/http";
import type { CalendarQuery, CalendarResponse } from "@/types/api";

export const calendarService = {
  /** Ítems con fecha del rango (lotes, cobros, alarmas propias y cierres según el rol) y el resumen por estado. */
  get: async (query: CalendarQuery = {}): Promise<CalendarResponse> => (await http.get<CalendarResponse>("/calendar", { params: query })).data,
};
