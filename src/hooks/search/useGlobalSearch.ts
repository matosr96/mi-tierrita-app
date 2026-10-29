import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { searchService } from "@/services/search";

/** Búsqueda global para Ctrl+K (brief 29). Solo consulta con dos caracteres o más; el rebote lo pone quien la usa. */
export const useGlobalSearch = (q: string) =>
  useQuery({ queryKey: [...keys.search, q], queryFn: () => searchService.global(q), enabled: q.length >= 2, placeholderData: (prev) => prev, staleTime: 30_000 });
