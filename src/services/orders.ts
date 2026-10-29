import { http } from "@/lib/http";
import type { CreateOrderInput, Order, OrderDetail, OrderQuery, Page, ReceiveOrderInput, ReceiveOrderResult, UpdateOrderInput } from "@/types/api";

/** Pedidos a proveedor y de cliente (`/orders`). La API filtra por rol y calcula los totales. */
export const ordersService = {
  list: async (query: OrderQuery): Promise<Page<Order>> => (await http.get<Page<Order>>("/orders", { params: query })).data,
  get: async (id: number): Promise<OrderDetail> => (await http.get<OrderDetail>(`/orders/${id}`)).data,
  create: async (input: CreateOrderInput): Promise<OrderDetail> => (await http.post<OrderDetail>("/orders", input)).data,
  update: async (id: number, input: UpdateOrderInput): Promise<OrderDetail> => (await http.put<OrderDetail>(`/orders/${id}`, input)).data,
  receive: async (id: number, input: ReceiveOrderInput): Promise<ReceiveOrderResult> => (await http.post<ReceiveOrderResult>(`/orders/${id}/receive`, input)).data,
  deliver: async (id: number, saleId?: number): Promise<OrderDetail> => (await http.post<OrderDetail>(`/orders/${id}/deliver`, saleId === undefined ? {} : { saleId })).data,
  cancel: async (id: number): Promise<OrderDetail> => (await http.post<OrderDetail>(`/orders/${id}/cancel`)).data,
};
