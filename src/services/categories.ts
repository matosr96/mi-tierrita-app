import { http } from "@/lib/http";
import type { Category, Page, PageQuery } from "@/types/api";

export const categoriesService = {
  list: async (query: PageQuery & { active?: boolean }): Promise<Page<Category>> => (await http.get<Page<Category>>("/categories", { params: query })).data,
  create: async (name: string): Promise<Category> => (await http.post<Category>("/categories", { name })).data,
  update: async (id: number, input: { name?: string; active?: boolean }): Promise<Category> => (await http.put<Category>(`/categories/${id}`, input)).data,
  remove: async (id: number): Promise<void> => {
    await http.delete(`/categories/${id}`);
  },
};
