import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { batchesService } from "@/services/batches";
import type { PageQuery } from "@/types/api";

/** CU-07: lotes por vencer (y vencidos) dentro de la ventana de días. */
export const useExpiringBatches = (query: PageQuery & { days?: number }) =>
  useQuery({ queryKey: [...keys.batches, "expiring", query], queryFn: () => batchesService.expiring(query), placeholderData: (prev) => prev });
