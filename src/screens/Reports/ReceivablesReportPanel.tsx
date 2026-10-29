import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useReceivablesReport } from "@/hooks/reports";
import { ROLE_LABELS, useSessionStore } from "@/stores/session";
import { dateOnly, dateTime, int, money, moneyCompact, todayIso } from "@/lib/format";
import { Badge, Chips, DataTable, EmptyState, QueryState, type Column } from "@/components/ui";
import { ChartDetailModal, Legend, RankingChart } from "@/components/charts";
import type { ReceivableRow, ReceivablesReport } from "@/types/api";
import { downloadXlsx, type XlsxSheet } from "@/lib/xlsx";
import type { User } from "@/types/api";
import { ReportPreview } from "./ReportPreview";
import { ReportPaper } from "./ReportPaper";
import { PaperBlock } from "./PaperBlock";
import { SourceCell } from "./SourceCell";
import styles from "./ReportsScreen.module.css";

const OVERDUE_OPTIONS = [15, 30, 45, 60].map((v) => ({ value: v, label: `${v} días` }));
const TOP_CUSTOMERS = 10;

/** Ficha del cliente de la fila (`?c=`). */
const customerLink = (r: ReceivableRow): string => `/clientes?c=${r.customerId}`;

const columns: Column<ReceivableRow>[] = [
  { key: "name", header: "Cliente", render: (r) => <span className={styles.name}>{r.name}</span> },
  { key: "creditLimit", header: "Cupo", align: "right", render: (r) => money(r.creditLimit) },
  { key: "balance", header: "Saldo", align: "right", render: (r) => money(r.balance) },
  { key: "lastCreditSaleAt", header: "Última venta a crédito", align: "left", render: (r) => dateTime(r.lastCreditSaleAt) },
  { key: "lastPaymentAt", header: "Último abono", align: "left", render: (r) => dateTime(r.lastPaymentAt) },
  { key: "overdue", header: "Estado", align: "left", render: (r) => <Badge tone={r.overdue ? "bad" : "good"}>{r.overdue ? "Vencida" : "Al día"}</Badge> },
  { key: "source", header: "Origen", align: "left", render: (r) => <SourceCell prefix="Cliente" ids={[r.customerId]} count={1} /> },
];

const sheet = (rows: ReceivableRow[], footer?: ReceivablesReport): XlsxSheet => ({
  name: "Cartera",
  headers: ["Cliente", "Cupo", "Saldo", "Última venta a crédito", "Último abono", "Estado", "Origen (id de cliente)"],
  formats: ["text", "money", "money", "text", "text", "text", "text"],
  rows: rows.map((r) => [r.name, r.creditLimit, r.balance, dateTime(r.lastCreditSaleAt), dateTime(r.lastPaymentAt), r.overdue ? "Vencida" : "Al día", `#${r.customerId}`]),
  ...(footer ? { footer: ["Total por cobrar", null, footer.totalBalance, null, null, null, null] } : {}),
});

const exportName = (report: ReceivablesReport) => `cartera_${report.overdueDays}-dias`;

const exportExcel = (report: ReceivablesReport, user: User | null) =>
  downloadXlsx(`${exportName(report)}.xlsx`, [
    {
      ...sheet(report.items, report),
      title: [
        "Agropecuaria Mi Tierrita · Reporte de cartera",
        `Vencida a partir de ${report.overdueDays} días sin abonos · corte al ${dateOnly(todayIso())}`,
        user ? `Generado por ${user.firstName} ${user.lastName} el ${dateOnly(todayIso())}` : `Generado el ${dateOnly(todayIso())}`,
        `Clientes con saldo ${int(report.customersWithBalance)} · cartera total ${money(report.totalBalance)} · vencida ${money(report.overdueBalance)} en ${int(report.overdueCustomers)} clientes`,
      ],
    },
  ]);

