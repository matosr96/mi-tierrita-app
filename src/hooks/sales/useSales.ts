import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { salesService } from "@/services/sales";
import type { SaleQuery } from "@/types/api";

/** CU-10. */
export const useSales = (query: SaleQuery) => useQuery({ queryKey: [...keys.sales, query], queryFn: () => salesService.list(query), placeholderData: (prev) => prev });
