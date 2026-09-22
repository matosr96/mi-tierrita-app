import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { financialService } from "@/services/financial";
import type { Range, SensitivityVariable } from "@/types/api";

/** CU-17 univariante. */
export const useSensitivity = (id: number | null, variable: SensitivityVariable, range?: Range) =>
  useQuery({ queryKey: [...keys.financial, "sensitivity", id, variable, range], queryFn: () => financialService.sensitivity(id!, variable, range), enabled: id !== null });
