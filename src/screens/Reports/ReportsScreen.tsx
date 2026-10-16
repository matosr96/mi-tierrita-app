import { useState } from "react";
import { useSessionStore } from "@/stores/session";
import { PageHeader } from "@/components/layout/AppShell";
import { SalesReportPanel } from "./SalesReportPanel";
import { InventoryReportPanel } from "./InventoryReportPanel";
import { ReceivablesReportPanel } from "./ReceivablesReportPanel";
import { ReportCover, type ReportDef, type ReportKind } from "./ReportCover";
import { ExportHistory } from "./ExportHistory";
import styles from "./ReportsScreen.module.css";

/** Una portada por reporte real de la API. */
const REPORTS: ReportDef[] = [
  {
    kind: "sales",
    code: "R-01",
    lead: "Reporte de",
    accent: "ventas",
    text: "Ventas completadas del periodo, de contado y a crédito, agrupadas por día o por producto, con el detalle exportable.",
    audience: "Propietaria · secretaria",
    cadence: "Por rango de fechas",
    adminOnly: false,
  },
  {
    kind: "inventory",
    code: "R-02",
    lead: "Reporte de",
    accent: "inventario",
    text: "Valor del stock al costo y a precio de venta por categoría, productos sin stock y lotes por vencer o vencidos.",
    audience: "Solo propietaria",
    cadence: "A la fecha de corte",
    adminOnly: true,
  },
  {
    kind: "receivables",
    code: "R-03",
    lead: "Reporte de",
    accent: "cartera",
    text: "Clientes con saldo pendiente, cupo, última venta a crédito y último abono, con la cartera vencida según los días sin abonar.",
    audience: "Solo propietaria",
    cadence: "Según días sin abono",
    adminOnly: true,
  },
];

/**
 * CU-19 y CU-20 Reportes. La secretaria (SALES) solo ve Ventas: los otros paneles no se montan,
 * así sus consultas nunca se disparan con un rol que el backend rechazaría.
 */
export const ReportsScreen = () => {
  const user = useSessionStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";
  const reports = REPORTS.filter((r) => isAdmin || !r.adminOnly);
  const [kind, setKind] = useState<ReportKind>("sales");
  const current: ReportKind = reports.some((r) => r.kind === kind) ? kind : "sales";

  return (
    <div className={styles.page}>
      <PageHeader title="Reportes" subtitle={isAdmin ? "Documentos para la propietaria: ventas, inventario y cartera tal como los registra el sistema." : "Documento de ventas del periodo tal como las registra el sistema."} />

      <div className={styles.covers} role="group" aria-label="Elegir reporte">
        {reports.map((r, i) => (
          <ReportCover key={r.kind} def={r} index={i} selected={r.kind === current} onSelect={() => setKind(r.kind)} />
        ))}
      </div>

      {current === "sales" ? <SalesReportPanel /> : null}
      {isAdmin && current === "inventory" ? <InventoryReportPanel /> : null}
      {isAdmin && current === "receivables" ? <ReceivablesReportPanel /> : null}

      <ExportHistory isAdmin={isAdmin} />
    </div>
  );
};
