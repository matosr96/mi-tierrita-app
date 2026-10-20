import { useApiMutation, keys } from "@/hooks/shared";
import { chatService } from "@/services/chat";

/** Corrige el texto de un mensaje propio (queda la marca "editado"). */
export const useEditChatMessage = () =>
  useApiMutation(({ id, body }: { id: number; body: string }) => chatService.edit(id, body), { invalidate: [[...keys.chat, "pins"]] });
