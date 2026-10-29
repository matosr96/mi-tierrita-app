import { useApiMutation, keys } from "@/hooks/shared";
import { libraryService } from "@/services/library";
import type { CreateLinkInput } from "@/types/api";

export const useCreateLink = () => useApiMutation((input: CreateLinkInput) => libraryService.createLink(input), { invalidate: [keys.library], success: "Enlace agregado.", notifyError: false });
