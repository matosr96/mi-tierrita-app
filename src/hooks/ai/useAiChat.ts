import { useApiMutation } from "@/hooks/shared";
import { aiService } from "@/services/ai";
import type { AiChatTurn } from "@/types/api";

/** Una pregunta al asistente con la conversación previa (el servidor no la guarda). */
export const useAiChat = () => useApiMutation((messages: AiChatTurn[]) => aiService.chat(messages), { notifyError: false });
