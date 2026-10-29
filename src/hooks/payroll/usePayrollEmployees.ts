import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { payrollService } from "@/services/payroll";
import type { PayrollEmployeeQuery } from "@/types/api";

export const usePayrollEmployees = (query: PayrollEmployeeQuery = { limit: 100 }) =>
  useQuery({ queryKey: [...keys.payroll, "employees", query], queryFn: () => payrollService.listEmployees(query), placeholderData: (prev) => prev });
