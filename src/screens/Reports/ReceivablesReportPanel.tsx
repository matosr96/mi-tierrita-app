import { useState } from "react";
import { useReceivablesReport } from "@/hooks/reports";
import { dateTime, int, money, moneyCompact } from "@/lib/format";
import { Badge, Button, Card, Chips, DataTable, EmptyState, QueryState, StatCard, StatGrid, type Column } from "@/components/ui";
import type { ReceivableRow, ReceivablesReport } from "@/types/api";
import { downloadCsv } from "./csv";
import styles from "./ReportsScreen.module.css";

const OVERDUE_OPTIONS = [15, 30, 45, 60].map((v) => ({ value: v, label: `${v} días` }));

const columns: Column<ReceivableRow>[] = [
  { key: "name", header: "Cliente", render: (r) => <span className={styles.name}>{r.name}</span> },
  { key: "creditLimit", header: "Cupo", align: "right", render: (r) => money(r.creditLimit) },
  { key: "balance", header: "Saldo", align: "right", render: (r) => money(r.balance) },
  { key: "lastCreditSaleAt", header: "Última venta a crédito", render: (r) => dateTime(r.lastCreditSaleAt) },
  { key: "lastPaymentAt", header: "Último abono", render: (r) => dateTime(r.lastPaymentAt) },
  { key: "overdue", header: "Estado", render: (r) => <Badge tone={r.overdue ? "bad" : "good"}>{r.overdue ? "Vencida" : "Al día"}</Badge> },
];

const exportCsv = (report: ReceivablesReport) =>
  downloadCsv(
    `cartera_${report.overdueDays}-dias.csv`,
    ["Cliente", "Cupo", "Saldo", "Última venta a crédito", "Último abono", "Estado"],
    report.items.map((r) => [r.name, r.creditLimit, r.balance, r.lastCreditSaleAt ?? "", r.lastPaymentAt ?? "", r.overdue ? "Vencida" : "Al día"]),
  );

/** CU-20 Reporte de cartera (solo ADMIN). */
export const ReceivablesReportPanel = () => {
  const [overdueDays, setOverdueDays] = useState(30);
  const query = useReceivablesReport(overdueDays);

  return (
    <div className={styles.panel}>
      <Card>
        <div className={styles.chipsRow}>
          <span className={styles.filterLabel}>Cartera vencida a partir de</span>
          <Chips options={OVERDUE_OPTIONS} value={overdueDays} onChange={setOverdueDays} />
          <span className="muted" style={{ fontSize: 13 }}>
            sin abonos desde la última venta a crédito
          </span>
        </div>
      </Card>

      <QueryState query={query} empty={null}>
        {(report) => (
          <>
            <StatGrid>
              <StatCard label="Clientes con saldo" value={int(report.customersWithBalance)} />
              <StatCard label="Cartera total" value={moneyCompact(report.totalBalance)} hint={money(report.totalBalance)} />
              <StatCard label="Cartera vencida" value={moneyCompact(report.overdueBalance)} hint={money(report.overdueBalance)} tone={report.overdueBalance > 0 ? "bad" : "good"} />
              <StatCard label="Clientes vencidos" value={int(report.overdueCustomers)} hint={`más de ${int(report.overdueDays)} días sin abono`} tone={report.overdueCustomers > 0 ? "warn" : "neutral"} />
            </StatGrid>

            <Card
              title="Clientes con saldo pendiente"
              subtitle={`${int(report.items.length)} clientes`}
              actions={
                report.items.length > 0 ? (
                  <Button variant="secondary" size="sm" onClick={() => exportCsv(report)}>
                    Exportar CSV
                  </Button>
                ) : undefined
              }
              flush
            >
              {report.items.length === 0 ? (
                <EmptyState title="Sin cartera pendiente" text="Ningún cliente tiene saldo a la fecha." />
              ) : (
                <DataTable
                  columns={columns}
                  rows={report.items}
                  rowKey={(r) => r.customerId}
                  footer={
                    <tr className={styles.footRow}>
                      <td colSpan={2}>Total</td>
                      <td className="num">{money(report.totalBalance)}</td>
                      <td colSpan={3} />
                    </tr>
                  }
                />
              )}
            </Card>
          </>
        )}
      </QueryState>
    </div>
  );
};