/** CU-20 Reporte de cartera (solo ADMIN). */
export const ReceivablesReportPanel = (initial: { overdueDays?: number | undefined }) => {
  const user = useSessionStore((s) => s.user);
  const navigate = useNavigate();
  const [overdueDays, setOverdueDays] = useState(initial.overdueDays ?? 30);
  const query = useReceivablesReport(overdueDays);
  const [detail, setDetail] = useState<string | null>(null);
  const report = query.data;
  const top = report ? report.items.slice(0, TOP_CUSTOMERS) : [];

  const filters = (
    <div className={styles.chipsRow}>
      <span className={styles.filterLabel}>Cartera vencida a partir de</span>
      <Chips options={OVERDUE_OPTIONS} value={overdueDays} onChange={setOverdueDays} />
      <span className={styles.filterHint}>sin abonos desde la última venta a crédito</span>
    </div>
  );

  const params = report
    ? [
        { label: "Días para considerar vencida", value: `${int(report.overdueDays)} días` },
        { label: "Criterio", value: "Sin abonos desde la última venta a crédito" },
        { label: "Fecha de corte", value: dateOnly(todayIso()) },
        { label: "Clientes incluidos", value: "Con saldo pendiente" },
      ]
    : [];

  return (
    <>
      <ReportPreview
        subtitle={`Reporte de cartera · vencida a ${int(overdueDays)} días · generado el ${dateOnly(todayIso())}`}
        filters={filters}
        exportName={report && report.items.length > 0 ? exportName(report) : undefined}
        onExcel={report ? () => exportExcel(report, user) : undefined}
        record={{
          report: "receivables",
          description: `Vencida a ${overdueDays} días`,
          filters: { overdueDays, asOf: todayIso() },
          summary: report ? { customersWithBalance: report.customersWithBalance, totalBalance: report.totalBalance, overdueCustomers: report.overdueCustomers, overdueBalance: report.overdueBalance } : {},
        }}
        cover={report ? { code: "R-03", title: "Reporte de", accent: "cartera", period: `Corte al ${dateOnly(todayIso())} · vencida a ${int(report.overdueDays)} días sin abono`, params } : undefined}
      >
        <QueryState query={query} empty={null}>
          {(data) => (
            <ReportPaper
              code="R-03"
              title="Reporte de"
              accent="cartera"
              meta={[`Corte al ${dateOnly(todayIso())}`, `Vencida a ${int(data.overdueDays)} días`, user ? `Por ${user.firstName} ${user.lastName}, ${ROLE_LABELS[user.role]}` : ""]}
              summary={
                data.customersWithBalance === 0 ? (
                  <p>Ningún cliente tiene saldo pendiente a la fecha.</p>
                ) : (
                  <>
                    <p>
                      <strong>{int(data.customersWithBalance)} clientes</strong> deben en total <strong>{money(data.totalBalance)}</strong>.
                    </p>
                    <p>
                      De esa cartera, {money(data.overdueBalance)} corresponde a {int(data.overdueCustomers)} clientes con más de {int(data.overdueDays)} días sin abonar desde su última venta a crédito.
                    </p>
                  </>
                )
              }
              params={params}
              indicators={[
                { label: "Clientes con saldo", value: int(data.customersWithBalance) },
                { label: "Cartera total", value: money(data.totalBalance) },
                { label: "Cartera vencida", value: money(data.overdueBalance), tone: data.overdueBalance > 0 ? "bad" : "good" },
                { label: "Clientes vencidos", value: int(data.overdueCustomers), tone: data.overdueCustomers > 0 ? "warn" : undefined },
              ]}
              note="Elaborado con las ventas a crédito y los abonos registrados en el sistema. No sustituye la contabilidad."
            >
              {data.items.length === 0 ? (
                <PaperBlock label="Clientes con saldo pendiente">
                  <EmptyState title="Sin cartera pendiente" text="Ningún cliente tiene saldo a la fecha." />
                </PaperBlock>
              ) : (
                <>
                  <PaperBlock label="Mayores saldos" hint={`top ${int(top.length)} · toque una barra para ver el detalle`}>
                    <Legend
                      items={[
                        { key: "ok", label: "Al día", tone: "accent" },
                        { key: "overdue", label: `Vencida (más de ${int(data.overdueDays)} días sin abono)`, tone: "bad" },
                      ]}
                    />
                    <RankingChart
                      data={top.map((r) => ({ label: r.name, value: r.balance, tone: r.overdue ? "bad" : "accent", hint: r.overdue ? "Cartera vencida" : "Al día" }))}
                      format={moneyCompact}
                      formatTip={money}
                      title="Ranking de clientes por saldo pendiente"
                      onSelect={(i) => setDetail(top[i]?.name ?? null)}
                    />
                    <p className={styles.chartNote}>Fuente: saldo de cada cliente (tabla «Clientes con saldo pendiente»).</p>
                  </PaperBlock>

                  <PaperBlock label="Clientes con saldo pendiente" hint={`${int(data.items.length)} clientes · toque una fila para abrir su ficha`}>
                    <DataTable
                      columns={columns}
                      rows={data.items}
                      rowKey={(r) => r.customerId}
                      scroll
                      onRowClick={(r) => navigate(customerLink(r))}
                      footer={
                        <tr className={styles.footRow}>
                          <td colSpan={2}>Total</td>
                          <td className="num">{money(data.totalBalance)}</td>
                          <td colSpan={4} />
                        </tr>
                      }
                    />
                    <p className={styles.chartNote}>Fuente: saldo, cupo, ventas a crédito y abonos de cada cliente; «Origen» es su id en Clientes.</p>
                  </PaperBlock>
                </>
              )}
            </ReportPaper>
          )}
        </QueryState>
      </ReportPreview>

      {detail !== null && report ? (
        <ChartDetailModal
          open
          onClose={() => setDetail(null)}
          title="Mayores saldos pendientes"
          description={`Cliente tocado: ${detail} · vencida a ${int(report.overdueDays)} días`}
          columns={columns}
          rows={[...top].sort((a, b) => (a.name === detail ? -1 : b.name === detail ? 1 : 0))}
          rowKey={(r) => r.customerId}
          onRowClick={(r) => navigate(customerLink(r))}
          excel={{ filename: `${exportName(report)}_top.xlsx`, sheet: { ...sheet(top), title: ["Agropecuaria Mi Tierrita · Mayores saldos (detalle de la gráfica)", `Vencida a ${report.overdueDays} días · corte al ${dateOnly(todayIso())}`] } }}
        />
      ) : null}
    </>
  );
};
