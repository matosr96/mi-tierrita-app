import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { toApiError, type ApiError } from "@/lib/errors";
import { financialService } from "@/services/financial";
import type { SimulatorCalculation, SimulatorInput } from "@/types/api";

/**
 * Recalcula en la API sin guardar; mientras llega el nuevo cálculo (o si la entrada es inválida) se conserva el
 * anterior en pantalla. El error es un `ApiError` para pintar los campos con `fieldErrors`.
 */
export const useSimulation = (input: SimulatorInput | null) =>
  useQuery<SimulatorCalculation, ApiError>({
    queryKey: [...keys.financial, "simulate", input],
    queryFn: async () => {
      try {
        return await financialService.calculate(input!);
      } catch (err) {
        throw toApiError(err);
      }
    },
    enabled: input !== null,
    placeholderData: keepPreviousData,
    retry: false,
  });
