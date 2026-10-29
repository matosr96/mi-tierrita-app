import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation, keys } from "@/hooks/shared";
import { libraryService } from "@/services/library";
import type { LibraryItem } from "@/types/api";

/** Descarga el archivo de un documento con su nombre original. */
export const useDownloadLibraryFile = () => {
  const queryClient = useQueryClient();
  return useApiMutation(async (item: LibraryItem) => {
    const blob = await queryClient.fetchQuery({ queryKey: [...keys.library, "file", item.id, item.updatedAt], queryFn: () => libraryService.file(item.id), staleTime: Infinity });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.name ?? item.title;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return item;
  });
};
