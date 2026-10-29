import { useApiMutation, keys } from "@/hooks/shared";
import { ordersService } from "@/services/orders";
import type { ReceiveOrderInput } from "@/types/api";

/** La recepción crea lotes y sube el stock: refresca también inventario, lotes y reportes. */
export const useReceiveOrder = () =>
  useApiMutation(({ id, ...input }: ReceiveOrderInput & { id: number }) => ordersService.receive(id, input), {
    invalidate: [keys.orders, keys.batches, keys.products, keys.reports, keys.calendar],
    success: (r) => (r.order.status === "RECEIVED" ? "Pedido recibido completo." : "Recepción parcial registrada."),
    notifyError: false,
  });
