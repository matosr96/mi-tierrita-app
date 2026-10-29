import { useApiMutation, keys } from "@/hooks/shared";
import { payrollService } from "@/services/payroll";
import type { CreatePayrollEmployeeInput } from "@/types/api";

export const useCreatePayrollEmployee = () =>
  useApiMutation((input: CreatePayrollEmployeeInput) => payrollService.createEmployee(input), { invalidate: [keys.payroll], success: "Empleado creado.", notifyError: false });
