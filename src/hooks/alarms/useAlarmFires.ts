import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { alarmsService } from "@/services/alarms";
import type { PageQuery } from "@/types/api";

/** Alarmas pasadas: los disparos ocurridos, del más reciente al más antiguo. */
export const useAlarmFires = (query: PageQuery = { limit: 50 }, options: { enabled?: boolean } = {}) =>
  useQuery({ queryKey: [...keys.alarms, "fires", query], queryFn: () => alarmsService.fires(query), placeholderData: (prev) => prev, enabled: options.enabled ?? true });
