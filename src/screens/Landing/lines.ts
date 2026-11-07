import type { PublicCategory } from "@/types/api";
import { LINES_FALLBACK, type ProductLine } from "./content";

/**
 * Corte tipográfico del nombre de una línea: la última palabra va en color de acento («Alimentos» + «balanceados»,
 * «Semillas y» + «fertilizantes»). Un nombre de una sola palabra queda entero sin acento.
 */
export const splitLineName = (name: string): { name: string; accent: string } => {
  const words = name.trim().split(/\s+/).filter((w) => w !== "");
  if (words.length <= 1) return { name: words[0] ?? "", accent: "" };
  return { name: words.slice(0, -1).join(" "), accent: words[words.length - 1]! };
};

/** Una línea de la API lista para pintar: foto y escena las elige la app por `code`. */
export const toProductLine = (c: PublicCategory): ProductLine => ({
  code: c.code,
  ...splitLineName(c.name),
  text: c.description ?? "",
  tags: c.tags,
});

/** Las líneas que se pintan: las de la API si ya llegaron; si no (cargando o sin API), la copia de respaldo. */
export const resolveLines = (fromApi: PublicCategory[] | undefined): ProductLine[] => (fromApi === undefined ? LINES_FALLBACK : fromApi.map(toProductLine));
