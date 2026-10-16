import { http } from "@/lib/http";
import type { ChatMessage } from "@/types/api";

export const chatService = {
  list: async (query: { after?: number; limit?: number }): Promise<{ items: ChatMessage[] }> => (await http.get<{ items: ChatMessage[] }>("/chat/messages", { params: query })).data,
  send: async (body: string): Promise<ChatMessage> => (await http.post<ChatMessage>("/chat/messages", { body })).data,
};
