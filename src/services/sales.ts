import { http } from "@/lib/http";
import { aiSuggestedHeaders } from "@/services/ai";
import type { CreateSaleInput, Page, Sale, SaleDetail, SaleQuery } from "@/types/api";

export const salesService = {
  list: async (query: SaleQuery): Promise<Page<Sale>> => (await http.get<Page<Sale>>("/sales", { params: query })).data,
  get: async (id: number): Promise<SaleDetail> => (await http.get<SaleDetail>(`/sales/${id}`)).data,
  register: async (input: CreateSaleInput, aiSuggested?: boolean): Promise<SaleDetail> => (await http.post<SaleDetail>("/sales", input, aiSuggestedHeaders(aiSuggested))).data,
  void: async (id: number): Promise<SaleDetail> => (await http.post<SaleDetail>(`/sales/${id}/void`)).data,
};
