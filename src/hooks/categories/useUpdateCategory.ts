import { useApiMutation, keys } from "@/hooks/shared";
import { categoriesService } from "@/services/categories";
import type { CategoryInput } from "@/types/api";

export const useUpdateCategory = () =>
  useApiMutation(({ id, ...input }: { id: number } & CategoryInput) => categoriesService.update(id, input), {
    invalidate: [keys.categories, keys.products],
    success: "Categoría actualizada.",
  });
