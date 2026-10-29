import { useApiMutation, keys } from "@/hooks/shared";
import { libraryService } from "@/services/library";

export const useDeleteLibraryItem = () => useApiMutation((id: number) => libraryService.remove(id), { invalidate: [keys.library], success: "Eliminado de la biblioteca." });
