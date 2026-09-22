import type { ReactNode } from "react";
import { StatCard, StatGrid } from "@/components/ui";
import { useExpiringBatches } from "@/hooks/batches";
import { int } from "@/lib/format";
import type { Page, ProductBatch } from "@/types/api";

type Query = { data: Page<ProductBatch> | undefined; isPending: boolean; isError: boolean };

/** Indicadores de bodega (sin reporte): conteos de la ventana cargada y el total de la API a 90 días. */
export const WindowBatchStats = ({ days, query }: { days: number; query: Query }) => {
  const quarter = useExpiringBatches({ days: 90, limit: 1 });
  const items = query.data?.items ?? [];
  const expired = items.filter((b) => b.expired).length;
  const upcoming = items.length - expired;
  const products = new Set(items.map((b) => b.productId)).size;
  const partial = query.data !== undefined && query.data.count > items.length;
  const stat = (value: ReactNode): ReactNode => (query.isPending ? "…" : query.isError ? "—" : value);
  const hint = (text: string): string => (query.isPending ? "Cargando" : query.isError ? "No disponible" : partial ? `${text} (primeros ${int(items.length)} de ${int(query.data?.count)})` : text);

  return (
    <StatGrid>
      <StatCard label="Vencidos" value={stat(int(expired))} hint={hint(expired > 0 ? "retirar del estante" : "ninguno en bodega")} tone={query.data === undefined ? "neutral" : expired > 0 ? "bad" : "good"} />
      <StatCard label={`Vencen en ${days} días`} value={stat(int(upcoming))} hint={hint("sacar al frente")} tone={upcoming > 0 ? "bad" : "neutral"} />
      <StatCard label="Productos afectados" value={stat(int(products))} hint={hint("con lotes en la ventana")} />
      <StatCard
        label="Vencen en 90 días"
        value={quarter.isPending ? "…" : quarter.isError ? "—" : int(quarter.data.count)}
        hint={quarter.isPending ? "Cargando" : quarter.isError ? "No disponible" : "lotes, incluidos los vencidos"}
        tone={quarter.data && quarter.data.count > 0 ? "warn" : "neutral"}
      />
    </StatGrid>
  );
};
