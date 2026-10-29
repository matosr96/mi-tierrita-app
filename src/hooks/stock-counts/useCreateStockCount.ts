import { keys, useApiMutation } from "@/hooks/shared";
import { stockCountsService } from "@/services/stockCounts";
import type { CreateStockCountInput } from "@/types/api";

/** Programar un conteo. */
export const useCreateStockCount = () =>
  useApiMutation((input: CreateStockCountInput) => stockCountsService.create(input), {
    invalidate: [keys.stockCounts, keys.calendar],
    success: "Conteo programado.",
    notifyError: false,
  });
