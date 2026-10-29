import type { Alarm, AlarmArea, AlarmRepeat } from "@/types/api";

export const REPEAT_LABELS: Record<AlarmRepeat, string> = { ONCE: "Una sola vez", DAILY: "Todos los días", WEEKDAYS: "De lunes a viernes", WEEKLY: "Cada semana" };

export const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;

export const AREA_LABELS: Record<AlarmArea, string> = {
  inicio: "Inicio",
  inventario: "Inventario",
  lotes: "Lotes y vencimientos",
  ventas: "Ventas",
  clientes: "Clientes y cartera",
  proveedores: "Proveedores",
  finanzas: "Finanzas",
  reportes: "Reportes",
  chat: "Chat del equipo",
  alarmas: "Alarmas",
};

/** Ruta de la app a la que lleva el área de una alarma. */
export const areaPath = (area: AlarmArea | null): string => (area === null || area === "alarmas" ? "/alarmas" : area === "inicio" ? "/" : `/${area}`);

/** «Todos los días», «Lun, Mié y Vie», «El 3 nov»… */
export const repeatText = (a: Pick<Alarm, "repeat" | "weekdays" | "date">): string => {
  if (a.repeat === "WEEKLY") {
    const days = [...a.weekdays].sort((x, y) => x - y).map((d) => WEEKDAY_LABELS[d] ?? "");
    return days.length === 7 ? "Todos los días" : days.length > 1 ? `${days.slice(0, -1).join(", ")} y ${days[days.length - 1]}` : (days[0] ?? REPEAT_LABELS.WEEKLY);
  }
  if (a.repeat === "ONCE" && a.date) {
    const [y, m, d] = a.date.split("-").map(Number);
    return `Una sola vez · ${new Date(y!, (m ?? 1) - 1, d).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}`;
  }
  return REPEAT_LABELS[a.repeat];
};

/** Hora «5:30 p. m.» a partir de HH:MM. */
export const timeText = (hhmm: string): string => {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(2000, 0, 1, h ?? 0, m ?? 0).toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
};
