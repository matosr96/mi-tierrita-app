import { http } from "@/lib/http";
import type { CommentEntity, CreateCommentInput, RecordComment, TitaActionInput } from "@/types/api";

export const commentsService = {
  list: async (entity: CommentEntity, entityId: number): Promise<{ items: RecordComment[] }> =>
    (await http.get<{ items: RecordComment[] }>("/comments", { params: { entity, entityId } })).data,
  create: async (input: CreateCommentInput): Promise<RecordComment> => (await http.post<RecordComment>("/comments", input)).data,
  remove: async (id: number): Promise<void> => {
    await http.delete(`/comments/${id}`);
  },
  titaAction: async (id: number, input: TitaActionInput): Promise<void> => {
    await http.patch(`/comments/${id}/tita-actions`, input);
  },
};
