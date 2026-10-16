import { useState } from "react";
import { Badge, Card, DataTable, EmptyState, Pagination, QueryState, type Column } from "@/components/ui";
import { useReportExports } from "@/hooks/reports";
import { dateTime } from "@/lib/format";
import type { ExportReportKind, ReportExport } from "@/types/api";
import styles from "./ReportsScreen.module.css";

const REPORT_LABEL: Record<ExportReportKind, string> = { sales: "Reporte de ventas", inventory: "Reporte de inventario", receivables: "Reporte de cartera", scenario: "Escenario financiero" };

const columns: Column<ReportExport>[] = [
  { key: "date", header: "Fecha y hora", render: (e) => dateTime(e.createdAt) },
  { key: "user", header: "Generado por", align: "left", render: (e) => <span className={styles.mono}>@{e.username}</span> },
  {
    key: "report",
    header: "Reporte",
    align: "left",
    render: (e) => (
      <span className={styles.historyReport}>
        <strong>{REPORT_LABEL[e.report]}</strong>
        <span>{e.description}</span>
      </span>
    ),
  },
  { key: "format", header: "Formato", align: "right", render: (e) => <Badge tone={e.format === "pdf" ? "bad" : "good"}>{e.format === "pdf" ? "PDF" : "Excel"}</Badge> },
];

/** Historial de reportes generados (prototipo 09): cada PDF o Excel descargado, con quién y cuándo. */
export const ExportHistory = ({ isAdmin }: { isAdmin: boolean }) => {
  const [page, setPage] = useState(1);
  const query = useReportExports({ page, limit: 8 });
  return (
    <Card title="Historial de reportes generados" subtitle={isAdmin ? "Cada PDF o Excel descargado por el equipo, con la hora exacta. También queda en Auditoría." : "Los reportes que usted ha descargado."}>
      <QueryState query={query} isEmpty={(p) => p.items.length === 0} empty={<EmptyState title="Aún no se ha descargado ningún reporte" text="Cuando alguien descargue un PDF o un Excel aparecerá aquí." />}>
        {(p) => (
          <>
            <DataTable columns={columns} rows={p.items} rowKey={(e) => e.id} />
            <Pagination page={p} onPage={setPage} />
          </>
        )}
      </QueryState>
    </Card>
  );
};
