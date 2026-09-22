import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { categoriesService } from "@/services/categories";
import type { PageQuery } from "@/types/api";

export const useCategories = (query: PageQuery & { active?: boolean } = { limit: 100 }) =>
  useQuery({ queryKey: [...keys.categories, query], queryFn: () => categoriesService.list(query), staleTime: 60_000 });
