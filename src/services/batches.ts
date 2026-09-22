import { http } from "@/lib/http";
import type { CreateBatchInput, Page, PageQuery, ProductBatch } from "@/types/api";

export const batchesService = {
  listByProduct: async (productId: number, query: PageQuery & { onlyAvailable?: boolean }): Promise<Page<ProductBatch>> =>
    (await http.get<Page<ProductBatch>>(`/products/${productId}/batches`, { params: query })).data,
  register: async (productId: number, input: CreateBatchInput): Promise<ProductBatch> => (await http.post<ProductBatch>(`/products/${productId}/batches`, input)).data,
  expiring: async (query: PageQuery & { days?: number }): Promise<Page<ProductBatch>> => (await http.get<Page<ProductBatch>>("/batches/expiring", { params: query })).data,
};
