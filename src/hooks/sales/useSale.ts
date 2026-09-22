import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { salesService } from "@/services/sales";

export const useSale = (id: number | null) => useQuery({ queryKey: [...keys.sales, id], queryFn: () => salesService.get(id!), enabled: id !== null });
