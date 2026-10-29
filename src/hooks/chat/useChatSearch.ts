import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { chatService } from "@/services/chat";

/**
 * Búsqueda en el chat (sin tildes): en todo lo que la persona puede ver o, con `scope`, en una conversación. Con `day`
 * (YYYY-MM-DD) solo ese día; entonces el texto es opcional.
 */
export const useChatSearch = (q: string, scope: { peerId: number | null } | "all", day: string | null = null) => {
  const term = q.trim();
  const query = {
    ...(term.length >= 2 ? { q: term } : {}),
    ...(day !== null ? { day } : {}),
    ...(scope === "all" ? {} : scope.peerId === null ? { general: true } : { with: scope.peerId }),
  };
  return useQuery({ queryKey: [...keys.chat, "search", query], queryFn: () => chatService.search(query), enabled: term.length >= 2 || day !== null, staleTime: 15_000 });
};
