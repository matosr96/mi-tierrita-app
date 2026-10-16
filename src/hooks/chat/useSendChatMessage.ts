import { useApiMutation } from "@/hooks/shared";
import { chatService } from "@/services/chat";

/** Publica un mensaje en el chat del equipo. */
export const useSendChatMessage = () => useApiMutation((body: string) => chatService.send(body));
