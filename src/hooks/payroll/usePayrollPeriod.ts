import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { payrollService } from "@/services/payroll";

export const usePayrollPeriod = (id: number | null) =>
  useQuery({ queryKey: [...keys.payroll, "period", id], queryFn: () => payrollService.getPeriod(id!), enabled: id !== null });
