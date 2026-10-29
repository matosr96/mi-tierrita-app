import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInventoryReport } from "@/hooks/reports";
import { ROLE_LABELS, useSessionStore } from "@/stores/session";
import { dateOnly, dateTime, int, money, moneyCompact, todayIso } from "@/lib/format";
import { Chips, DataTable, EmptyState, QueryState, type Column } from "@/components/ui";
import { ChartDetailModal, StackedBarChart, type StackedSeries } from "@/components/charts";
import type { BatchAggregate, InventoryCategoryRow, InventoryReport } from "@/types/api";
import { downloadXlsx, type XlsxSheet } from "@/lib/xlsx";
import type { User } from "@/types/api";
import { ReportPreview } from "./ReportPreview";
import { ReportPaper } from "./ReportPaper";
import { PaperBlock } from "./PaperBlock";
import { SourceCell, sourceText } from "./SourceCell";
import styles from "./ReportsScreen.module.css";

const DAY_OPTIONS = [15, 30, 60, 90].map((v) => ({ value: v, label: `${v} días` }));

type AggregateRow = { key: string; label: string; data: BatchAggregate };

/** Costo y valor de venta en dos series: la primera en verde sólido y la segunda en verde claro. */
const SERIES: StackedSeries[] = [
  { key: "costValue", label: "Valor al costo", tone: "forest" },
  { key: "saleValue", label: "Valor a precio de venta", tone: "soft" },
];

/** Inventario filtrado por la categoría de la fila (`?categoria=`). */
const categoryLink = (r: InventoryCategoryRow): string => `/inventario?categoria=${r.categoryId}`;

const categoryColumns: Column<InventoryCategoryRow>[] = [
  { key: "category", header: "Categoría", render: (r) => <span className={styles.name}>{r.categoryName}</span> },
  { key: "products", header: "Productos", align: "right", render: (r) => int(r.products) },
  { key: "units", header: "Unidades", align: "right", render: (r) => int(r.units) },
  { key: "costValue", header: "Valor al costo", align: "right", render: (r) => money(r.costValue) },
  { key: "saleValue", header: "Valor a precio de venta", align: "right", render: (r) => money(r.saleValue) },
  { key: "source", header: "Origen", align: "left", render: (r) => <SourceCell prefix="Productos" ids={r.productIds} count={r.products} /> },
];

const aggregateColumns: Column<AggregateRow>[] = [
  { key: "label", header: "Lotes", render: (r) => <span className={styles.name}>{r.label}</span> },
  { key: "batches", header: "Lotes", align: "right", render: (r) => int(r.data.batches) },
  { key: "units", header: "Unidades", align: "right", render: (r) => int(r.data.units) },
  { key: "costValue", header: "Valor al costo", align: "right", render: (r) => money(r.data.costValue) },
];

const categorySheet = (rows: InventoryCategoryRow[], footer?: InventoryReport): XlsxSheet => ({
  name: "Inventario por categoría",
  headers: ["Categoría", "Productos", "Unidades", "Valor al costo", "Valor a precio de venta", "Origen (ids de producto)"],
  formats: ["text", "int", "int", "money", "money", "text"],
  rows: rows.map((r) => [r.categoryName, r.products, r.units, r.costValue, r.saleValue, sourceText("", r.productIds, r.products)]),
  ...(footer ? { footer: ["Total", footer.products, footer.units, footer.costValue, footer.saleValue, ""] } : {}),
});

const exportName = (report: InventoryReport) => `inventario_${report.asOf.slice(0, 10)}`;

