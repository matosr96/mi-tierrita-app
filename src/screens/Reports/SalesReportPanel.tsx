import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSalesReport } from "@/hooks/reports";
import { useAiStatus } from "@/hooks/ai";
import { AiDraftModal } from "@/components/ai/AiDraftModal";
import { ROLE_LABELS, useSessionStore } from "@/stores/session";
import { addDaysIso, dateOnly, int, money, moneyCompact, todayIso } from "@/lib/format";
import { Button, DataTable, EmptyState, Field, Input, QueryState, Tabs, type Column, type TabOption } from "@/components/ui";
import { ChartDetailModal, HeatmapCalendar, RankingChart, StackedBarChart, type StackedSeries } from "@/components/charts";
import type { SalesGroupBy, SalesReport, SalesReportDayRow, SalesReportProductRow } from "@/types/api";
import { downloadXlsx, type XlsxSheet } from "@/lib/xlsx";
import type { User } from "@/types/api";
import { ReportPreview } from "./ReportPreview";
import { ReportPaper } from "./ReportPaper";
import { PaperBlock } from "./PaperBlock";
import { SourceCell, sourceText } from "./SourceCell";
import styles from "./ReportsScreen.module.css";

const GROUP_OPTIONS: TabOption<SalesGroupBy>[] = [
  { value: "day", label: "Por día" },
  { value: "product", label: "Por producto" },
];

/** Máximo de barras legibles en el gráfico apilado. */
const MAX_DAY_BARS = 14;
const TOP_PRODUCTS = 10;

const SERIES: StackedSeries[] = [
  { key: "cashTotal", label: "De contado", tone: "accent" },
  { key: "creditTotal", label: "A crédito", tone: "warn" },
];

const shortDay = (iso: string): string => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

/** Historial de ventas de la fila: abre el primer ticket y, por día, deja el filtro en esa fecha. */
const dayLink = (r: SalesReportDayRow): string => `/ventas/historial?from=${r.date}&to=${r.date}${r.sourceIds[0] !== undefined ? `&sale=${r.sourceIds[0]}` : ""}`;
const productLink = (r: SalesReportProductRow): string => `/ventas/historial${r.sourceIds[0] !== undefined ? `?sale=${r.sourceIds[0]}` : ""}`;

const dayColumns: Column<SalesReportDayRow>[] = [
  { key: "date", header: "Fecha", render: (r) => dateOnly(r.date) },
  { key: "salesCount", header: "Ventas", align: "right", render: (r) => int(r.salesCount) },
  { key: "units", header: "Unidades", align: "right", render: (r) => int(r.units) },
  { key: "cashTotal", header: "Contado", align: "right", render: (r) => money(r.cashTotal) },
  { key: "creditTotal", header: "Crédito", align: "right", render: (r) => money(r.creditTotal) },
  { key: "total", header: "Total", align: "right", render: (r) => money(r.total) },
  { key: "source", header: "Origen", align: "left", render: (r) => <SourceCell prefix="Ventas" ids={r.sourceIds} count={r.sourceCount} /> },
];

const productColumns: Column<SalesReportProductRow>[] = [
  { key: "product", header: "Producto", render: (r) => <span className={styles.name}>{r.productName}</span> },
  { key: "sku", header: "SKU", align: "left", render: (r) => <span className={styles.mono}>{r.sku}</span> },
  { key: "salesCount", header: "Ventas", align: "right", render: (r) => int(r.salesCount) },
  { key: "units", header: "Unidades", align: "right", render: (r) => int(r.units) },
  { key: "total", header: "Total", align: "right", render: (r) => money(r.total) },
  { key: "source", header: "Origen", align: "left", render: (r) => <SourceCell prefix="Ventas" ids={r.sourceIds} count={r.sourceCount} /> },
];

const exportName = (report: SalesReport) => `ventas_${report.from.slice(0, 10)}_${report.to.slice(0, 10)}_${report.groupBy === "day" ? "por-dia" : "por-producto"}`;

