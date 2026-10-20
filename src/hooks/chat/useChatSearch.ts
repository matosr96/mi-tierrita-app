import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { chatService } from "@/services/chat";

/** Búsqueda en el chat (sin tildes): en todo lo que la persona puede ver o, con `scope`, en una conversación. */
export const useChatSearch = (q: string, scope: { peerId: number | null } | "all") => {
  const term = q.trim();
  const query = scope === "all" ? { q: term } : scope.peerId === null ? { q: term, general: true } : { q: term, with: scope.peerId };
  return useQuery({ queryKey: [...keys.chat, "search", query], queryFn: () => chatService.search(query), enabled: term.length >= 2, staleTime: 15_000 });
};
