import type { ReactNode } from "react";
import { StatCard, StatGrid } from "@/components/ui";
import { useInventoryReport } from "@/hooks/reports";
import { int, money } from "@/lib/format";

/** Indicadores de vencimiento del reporte de inventario (solo ADMIN): vencidos, por vencer en la ventana y a 90 días. */
export const AdminBatchStats = ({ days }: { days: number }) => {
  const report = useInventoryReport(days);
  const quarter = useInventoryReport(90);
  const d = report.data;
  const q = quarter.data;
  const stat = (value: ReactNode): ReactNode => (report.isPending ? "…" : report.isError || d === undefined ? "—" : value);
  const hint = (text: string): string => (report.isPending ? "Cargando" : report.isError ? "No disponible" : text);

  return (
    <StatGrid>
      <StatCard
        label="Vencidos"
        value={stat(int(d?.expired.batches))}
        hint={hint(d && d.expired.batches > 0 ? `${money(d.expired.costValue)} en bodega` : "ninguno en bodega")}
        tone={d === undefined ? "neutral" : d.expired.batches > 0 ? "bad" : "good"}
      />
      <StatCard
        label={`Vencen en ${days} días`}
        value={stat(int(d?.expiringSoon.batches))}
        hint={hint(d ? `${money(d.expiringSoon.costValue)} en riesgo` : "")}
        tone={d && d.expiringSoon.batches > 0 ? "bad" : "neutral"}
      />
      <StatCard
        label="Vencen en 90 días"
        value={quarter.isPending ? "…" : quarter.isError || q === undefined ? "—" : int(q.expiringSoon.batches)}
        hint={quarter.isPending ? "Cargando" : quarter.isError || q === undefined ? "No disponible" : `${money(q.expiringSoon.costValue)} en riesgo`}
        tone={q && q.expiringSoon.batches > 0 ? "warn" : "neutral"}
      />
      <StatCard label="Unidades por vencer" value={stat(int(d?.expiringSoon.units))} hint={hint(`en los próximos ${days} días`)} />
    </StatGrid>
  );
};
