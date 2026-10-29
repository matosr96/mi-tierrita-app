import { http } from "@/lib/http";
import type { Audit, AuditQuery, Page, RecordHistoryQuery } from "@/types/api";

export const auditsService = {
  list: async (query: AuditQuery): Promise<Page<Audit>> => (await http.get<Page<Audit>>("/audits", { params: query })).data,
  entity: async ({ entity, entityId, ...query }: RecordHistoryQuery): Promise<Page<Audit>> =>
    (await http.get<Page<Audit>>(`/audits/entity/${entity}/${entityId}`, { params: query })).data,
};