const daySheet = (rows: SalesReportDayRow[], footer?: SalesReport): XlsxSheet => ({
  name: "Ventas por día",
  headers: ["Fecha", "Ventas", "Unidades", "Contado", "Crédito", "Total", "Origen (ids de venta)"],
  formats: ["text", "int", "int", "money", "money", "money", "text"],
  rows: rows.map((r) => [r.date.slice(0, 10), r.salesCount, r.units, r.cashTotal, r.creditTotal, r.total, sourceText("", r.sourceIds, r.sourceCount)]),
  ...(footer ? { footer: ["Total", footer.salesCount, footer.units, footer.cashTotal, footer.creditTotal, footer.total, ""] } : {}),
});

const productSheet = (rows: SalesReportProductRow[], footer?: SalesReport): XlsxSheet => ({
  name: "Ventas por producto",
  headers: ["Producto", "SKU", "Ventas", "Unidades", "Total", "Origen (ids de venta)"],
  formats: ["text", "text", "int", "int", "money", "text"],
  rows: rows.map((r) => [r.productName, r.sku, r.salesCount, r.units, r.total, sourceText("", r.sourceIds, r.sourceCount)]),
  ...(footer ? { footer: ["Total", "", footer.salesCount, footer.units, footer.total, ""] } : {}),
});

const exportExcel = (report: SalesReport, user: User | null) => {
  const title = [
    "Agropecuaria Mi Tierrita · Reporte de ventas",
    `Del ${dateOnly(report.from)} al ${dateOnly(report.to)} · ${report.groupBy === "day" ? "por día" : "por producto"}`,
    user ? `Generado por ${user.firstName} ${user.lastName} el ${dateOnly(todayIso())}` : `Generado el ${dateOnly(todayIso())}`,
    `Ventas ${int(report.salesCount)} · unidades ${int(report.units)} · total ${money(report.total)} · contado ${money(report.cashTotal)} · crédito ${money(report.creditTotal)} · ventas anuladas no incluidas`,
  ];
  const sheet = report.groupBy === "day" ? daySheet(report.rows as SalesReportDayRow[], report) : productSheet(report.rows as SalesReportProductRow[], report);
  return downloadXlsx(`${exportName(report)}.xlsx`, [{ ...sheet, title }]);
};

type Detail = { kind: "days"; focus?: string } | { kind: "products"; focus?: string };

