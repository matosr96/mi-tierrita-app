import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { toApiError } from "@/lib/errors";
import { reportsService } from "@/services/reports";

/** Verificación pública de un documento por su folio (página `/verificar/:folio`, sin sesión). No reintenta: un 404 es «No encontrado». */
export const useVerifyExport = (folio: string) =>
  useQuery({
    queryKey: [...keys.reports, "verify", folio],
    queryFn: async () => {
      try {
        return await reportsService.verify(folio);
      } catch (err) {
        throw toApiError(err);
      }
    },
    retry: false,
    enabled: folio !== "",
  });
