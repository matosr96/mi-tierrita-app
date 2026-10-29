import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSessionStore } from "@/stores/session";
import { PageHeader } from "@/components/layout/AppShell";
import { SalesReportPanel } from "./SalesReportPanel";
import { InventoryReportPanel } from "./InventoryReportPanel";
import { ReceivablesReportPanel } from "./ReceivablesReportPanel";
import { ReportPicker, type ReportDef, type ReportKind } from "./ReportPicker";
import { ExportHistory } from "./ExportHistory";
import styles from "./ReportsScreen.module.css";

/** Una tarjeta (ReportPicker) por reporte real de la API. */
const REPORTS: ReportDef[] = [
  {
    kind: "sales",
    code: "R-01",
    lead: "Reporte de",
    accent: "ventas",
    text: "Ventas del periodo, de contado y a crédito, por día o por producto.",
    audience: "Propietaria · secretaria",
    cadence: "Por rango de fechas",
    adminOnly: false,
  },
  {
    kind: "inventory",
    code: "R-02",
    lead: "Reporte de",
    accent: "inventario",
    text: "Valor del stock por categoría, productos agotados y lotes por vencer.",
    audience: "Solo propietaria",
    cadence: "A la fecha de corte",
    adminOnly: true,
  },
  {
    kind: "receivables",
    code: "R-03",
    lead: "Reporte de",
    accent: "cartera",
    text: "Clientes con saldo pendiente y cartera vencida según días sin abono.",
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
  // ?r=sales|inventory|receivables y sus parámetros: así Tita abre el reporte que preparó en el chat.
  const [params] = useSearchParams();
  const asked = params.get("r");
  const [kind, setKind] = useState<ReportKind>(asked === "inventory" || asked === "receivables" ? asked : "sales");
  const intParam = (k: string) => {
    const n = Number(params.get(k));
    return Number.isInteger(n) && n > 0 ? n : undefined;
  };
  const isoParam = (k: string) => (/^\d{4}-\d{2}-\d{2}$/.test(params.get(k) ?? "") ? (params.get(k) as string) : undefined);
  const current: ReportKind = reports.some((r) => r.kind === kind) ? kind : "sales";

  return (
    <div className={styles.page}>
      <PageHeader title="Reportes" subtitle={isAdmin ? "Documentos para la propietaria: ventas, inventario y cartera tal como los registra el sistema." : "Documento de ventas del periodo tal como las registra el sistema."} />

      <div className={styles.covers} role="group" aria-label="Elegir reporte">
        {reports.map((r) => (
          <ReportPicker key={r.kind} def={r} selected={r.kind === current} onSelect={() => setKind(r.kind)} />
        ))}
      </div>

      {current === "sales" ? <SalesReportPanel from={isoParam("from")} to={isoParam("to")} groupBy={params.get("groupBy") === "product" ? "product" : undefined} /> : null}
      {isAdmin && current === "inventory" ? <InventoryReportPanel days={intParam("days")} /> : null}
      {isAdmin && current === "receivables" ? <ReceivablesReportPanel overdueDays={intParam("overdueDays")} /> : null}

      <ExportHistory isAdmin={isAdmin} />
    </div>
  );
};
