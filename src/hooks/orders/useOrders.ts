import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { ordersService } from "@/services/orders";
import type { OrderQuery } from "@/types/api";

/** `enabled: false` cuando el rol no maneja ese tipo (la API respondería 613). */
export const useOrders = (query: OrderQuery, options: { enabled?: boolean } = {}) =>
  useQuery({ queryKey: [...keys.orders, "list", query], queryFn: () => ordersService.list(query), placeholderData: (prev) => prev, enabled: options.enabled ?? true });
