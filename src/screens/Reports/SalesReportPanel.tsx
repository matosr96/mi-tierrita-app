import { useState } from "react";
import { useSalesReport } from "@/hooks/reports";
import { useAiStatus } from "@/hooks/ai";
import { AiDraftModal } from "@/components/ai/AiDraftModal";
import { ROLE_LABELS, useSessionStore } from "@/stores/session";
import { addDaysIso, dateOnly, int, money, moneyCompact, todayIso } from "@/lib/format";
import { Button, DataTable, EmptyState, Field, Input, QueryState, Tabs, type Column, type TabOption } from "@/components/ui";
import { HBarChart, VBarChart } from "@/components/charts";
import type { SalesGroupBy, SalesReport, SalesReportDayRow, SalesReportProductRow } from "@/types/api";
import { downloadXlsx } from "@/lib/xlsx";
import type { User } from "@/types/api";
import { ReportPreview } from "./ReportPreview";
import { ReportPaper } from "./ReportPaper";
import { PaperBlock } from "./PaperBlock";
import styles from "./ReportsScreen.module.css";

const GROUP_OPTIONS: TabOption<SalesGroupBy>[] = [
  { value: "day", label: "Por día" },
  { value: "product", label: "Por producto" },
];

/** Máximo de barras legibles en el gráfico vertical del kit. */
const MAX_DAY_BARS = 14;
const TOP_PRODUCTS = 10;

const shortDay = (iso: string): string => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const truncate = (text: string, max: number): string => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

const dayColumns: Column<SalesReportDayRow>[] = [
  { key: "date", header: "Fecha", render: (r) => dateOnly(r.date) },
  { key: "salesCount", header: "Ventas", align: "right", render: (r) => int(r.salesCount) },
  { key: "units", header: "Unidades", align: "right", render: (r) => int(r.units) },
  { key: "total", header: "Total", align: "right", render: (r) => money(r.total) },
];

const productColumns: Column<SalesReportProductRow>[] = [
  { key: "product", header: "Producto", render: (r) => <span className={styles.name}>{r.productName}</span> },
  { key: "sku", header: "SKU", align: "left", render: (r) => <span className={styles.mono}>{r.sku}</span> },
  { key: "salesCount", header: "Ventas", align: "right", render: (r) => int(r.salesCount) },
  { key: "units", header: "Unidades", align: "right", render: (r) => int(r.units) },
  { key: "total", header: "Total", align: "right", render: (r) => money(r.total) },
];

const exportName = (report: SalesReport) => `ventas_${report.from.slice(0, 10)}_${report.to.slice(0, 10)}_${report.groupBy === "day" ? "por-dia" : "por-producto"}`;

const exportExcel = (report: SalesReport, user: User | null) => {
  const title = [
    "Agropecuaria Mi Tierrita · Reporte de ventas",
    `Del ${dateOnly(report.from)} al ${dateOnly(report.to)} · ${report.groupBy === "day" ? "por día" : "por producto"}`,
    user ? `Generado por ${user.firstName} ${user.lastName} el ${dateOnly(todayIso())}` : `Generado el ${dateOnly(todayIso())}`,
    `Contado ${money(report.cashTotal)} · crédito ${money(report.creditTotal)} · ventas anuladas no incluidas`,
  ];
  if (report.groupBy === "day") {
    const rows = report.rows as SalesReportDayRow[];
    downloadXlsx(`${exportName(report)}.xlsx`, [
      {
        name: "Ventas por día",
        title,
        headers: ["Fecha", "Ventas", "Unidades", "Total"],
        formats: ["text", "int", "int", "money"],
        rows: rows.map((r) => [r.date.slice(0, 10), r.salesCount, r.units, r.total]),
        footer: ["Total", report.salesCount, report.units, report.total],
      },
    ]);
  } else {
    const rows = report.rows as SalesReportProductRow[];
    downloadXlsx(`${exportName(report)}.xlsx`, [
      {
        name: "Ventas por producto",
        title,
        headers: ["Producto", "SKU", "Ventas", "Unidades", "Total"],
        formats: ["text", "text", "int", "int", "money"],
        rows: rows.map((r) => [r.productName, r.sku, r.salesCount, r.units, r.total]),
        footer: ["Total", "", report.salesCount, report.units, report.total],
      },
    ]);
  }
};

