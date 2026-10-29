import { int } from "@/lib/format";
import type { StockCount, StockCountStatus } from "@/types/api";

export const STATUS_LABELS: Record<StockCountStatus, string> = {
  PLANNED: "Programado",
  IN_PROGRESS: "En curso",
  SUBMITTED: "Enviado",
  APPLIED: "Aplicado",
  CANCELLED: "Cancelado",
};

export const STATUS_TONES: Record<StockCountStatus, "neutral" | "good" | "warn" | "bad"> = {
  PLANNED: "neutral",
  IN_PROGRESS: "warn",
  SUBMITTED: "warn",
  APPLIED: "good",
  CANCELLED: "neutral",
};

/** Orden de los grupos en la lista: primero lo que pide acción. */
export const STATUS_ORDER: StockCountStatus[] = ["IN_PROGRESS", "SUBMITTED", "PLANNED", "APPLIED", "CANCELLED"];

export const scopeLabel = (count: Pick<StockCount, "scope" | "categoryName">): string =>
  count.scope === "ALL" ? "Todo el inventario" : `Categoría ${count.categoryName ?? ""}`.trim();

/** Diferencia que devuelve la API, con signo explícito para los sobrantes. */
export const signed = (value: number | null): string => (value === null ? "—" : value > 0 ? `+${int(value)}` : int(value));

/** «1 producto», «3 productos». */
export const plural = (n: number, one: string, many: string): string => `${int(n)} ${n === 1 ? one : many}`;
