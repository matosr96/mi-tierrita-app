import { useApiMutation, keys } from "@/hooks/shared";
import { payrollService } from "@/services/payroll";
import type { UpdatePayrollEmployeeInput } from "@/types/api";

/** Editar, activar o desactivar (`active`). */
export const useUpdatePayrollEmployee = () =>
  useApiMutation(({ id, ...input }: UpdatePayrollEmployeeInput & { id: number }) => payrollService.updateEmployee(id, input), {
    invalidate: [keys.payroll],
    success: (e) => (e.active ? "Empleado actualizado." : "Empleado actualizado e inactivo."),
    notifyError: false,
  });
