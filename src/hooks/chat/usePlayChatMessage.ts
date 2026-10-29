import { useApiMutation, keys } from "@/hooks/shared";
import { chatService } from "@/services/chat";

/** Avisa que se reprodujo la nota de voz de un mensaje ajeno (`POST /chat/messages/:id/played`); sin aviso en pantalla. */
export const usePlayChatMessage = () => useApiMutation((id: number) => chatService.played(id), { invalidate: [[...keys.chat, "team"]], notifyError: false });
