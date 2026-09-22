import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { batchesService } from "@/services/batches";
import type { PageQuery } from "@/types/api";

export const useProductBatches = (productId: number | null, query: PageQuery & { onlyAvailable?: boolean } = { limit: 50 }) =>
  useQuery({ queryKey: [...keys.batches, "product", productId, query], queryFn: () => batchesService.listByProduct(productId!, query), enabled: productId !== null });
