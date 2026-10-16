import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { reportsService } from "@/services/reports";
import type { PageQuery } from "@/types/api";

/** Historial de reportes descargados (el administrador ve el de todo el equipo; la secretaria, el suyo). */
export const useReportExports = (query: PageQuery) =>
  useQuery({ queryKey: [...keys.reports, "exports", query], queryFn: () => reportsService.exports(query), placeholderData: (prev) => prev });
