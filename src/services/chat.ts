import { http } from "@/lib/http";
import type { ChatMessage, ChatTeam } from "@/types/api";

export const chatService = {
  /** Sin `with`, canal general; con `with`, la conversación privada con esa persona. */
  list: async (query: { with?: number; after?: number; limit?: number }): Promise<{ items: ChatMessage[] }> =>
    (await http.get<{ items: ChatMessage[] }>("/chat/messages", { params: query })).data,
  send: async (input: { body: string; recipientId?: number }): Promise<ChatMessage> => (await http.post<ChatMessage>("/chat/messages", input)).data,
  team: async (): Promise<ChatTeam> => (await http.get<ChatTeam>("/chat/team")).data,
};
