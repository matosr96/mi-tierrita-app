import { useApiMutation, keys } from "@/hooks/shared";
import { chatService } from "@/services/chat";

/** Elimina un mensaje para todos (el autor; en #general también la administración). */
export const useDeleteChatMessage = () =>
  useApiMutation((id: number) => chatService.remove(id), { invalidate: [[...keys.chat, "pins"], [...keys.chat, "team"]], success: "Mensaje eliminado" });
