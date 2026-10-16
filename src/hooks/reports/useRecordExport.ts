import { useApiMutation, keys } from "@/hooks/shared";
import { reportsService } from "@/services/reports";
import type { RecordExportInput } from "@/types/api";

/** Deja constancia de una descarga en PDF o Excel. Si falla no se avisa: la descarga ya ocurrió. */
export const useRecordExport = () =>
  useApiMutation((input: RecordExportInput) => reportsService.recordExport(input), { invalidate: [[...keys.reports, "exports"], keys.audits], notifyError: false });
