import { useApiMutation, keys } from "@/hooks/shared";
import { payrollService } from "@/services/payroll";

/**
 * Solo invalida los listados de periodos (no la raíz de nómina): el detalle del borrador eliminado ya no existe y
 * volver a pedirlo (con sus reintentos) retrasaría la salida de la pantalla.
 */
export const useDeletePayrollPeriod = () =>
  useApiMutation((id: number) => payrollService.removePeriod(id), {
    invalidate: [[...keys.payroll, "periods"], keys.calendar, keys.notifications],
    success: "Borrador eliminado.",
  });
