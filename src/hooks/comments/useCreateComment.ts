import { useApiMutation, keys } from "@/hooks/shared";
import { commentsService } from "@/services/comments";
import type { CreateCommentInput } from "@/types/api";

export const useCreateComment = () => useApiMutation((input: CreateCommentInput) => commentsService.create(input), { invalidate: [keys.comments] });
