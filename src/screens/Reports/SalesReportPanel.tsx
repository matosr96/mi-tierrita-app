import { useState } from "react";
import { useSalesReport } from "@/hooks/reports";
import { ROLE_LABELS, useSessionStore } from "@/stores/session";
import { addDaysIso, dateOnly, int, money, moneyCompact, todayIso } from "@/lib/format";
import { Button, DataTable, EmptyState, Field, Input, QueryState, Tabs, type Column, type TabOption } from "@/components/ui";
import { HBarChart, VBarChart } from "@/components/charts";
import type { SalesGroupBy, SalesReport, SalesReportDayRow, SalesReportProductRow } from "@/types/api";
import { downloadCsv } from "./csv";
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

const exportCsv = (report: SalesReport) => {
  const name = `ventas_${report.from.slice(0, 10)}_${report.to.slice(0, 10)}_${report.groupBy === "day" ? "por-dia" : "por-producto"}.csv`;
  if (report.groupBy === "day") {
    const rows = report.rows as SalesReportDayRow[];
    downloadCsv(
      name,
      ["Fecha", "Ventas", "Unidades", "Total"],
      rows.map((r) => [r.date.slice(0, 10), r.salesCount, r.units, r.total]),
    );
  } else {
    const rows = report.rows as SalesReportProductRow[];
    downloadCsv(
      name,
      ["Producto", "SKU", "Ventas", "Unidades", "Total"],
      rows.map((r) => [r.productName, r.sku, r.salesCount, r.units, r.total]),
    );
  }
};

/** CU-19 Reporte de ventas (ADMIN y SALES). */
export const SalesReportPanel = () => {
  const user = useSessionStore((s) => s.user);
  const [from, setFrom] = useState(() => addDaysIso(todayIso(), -30));
  const [to, setTo] = useState(() => todayIso());
  const [groupBy, setGroupBy] = useState<SalesGroupBy>("day");
  const query = useSalesReport({ from, to, groupBy });
  const rangeError = from && to && from > to ? "La fecha inicial no puede ser posterior a la final." : undefined;
  const groupLabel = groupBy === "day" ? "por día" : "por producto";

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
      </div>
      <Tabs options={GROUP_OPTIONS} value={groupBy} onChange={setGroupBy} />
    </>
  );

  return (
    <ReportPreview
      subtitle={`Reporte de ventas · ${dateOnly(from)} – ${dateOnly(to)} · ${groupLabel} · generado el ${dateOnly(todayIso())}`}
      filters={filters}
      actions={
        query.data && query.data.rows.length > 0 ? (
          <Button variant="secondary" size="sm" onClick={() => exportCsv(query.data)}>
            Exportar CSV
          </Button>
        ) : undefined
      }
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
              title="Reporte de ventas"
              meta={`Agropecuaria Mi Tierrita · ${rangeLabel} · ${user ? `Generado por ${user.firstName} ${user.lastName}, ${ROLE_LABELS[user.role]}` : ""}`}
              summary={
                hasRows ? (
                  <>
                    <p className={styles.summary}>
                      Entre el {dateOnly(report.from)} y el {dateOnly(report.to)} se registraron <strong>{int(report.salesCount)} ventas</strong> completadas por{" "}
                      <strong>{money(report.total)}</strong>, con {int(report.units)} unidades vendidas.
                    </p>
                    <p className={styles.summary}>
                      De ese total, {money(report.cashTotal)} fueron de contado y {money(report.creditTotal)} a crédito. Las ventas anuladas no se incluyen.
                    </p>
                  </>
                ) : (
                  <p className={styles.summary}>No se registraron ventas completadas entre el {dateOnly(report.from)} y el {dateOnly(report.to)}. Amplíe el rango para ver resultados.</p>
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
                      <VBarChart data={chartDays.map((r) => ({ label: shortDay(r.date), value: r.total }))} format={chartDays.length <= 8 ? moneyCompact : () => ""} />
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
  );
};
