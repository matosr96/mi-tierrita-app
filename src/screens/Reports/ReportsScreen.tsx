import { useState } from "react";
import { useSessionStore } from "@/stores/session";
import { PageHeader } from "@/components/layout/AppShell";
import { Button, Card } from "@/components/ui";
import { SalesReportPanel } from "./SalesReportPanel";
import { InventoryReportPanel } from "./InventoryReportPanel";
import { ReceivablesReportPanel } from "./ReceivablesReportPanel";
import styles from "./ReportsScreen.module.css";

type ReportKind = "sales" | "inventory" | "receivables";

type ReportDef = { kind: ReportKind; title: string; text: string; icon: "document" | "table" | "wallet"; adminOnly: boolean };

/** Tarjetas del lienzo (ícono, título y descripción); una por reporte real de la API. */
const REPORTS: ReportDef[] = [
  {
    kind: "sales",
    title: "Reporte de ventas",
    text: "Para la propietaria y la secretaria. Ventas completadas del periodo, de contado y a crédito, agrupadas por día o por producto, con el detalle exportable.",
    icon: "document",
    adminOnly: false,
  },
  {
    kind: "inventory",
    title: "Reporte de inventario",
    text: "Valor del stock al costo y a precio de venta por categoría, productos sin stock y lotes por vencer o vencidos a la fecha de corte.",
    icon: "table",
    adminOnly: true,
  },
  {
    kind: "receivables",
    title: "Reporte de cartera",
    text: "Clientes con saldo pendiente, cupo, última venta a crédito y último abono, con la cartera vencida según los días sin abonar.",
    icon: "wallet",
    adminOnly: true,
  },
];

const ReportIcon = ({ icon }: { icon: ReportDef["icon"] }) => {
  if (icon === "document") {
    return (
      <svg className={styles.cardIcon} width="30" height="30" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <rect x="4.5" y="2.5" width="19" height="23" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
        <line x1="8.5" y1="9" x2="19.5" y2="9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="8.5" y1="13.5" x2="19.5" y2="13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="8.5" y1="18" x2="15" y2="18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (icon === "table") {
    return (
      <svg className={styles.cardIconMuted} width="30" height="30" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <rect x="3" y="4" width="22" height="20" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
        <line x1="3" y1="10" x2="25" y2="10" stroke="currentColor" strokeWidth="1.6" />
        <line x1="11" y1="10" x2="11" y2="24" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  return (
    <svg className={styles.cardIconMuted} width="30" height="30" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="22" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 11 h22" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 4.5 h13 a2 2 0 0 1 2 2 V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="19.5" cy="17.5" r="1.8" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
};

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

      <div className={styles.cards}>
        {reports.map((r) => {
          const selected = r.kind === current;
          return (
            <Card key={r.kind} className={styles.reportCard}>
              <div className={styles.cardHead}>
                <ReportIcon icon={r.icon} />
                <div className={styles.cardBody}>
                  <h2>{r.title}</h2>
                  <div className={styles.cardText}>{r.text}</div>
                </div>
              </div>
              <div className={styles.cardActions}>
                <Button variant={selected ? "secondary" : "primary"} aria-pressed={selected} onClick={() => setKind(r.kind)}>
                  Vista previa
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {current === "sales" ? <SalesReportPanel /> : null}
      {isAdmin && current === "inventory" ? <InventoryReportPanel /> : null}
      {isAdmin && current === "receivables" ? <ReceivablesReportPanel /> : null}
    </div>
  );
};
