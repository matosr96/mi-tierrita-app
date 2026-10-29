import { keys, useApiMutation } from "@/hooks/shared";
import { stockCountsService } from "@/services/stockCounts";
import type { UpdateStockCountInput } from "@/types/api";

/** Cambiar título, fecha o nota de un conteo programado. */
export const useUpdateStockCount = () =>
  useApiMutation(({ id, ...input }: UpdateStockCountInput & { id: number }) => stockCountsService.update(id, input), {
    invalidate: [keys.stockCounts, keys.calendar],
    success: "Conteo actualizado.",
    notifyError: false,
  });
