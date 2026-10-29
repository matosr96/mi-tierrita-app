import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { notificationsService } from "@/services/notifications";

/** Avisos de vencimiento del rol (lotes y cartera), calculados en el servidor; el evento `due` del stream los refresca. */
export const useDueNotices = (options: { enabled?: boolean } = {}) =>
  useQuery({ queryKey: [...keys.notifications, "due"], queryFn: notificationsService.due, enabled: options.enabled ?? true, staleTime: 60_000, refetchInterval: 10 * 60_000 });
