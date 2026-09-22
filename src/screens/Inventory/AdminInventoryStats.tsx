import type { ReactNode } from "react";
import { useInventoryReport } from "@/hooks/reports";
import { dateOnly, int, moneyCompact } from "@/lib/format";
import { StatCard, StatGrid } from "@/components/ui";

/** Indicadores del inventario tal como los calcula la API (solo ADMIN puede consultar el reporte). */
export const AdminInventoryStats = () => {
  const report = useInventoryReport();
  const d = report.data;
  const stat = (value: ReactNode): ReactNode => (report.isPending ? "…" : report.isError || d === undefined ? "—" : value);
  const hint = (text: string): string => (report.isPending ? "Cargando" : report.isError ? "No disponible" : text);

  return (
    <StatGrid>
      <StatCard label="Productos activos" value={stat(int(d?.activeProducts))} hint={hint(d ? `en ${int(d.byCategory.length)} ${d.byCategory.length === 1 ? "línea" : "líneas"}` : "")} />
      <StatCard label="Valor del inventario" value={stat(moneyCompact(d?.costValue))} hint={hint(d ? `a costo · al ${dateOnly(d.asOf)}` : "")} />
      <StatCard label="Sin existencias" value={stat(int(d?.outOfStock))} hint={hint("requieren reposición")} tone={d && d.outOfStock > 0 ? "bad" : "neutral"} />
      <StatCard
        label="Lotes por vencer"
        value={stat(int(d?.expiringSoon.batches))}
        hint={hint(d ? `${moneyCompact(d.expiringSoon.costValue)} en los próximos ${d.expiringDays} días` : "")}
        tone={d && d.expiringSoon.batches > 0 ? "warn" : "neutral"}
      />
    </StatGrid>
  );
};
