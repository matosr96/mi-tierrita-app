import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { financialService } from "@/services/financial";
import type { SensitivityVariable } from "@/types/api";

/** CU-17 bivariante. */
export const useBivariate = (id: number | null, varX: SensitivityVariable, varY: SensitivityVariable) =>
  useQuery({ queryKey: [...keys.financial, "bivariate", id, varX, varY], queryFn: () => financialService.bivariate(id!, varX, varY), enabled: id !== null && varX !== varY });
