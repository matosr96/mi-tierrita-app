import { http } from "@/lib/http";
import type { SearchResults } from "@/types/api";

export const searchService = {
  global: async (q: string): Promise<SearchResults> => (await http.get<SearchResults>("/search", { params: { q } })).data,
};
