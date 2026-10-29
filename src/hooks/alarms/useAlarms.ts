import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { alarmsService } from "@/services/alarms";
import type { PageQuery } from "@/types/api";

/** Alarmas propias («Próximas»: activas primero por próximo disparo; las apagadas al final). */
export const useAlarms = (query: PageQuery = { limit: 100 }, options: { enabled?: boolean } = {}) =>
  useQuery({ queryKey: [...keys.alarms, "list", query], queryFn: () => alarmsService.list(query), placeholderData: (prev) => prev, enabled: options.enabled ?? true });