/** CU-19 Reporte de ventas (ADMIN y SALES). Valores iniciales opcionales (por ejemplo, el reporte que preparó Tita). */
export const SalesReportPanel = (initial: { from?: string | undefined; to?: string | undefined; groupBy?: SalesGroupBy | undefined }) => {
  const user = useSessionStore((s) => s.user);
  const navigate = useNavigate();
  const [from, setFrom] = useState(() => initial.from ?? addDaysIso(todayIso(), -30));
  const [to, setTo] = useState(() => initial.to ?? todayIso());
  const [groupBy, setGroupBy] = useState<SalesGroupBy>(initial.groupBy ?? "day");
  const query = useSalesReport({ from, to, groupBy });
  const rangeError = from && to && from > to ? "La fecha inicial no puede ser posterior a la final." : undefined;
  const groupLabel = groupBy === "day" ? "por día" : "por producto";
  const ai = useAiStatus();
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [detail, setDetail] = useState<Detail | null>(null);
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

  const report = query.data;
  const dayRows = report?.groupBy === "day" ? (report.rows as SalesReportDayRow[]) : [];
  const productRows = report?.groupBy === "product" ? (report.rows as SalesReportProductRow[]) : [];
  const chartDays = dayRows.slice(-MAX_DAY_BARS);
  const topProducts = [...productRows].sort((a, b) => b.total - a.total).slice(0, TOP_PRODUCTS);
  const rangeLabel = report ? `${dateOnly(report.from)} – ${dateOnly(report.to)}` : "";
  const params = report
    ? [
        { label: "Desde", value: dateOnly(report.from) },
        { label: "Hasta", value: dateOnly(report.to) },
        { label: "Agrupación", value: report.groupBy === "day" ? "Por día" : "Por producto" },
        { label: "Estado de las ventas", value: "Completadas" },
      ]
    : [];

  return (
    <>
      <ReportPreview
        subtitle={`Reporte de ventas · ${dateOnly(from)} – ${dateOnly(to)} · ${groupLabel} · generado el ${dateOnly(todayIso())}`}
        filters={filters}
        exportName={report && report.rows.length > 0 ? exportName(report) : undefined}
        onExcel={report ? () => exportExcel(report, user) : undefined}
        record={{
          report: "sales",
          description: `Del ${dateOnly(from)} al ${dateOnly(to)} · ${groupLabel}`,
          filters: { from, to, groupBy },
          summary: report ? { salesCount: report.salesCount, units: report.units, total: report.total, cashTotal: report.cashTotal, creditTotal: report.creditTotal } : {},
        }}
        cover={report ? { code: "R-01", title: "Reporte de", accent: "ventas", period: `Ventas del ${dateOnly(report.from)} al ${dateOnly(report.to)}, ${groupLabel}`, params } : undefined}
      >
        <QueryState query={query} empty={null}>
          {(data) => {
            const hasRows = data.rows.length > 0;
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
                        Entre el {dateOnly(data.from)} y el {dateOnly(data.to)} se registraron <strong>{int(data.salesCount)} ventas</strong> completadas por <strong>{money(data.total)}</strong>, con{" "}
                        {int(data.units)} unidades vendidas.
                      </p>
                      <p>
                        De ese total, {money(data.cashTotal)} fueron de contado y {money(data.creditTotal)} a crédito. Las ventas anuladas no se incluyen.
                      </p>
                    </>
                  ) : (
                    <p>No se registraron ventas completadas entre el {dateOnly(data.from)} y el {dateOnly(data.to)}. Amplíe el rango para ver resultados.</p>
                  )
                }
                params={params}
                indicators={[
                  { label: "Ventas", value: int(data.salesCount) },
                  { label: "Unidades vendidas", value: int(data.units) },
                  { label: "Total vendido", value: money(data.total), tone: "good" },
                  { label: "De contado", value: money(data.cashTotal) },
                  { label: "A crédito", value: money(data.creditTotal), tone: data.creditTotal > 0 ? "warn" : undefined },
                ]}
                note="Elaborado con las ventas registradas en el sistema. No sustituye la contabilidad ni los estados financieros."
              >
                {!hasRows ? (
                  <EmptyState title="Sin ventas en el periodo" text="No se registraron ventas completadas entre esas fechas." />
                ) : data.groupBy === "day" ? (
                  <>
                    <PaperBlock label="Contado y crédito por día" hint={dayRows.length > MAX_DAY_BARS ? `últimos ${MAX_DAY_BARS} días con ventas del rango · toque una barra para ver el detalle` : `${rangeLabel} · toque una barra para ver el detalle`}>
                      <StackedBarChart
                        data={chartDays.map((r) => ({ label: shortDay(r.date), values: { cashTotal: r.cashTotal, creditTotal: r.creditTotal } }))}
                        series={SERIES}
                        format={chartDays.length <= 8 ? moneyCompact : () => ""}
                        formatTip={money}
                        title="Total vendido por día, de contado y a crédito"
                        onSelect={(i) => setDetail({ kind: "days", focus: chartDays[i]?.date })}
                      />
                      <p className={styles.chartNote}>Fuente: ventas completadas del período (tabla «Detalle»).</p>
                    </PaperBlock>

                    <PaperBlock label="Mapa de calor del período" hint="total vendido por día · toque un día para ver el detalle">
                      <HeatmapCalendar
                        data={dayRows.map((r) => ({ date: r.date, value: r.total }))}
                        from={data.from.slice(0, 10)}
                        to={data.to.slice(0, 10)}
                        format={money}
                        formatDate={dateOnly}
                        title="Mapa de calor del total vendido por día"
                        onSelect={(date) => setDetail({ kind: "days", focus: date })}
                      />
                      <p className={styles.chartNote}>Fuente: ventas completadas del período; los días sin ventas quedan en gris.</p>
                    </PaperBlock>

                    <PaperBlock label="Detalle" hint={`${int(data.rows.length)} días · toque una fila para abrir sus ventas`}>
                      <DataTable
                        columns={dayColumns}
                        rows={dayRows}
                        rowKey={(r) => r.date}
                        scroll
                        onRowClick={(r) => navigate(dayLink(r))}
                        footer={
                          <tr className={styles.footRow}>
                            <td>Total</td>
                            <td className="num">{int(data.salesCount)}</td>
                            <td className="num">{int(data.units)}</td>
                            <td className="num">{money(data.cashTotal)}</td>
                            <td className="num">{money(data.creditTotal)}</td>
                            <td className="num">{money(data.total)}</td>
                            <td />
                          </tr>
                        }
                      />
                      <p className={styles.chartNote}>Fuente: tabla de ventas y sus líneas; cada fila indica en «Origen» los tickets que la componen.</p>
                    </PaperBlock>
                  </>
                ) : (
                  <>
                    <PaperBlock label="Productos más vendidos" hint={`top ${int(topProducts.length)} por total vendido · toque una barra para ver el detalle`}>
                      <RankingChart data={topProducts.map((r) => ({ label: r.productName, value: r.total, hint: `${int(r.units)} unidades en ${int(r.salesCount)} ventas` }))} format={moneyCompact} formatTip={money} title="Ranking de productos por total vendido" onSelect={(i) => setDetail({ kind: "products", focus: topProducts[i]?.productName })} />
                      <p className={styles.chartNote}>Fuente: líneas de las ventas completadas del período (tabla «Detalle»).</p>
                    </PaperBlock>

                    <PaperBlock label="Detalle" hint={`${int(data.rows.length)} productos · toque una fila para abrir sus ventas`}>
                      <DataTable
                        columns={productColumns}
                        rows={productRows}
                        rowKey={(r) => r.productId}
                        scroll
                        onRowClick={(r) => navigate(productLink(r))}
                        footer={
                          <tr className={styles.footRow}>
                            <td colSpan={2}>Total</td>
                            <td className="num">{int(data.salesCount)}</td>
                            <td className="num">{int(data.units)}</td>
                            <td className="num">{money(data.total)}</td>
                            <td />
                          </tr>
                        }
                      />
                      <p className={styles.chartNote}>Fuente: tabla de ventas y sus líneas; «Origen» indica los tickets donde se vendió el producto.</p>
                    </PaperBlock>
                  </>
                )}
              </ReportPaper>
            );
          }}
        </QueryState>
      </ReportPreview>

      {detail?.kind === "days" ? (
        <ChartDetailModal
          open
          onClose={() => setDetail(null)}
          title="Ventas por día · contado y crédito"
          description={detail.focus ? `Día tocado: ${dateOnly(detail.focus)} · ${rangeLabel}` : rangeLabel}
          columns={dayColumns}
          rows={detail.focus ? [...dayRows].sort((a, b) => (a.date === detail.focus ? -1 : b.date === detail.focus ? 1 : 0)) : dayRows}
          rowKey={(r) => r.date}
          onRowClick={(r) => navigate(dayLink(r))}
          excel={report ? { filename: `${exportName(report)}_detalle.xlsx`, sheet: { ...daySheet(dayRows, report), title: ["Agropecuaria Mi Tierrita · Ventas por día (detalle de la gráfica)", rangeLabel] } } : undefined}
        />
      ) : null}
      {detail?.kind === "products" ? (
        <ChartDetailModal
          open
          onClose={() => setDetail(null)}
          title="Productos más vendidos"
          description={detail.focus ? `Producto tocado: ${detail.focus} · ${rangeLabel}` : rangeLabel}
          columns={productColumns}
          rows={topProducts}
          rowKey={(r) => r.productId}
          onRowClick={(r) => navigate(productLink(r))}
          excel={report ? { filename: `${exportName(report)}_top.xlsx`, sheet: { ...productSheet(topProducts), title: ["Agropecuaria Mi Tierrita · Productos más vendidos (detalle de la gráfica)", rangeLabel] } } : undefined}
        />
      ) : null}

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
