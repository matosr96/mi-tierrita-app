import { useApiMutation, keys } from "@/hooks/shared";
import { customersService } from "@/services/customers";

/** CU-12. `aiSuggested` marca en la auditoría que el abono salió de un borrador del asistente. */
export const useRegisterPayment = () =>
  useApiMutation(({ id, amount, aiSuggested }: { id: number; amount: number; aiSuggested?: boolean }) => customersService.registerPayment(id, amount, aiSuggested), {
    invalidate: [keys.customers, keys.reports],
    success: "Abono registrado.",
    notifyError: false,
  });
