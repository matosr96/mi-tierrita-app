import type { ReactNode } from "react";
import { int } from "@/lib/format";
import { StatCard, StatGrid } from "@/components/ui";
import type { Page, Product } from "@/types/api";

type Query = { data: Page<Product> | undefined; isPending: boolean; isError: boolean };

/** Resumen de la página visible para los roles que no pueden consultar el reporte de inventario. */
export const PageInventoryStats = ({ query }: { query: Query }) => {
  const items = query.data?.items ?? [];
  const active = items.filter((p) => p.active);
  const units = active.reduce((sum, p) => sum + p.stock, 0);
  const outOfStock = active.filter((p) => p.stock === 0).length;
  const stat = (value: ReactNode): ReactNode => (query.isPending ? "…" : query.isError ? "—" : value);
  const hint = query.isError ? "No disponible" : "en esta página";

  return (
    <StatGrid>
      <StatCard label="Productos activos" value={stat(int(active.length))} hint={hint} />
      <StatCard label="Unidades en stock" value={stat(int(units))} hint={hint} />
      <StatCard label="Sin stock" value={stat(int(outOfStock))} hint={hint} tone={outOfStock > 0 ? "bad" : "neutral"} />
    </StatGrid>
  );
};
