import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { stockCountsService } from "@/services/stockCounts";

/** Un conteo con sus líneas y el resumen calculado en la API. */
export const useStockCount = (id: number | null) =>
  useQuery({ queryKey: [...keys.stockCounts, "detail", id], queryFn: () => stockCountsService.get(id!), enabled: id !== null });
