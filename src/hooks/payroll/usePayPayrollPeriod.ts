import { useApiMutation, keys } from "@/hooks/shared";
import { payrollService } from "@/services/payroll";

export const usePayPayrollPeriod = () =>
  useApiMutation((id: number) => payrollService.payPeriod(id), { invalidate: [keys.payroll, keys.calendar, keys.notifications], success: "Periodo marcado como pagado." });
