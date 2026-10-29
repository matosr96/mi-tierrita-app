import { useApiMutation, keys } from "@/hooks/shared";
import { payrollService } from "@/services/payroll";

export const useApprovePayrollPeriod = () =>
  useApiMutation((id: number) => payrollService.approvePeriod(id), { invalidate: [keys.payroll, keys.calendar, keys.notifications], success: "Periodo aprobado." });
