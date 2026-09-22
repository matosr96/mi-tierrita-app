import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { reportsService } from "@/services/reports";
import type { SalesGroupBy } from "@/types/api";

/** CU-19. */
export const useSalesReport = (query: { from?: string; to?: string; groupBy?: SalesGroupBy }) =>
  useQuery({ queryKey: [...keys.reports, "sales", query], queryFn: () => reportsService.sales(query), placeholderData: (prev) => prev });
