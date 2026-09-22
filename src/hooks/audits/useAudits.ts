import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { auditsService } from "@/services/audits";
import type { AuditQuery } from "@/types/api";

/** CU-18. */
export const useAudits = (query: AuditQuery) => useQuery({ queryKey: [...keys.audits, query], queryFn: () => auditsService.list(query), placeholderData: (prev) => prev });
