import { http } from "@/lib/http";
import type { Alarm, AlarmFire, AlarmInput, Page, PageQuery } from "@/types/api";

export const alarmsService = {
  /** Alarmas propias (activas primero, por próximo disparo). */
  list: async (query: PageQuery = {}): Promise<Page<Alarm>> => (await http.get<Page<Alarm>>("/alarms", { params: query })).data,
  /** Disparos ocurridos («Pasadas»), del más reciente al más antiguo. */
  fires: async (query: PageQuery = {}): Promise<Page<AlarmFire>> => (await http.get<Page<AlarmFire>>("/alarms", { params: { ...query, status: "past" } })).data,
  get: async (id: number): Promise<Alarm> => (await http.get<Alarm>(`/alarms/${id}`)).data,
  create: async (input: AlarmInput): Promise<Alarm> => (await http.post<Alarm>("/alarms", input)).data,
  update: async (id: number, input: AlarmInput): Promise<Alarm> => (await http.put<Alarm>(`/alarms/${id}`, input)).data,
  setActive: async (id: number, active: boolean): Promise<Alarm> => (await http.patch<Alarm>(`/alarms/${id}/active`, { active })).data,
  remove: async (id: number): Promise<void> => {
    await http.delete(`/alarms/${id}`);
  },
  /** Archivo .ics (text/calendar) de una alarma o de todas las activas; se pide con la sesión y se guarda como Blob. */
  ics: async (id: number | "all"): Promise<Blob> => (await http.get<Blob>(id === "all" ? "/alarms/ics" : `/alarms/${id}/ics`, { responseType: "blob" })).data,
};
