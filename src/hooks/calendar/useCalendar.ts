import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { calendarService } from "@/services/calendar";
import type { CalendarQuery } from "@/types/api";

/** Calendario del rango pedido (máximo 62 días); conserva el mes anterior en pantalla mientras llega el siguiente. */
export const useCalendar = (query: CalendarQuery) =>
  useQuery({ queryKey: [...keys.calendar, query], queryFn: () => calendarService.get(query), placeholderData: (prev) => prev });
