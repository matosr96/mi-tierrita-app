import { useState } from "react";
import { useReceivablesReport } from "@/hooks/reports";
import { ROLE_LABELS, useSessionStore } from "@/stores/session";
import { dateOnly, dateTime, int, money, todayIso } from "@/lib/format";
import { Badge, Button, Chips, DataTable, EmptyState, QueryState, type Column } from "@/components/ui";
import type { ReceivableRow, ReceivablesReport } from "@/types/api";
import { downloadCsv } from "./csv";
import { ReportPreview } from "./ReportPreview";
import { ReportPaper } from "./ReportPaper";
import { PaperBlock } from "./PaperBlock";
import styles from "./ReportsScreen.module.css";

const OVERDUE_OPTIONS = [15, 30, 45, 60].map((v) => ({ value: v, label: `${v} días` }));

const columns: Column<ReceivableRow>[] = [
  { key: "name", header: "Cliente", render: (r) => <span className={styles.name}>{r.name}</span> },
  { key: "creditLimit", header: "Cupo", align: "right", render: (r) => money(r.creditLimit) },
  { key: "balance", header: "Saldo", align: "right", render: (r) => money(r.balance) },
  { key: "lastCreditSaleAt", header: "Última venta a crédito", align: "left", render: (r) => dateTime(r.lastCreditSaleAt) },
  { key: "lastPaymentAt", header: "Último abono", align: "left", render: (r) => dateTime(r.lastPaymentAt) },
  { key: "overdue", header: "Estado", align: "left", render: (r) => <Badge tone={r.overdue ? "bad" : "good"}>{r.overdue ? "Vencida" : "Al día"}</Badge> },
];

const exportCsv = (report: ReceivablesReport) =>
  downloadCsv(
    `cartera_${report.overdueDays}-dias.csv`,
    ["Cliente", "Cupo", "Saldo", "Última venta a crédito", "Último abono", "Estado"],
    report.items.map((r) => [r.name, r.creditLimit, r.balance, r.lastCreditSaleAt ?? "", r.lastPaymentAt ?? "", r.overdue ? "Vencida" : "Al día"]),
  );

/** CU-20 Reporte de cartera (solo ADMIN). */
export const ReceivablesReportPanel = () => {
  const user = useSessionStore((s) => s.user);
  const [overdueDays, setOverdueDays] = useState(30);
  const query = useReceivablesReport(overdueDays);

  const filters = (
    <div className={styles.chipsRow}>
      <span className={styles.filterLabel}>Cartera vencida a partir de</span>
      <Chips options={OVERDUE_OPTIONS} value={overdueDays} onChange={setOverdueDays} />
      <span className={styles.filterHint}>sin abonos desde la última venta a crédito</span>
    </div>
  );

  return (
    <ReportPreview
      subtitle={`Reporte de cartera · vencida a ${int(overdueDays)} días · generado el ${dateOnly(todayIso())}`}
      filters={filters}
      actions={
        query.data && query.data.items.length > 0 ? (
          <Button variant="secondary" size="sm" onClick={() => exportCsv(query.data)}>
            Exportar CSV
          </Button>
        ) : undefined
      }
    >
      <QueryState query={query} empty={null}>
        {(report) => (
          <ReportPaper
            title="Reporte de cartera"
            meta={`Agropecuaria Mi Tierrita · al ${dateOnly(todayIso())} · ${user ? `Generado por ${user.firstName} ${user.lastName}, ${ROLE_LABELS[user.role]}` : ""}`}
            summary={
              report.customersWithBalance === 0 ? (
                <p className={styles.summary}>Ningún cliente tiene saldo pendiente a la fecha.</p>
              ) : (
                <>
                  <p className={styles.summary}>
                    <strong>{int(report.customersWithBalance)} clientes</strong> deben en total <strong>{money(report.totalBalance)}</strong>.
                  </p>
                  <p className={styles.summary}>
                    De esa cartera, {money(report.overdueBalance)} corresponde a {int(report.overdueCustomers)} clientes con más de {int(report.overdueDays)} días sin abonar desde su última venta a crédito.
                  </p>
                </>
              )
            }
            params={[
              { label: "Días para considerar vencida", value: `${int(report.overdueDays)} días` },
              { label: "Criterio", value: "Sin abonos desde la última venta a crédito" },
              { label: "Fecha de corte", value: dateOnly(todayIso()) },
              { label: "Clientes incluidos", value: "Con saldo pendiente" },
            ]}
            indicators={[
              { label: "Clientes con saldo", value: int(report.customersWithBalance) },
              { label: "Cartera total", value: money(report.totalBalance) },
              { label: "Cartera vencida", value: money(report.overdueBalance), tone: report.overdueBalance > 0 ? "bad" : "good" },
              { label: "Clientes vencidos", value: int(report.overdueCustomers), tone: report.overdueCustomers > 0 ? "warn" : undefined },
            ]}
            note="Elaborado con las ventas a crédito y los abonos registrados en el sistema. No sustituye la contabilidad."
          >
            <PaperBlock label="Clientes con saldo pendiente" hint={`${int(report.items.length)} clientes`}>
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
            </PaperBlock>
          </ReportPaper>
        )}
      </QueryState>
    </ReportPreview>
  );
};
