import { keys, useApiMutation } from "@/hooks/shared";
import { stockCountsService } from "@/services/stockCounts";
import type { ApplyStockCountInput } from "@/types/api";

/** Aplicar el ajuste de existencias (ADMIN): mueve lotes y stock, así que refresca productos, lotes y reportes. */
export const useApplyStockCount = () =>
  useApiMutation(({ id, ...input }: ApplyStockCountInput & { id: number }) => stockCountsService.apply(id, input), {
    invalidate: [keys.stockCounts, keys.products, keys.batches, keys.reports, keys.calendar],
    success: "Ajuste de existencias aplicado.",
    notifyError: false,
  });
