import { useApiMutation, keys } from "@/hooks/shared";
import { libraryService } from "@/services/library";
import type { UploadLibraryDocumentInput } from "@/types/api";

export const useUploadLibraryDocument = () =>
  useApiMutation((input: UploadLibraryDocumentInput) => libraryService.uploadDocument(input), { invalidate: [keys.library], success: "Documento guardado.", notifyError: false });
