import { http } from "@/lib/http";
import type { Category, CategoryInput, Page, PageQuery, PublicCategory } from "@/types/api";

export const categoriesService = {
  list: async (query: PageQuery & { active?: boolean }): Promise<Page<Category>> => (await http.get<Page<Category>>("/categories", { params: query })).data,
  /** Público: las líneas que muestra la página pública (categorías activas con código). */
  listPublic: async (): Promise<PublicCategory[]> => (await http.get<{ items: PublicCategory[] }>("/categories/public")).data.items,
  create: async (input: { name: string; description?: string; tags?: string[] }): Promise<Category> => (await http.post<Category>("/categories", input)).data,
  update: async (id: number, input: CategoryInput): Promise<Category> => (await http.put<Category>(`/categories/${id}`, input)).data,
  remove: async (id: number): Promise<void> => {
    await http.delete(`/categories/${id}`);
  },
};
