import { keys, useApiMutation } from "@/hooks/shared";
import { stockCountsService } from "@/services/stockCounts";

/** Cancelar un conteo programado o en curso. */
export const useCancelStockCount = () =>
  useApiMutation((id: number) => stockCountsService.cancel(id), { invalidate: [keys.stockCounts, keys.calendar], success: "Conteo cancelado." });
