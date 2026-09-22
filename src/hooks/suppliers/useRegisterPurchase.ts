import { useApiMutation, keys } from "@/hooks/shared";
import { suppliersService } from "@/services/suppliers";
import type { CreatePurchaseInput } from "@/types/api";

/** CU-13: la compra crea un lote asociado al proveedor y sube el stock. */
export const useRegisterPurchase = () =>
  useApiMutation(({ supplierId, ...input }: CreatePurchaseInput & { supplierId: number }) => suppliersService.registerPurchase(supplierId, input), {
    invalidate: [keys.batches, keys.products, keys.reports],
    success: "Compra registrada.",
    notifyError: false,
  });
