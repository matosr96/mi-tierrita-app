import { useApiMutation, keys } from "@/hooks/shared";
import { libraryService } from "@/services/library";
import type { UpdateLibraryItemInput } from "@/types/api";

export const useUpdateLibraryItem = () =>
  useApiMutation(({ id, ...input }: UpdateLibraryItemInput & { id: number }) => libraryService.update(id, input), { invalidate: [keys.library], success: "Cambios guardados.", notifyError: false });
