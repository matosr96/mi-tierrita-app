import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { financialService } from "@/services/financial";

/** CU-15. */
export const useCompareScenarios = (ids: number[]) =>
  useQuery({ queryKey: [...keys.financial, "compare", ids], queryFn: () => financialService.compare(ids), enabled: ids.length >= 2 });
