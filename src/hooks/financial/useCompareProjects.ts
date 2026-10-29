import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { financialService } from "@/services/financial";

/** Proyectos lado a lado con sus escenarios pesimista, base y optimista. */
export const useCompareProjects = (ids: number[]) =>
  useQuery({ queryKey: [...keys.financial, "compare", ids], queryFn: () => financialService.compare(ids), enabled: ids.length >= 2 });