const exportExcel = (report: InventoryReport, user: User | null) =>
  downloadXlsx(`${exportName(report)}.xlsx`, [
    {
      ...categorySheet(report.byCategory, report),
      title: [
        "Agropecuaria Mi Tierrita · Reporte de inventario",
        `Corte al ${dateOnly(report.asOf)} · lotes por vencer a ${report.expiringDays} días`,
        user ? `Generado por ${user.firstName} ${user.lastName} el ${dateOnly(todayIso())}` : `Generado el ${dateOnly(todayIso())}`,
        `Productos activos ${int(report.activeProducts)} · unidades ${int(report.units)} · valor al costo ${money(report.costValue)} · a precio de venta ${money(report.saleValue)} · sin stock ${int(report.outOfStock)}`,
      ],
    },
    {
      name: "Lotes",
      headers: ["Lotes", "Cantidad de lotes", "Unidades", "Valor al costo"],
      formats: ["text", "int", "int", "money"],
      rows: [
        [`Por vencer (${report.expiringDays} días)`, report.expiringSoon.batches, report.expiringSoon.units, report.expiringSoon.costValue],
        ["Vencidos con unidades", report.expired.batches, report.expired.units, report.expired.costValue],
        ["Productos agotados", report.outOfStock, null, null],
      ],
    },
  ]);

