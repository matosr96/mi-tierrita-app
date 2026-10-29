import { useApiMutation, keys } from "@/hooks/shared";
import { commentsService } from "@/services/comments";

export const useDeleteComment = () => useApiMutation((id: number) => commentsService.remove(id), { invalidate: [keys.comments], success: "Comentario eliminado." });
