import { useApiMutation, keys } from "@/hooks/shared";
import { productsService } from "@/services/products";
import type { UpdateProductInput } from "@/types/api";

export const useUpdateProduct = () =>
  useApiMutation(({ id, ...input }: UpdateProductInput & { id: number }) => productsService.update(id, input), {
    invalidate: [keys.products, keys.reports],
    success: "Producto actualizado.",
    notifyError: false,
  });
