import { useApiMutation, keys } from "@/hooks/shared";
import { categoriesService } from "@/services/categories";

export const useCreateCategory = () =>
  useApiMutation((input: { name: string; description?: string; tags?: string[] }) => categoriesService.create(input), { invalidate: [keys.categories], success: "Categoría creada." });
