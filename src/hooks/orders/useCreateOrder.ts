import { useApiMutation, keys } from "@/hooks/shared";
import { ordersService } from "@/services/orders";
import type { CreateOrderInput } from "@/types/api";

export const useCreateOrder = () =>
  useApiMutation((input: CreateOrderInput) => ordersService.create(input), { invalidate: [keys.orders, keys.calendar], success: "Pedido creado.", notifyError: false });
