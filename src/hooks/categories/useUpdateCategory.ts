import { useApiMutation, keys } from "@/hooks/shared";
import { categoriesService } from "@/services/categories";

export const useUpdateCategory = () =>
  useApiMutation(({ id, ...input }: { id: number; name?: string; active?: boolean }) => categoriesService.update(id, input), {
    invalidate: [keys.categories, keys.products],
    success: "Categoría actualizada.",
  });
