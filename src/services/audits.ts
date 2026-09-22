import { http } from "@/lib/http";
import type { Audit, AuditQuery, Page } from "@/types/api";

export const auditsService = {
  list: async (query: AuditQuery): Promise<Page<Audit>> => (await http.get<Page<Audit>>("/audits", { params: query })).data,
};
