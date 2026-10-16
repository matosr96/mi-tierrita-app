import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { chatService } from "@/services/chat";

/**
 * Equipo del chat: quién está en línea, privados sin leer y último mensaje de cada conversación. Se refresca solo
 * (cada `intervalMs`) mientras la pestaña está a la vista; consultarlo también cuenta como estar en línea.
 */
export const useChatTeam = (intervalMs = 20_000, options: { enabled?: boolean } = {}) =>
  useQuery({ queryKey: [...keys.chat, "team"], queryFn: chatService.team, refetchInterval: intervalMs, staleTime: 3_000, enabled: options.enabled ?? true });
