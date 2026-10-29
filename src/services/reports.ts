import { http } from "@/lib/http";
import type { ExportVerification, InventoryReport, Page, PageQuery, ReceivablesReport, RecordExportInput, ReportExport, SalesGroupBy, SalesReport } from "@/types/api";

export const reportsService = {
  sales: async (query: { from?: string; to?: string; groupBy?: SalesGroupBy }): Promise<SalesReport> => (await http.get<SalesReport>("/reports/sales", { params: query })).data,
  inventory: async (days?: number): Promise<InventoryReport> => (await http.get<InventoryReport>("/reports/inventory", { params: { days } })).data,
  exports: async (query: PageQuery): Promise<Page<ReportExport>> => (await http.get<Page<ReportExport>>("/reports/exports", { params: query })).data,
  recordExport: async (input: RecordExportInput): Promise<ReportExport> => (await http.post<ReportExport>("/reports/exports", input)).data,
  receivables: async (overdueDays?: number): Promise<ReceivablesReport> => (await http.get<ReceivablesReport>("/reports/receivables", { params: { overdueDays } })).data,
  /** Pública (sin sesión): verificación del documento del QR. */
  verify: async (folio: string): Promise<ExportVerification> => (await http.get<ExportVerification>(`/reports/verify/${encodeURIComponent(folio)}`)).data,
};
