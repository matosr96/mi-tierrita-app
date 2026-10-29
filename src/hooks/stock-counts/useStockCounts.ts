import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { stockCountsService } from "@/services/stockCounts";
import type { StockCountQuery } from "@/types/api";

/** Conteos de inventario con filtro por estado y fecha programada. */
export const useStockCounts = (query: StockCountQuery, options: { enabled?: boolean } = {}) =>
  useQuery({ queryKey: [...keys.stockCounts, "list", query], queryFn: () => stockCountsService.list(query), placeholderData: (prev) => prev, enabled: options.enabled ?? true });
