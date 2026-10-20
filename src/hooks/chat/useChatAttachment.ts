import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { chatService } from "@/services/chat";

/** Contenido de un adjunto (con la sesión). Se guarda en caché para no descargar dos veces la misma foto. */
export const useChatAttachment = (id: number, options: { enabled?: boolean } = {}) =>
  useQuery({ queryKey: [...keys.chat, "file", id], queryFn: () => chatService.attachment(id), enabled: options.enabled ?? true, staleTime: Infinity, gcTime: 10 * 60_000 });
