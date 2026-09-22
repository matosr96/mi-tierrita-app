import { useApiMutation, keys } from "@/hooks/shared";
import { productsService } from "@/services/products";
import type { CreateProductInput } from "@/types/api";

/** CU-05. */
export const useCreateProduct = () =>
  useApiMutation((input: CreateProductInput) => productsService.create(input), { invalidate: [keys.products, keys.reports], success: "Producto registrado.", notifyError: false });
