import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { chatService } from "@/services/chat";

/** Mensajes fijados del canal general (`peerId` null) o de un privado, el más reciente primero. */
export const useChatPins = (peerId: number | null, options: { enabled?: boolean } = {}) =>
  useQuery({ queryKey: [...keys.chat, "pins", peerId ?? "general"], queryFn: () => chatService.pins(peerId), enabled: options.enabled ?? true, staleTime: 30_000 });
