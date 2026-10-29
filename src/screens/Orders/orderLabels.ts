import type { Order, OrderKind, OrderStatus, Role } from "@/types/api";

/** Qué tipo de pedido maneja cada rol (la API aplica la misma regla y responde 613 si no). */
export const ORDER_KIND_ROLES: Record<OrderKind, Role[]> = { SUPPLIER: ["ADMIN", "WAREHOUSE"], CUSTOMER: ["ADMIN", "SALES"] };

export const kindsFor = (role: Role | undefined): OrderKind[] => (role ? (["SUPPLIER", "CUSTOMER"] as const).filter((k) => ORDER_KIND_ROLES[k].includes(role)) : []);

export const KIND_TAB_LABEL: Record<OrderKind, string> = { SUPPLIER: "A proveedores", CUSTOMER: "De clientes" };
export const KIND_PARAM: Record<OrderKind, string> = { SUPPLIER: "proveedor", CUSTOMER: "cliente" };
export const COUNTERPART_LABEL: Record<OrderKind, string> = { SUPPLIER: "Proveedor", CUSTOMER: "Cliente" };
export const DUE_LABEL: Record<OrderKind, string> = { SUPPLIER: "Llegada esperada", CUSTOMER: "Entrega comprometida" };
export const PRICE_LABEL: Record<OrderKind, string> = { SUPPLIER: "Costo esperado", CUSTOMER: "Precio acordado" };

export const statusLabel = (status: OrderStatus): string =>
  ({ PENDING: "Pendiente", PARTIAL: "Recibido en parte", RECEIVED: "Recibido", DELIVERED: "Entregado", CANCELLED: "Cancelado" })[status];

export const statusTone = (status: OrderStatus): "neutral" | "good" | "warn" | "bad" =>
  status === "RECEIVED" || status === "DELIVERED" ? "good" : status === "PARTIAL" ? "warn" : status === "CANCELLED" ? "neutral" : "neutral";

/** Filtros por estado de cada pestaña; `value` va tal cual a `?status=` (vacío = todos). */
export type StatusFilter = "open" | "done" | "cancelled" | "all";
export const statusFilters = (kind: OrderKind): { value: StatusFilter; label: string }[] => [
  { value: "open", label: "Abiertos" },
  { value: "done", label: kind === "SUPPLIER" ? "Recibidos" : "Entregados" },
  { value: "cancelled", label: "Cancelados" },
  { value: "all", label: "Todos" },
];
export const statusParam = (kind: OrderKind, filter: StatusFilter): string | undefined =>
  filter === "open" ? "PENDING,PARTIAL" : filter === "done" ? (kind === "SUPPLIER" ? "RECEIVED" : "DELIVERED") : filter === "cancelled" ? "CANCELLED" : undefined;

/** Días que se resaltan en ámbar antes de la fecha comprometida. */
export const DUE_SOON_DAYS = 2;

/**
 * Tono de la fecha con lo que dice la API (`overdue`, `daysToDue` en hora del negocio): vencido en `--bad`, a dos días
 * o menos en `--warn`; los pedidos cerrados no se resaltan.
 */
export const dueTone = (order: Pick<Order, "open" | "overdue" | "daysToDue">): "bad" | "warn" | null =>
  !order.open ? null : order.overdue ? "bad" : order.daysToDue <= DUE_SOON_DAYS ? "warn" : null;

export const dueText = (order: Pick<Order, "open" | "overdue" | "daysToDue">): string | null => {
  if (!order.open) return null;
  const d = order.daysToDue;
  if (d < -1) return `Venció hace ${-d} días`;
  if (d === -1) return "Venció ayer";
  if (d === 0) return "Vence hoy";
  if (d === 1) return "Vence mañana";
  if (d <= DUE_SOON_DAYS) return `Vence en ${d} días`;
  return null;
};
