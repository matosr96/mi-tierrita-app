import { useQueries } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { productsService } from "@/services/products";
import type { Product } from "@/types/api";

/** Varios productos por id (por ejemplo, las líneas de un borrador de venta). `ready` cuando llegaron todos. */
export const useProductsByIds = (ids: number[]) => {
  const results = useQueries({ queries: ids.map((id) => ({ queryKey: [...keys.products, id], queryFn: () => productsService.get(id) })) });
  const products = results.map((r) => r.data).filter((p): p is Product => p !== undefined);
  return { products, ready: ids.length > 0 && results.every((r) => !r.isPending), failed: results.some((r) => r.isError) };
};
