import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { financialService } from "@/services/financial";
import type { PageQuery } from "@/types/api";

export const useScenarios = (query: PageQuery = { limit: 50 }) => useQuery({ queryKey: [...keys.financial, "scenarios", query], queryFn: () => financialService.list(query) });
