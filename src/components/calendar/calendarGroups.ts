import type { CalendarItem, CalendarPriority, CalendarStatus } from "@/types/api";

/** Funciones puras del calendario (sin React ni zona horaria: todo en fechas YYYY-MM-DD). */

export type DayGroup = { date: string; items: CalendarItem[] };

const pad = (n: number): string => String(n).padStart(2, "0");

/** YYYY-MM-DD de un año, mes (1–12) y día; admite desbordes (día 0 = último del mes anterior). */
export const isoOf = (year: number, month: number, day: number): string => {
  const d = new Date(Date.UTC(year, month - 1, day));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

/** Agrupa los ítems por día, en orden de fecha; dentro del día conserva el orden de la API. */
export const groupByDay = (items: CalendarItem[]): DayGroup[] => {
  const byDate = new Map<string, CalendarItem[]>();
  for (const item of items) {
    const list = byDate.get(item.date);
    if (list) list.push(item);
    else byDate.set(item.date, [item]);
  }
  return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, list]) => ({ date, items: list }));
};

/**
 * Semanas de un mes (`month` de 1 a 12) de lunes a domingo, con sus fechas ISO: la primera empieza el lunes en o antes
 * del día 1 y la última termina el domingo en o después del último día (por eso incluye días de los meses vecinos).
 */
export const monthGrid = (year: number, month: number): string[][] => {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const lead = (first.getUTCDay() + 6) % 7; // lunes = 0 … domingo = 6
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = Math.ceil((lead + daysInMonth) / 7) * 7;
  const weeks: string[][] = [];
  for (let i = 0; i < cells; i++) {
    if (i % 7 === 0) weeks.push([]);
    weeks[weeks.length - 1]?.push(isoOf(year, month, 1 - lead + i));
  }
  return weeks;
};

/** Primer y último día de un mes (1–12), para pedir el calendario de ese mes. */
export const monthRange = (year: number, month: number): { from: string; to: string } => ({ from: isoOf(year, month, 1), to: isoOf(year, month + 1, 0) });

/** Año y mes (1–12) desplazados `delta` meses. */
export const shiftMonth = (year: number, month: number, delta: number): { year: number; month: number } => {
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
};

export const STATUS_LABEL: Record<CalendarStatus, string> = { pending: "Pendiente", overdue: "Vencido", done: "Cerrado" };
export const PRIORITY_LABEL: Record<CalendarPriority, string> = { alta: "Prioridad alta", media: "Prioridad media", baja: "Prioridad baja" };

export type CalendarTone = "bad" | "done" | "warn" | "pending";
/** Tono de un ítem: vencido en rojo, cerrado en verde tenue, pendiente de prioridad alta en ámbar, el resto en verde suave. */
export const toneOf = (item: CalendarItem): CalendarTone => (item.status === "overdue" ? "bad" : item.status === "done" ? "done" : item.priority === "alta" ? "warn" : "pending");
