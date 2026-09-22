import { useApiMutation, keys } from "@/hooks/shared";
import { customersService } from "@/services/customers";

/** CU-12. */
export const useRegisterPayment = () =>
  useApiMutation(({ id, amount }: { id: number; amount: number }) => customersService.registerPayment(id, amount), {
    invalidate: [keys.customers, keys.reports],
    success: "Abono registrado.",
    notifyError: false,
  });