/** CU-20 Reporte de inventario (solo ADMIN). */
export const InventoryReportPanel = (initial: { days?: number | undefined }) => {
  const user = useSessionStore((s) => s.user);
  const navigate = useNavigate();
  const [days, setDays] = useState(initial.days ?? 30);
  const query = useInventoryReport(days);
  const [detail, setDetail] = useState<string | null>(null);
  const report = query.data;

  const filters = (
    <div className={styles.chipsRow}>
      <span className={styles.filterLabel}>Ventana de vencimiento</span>
      <Chips options={DAY_OPTIONS} value={days} onChange={setDays} />
    </div>
  );

  const params = report
    ? [
        { label: "Fecha de corte", value: dateTime(report.asOf) },
        { label: "Ventana de vencimiento", value: `${int(report.expiringDays)} días` },
        { label: "Productos registrados", value: int(report.products) },
        { label: "Valoración", value: "Costo y precio de venta" },
      ]
    : [];

  return (
    <>
      <ReportPreview
        subtitle={`Reporte de inventario · lotes por vencer a ${int(days)} días · generado el ${dateOnly(todayIso())}`}
        filters={filters}
        exportName={report && report.byCategory.length > 0 ? exportName(report) : undefined}
        onExcel={report ? () => exportExcel(report, user) : undefined}
        record={{
          report: "inventory",
          description: `Corte al ${dateOnly(todayIso())} · vencimientos a ${days} días`,
          filters: { asOf: report?.asOf ?? todayIso(), days },
          summary: report ? { activeProducts: report.activeProducts, units: report.units, costValue: report.costValue, saleValue: report.saleValue, outOfStock: report.outOfStock, expiringBatches: report.expiringSoon.batches, expiredBatches: report.expired.batches } : {},
        }}
        cover={report ? { code: "R-02", title: "Reporte de", accent: "inventario", period: `Corte al ${dateTime(report.asOf)} · lotes por vencer a ${int(report.expiringDays)} días`, params } : undefined}
      >
        <QueryState query={query} isEmpty={(r) => r.products === 0} empty={<EmptyState title="Sin productos registrados" text="Registre productos y compras en Inventario para ver el valor del stock." />}>
          {(data) => {
            const aggregates: AggregateRow[] = [
              { key: "expiring", label: `Por vencer (${int(data.expiringDays)} días)`, data: data.expiringSoon },
              { key: "expired", label: "Vencidos con unidades", data: data.expired },
            ];
            return (
              <ReportPaper
                code="R-02"
                title="Reporte de"
                accent="inventario"
                meta={[`Corte al ${dateTime(data.asOf)}`, `Ventana de ${int(data.expiringDays)} días`, user ? `Por ${user.firstName} ${user.lastName}, ${ROLE_LABELS[user.role]}` : ""]}
                summary={
                  <>
                    <p>
                      El inventario tiene <strong>{int(data.units)} unidades</strong> en {int(data.activeProducts)} productos activos, valoradas en <strong>{money(data.costValue)}</strong> al costo y{" "}
                      {money(data.saleValue)} a precio de venta.
                    </p>
                    <p>
                      {int(data.outOfStock)} productos activos están sin stock. En los próximos {int(data.expiringDays)} días vencen {int(data.expiringSoon.batches)} lotes ({int(data.expiringSoon.units)} unidades) y hay{" "}
                      {int(data.expired.batches)} lotes vencidos con unidades disponibles.
                    </p>
                  </>
                }
                params={params}
                indicators={[
                  { label: "Productos activos", value: int(data.activeProducts) },
                  { label: "Unidades en stock", value: int(data.units) },
                  { label: "Valor al costo", value: money(data.costValue) },
                  { label: "Valor a precio de venta", value: money(data.saleValue), tone: "good" },
                  { label: "Sin stock", value: int(data.outOfStock), tone: data.outOfStock > 0 ? "bad" : undefined },
                  { label: "Lotes por vencer", value: int(data.expiringSoon.batches), tone: data.expiringSoon.batches > 0 ? "warn" : undefined },
                  { label: "Lotes vencidos", value: int(data.expired.batches), tone: data.expired.batches > 0 ? "bad" : undefined },
                ]}
                note="Elaborado con los lotes y productos registrados en el sistema. No sustituye un conteo físico."
              >
                <PaperBlock label="Lotes por vencer y vencidos" hint={`ventana de ${int(data.expiringDays)} días`}>
                  <DataTable columns={aggregateColumns} rows={aggregates} rowKey={(r) => r.key} scroll />
                  <p className={styles.chartNote}>Fuente: lotes con unidades restantes y su fecha de vencimiento.</p>
                </PaperBlock>

                <PaperBlock label="Costo y valor de venta por categoría" hint={`${int(data.byCategory.length)} categorías · toque una barra para ver el detalle`}>
                  {data.byCategory.length === 0 ? (
                    <EmptyState title="Sin categorías con stock" />
                  ) : (
                    <StackedBarChart
                      data={data.byCategory.map((c) => ({ label: c.categoryName, values: { costValue: c.costValue, saleValue: c.saleValue } }))}
                      series={SERIES}
                      format={data.byCategory.length <= 8 ? moneyCompact : () => ""}
                      formatTip={money}
                      title="Valor al costo y a precio de venta por categoría"
                      onSelect={(i) => setDetail(data.byCategory[i]?.categoryName ?? null)}
                    />
                  )}
                  <p className={styles.chartNote}>Fuente: stock y precio de cada producto, y costo unitario de sus lotes (tabla «Detalle por categoría»).</p>
                </PaperBlock>

                {data.byCategory.length > 0 ? (
                  <PaperBlock label="Detalle por categoría" hint="toque una fila para abrir esa categoría en Inventario">
                    <DataTable
                      columns={categoryColumns}
                      rows={data.byCategory}
                      rowKey={(r) => r.categoryId}
                      scroll
                      onRowClick={(r) => navigate(categoryLink(r))}
                      footer={
                        <tr className={styles.footRow}>
                          <td>Total</td>
                          <td className="num">{int(data.activeProducts)}</td>
                          <td className="num">{int(data.units)}</td>
                          <td className="num">{money(data.costValue)}</td>
                          <td className="num">{money(data.saleValue)}</td>
                          <td />
                        </tr>
                      }
                    />
                    <p className={styles.chartNote}>Fuente: productos y lotes por categoría; «Origen» indica los productos que componen la fila.</p>
                  </PaperBlock>
                ) : null}
              </ReportPaper>
            );
          }}
        </QueryState>
      </ReportPreview>

      {detail !== null && report ? (
        <ChartDetailModal
          open
          onClose={() => setDetail(null)}
          title="Costo y valor de venta por categoría"
          description={`Categoría tocada: ${detail} · corte al ${dateOnly(report.asOf)}`}
          columns={categoryColumns}
          rows={[...report.byCategory].sort((a, b) => (a.categoryName === detail ? -1 : b.categoryName === detail ? 1 : 0))}
          rowKey={(r) => r.categoryId}
          onRowClick={(r) => navigate(categoryLink(r))}
          excel={{ filename: `${exportName(report)}_categorias.xlsx`, sheet: { ...categorySheet(report.byCategory, report), title: ["Agropecuaria Mi Tierrita · Inventario por categoría (detalle de la gráfica)", `Corte al ${dateOnly(report.asOf)}`] } }}
        />
      ) : null}
    </>
  );
};
