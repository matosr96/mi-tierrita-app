import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { ordersService } from "@/services/orders";

export const useOrder = (id: number | null) => useQuery({ queryKey: [...keys.orders, "detail", id], queryFn: () => ordersService.get(id!), enabled: id !== null });