/** CU-19 Reporte de ventas (ADMIN y SALES). */
/** Valores iniciales opcionales (por ejemplo, el reporte que preparó Tita). */
export const SalesReportPanel = (initial: { from?: string | undefined; to?: string | undefined; groupBy?: SalesGroupBy | undefined }) => {
  const user = useSessionStore((s) => s.user);
  const [from, setFrom] = useState(() => initial.from ?? addDaysIso(todayIso(), -30));
  const [to, setTo] = useState(() => initial.to ?? todayIso());
  const [groupBy, setGroupBy] = useState<SalesGroupBy>(initial.groupBy ?? "day");
  const query = useSalesReport({ from, to, groupBy });
  const rangeError = from && to && from > to ? "La fecha inicial no puede ser posterior a la final." : undefined;
  const groupLabel = groupBy === "day" ? "por día" : "por producto";
  const ai = useAiStatus();
  const [summaryOpen, setSummaryOpen] = useState(false);
  const canSummarize = ai.enabled && (user?.role === "ADMIN" || user?.role === "SALES") && Boolean(from && to) && !rangeError;

  const filters = (
    <>
      <div className={styles.filterGroup}>
        <div className={styles.dateField}>
          <Field label="Desde" htmlFor="sales-from" error={rangeError}>
            <Input id="sales-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} invalid={Boolean(rangeError)} />
          </Field>
        </div>
        <div className={styles.dateField}>
          <Field label="Hasta" htmlFor="sales-to">
            <Input id="sales-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setFrom(addDaysIso(todayIso(), -30));
            setTo(todayIso());
          }}
        >
          Últimos 30 días
        </Button>
        {canSummarize ? (
          <Button variant="secondary" size="sm" onClick={() => setSummaryOpen(true)}>
            Lectura con IA
          </Button>
        ) : null}
      </div>
      <Tabs options={GROUP_OPTIONS} value={groupBy} onChange={setGroupBy} />
    </>
  );

  return (
    <>
      <ReportPreview
        subtitle={`Reporte de ventas · ${dateOnly(from)} – ${dateOnly(to)} · ${groupLabel} · generado el ${dateOnly(todayIso())}`}
        filters={filters}
        exportName={query.data && query.data.rows.length > 0 ? exportName(query.data) : undefined}
        onExcel={query.data ? () => exportExcel(query.data, user) : undefined}
        record={{ report: "sales", description: `Del ${dateOnly(from)} al ${dateOnly(to)} · ${groupLabel}` }}
      >
        <QueryState query={query} empty={null}>
          {(report) => {
            const dayRows = report.groupBy === "day" ? (report.rows as SalesReportDayRow[]) : [];
            const productRows = report.groupBy === "product" ? (report.rows as SalesReportProductRow[]) : [];
            const chartDays = dayRows.slice(-MAX_DAY_BARS);
            const topProducts = [...productRows].sort((a, b) => b.total - a.total).slice(0, TOP_PRODUCTS);
            const hasRows = report.rows.length > 0;
            const rangeLabel = `${dateOnly(report.from)} – ${dateOnly(report.to)}`;
            return (
              <ReportPaper
                code="R-01"
                title="Reporte de"
                accent="ventas"
                meta={[rangeLabel, `Generado el ${dateOnly(todayIso())}`, user ? `Por ${user.firstName} ${user.lastName}, ${ROLE_LABELS[user.role]}` : ""]}
                summary={
                  hasRows ? (
                    <>
                      <p>
                        Entre el {dateOnly(report.from)} y el {dateOnly(report.to)} se registraron <strong>{int(report.salesCount)} ventas</strong> completadas por{" "}
                        <strong>{money(report.total)}</strong>, con {int(report.units)} unidades vendidas.
                      </p>
                      <p>
                        De ese total, {money(report.cashTotal)} fueron de contado y {money(report.creditTotal)} a crédito. Las ventas anuladas no se incluyen.
                      </p>
                    </>
                  ) : (
                    <p>No se registraron ventas completadas entre el {dateOnly(report.from)} y el {dateOnly(report.to)}. Amplíe el rango para ver resultados.</p>
                  )
                }
                params={[
                  { label: "Desde", value: dateOnly(report.from) },
                  { label: "Hasta", value: dateOnly(report.to) },
                  { label: "Agrupación", value: report.groupBy === "day" ? "Por día" : "Por producto" },
                  { label: "Estado de las ventas", value: "Completadas" },
                ]}
                indicators={[
                  { label: "Ventas", value: int(report.salesCount) },
                  { label: "Unidades vendidas", value: int(report.units) },
                  { label: "Total vendido", value: money(report.total), tone: "good" },
                  { label: "De contado", value: money(report.cashTotal) },
                  { label: "A crédito", value: money(report.creditTotal), tone: report.creditTotal > 0 ? "warn" : undefined },
                ]}
                note="Elaborado con las ventas registradas en el sistema. No sustituye la contabilidad ni los estados financieros."
              >
                {!hasRows ? (
                  <EmptyState title="Sin ventas en el periodo" text="No se registraron ventas completadas entre esas fechas." />
                ) : (
                  <>
                    <PaperBlock
                      label={report.groupBy === "day" ? "Total vendido por día" : "Productos más vendidos"}
                      hint={report.groupBy === "day" ? (dayRows.length > MAX_DAY_BARS ? `últimos ${MAX_DAY_BARS} días con ventas del rango` : rangeLabel) : `top ${int(topProducts.length)} por total vendido`}
                    >
                      {report.groupBy === "day" ? (
                        <VBarChart data={chartDays.map((r) => ({ label: shortDay(r.date), value: r.total }))} format={chartDays.length <= 8 ? moneyCompact : () => ""} formatTip={moneyCompact} />
                      ) : (
                        <HBarChart data={topProducts.map((r) => ({ label: truncate(r.productName, 22), value: r.total }))} format={moneyCompact} />
                      )}
                      {report.groupBy === "day" && chartDays.length > 8 ? <p className={styles.chartNote}>Los valores de cada día están en la tabla.</p> : null}
                    </PaperBlock>

                    <PaperBlock label="Detalle" hint={`${int(report.rows.length)} ${report.groupBy === "day" ? "días" : "productos"}`}>
                      {report.groupBy === "day" ? (
                        <DataTable
                          columns={dayColumns}
                          rows={dayRows}
                          rowKey={(r) => r.date}
                          footer={
                            <tr className={styles.footRow}>
                              <td>Total</td>
                              <td className="num">{int(report.salesCount)}</td>
                              <td className="num">{int(report.units)}</td>
                              <td className="num">{money(report.total)}</td>
                            </tr>
                          }
                        />
                      ) : (
                        <DataTable
                          columns={productColumns}
                          rows={productRows}
                          rowKey={(r) => r.productId}
                          footer={
                            <tr className={styles.footRow}>
                              <td colSpan={2}>Total</td>
                              <td className="num">{int(report.salesCount)}</td>
                              <td className="num">{int(report.units)}</td>
                              <td className="num">{money(report.total)}</td>
                            </tr>
                          }
                        />
                      )}
                    </PaperBlock>
                  </>
                )}
              </ReportPaper>
            );
          }}
        </QueryState>
      </ReportPreview>
      {canSummarize ? (
        <AiDraftModal
          open={summaryOpen}
          onClose={() => setSummaryOpen(false)}
          title="Lectura del reporte de ventas"
          description={`Del ${dateOnly(from)} al ${dateOnly(to)} frente al periodo anterior de igual duración`}
          request={{ kind: "report_summary", from, to }}
        />
      ) : null}
    </>
  );
};
