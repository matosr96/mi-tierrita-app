import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { reportsService } from "@/services/reports";

/** CU-20. */
export const useReceivablesReport = (overdueDays = 30) =>
  useQuery({ queryKey: [...keys.reports, "receivables", overdueDays], queryFn: () => reportsService.receivables(overdueDays) });
