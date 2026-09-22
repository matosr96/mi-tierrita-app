import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { reportsService } from "@/services/reports";

/** CU-20. */
export const useInventoryReport = (days = 30) => useQuery({ queryKey: [...keys.reports, "inventory", days], queryFn: () => reportsService.inventory(days) });
