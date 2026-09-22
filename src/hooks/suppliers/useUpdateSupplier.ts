import { useApiMutation, keys } from "@/hooks/shared";
import { suppliersService } from "@/services/suppliers";
import type { UpdateSupplierInput } from "@/types/api";

export const useUpdateSupplier = () =>
  useApiMutation(({ id, ...input }: UpdateSupplierInput & { id: number }) => suppliersService.update(id, input), {
    invalidate: [keys.suppliers],
    success: "Proveedor actualizado.",
    notifyError: false,
  });
