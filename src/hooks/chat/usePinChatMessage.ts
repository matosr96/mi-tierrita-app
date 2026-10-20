import { useApiMutation, keys } from "@/hooks/shared";
import { chatService } from "@/services/chat";

/** Fija o desfija un mensaje (en #general solo administración; en un privado, cualquiera de los dos). */
export const usePinChatMessage = () =>
  useApiMutation(({ id, pinned }: { id: number; pinned: boolean }) => (pinned ? chatService.pin(id) : chatService.unpin(id)), {
    invalidate: [[...keys.chat, "pins"]],
    success: (m) => (m.pinned ? "Mensaje fijado" : "Mensaje desfijado"),
  });
