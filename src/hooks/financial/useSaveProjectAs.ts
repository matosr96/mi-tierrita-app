import { useApiMutation, keys } from "@/hooks/shared";
import { financialService } from "@/services/financial";
import type { SimulatorInput } from "@/types/api";

/** «Guardar como»: crea un proyecto nuevo del usuario. */
export const useSaveProjectAs = () =>
  useApiMutation((body: { name: string; input: SimulatorInput }) => financialService.saveAs(body), { invalidate: [keys.financial], success: "Proyecto guardado.", notifyError: false });
