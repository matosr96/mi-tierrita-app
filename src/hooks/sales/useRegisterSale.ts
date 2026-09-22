import { useApiMutation, keys } from "@/hooks/shared";
import { salesService } from "@/services/sales";
import type { CreateSaleInput } from "@/types/api";

/** CU-09: el servidor congela precios, calcula el total y descuenta stock por FEFO. */
export const useRegisterSale = () =>
  useApiMutation((input: CreateSaleInput) => salesService.register(input), {
    invalidate: [keys.sales, keys.products, keys.batches, keys.customers, keys.reports],
    success: (sale) => `Venta ${sale.invoiceNumber} registrada.`,
    notifyError: false,
  });
