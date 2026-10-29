import { useApiMutation, keys } from "@/hooks/shared";
import { financialService } from "@/services/financial";
import type { SimulatorInput } from "@/types/api";

/** «Guardar proyecto»: sobrescribe un proyecto propio. */
export const useSaveProject = () =>
  useApiMutation((body: { id: number; name?: string; input: SimulatorInput }) => financialService.save(body), { invalidate: [keys.financial], success: "Cambios guardados." });
