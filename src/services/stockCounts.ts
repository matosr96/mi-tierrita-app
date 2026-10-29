import { http } from "@/lib/http";
import type {
  AdjustmentPreview,
  AppliedStockCount,
  ApplyStockCountInput,
  CreateStockCountInput,
  Page,
  StockCount,
  StockCountDetail,
  StockCountLineInput,
  StockCountQuery,
  UpdateStockCountInput,
} from "@/types/api";

/** Conteos de inventario (`/stock-counts`): ADMIN y WAREHOUSE; aplicar el ajuste, solo ADMIN. */
export const stockCountsService = {
  list: async (query: StockCountQuery): Promise<Page<StockCount>> => (await http.get<Page<StockCount>>("/stock-counts", { params: query })).data,
  get: async (id: number): Promise<StockCountDetail> => (await http.get<StockCountDetail>(`/stock-counts/${id}`)).data,
  create: async (input: CreateStockCountInput): Promise<StockCountDetail> => (await http.post<StockCountDetail>("/stock-counts", input)).data,
  update: async (id: number, input: UpdateStockCountInput): Promise<StockCountDetail> => (await http.put<StockCountDetail>(`/stock-counts/${id}`, input)).data,
  start: async (id: number): Promise<StockCountDetail> => (await http.post<StockCountDetail>(`/stock-counts/${id}/start`)).data,
  saveLines: async (id: number, lines: StockCountLineInput[]): Promise<StockCountDetail> => (await http.put<StockCountDetail>(`/stock-counts/${id}/lines`, { lines })).data,
  submit: async (id: number): Promise<StockCountDetail> => (await http.post<StockCountDetail>(`/stock-counts/${id}/submit`)).data,
  previewAdjustment: async (id: number): Promise<AdjustmentPreview> => (await http.get<AdjustmentPreview>(`/stock-counts/${id}/preview-adjustment`)).data,
  apply: async (id: number, input: ApplyStockCountInput): Promise<AppliedStockCount> => (await http.post<AppliedStockCount>(`/stock-counts/${id}/apply`, input)).data,
  cancel: async (id: number): Promise<StockCountDetail> => (await http.post<StockCountDetail>(`/stock-counts/${id}/cancel`)).data,
};
