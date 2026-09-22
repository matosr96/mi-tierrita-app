import type { ReactNode } from "react";
import { useProducts } from "@/hooks/products";
import { int } from "@/lib/format";
import { StatCard, StatGrid } from "@/components/ui";
import type { Category, Page } from "@/types/api";

type Query<T> = { data: T | undefined; isPending: boolean; isError: boolean };
type Props = { categories: Query<Page<Category>> };

const LOW_STOCK = 5;

/** Indicadores para los roles que no pueden consultar el reporte: conteo de la API y faltantes entre los productos cargados. */
export const PageInventoryStats = ({ categories }: Props) => {
  const products = useProducts({ limit: 100, active: true });
  const items = products.data?.items ?? [];
  const outOfStock = items.filter((p) => p.stock === 0).length;
  const low = items.filter((p) => p.stock > 0 && p.stock < LOW_STOCK).length;
  const partial = products.data !== undefined && products.data.count > items.length;
  const lines = categories.data?.items.filter((c) => c.active).length;
  const stat = (value: ReactNode): ReactNode => (products.isPending ? "…" : products.isError ? "—" : value);
  const hint = (text: string): string => (products.isPending ? "Cargando" : products.isError ? "No disponible" : text);
  const sample = partial ? `entre los primeros ${int(items.length)}` : "";

  return (
    <StatGrid>
      <StatCard label="Productos activos" value={stat(int(products.data?.count))} hint={hint(lines !== undefined ? `en ${int(lines)} ${lines === 1 ? "línea" : "líneas"}` : "en el catálogo")} />
      <StatCard label="Sin existencias" value={stat(int(outOfStock))} hint={hint(partial ? sample : "requieren reposición")} tone={outOfStock > 0 ? "bad" : "neutral"} />
      <StatCard label="Existencias bajas" value={stat(int(low))} hint={hint(partial ? sample : `menos de ${LOW_STOCK} unidades`)} tone={low > 0 ? "warn" : "neutral"} />
      <StatCard label="Con existencias" value={stat(int(items.length - outOfStock))} hint={hint(partial ? sample : "listos para la venta")} tone="good" />
    </StatGrid>
  );
};
