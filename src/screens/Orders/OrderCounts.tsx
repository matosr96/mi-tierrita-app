import { StatCard, StatGrid } from "@/components/ui";
import { int } from "@/lib/format";
import type { Page } from "@/types/api";

type CountQuery = { data: Page<unknown> | undefined; isPending: boolean; isError: boolean };
type Item = { query: CountQuery; label: string; hint: string; tone?: "warn" | "bad" };

/** Conteos de la pestaña: cada cifra es el `count` de un listado de la API; el tono solo se pinta si hay alguno. */
export const OrderCounts = ({ items }: { items: Item[] }) => (
  <StatGrid>
    {items.map((item) => {
      const count = item.query.data?.count;
      const tone = item.tone !== undefined && count !== undefined && count > 0 ? item.tone : "neutral";
      return (
        <StatCard
          key={item.label}
          label={item.label}
          value={count !== undefined ? int(count) : item.query.isPending ? "…" : "—"}
          hint={item.query.isError ? "No disponible" : item.query.isPending ? "Cargando" : item.hint}
          tone={tone}
        />
      );
    })}
  </StatGrid>
);
