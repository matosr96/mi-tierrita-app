import type { Product } from "@/types/api";

export const LOW_STOCK = 5;

export type StockTone = "bad" | "warn" | "good" | "neutral";

/** Unidades en bodega que ya no se pueden vender (lotes vencidos aún sin retirar). */
export const expiredUnits = (p: Product): number => Math.max(0, p.stock - (p.availableStock ?? p.stock));

/**
 * Estado de existencias del lienzo: la API no guarda mínimos, así que Crítico = sin stock y Bajo = menos de 5 unidades.
 * "Vencido" cuando todo lo que queda en bodega está vencido: hay stock pero no se puede vender.
 */
export const stockStatus = (p: Product): { tone: StockTone; label: string } =>
  !p.active
    ? { tone: "neutral", label: "Inactivo" }
    : p.stock === 0
      ? { tone: "bad", label: "Crítico" }
      : expiredUnits(p) === p.stock
        ? { tone: "bad", label: "Vencido" }
        : p.stock < LOW_STOCK
          ? { tone: "warn", label: "Bajo" }
          : { tone: "good", label: "Normal" };
