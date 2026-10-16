import { StatCard, StatGrid } from "@/components/ui";
import { int } from "@/lib/format";
import type { Page } from "@/types/api";

type CountQuery = { data: Page<unknown> | undefined; isPending: boolean; isError: boolean };
type Item = { query: CountQuery; label: string; hint: string; warnWhenPositive?: boolean };

/** Franja de conteos del directorio: cada cifra es el `count` de un listado de la API y carga o falla por su cuenta. */
export const SupplierCounts = ({ items }: { items: Item[] }) => (
  <StatGrid>
    {items.map((item) => {
      const count = item.query.data?.count;
      const warn = item.warnWhenPositive === true && count !== undefined && count > 0;
      return (
        <StatCard
          key={item.label}
          label={item.label}
          value={count !== undefined ? int(count) : item.query.isPending ? "…" : "—"}
          hint={item.query.isError ? "No disponible" : item.query.isPending ? "Cargando" : item.hint}
          tone={warn ? "warn" : "neutral"}
        />
      );
    })}
  </StatGrid>
);
