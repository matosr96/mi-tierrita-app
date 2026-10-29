import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { chatService } from "@/services/chat";
import type { ChatMediaKind } from "@/types/api";

/** Fotos, archivos, notas de voz o enlaces del canal general (`peerId` null) o de un privado, paginados. */
export const useChatMedia = (scope: { peerId: number | null }, kind: ChatMediaKind, page = 1, limit = 30) =>
  useQuery({
    queryKey: [...keys.chat, "media", scope.peerId ?? "general", kind, page, limit],
    queryFn: () => chatService.media({ kind, page, limit, ...(scope.peerId !== null ? { with: scope.peerId } : {}) }),
    staleTime: 30_000,
  });
