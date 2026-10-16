import { http } from "@/lib/http";
import { aiSuggestedHeaders } from "@/services/ai";
import type { CreatePurchaseInput, CreateSupplierInput, Page, PageQuery, ProductBatch, Supplier, UpdateSupplierInput } from "@/types/api";

export const suppliersService = {
  list: async (query: PageQuery & { active?: boolean }): Promise<Page<Supplier>> => (await http.get<Page<Supplier>>("/suppliers", { params: query })).data,
  create: async (input: CreateSupplierInput): Promise<Supplier> => (await http.post<Supplier>("/suppliers", input)).data,
  update: async (id: number, input: UpdateSupplierInput): Promise<Supplier> => (await http.put<Supplier>(`/suppliers/${id}`, input)).data,
  registerPurchase: async (supplierId: number, input: CreatePurchaseInput, aiSuggested?: boolean): Promise<ProductBatch> =>
    (await http.post<ProductBatch>(`/suppliers/${supplierId}/purchases`, input, aiSuggestedHeaders(aiSuggested))).data,
};
