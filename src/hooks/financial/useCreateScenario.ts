import { useApiMutation, keys } from "@/hooks/shared";
import { financialService } from "@/services/financial";
import type { CreateScenarioInput } from "@/types/api";

/** CU-14: el servidor calcula y guarda los indicadores. */
export const useCreateScenario = () =>
  useApiMutation((input: CreateScenarioInput) => financialService.create(input), { invalidate: [keys.financial], success: "Escenario calculado.", notifyError: false });
