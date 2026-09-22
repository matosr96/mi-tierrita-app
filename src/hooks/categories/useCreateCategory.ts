import { useApiMutation, keys } from "@/hooks/shared";
import { categoriesService } from "@/services/categories";

export const useCreateCategory = () =>
  useApiMutation((name: string) => categoriesService.create(name), { invalidate: [keys.categories], success: "Categoría creada." });
