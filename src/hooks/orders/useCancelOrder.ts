import { useApiMutation, keys } from "@/hooks/shared";
import { ordersService } from "@/services/orders";

export const useCancelOrder = () =>
  useApiMutation((id: number) => ordersService.cancel(id), { invalidate: [keys.orders, keys.calendar], success: "Pedido cancelado." });
