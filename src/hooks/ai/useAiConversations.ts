import { useQuery } from "@tanstack/react-query";
import { keys, useApiMutation } from "@/hooks/shared";
import { aiService } from "@/services/ai";
import { useAiStore } from "@/stores/ai";
import type { PageQuery } from "@/types/api";

/** Historial de conversaciones propias con Tita, de la más reciente a la más antigua. */
export const useAiConversations = (query: PageQuery = {}) =>
  useQuery({ queryKey: [...keys.ai, "conversations", query], queryFn: () => aiService.conversations(query), placeholderData: (prev) => prev });

/** Retoma una conversación del historial: la carga en pantalla (panel y página comparten la misma). */
export const useOpenAiConversation = () =>
  useApiMutation(async (id: number) => {
    const c = await aiService.conversation(id);
    useAiStore.getState().load(c);
    return c;
  });

export const useDeleteAiConversation = () =>
  useApiMutation(
    async (id: number) => {
      await aiService.deleteConversation(id);
      if (useAiStore.getState().conversationId === id) useAiStore.getState().reset();
    },
    { invalidate: [[...keys.ai, "conversations"]], success: "Conversación eliminada." },
  );
