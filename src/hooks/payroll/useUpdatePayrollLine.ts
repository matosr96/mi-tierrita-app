import { useApiMutation, keys } from "@/hooks/shared";
import { payrollService } from "@/services/payroll";
import type { UpdatePayrollLineInput } from "@/types/api";

/** La API recalcula salud, pensión, totales de la línea y del periodo. El error se avisa con un toast (edición en línea). */
export const useUpdatePayrollLine = () =>
  useApiMutation(({ periodId, lineId, ...input }: UpdatePayrollLineInput & { periodId: number; lineId: number }) => payrollService.updateLine(periodId, lineId, input), {
    invalidate: [keys.payroll, keys.calendar],
    success: "Línea recalculada.",
  });
