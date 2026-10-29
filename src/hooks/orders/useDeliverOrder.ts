import { useApiMutation, keys } from "@/hooks/shared";
import { ordersService } from "@/services/orders";

export const useDeliverOrder = () =>
  useApiMutation(({ id, saleId }: { id: number; saleId?: number }) => ordersService.deliver(id, saleId), {
    invalidate: [keys.orders, keys.calendar],
    success: "Pedido marcado como entregado.",
    notifyError: false,
  });
