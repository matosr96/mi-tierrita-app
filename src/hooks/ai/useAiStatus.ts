import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { aiService } from "@/services/ai";

/** ¿El servidor tiene IA configurada? Sin ella, la app no muestra ninguna función de IA. */
export const useAiStatus = () => {
  const q = useQuery({ queryKey: [...keys.ai, "status"], queryFn: aiService.status, staleTime: 5 * 60_000, retry: false });
  return { enabled: q.data?.enabled === true, model: q.data?.model ?? null, isPending: q.isPending };
};
