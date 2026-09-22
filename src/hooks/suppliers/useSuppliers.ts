import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { suppliersService } from "@/services/suppliers";
import type { PageQuery } from "@/types/api";

export const useSuppliers = (query: PageQuery & { active?: boolean } = { limit: 100 }) =>
  useQuery({ queryKey: [...keys.suppliers, query], queryFn: () => suppliersService.list(query), placeholderData: (prev) => prev });
