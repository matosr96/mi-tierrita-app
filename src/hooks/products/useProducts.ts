import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { productsService } from "@/services/products";
import type { ProductQuery } from "@/types/api";

/** Lista paginada de productos con stock actual (RF-02.3). */
export const useProducts = (query: ProductQuery) => useQuery({ queryKey: [...keys.products, query], queryFn: () => productsService.list(query), placeholderData: (prev) => prev });
