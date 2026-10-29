import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { financialService } from "@/services/financial";

/** Supuestos del ejemplo de la ampliación ($94,5 M) con su cálculo. */
export const useSimulatorDefaults = (enabled = true) =>
  useQuery({ queryKey: [...keys.financial, "defaults"], queryFn: financialService.defaults, enabled, staleTime: Infinity });
