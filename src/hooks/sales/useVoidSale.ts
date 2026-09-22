import { useApiMutation, keys } from "@/hooks/shared";
import { salesService } from "@/services/sales";

/** RF-03.4: solo ADMIN. */
export const useVoidSale = () =>
  useApiMutation((id: number) => salesService.void(id), {
    invalidate: [keys.sales, keys.products, keys.batches, keys.customers, keys.reports],
    success: "Venta anulada y stock repuesto.",
  });
