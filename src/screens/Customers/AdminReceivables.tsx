import type { ReactNode } from "react";
import { useReceivablesReport } from "@/hooks/reports";

/** Entrega los clientes con cartera vencida según el reporte (solo ADMIN); el listado no trae ese dato. */
export const AdminReceivables = ({ children }: { children: (overdueIds: Set<number> | undefined) => ReactNode }) => {
  const report = useReceivablesReport();
  const overdueIds = report.data ? new Set(report.data.items.filter((row) => row.overdue).map((row) => row.customerId)) : undefined;
  return <>{children(overdueIds)}</>;
};
