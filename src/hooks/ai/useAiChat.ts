import { useApiMutation } from "@/hooks/shared";
import { aiService } from "@/services/ai";
import type { AiChatRequest } from "@/types/api";

/** Una pregunta al asistente en un solo paso (la conversación con Tita usa el flujo en dos pasos de `useTitaConversation`). */
export const useAiChat = () => useApiMutation((input: AiChatRequest) => aiService.chat(input), { notifyError: false });
