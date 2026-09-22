import type { ReactNode } from "react";
import { useInventoryReport } from "@/hooks/reports";
import { dateOnly, int, moneyCompact } from "@/lib/format";
import { StatCard, StatGrid } from "@/components/ui";

/** Indicadores del inventario tal como los calcula la API (solo ADMIN puede consultar el reporte). */
export const AdminInventoryStats = () => {
  const report = useInventoryReport();
  const d = report.data;
  const stat = (value: ReactNode): ReactNode => (report.isPending ? "…" : report.isError || d === undefined ? "—" : value);
  const hint = (text: string): string => (report.isError ? "No disponible" : text);

  return (
    <StatGrid>
      <StatCard label="Productos activos" value={stat(int(d?.activeProducts))} hint={hint(d ? `de ${int(d.products)} registrados` : "")} />
      <StatCard label="Unidades en stock" value={stat(int(d?.units))} hint={hint(d ? `en ${int(d.byCategory.length)} categorías` : "")} />
      <StatCard label="Sin stock" value={stat(int(d?.outOfStock))} hint={hint("requieren reposición")} tone={d && d.outOfStock > 0 ? "bad" : "neutral"} />
      <StatCard label="Valor del inventario" value={stat(moneyCompact(d?.costValue))} hint={hint(d ? `a costo · al ${dateOnly(d.asOf)}` : "")} />
    </StatGrid>
  );
};
