import { http } from "@/lib/http";
import type { PushPublicKey, PushSubscriptionInput } from "@/types/api";

export const pushService = {
  publicKey: async (): Promise<PushPublicKey> => (await http.get<PushPublicKey>("/push/public-key")).data,
  subscribe: async (input: PushSubscriptionInput): Promise<void> => {
    await http.post("/push/subscriptions", input);
  },
  unsubscribe: async (endpoint: string): Promise<void> => {
    await http.delete("/push/subscriptions", { data: { endpoint } });
  },
};
