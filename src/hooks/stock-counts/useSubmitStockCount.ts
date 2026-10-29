import { keys, useApiMutation } from "@/hooks/shared";
import { stockCountsService } from "@/services/stockCounts";

/** Enviar el conteo para que la administración apruebe el ajuste. */
export const useSubmitStockCount = () =>
  useApiMutation((id: number) => stockCountsService.submit(id), { invalidate: [keys.stockCounts, keys.calendar], success: "Conteo enviado para aprobación." });
