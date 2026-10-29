import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { auditsService } from "@/services/audits";

const HISTORY_LIMIT = 50;

/** Línea de tiempo de un registro (brief 33): solo ADMIN; quien la monta decide si la pide. */
export const useRecordHistory = (entity: string, entityId: number | null, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: [...keys.audits, "entity", entity, entityId],
    queryFn: () => auditsService.entity({ entity, entityId: entityId!, limit: HISTORY_LIMIT }),
    enabled: entityId !== null && (options.enabled ?? true),
  });
