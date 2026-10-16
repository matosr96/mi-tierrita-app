import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { aiService } from "@/services/ai";

/** Recomendaciones del día del rol (las calcula el servidor) y, si hay IA, el párrafo que las prioriza. */
export const useBriefing = () => useQuery({ queryKey: [...keys.ai, "briefing"], queryFn: aiService.briefing, staleTime: 10 * 60_000 });
