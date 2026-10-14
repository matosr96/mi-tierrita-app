import type { Product } from "@/types/api";

export const LOW_STOCK = 5;

export type StockTone = "bad" | "warn" | "good" | "neutral";

/** Estado de existencias del lienzo: la API no guarda mínimos, así que Crítico = sin stock y Bajo = menos de 5 unidades. */
export const stockStatus = (p: Product): { tone: StockTone; label: string } =>
  !p.active ? { tone: "neutral", label: "Inactivo" } : p.stock === 0 ? { tone: "bad", label: "Crítico" } : p.stock < LOW_STOCK ? { tone: "warn", label: "Bajo" } : { tone: "good", label: "Normal" };
