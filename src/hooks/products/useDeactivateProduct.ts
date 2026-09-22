import { useApiMutation, keys } from "@/hooks/shared";
import { productsService } from "@/services/products";

export const useDeactivateProduct = () =>
  useApiMutation((id: number) => productsService.deactivate(id), { invalidate: [keys.products, keys.reports], success: "Producto desactivado." });
