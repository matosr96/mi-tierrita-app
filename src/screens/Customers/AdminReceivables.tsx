import type { ReactNode } from "react";
import { useReceivablesReport } from "@/hooks/reports";
import type { ReceivableRow } from "@/types/api";

/** Filas del reporte de cartera por cliente (solo ADMIN): vencida y último abono; el listado no trae ese dato. */
export const AdminReceivables = ({ children }: { children: (receivables: Map<number, ReceivableRow> | undefined) => ReactNode }) => {
  const report = useReceivablesReport();
  const receivables = report.data ? new Map(report.data.items.map((row) => [row.customerId, row])) : undefined;
  return <>{children(receivables)}</>;
};
