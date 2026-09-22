import { useState } from "react";
import { useSessionStore } from "@/stores/session";
import { PageHeader } from "@/components/layout/AppShell";
import { Tabs, type TabOption } from "@/components/ui";
import { SalesReportPanel } from "./SalesReportPanel";
import { InventoryReportPanel } from "./InventoryReportPanel";
import { ReceivablesReportPanel } from "./ReceivablesReportPanel";
import styles from "./ReportsScreen.module.css";

type ReportTab = "sales" | "inventory" | "receivables";

const SALES_TAB: TabOption<ReportTab> = { value: "sales", label: "Ventas" };
const ADMIN_TABS: TabOption<ReportTab>[] = [SALES_TAB, { value: "inventory", label: "Inventario" }, { value: "receivables", label: "Cartera" }];

/**
 * CU-19 y CU-20 Reportes. La secretaria (SALES) solo ve Ventas: los otros paneles no se montan,
 * así sus consultas nunca se disparan con un rol que el backend rechazaría.
 */
export const ReportsScreen = () => {
  const user = useSessionStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";
  const options = isAdmin ? ADMIN_TABS : [SALES_TAB];
  const [tab, setTab] = useState<ReportTab>("sales");
  const current: ReportTab = options.some((o) => o.value === tab) ? tab : "sales";

  return (
    <div className={styles.page}>
      <PageHeader
        title="Reportes"
        subtitle={isAdmin ? "Ventas, inventario y cartera tal como los registra el sistema, con exportación a CSV." : "Ventas del periodo tal como las registra el sistema, con exportación a CSV."}
        actions={options.length > 1 ? <Tabs options={options} value={current} onChange={setTab} /> : undefined}
      />
      {current === "sales" ? <SalesReportPanel /> : null}
      {isAdmin && current === "inventory" ? <InventoryReportPanel /> : null}
      {isAdmin && current === "receivables" ? <ReceivablesReportPanel /> : null}
    </div>
  );
};
