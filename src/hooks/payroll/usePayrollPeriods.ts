import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { payrollService } from "@/services/payroll";
import type { PayrollPeriodQuery } from "@/types/api";

export const usePayrollPeriods = (query: PayrollPeriodQuery = {}) =>
  useQuery({ queryKey: [...keys.payroll, "periods", query], queryFn: () => payrollService.listPeriods(query), placeholderData: (prev) => prev });
