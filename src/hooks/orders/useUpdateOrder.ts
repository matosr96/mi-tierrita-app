import { useApiMutation, keys } from "@/hooks/shared";
import { ordersService } from "@/services/orders";
import type { UpdateOrderInput } from "@/types/api";

export const useUpdateOrder = () =>
  useApiMutation(({ id, ...input }: UpdateOrderInput & { id: number }) => ordersService.update(id, input), {
    invalidate: [keys.orders, keys.calendar],
    success: "Pedido actualizado.",
    notifyError: false,
  });
