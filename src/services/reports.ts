import { http } from "@/lib/http";
import type { InventoryReport, ReceivablesReport, SalesGroupBy, SalesReport } from "@/types/api";

export const reportsService = {
  sales: async (query: { from?: string; to?: string; groupBy?: SalesGroupBy }): Promise<SalesReport> => (await http.get<SalesReport>("/reports/sales", { params: query })).data,
  inventory: async (days?: number): Promise<InventoryReport> => (await http.get<InventoryReport>("/reports/inventory", { params: { days } })).data,
  receivables: async (overdueDays?: number): Promise<ReceivablesReport> => (await http.get<ReceivablesReport>("/reports/receivables", { params: { overdueDays } })).data,
};
