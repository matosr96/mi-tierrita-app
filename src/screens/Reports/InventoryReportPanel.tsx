import { useState } from "react";
import { useInventoryReport } from "@/hooks/reports";
import { ROLE_LABELS, useSessionStore } from "@/stores/session";
import { dateOnly, dateTime, int, money, moneyCompact, todayIso } from "@/lib/format";
import { Button, Chips, DataTable, EmptyState, QueryState, type Column } from "@/components/ui";
import { VBarChart } from "@/components/charts";
import type { BatchAggregate, InventoryReport } from "@/types/api";
import { downloadCsv } from "./csv";
import { ReportPreview } from "./ReportPreview";
import { ReportPaper } from "./ReportPaper";
import { PaperBlock } from "./PaperBlock";
import styles from "./ReportsScreen.module.css";

const DAY_OPTIONS = [15, 30, 60, 90].map((v) => ({ value: v, label: `${v} días` }));

type CategoryRow = InventoryReport["byCategory"][number];
type AggregateRow = { key: string; label: string; data: BatchAggregate };

const categoryColumns: Column<CategoryRow>[] = [
  { key: "category", header: "Categoría", render: (r) => <span className={styles.name}>{r.categoryName}</span> },
  { key: "products", header: "Productos", align: "right", render: (r) => int(r.products) },
  { key: "units", header: "Unidades", align: "right", render: (r) => int(r.units) },
  { key: "costValue", header: "Valor al costo", align: "right", render: (r) => money(r.costValue) },
  { key: "saleValue", header: "Valor a precio de venta", align: "right", render: (r) => money(r.saleValue) },
];

const aggregateColumns: Column<AggregateRow>[] = [
  { key: "label", header: "Lotes", render: (r) => <span className={styles.name}>{r.label}</span> },
  { key: "batches", header: "Lotes", align: "right", render: (r) => int(r.data.batches) },
  { key: "units", header: "Unidades", align: "right", render: (r) => int(r.data.units) },
  { key: "costValue", header: "Valor al costo", align: "right", render: (r) => money(r.data.costValue) },
];

const exportCsv = (report: InventoryReport) =>
  downloadCsv(
    `inventario_${report.asOf.slice(0, 10)}.csv`,
    ["Categoría", "Productos", "Unidades", "Valor al costo", "Valor a precio de venta"],
    report.byCategory.map((r) => [r.categoryName, r.products, r.units, r.costValue, r.saleValue]),
  );

/** CU-20 Reporte de inventario (solo ADMIN). */
export const InventoryReportPanel = () => {
  const user = useSessionStore((s) => s.user);
  const [days, setDays] = useState(30);
  const query = useInventoryReport(days);

  const filters = (
    <div className={styles.chipsRow}>
      <span className={styles.filterLabel}>Ventana de vencimiento</span>
      <Chips options={DAY_OPTIONS} value={days} onChange={setDays} />
    </div>
  );

  return (
    <ReportPreview
      subtitle={`Reporte de inventario · lotes por vencer a ${int(days)} días · generado el ${dateOnly(todayIso())}`}
      filters={filters}
      actions={
        query.data && query.data.byCategory.length > 0 ? (
          <Button variant="secondary" size="sm" onClick={() => exportCsv(query.data)}>
            Exportar CSV
          </Button>
        ) : undefined
      }
    >
      <QueryState query={query} isEmpty={(r) => r.products === 0} empty={<EmptyState title="Sin productos registrados" text="Registre productos y compras en Inventario para ver el valor del stock." />}>
        {(report) => {
          const aggregates: AggregateRow[] = [
            { key: "expiring", label: `Por vencer (${int(report.expiringDays)} días)`, data: report.expiringSoon },
            { key: "expired", label: "Vencidos con unidades", data: report.expired },
          ];
          return (
            <ReportPaper
              title="Reporte de inventario"
              meta={`Agropecuaria Mi Tierrita · al ${dateTime(report.asOf)} · ${user ? `Generado por ${user.firstName} ${user.lastName}, ${ROLE_LABELS[user.role]}` : ""}`}
              summary={
                <>
                  <p className={styles.summary}>
                    El inventario tiene <strong>{int(report.units)} unidades</strong> en {int(report.activeProducts)} productos activos, valoradas en <strong>{money(report.costValue)}</strong> al costo y{" "}
                    {money(report.saleValue)} a precio de venta.
                  </p>
                  <p className={styles.summary}>
                    {int(report.outOfStock)} productos activos están sin stock. En los próximos {int(report.expiringDays)} días vencen {int(report.expiringSoon.batches)} lotes ({int(report.expiringSoon.units)} unidades) y hay{" "}
                    {int(report.expired.batches)} lotes vencidos con unidades disponibles.
                  </p>
                </>
              }
              params={[
                { label: "Fecha de corte", value: dateTime(report.asOf) },
                { label: "Ventana de vencimiento", value: `${int(report.expiringDays)} días` },
                { label: "Productos registrados", value: int(report.products) },
                { label: "Valoración", value: "Costo y precio de venta" },
              ]}
              indicators={[
                { label: "Productos activos", value: int(report.activeProducts) },
                { label: "Unidades en stock", value: int(report.units) },
                { label: "Valor al costo", value: money(report.costValue) },
                { label: "Valor a precio de venta", value: money(report.saleValue), tone: "good" },
                { label: "Sin stock", value: int(report.outOfStock), tone: report.outOfStock > 0 ? "bad" : undefined },
                { label: "Lotes por vencer", value: int(report.expiringSoon.batches), tone: report.expiringSoon.batches > 0 ? "warn" : undefined },
                { label: "Lotes vencidos", value: int(report.expired.batches), tone: report.expired.batches > 0 ? "bad" : undefined },
              ]}
              note="Elaborado con los lotes y productos registrados en el sistema. No sustituye un conteo físico."
            >
              <PaperBlock label="Lotes por vencer y vencidos" hint={`ventana de ${int(report.expiringDays)} días`}>
                <DataTable columns={aggregateColumns} rows={aggregates} rowKey={(r) => r.key} />
              </PaperBlock>

              <PaperBlock label="Valor al costo por categoría" hint={`${int(report.byCategory.length)} categorías`}>
                {report.byCategory.length === 0 ? (
                  <EmptyState title="Sin categorías con stock" />
                ) : (
                  <VBarChart data={report.byCategory.map((c) => ({ label: c.categoryName, value: c.costValue }))} format={moneyCompact} />
                )}
              </PaperBlock>

              {report.byCategory.length > 0 ? (
                <PaperBlock label="Detalle por categoría">
                  <DataTable
                    columns={categoryColumns}
                    rows={report.byCategory}
                    rowKey={(r) => r.categoryId}
                    footer={
                      <tr className={styles.footRow}>
                        <td>Total</td>
                        <td className="num">{int(report.activeProducts)}</td>
                        <td className="num">{int(report.units)}</td>
                        <td className="num">{money(report.costValue)}</td>
                        <td className="num">{money(report.saleValue)}</td>
                      </tr>
                    }
                  />
                </PaperBlock>
              ) : null}
            </ReportPaper>
          );
        }}
      </QueryState>
    </ReportPreview>
  );
};
