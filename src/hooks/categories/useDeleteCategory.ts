import { useApiMutation, keys } from "@/hooks/shared";
import { categoriesService } from "@/services/categories";

export const useDeleteCategory = () =>
  useApiMutation((id: number) => categoriesService.remove(id), { invalidate: [keys.categories], success: "Categoría eliminada." });
