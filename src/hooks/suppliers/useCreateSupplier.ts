import { useApiMutation, keys } from "@/hooks/shared";
import { suppliersService } from "@/services/suppliers";
import type { CreateSupplierInput } from "@/types/api";

export const useCreateSupplier = () =>
  useApiMutation((input: CreateSupplierInput) => suppliersService.create(input), { invalidate: [keys.suppliers], success: "Proveedor creado.", notifyError: false });
