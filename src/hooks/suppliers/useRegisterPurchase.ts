import { useApiMutation, keys } from "@/hooks/shared";
import { suppliersService } from "@/services/suppliers";
import type { CreatePurchaseInput } from "@/types/api";

/** CU-13: la compra crea un lote asociado al proveedor y sube el stock. `aiSuggested` marca la auditoría. */
export const useRegisterPurchase = () =>
  useApiMutation(
    async ({ supplierId, aiSuggested, quiet, ...input }: CreatePurchaseInput & { supplierId: number; aiSuggested?: boolean; quiet?: boolean }) => ({
      batch: await suppliersService.registerPurchase(supplierId, input, aiSuggested),
      quiet: quiet === true,
    }),
    {
      invalidate: [keys.batches, keys.products, keys.reports],
      // `quiet`: la lectura de factura registra varias compras seguidas y muestra su propio resumen.
      success: (r) => (r.quiet ? "" : "Compra registrada."),
      notifyError: false,
    },
  );
