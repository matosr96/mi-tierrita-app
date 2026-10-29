import { keys, useApiMutation } from "@/hooks/shared";
import { stockCountsService } from "@/services/stockCounts";
import type { StockCountLineInput } from "@/types/api";

/** Guardar avance de la hoja de conteo; la respuesta trae la diferencia de cada línea. */
export const useSaveStockCountLines = () =>
  useApiMutation(({ id, lines }: { id: number; lines: StockCountLineInput[] }) => stockCountsService.saveLines(id, lines), {
    invalidate: [keys.stockCounts],
    success: "Avance guardado.",
  });
