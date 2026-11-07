import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { categoriesService } from "@/services/categories";
import type { PublicCategory } from "@/types/api";

/**
 * Líneas de la página pública, leídas de la API (la fuente de verdad es la tabla de categorías). No necesita sesión.
 * Mientras la API responde, o si falla, `data` es undefined: la landing muestra entonces su copia de respaldo.
 */
export const usePublicLines = () =>
  useQuery<PublicCategory[]>({
    queryKey: [...keys.categories, "public"],
    queryFn: categoriesService.listPublic,
    staleTime: 5 * 60_000,
    retry: 1,
  });
