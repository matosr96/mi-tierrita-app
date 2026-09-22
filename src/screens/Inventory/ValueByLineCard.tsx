import { Card, EmptyState, ErrorState, Loading } from "@/components/ui";
import { VBarChart } from "@/components/charts";
import { useInventoryReport } from "@/hooks/reports";
import { int, money, moneyCompact } from "@/lib/format";
import styles from "./InventoryScreen.module.css";

/** "Valor por línea" del lienzo: barras verticales con el valor a costo por categoría del reporte de inventario (ADMIN). */
export const ValueByLineCard = () => {
  const report = useInventoryReport();
  return (
    <Card title="Valor por línea" subtitle="A costo, en pesos">
      {report.isPending ? (
        <Loading inline />
      ) : report.isError ? (
        <ErrorState error={report.error} onRetry={() => report.refetch()} />
      ) : report.data.byCategory.length === 0 ? (
        <EmptyState title="Sin existencias valoradas" text="Registre lotes para ver el capital por línea." />
      ) : (
        (() => {
          const rows = [...report.data.byCategory].sort((a, b) => b.costValue - a.costValue);
          const top = rows[0]!;
          return (
            <>
              <VBarChart data={rows.slice(0, 6).map((c) => ({ label: c.categoryName, value: c.costValue }))} format={moneyCompact} />
              <p className={styles.note}>
                {top.categoryName} es la línea con más capital en bodega: {money(top.costValue)} en {int(top.products)} {top.products === 1 ? "producto" : "productos"} y {int(top.units)} unidades.
              </p>
            </>
          );
        })()
      )}
    </Card>
  );
};
