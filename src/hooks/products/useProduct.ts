import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { productsService } from "@/services/products";

export const useProduct = (id: number | null) => useQuery({ queryKey: [...keys.products, id], queryFn: () => productsService.get(id!), enabled: id !== null });
