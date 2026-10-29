import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { libraryService } from "@/services/library";

/** Contenido de un documento (con la sesión), en caché para que el visor no lo baje dos veces. */
export const useLibraryFile = (id: number | null, updatedAt?: string) =>
  useQuery({ queryKey: [...keys.library, "file", id, updatedAt ?? null], queryFn: () => libraryService.file(id!), enabled: id !== null, staleTime: Infinity, gcTime: 10 * 60_000 });
