import { keys, useApiMutation } from "@/hooks/shared";
import { stockCountsService } from "@/services/stockCounts";

/** Iniciar: la API crea las líneas con el stock físico de este momento. */
export const useStartStockCount = () =>
  useApiMutation((id: number) => stockCountsService.start(id), { invalidate: [keys.stockCounts, keys.calendar], success: "Conteo iniciado." });
