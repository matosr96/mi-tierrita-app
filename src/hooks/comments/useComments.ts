import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { commentsService } from "@/services/comments";
import type { CommentEntity } from "@/types/api";

/** Comentarios de un registro en orden cronológico (brief 33). `pollMs` consulta periódicamente mientras se espera la respuesta de @Tita. */
export const useComments = (entity: CommentEntity, entityId: number | null, pollMs: number | false = false) =>
  useQuery({
    queryKey: [...keys.comments, entity, entityId],
    queryFn: () => commentsService.list(entity, entityId!),
    enabled: entityId !== null,
    refetchInterval: pollMs,
  });
