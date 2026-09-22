import { http } from "@/lib/http";
import type { CreateProductInput, Page, Product, ProductQuery, UpdateProductInput } from "@/types/api";

export const productsService = {
  list: async (query: ProductQuery): Promise<Page<Product>> => (await http.get<Page<Product>>("/products", { params: query })).data,
  get: async (id: number): Promise<Product> => (await http.get<Product>(`/products/${id}`)).data,
  create: async (input: CreateProductInput): Promise<Product> => (await http.post<Product>("/products", input)).data,
  update: async (id: number, input: UpdateProductInput): Promise<Product> => (await http.put<Product>(`/products/${id}`, input)).data,
  deactivate: async (id: number): Promise<void> => {
    await http.delete(`/products/${id}`);
  },
};
