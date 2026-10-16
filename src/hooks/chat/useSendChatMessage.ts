import { useApiMutation, keys } from "@/hooks/shared";
import { chatService } from "@/services/chat";

/** Publica un mensaje en el canal general o, con `recipientId`, uno privado. */
export const useSendChatMessage = () =>
  useApiMutation((input: { body: string; recipientId?: number }) => chatService.send(input), { invalidate: [[...keys.chat, "team"]] });
