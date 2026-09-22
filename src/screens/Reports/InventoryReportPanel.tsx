import { useState } from "react";
import { useInventoryReport } from "@/hooks/reports";
import { dateTime, int, money, moneyCompact } from "@/lib/format";
import { Card, Chips, DataTable, EmptyState, QueryState, StatCard, StatGrid, type Column } from "@/components/ui";
import { VBarChart } from "@/components/charts";
import type { BatchAggregate, InventoryReport } from "@/types/api";
import styles from "./ReportsScreen.module.css";

const DAY_OPTIONS = [15, 30, 60, 90].map((v) => ({ value: v, label: `${v} días` }));

type CategoryRow = InventoryReport["byCategory"][number];

const categoryColumns: Column<CategoryRow>[] = [
  { key: "category", header: "Categoría", render: (r) => <span className={styles.name}>{r.categoryName}</span> },
  { key: "products", header: "Productos", align: "right", render: (r) => int(r.products) },
  { key: "units", header: "Unidades", align: "right", render: (r) => int(r.units) },
  { key: "costValue", header: "Valor al costo", align: "right", render: (r) => money(r.costValue) },
  { key: "saleValue", header: "Valor a precio de venta", align: "right", render: (r) => money(r.saleValue) },
];

const AggregateCard = ({ title, subtitle, data, tone }: { title: string; subtitle: string; data: BatchAggregate; tone: "warn" | "bad" }) => (
  <Card title={title} subtitle={subtitle} className={data.batches > 0 ? (tone === "warn" ? styles.warnCard : styles.badCard) : undefined}>
    <div className={styles.aggGrid}>
      <div className={styles.agg}>
        <span className={styles.aggLabel}>Lotes</span>
        <span className={styles.aggValue}>{int(data.batches)}</span>
      </div>
      <div className={styles.agg}>
        <span className={styles.aggLabel}>Unidades</span>
        <span className={styles.aggValue}>{int(data.units)}</span>
      </div>
      <div className={styles.agg}>
        <span className={styles.aggLabel}>Valor al costo</span>
        <span className={styles.aggValue}>{moneyCompact(data.costValue)}</span>
      </div>
    </div>
  </Card>
);

/** CU-20 Reporte de inventario (solo ADMIN). */
export const InventoryReportPanel = () => {
  const [days, setDays] = useState(30);
  const query = useInventoryReport(days);

  return (
    <div className={styles.panel}>
      <Card>
        <div className={styles.chipsRow}>
          <span className={styles.filterLabel}>Ventana de vencimiento</span>
          <Chips options={DAY_OPTIONS} value={days} onChange={setDays} />
        </div>
      </Card>

      <QueryState
        query={query}
        isEmpty={(r) => r.products === 0}
        empty={
          <Card>
            <EmptyState title="Sin productos registrados" text="Registre productos y compras en Inventario para ver el valor del stock." />
          </Card>
        }
      >
        {(report) => (
          <>
            <StatGrid>
              <StatCard label="Productos activos" value={int(report.activeProducts)} hint={`de ${int(report.products)} registrados`} />
              <StatCard label="Unidades en stock" value={int(report.units)} />
              <StatCard label="Valor al costo" value={moneyCompact(report.costValue)} hint={money(report.costValue)} />
              <StatCard label="Valor a precio de venta" value={moneyCompact(report.saleValue)} hint={money(report.saleValue)} tone="good" />
              <StatCard label="Sin stock" value={int(report.outOfStock)} hint="productos activos en cero" tone={report.outOfStock > 0 ? "bad" : "neutral"} />
            </StatGrid>

            <div className={styles.twoCols}>
              <AggregateCard title="Por vencer" subtitle={`próximos ${int(report.expiringDays)} días`} data={report.expiringSoon} tone="warn" />
              <AggregateCard title="Vencidos" subtitle="con unidades disponibles" data={report.expired} tone="bad" />
            </div>

            <Card title="Valor al costo por categoría" subtitle={`al ${dateTime(report.asOf)}`}>
              {report.byCategory.length === 0 ? (
                <EmptyState title="Sin categorías con stock" />
              ) : (
                <VBarChart data={report.byCategory.map((c) => ({ label: c.categoryName, value: c.costValue }))} format={moneyCompact} />
              )}
            </Card>

            <Card title="Detalle por categoría" subtitle={`${int(report.byCategory.length)} categorías`} flush>
              {report.byCategory.length === 0 ? (
                <EmptyState title="Sin categorías con stock" />
              ) : (
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
              )}
            </Card>
          </>
        )}
      </QueryState>
    </div>
  );
};
