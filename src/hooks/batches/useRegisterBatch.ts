import { useApiMutation, keys } from "@/hooks/shared";
import { batchesService } from "@/services/batches";
import type { CreateBatchInput } from "@/types/api";

/** CU-06: crea el lote y sube el stock del producto. */
export const useRegisterBatch = () =>
  useApiMutation(({ productId, ...input }: CreateBatchInput & { productId: number }) => batchesService.register(productId, input), {
    invalidate: [keys.batches, keys.products, keys.reports],
    success: "Lote registrado.",
    notifyError: false,
  });
