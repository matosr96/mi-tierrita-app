import { http } from "@/lib/http";
import type { CreateSaleInput, Page, Sale, SaleDetail, SaleQuery } from "@/types/api";

export const salesService = {
  list: async (query: SaleQuery): Promise<Page<Sale>> => (await http.get<Page<Sale>>("/sales", { params: query })).data,
  get: async (id: number): Promise<SaleDetail> => (await http.get<SaleDetail>(`/sales/${id}`)).data,
  register: async (input: CreateSaleInput): Promise<SaleDetail> => (await http.post<SaleDetail>("/sales", input)).data,
  void: async (id: number): Promise<SaleDetail> => (await http.post<SaleDetail>(`/sales/${id}/void`)).data,
};
