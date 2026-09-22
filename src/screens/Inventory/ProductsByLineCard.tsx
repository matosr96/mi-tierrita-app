import { Card, EmptyState, ErrorState, Loading } from "@/components/ui";
import { VBarChart } from "@/components/charts";
import { useProducts } from "@/hooks/products";
import { int } from "@/lib/format";
import styles from "./InventoryScreen.module.css";

/** "Productos por línea": para los roles sin reporte, conteo de productos activos por categoría entre los cargados. */
export const ProductsByLineCard = () => {
  const products = useProducts({ limit: 100, active: true });
  const data = products.data;
  const counts = new Map<string, number>();
  for (const p of data?.items ?? []) counts.set(p.categoryName, (counts.get(p.categoryName) ?? 0) + 1);
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const top = rows[0];
  const partial = data !== undefined && data.count > data.items.length;

  return (
    <Card title="Productos por línea" subtitle="Productos activos">
      {products.isPending ? (
        <Loading inline />
      ) : products.isError ? (
        <ErrorState error={products.error} onRetry={() => products.refetch()} />
      ) : data === undefined || top === undefined ? (
        <EmptyState title="Aún no hay productos" />
      ) : (
        <>
          <VBarChart data={rows.slice(0, 6).map(([label, value]) => ({ label, value }))} format={int} />
          <p className={styles.note}>
            {top[0]} es la línea con más productos ({int(top[1])}).{partial ? ` Conteo entre los primeros ${int(data.items.length)} de ${int(data.count)}.` : ""}
          </p>
        </>
      )}
    </Card>
  );
};
