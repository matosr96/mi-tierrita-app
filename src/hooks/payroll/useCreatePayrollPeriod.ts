import { useApiMutation, keys } from "@/hooks/shared";
import { payrollService } from "@/services/payroll";
import type { CreatePayrollPeriodInput } from "@/types/api";

/** Crea el borrador con las líneas de los empleados activos de la frecuencia (lo hace la API). */
export const useCreatePayrollPeriod = () =>
  useApiMutation((input: CreatePayrollPeriodInput) => payrollService.createPeriod(input), {
    invalidate: [keys.payroll, keys.calendar, keys.notifications],
    success: "Periodo creado en borrador.",
    notifyError: false,
  });
