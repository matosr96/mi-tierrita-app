import { useState } from "react";
import { useSalesReport } from "@/hooks/reports";
import { addDaysIso, dateOnly, int, money, moneyCompact, todayIso } from "@/lib/format";
import { Button, Card, DataTable, EmptyState, Field, Input, QueryState, StatCard, StatGrid, Tabs, type Column, type TabOption } from "@/components/ui";
import { HBarChart, VBarChart } from "@/components/charts";
import type { SalesGroupBy, SalesReport, SalesReportDayRow, SalesReportProductRow } from "@/types/api";
import { downloadCsv } from "./csv";
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
  { key: "sku", header: "SKU", render: (r) => <span className={styles.mono}>{r.sku}</span> },
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
  const [from, setFrom] = useState(() => addDaysIso(todayIso(), -30));
  const [to, setTo] = useState(() => todayIso());
  const [groupBy, setGroupBy] = useState<SalesGroupBy>("day");
  const query = useSalesReport({ from, to, groupBy });
  const rangeError = from && to && from > to ? "La fecha inicial no puede ser posterior a la final." : undefined;

  return (
    <div className={styles.panel}>
      <Card>
        <div className={styles.filters}>
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
            <Button variant="ghost" size="sm" onClick={() => { setFrom(addDaysIso(todayIso(), -30)); setTo(todayIso()); }}>
              Últimos 30 días
            </Button>
          </div>
          <Tabs options={GROUP_OPTIONS} value={groupBy} onChange={setGroupBy} />
        </div>
      </Card>

      <QueryState query={query} empty={null}>
        {(report) => {
          const dayRows = report.groupBy === "day" ? (report.rows as SalesReportDayRow[]) : [];
          const productRows = report.groupBy === "product" ? (report.rows as SalesReportProductRow[]) : [];
          const chartDays = dayRows.slice(-MAX_DAY_BARS);
          const topProducts = [...productRows].sort((a, b) => b.total - a.total).slice(0, TOP_PRODUCTS);
          const hasRows = report.rows.length > 0;
          const rangeLabel = `${dateOnly(report.from)} – ${dateOnly(report.to)}`;
          return (
            <>
              <StatGrid>
                <StatCard label="Ventas" value={int(report.salesCount)} hint={rangeLabel} />
                <StatCard label="Unidades vendidas" value={int(report.units)} />
                <StatCard label="Total vendido" value={moneyCompact(report.total)} hint={money(report.total)} tone="good" />
                <StatCard label="De contado" value={moneyCompact(report.cashTotal)} hint={money(report.cashTotal)} />
                <StatCard label="A crédito" value={moneyCompact(report.creditTotal)} hint={money(report.creditTotal)} tone={report.creditTotal > 0 ? "warn" : "neutral"} />
              </StatGrid>

              {!hasRows ? (
                <Card>
                  <EmptyState title="Sin ventas en el periodo" text="No se registraron ventas completadas entre esas fechas. Amplíe el rango para ver resultados." />
                </Card>
              ) : (
                <>
                  <Card
                    title={report.groupBy === "day" ? "Total vendido por día" : `Productos más vendidos`}
                    subtitle={report.groupBy === "day" ? (dayRows.length > MAX_DAY_BARS ? `Últimos ${MAX_DAY_BARS} días con ventas del rango` : rangeLabel) : `Top ${topProducts.length} por total vendido`}
                  >
                    {report.groupBy === "day" ? (
                      <VBarChart data={chartDays.map((r) => ({ label: shortDay(r.date), value: r.total }))} format={chartDays.length <= 8 ? moneyCompact : () => ""} />
                    ) : (
                      <HBarChart data={topProducts.map((r) => ({ label: truncate(r.productName, 22), value: r.total }))} format={moneyCompact} />
                    )}
                    {report.groupBy === "day" && chartDays.length > 8 ? <p className={styles.chartNote}>Los valores de cada día están en la tabla.</p> : null}
                  </Card>

                  <Card
                    title="Detalle"
                    subtitle={`${int(report.rows.length)} ${report.groupBy === "day" ? "días" : "productos"}`}
                    actions={
                      <Button variant="secondary" size="sm" onClick={() => exportCsv(report)}>
                        Exportar CSV
                      </Button>
                    }
                    flush
                  >
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
                  </Card>
                </>
              )}
            </>
          );
        }}
      </QueryState>
    </div>
  );
};
