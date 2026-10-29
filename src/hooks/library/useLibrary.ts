import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { libraryService } from "@/services/library";
import type { LibraryQuery } from "@/types/api";

/** Documentos y enlaces que el rol puede ver, lo más reciente primero. */
export const useLibrary = (query: LibraryQuery) =>
  useQuery({ queryKey: [...keys.library, query], queryFn: () => libraryService.list(query), staleTime: 30_000, placeholderData: keepPreviousData });
