import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { chatService } from "@/services/chat";

/** Detalle de un mensaje propio: quién lo leyó, a quién le llegó y quién falta. Se refresca con los avisos en vivo. */
export const useChatReceipts = (messageId: number | null) =>
  useQuery({ queryKey: [...keys.chat, "receipts", messageId], queryFn: () => chatService.receipts(messageId!), enabled: messageId !== null && messageId > 0 });
