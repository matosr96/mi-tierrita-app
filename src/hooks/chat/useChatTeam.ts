import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { chatService } from "@/services/chat";

/**
 * Equipo del chat: quién está en línea, lo que falta por leer (con menciones) y el último mensaje de cada conversación.
 * Los avisos en vivo la refrescan al instante; la consulta periódica (`intervalMs`) es el respaldo y también mantiene a
 * la persona "en línea". Consultarla cuenta como "entregado".
 */
export const useChatTeam = (intervalMs = 30_000, options: { enabled?: boolean } = {}) =>
  useQuery({ queryKey: [...keys.chat, "team"], queryFn: chatService.team, refetchInterval: intervalMs, staleTime: 3_000, enabled: options.enabled ?? true });
