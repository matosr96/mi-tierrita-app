import { Link } from "react-router-dom";
import { Card, DataTable, EmptyState, QueryState, StatGrid, type Column } from "@/components/ui";
import { useExpiringBatches } from "@/hooks/batches";
import { useProducts } from "@/hooks/products";
import { dateOnly, int } from "@/lib/format";
import type { Product, ProductBatch } from "@/types/api";
import { ExpiryBadge } from "@/screens/Batches/ExpiryBadge";
import { QueryStat } from "./QueryStat";
import styles from "./HomeScreen.module.css";

const EXPIRING_DAYS = 30;

const batchColumns: Column<ProductBatch>[] = [
  { key: "product", header: "Producto", render: (b) => <span className={styles.strong}>{b.productName}</span> },
  { key: "lot", header: "Lote", render: (b) => <span className="muted">#{b.id}</span> },
  { key: "expires", header: "Vence", render: (b) => dateOnly(b.expiresAt) },
  { key: "days", header: "Días", align: "center", render: (b) => <ExpiryBadge batch={b} /> },
  { key: "remaining", header: "Restante", align: "right", render: (b) => int(b.quantityRemaining) },
];

const productColumns: Column<Product>[] = [
  { key: "sku", header: "SKU", render: (p) => <span className="muted">{p.sku}</span> },
  { key: "name", header: "Producto", render: (p) => <span className={styles.strong}>{p.name}</span> },
  { key: "category", header: "Categoría", render: (p) => p.categoryName },
];

/** Inicio de bodega: qué reponer y qué sacar al frente. */
export const WarehouseHome = () => {
  const products = useProducts({ limit: 100 });
  const expiring = useExpiringBatches({ days: EXPIRING_DAYS, limit: 5 });

  const activeOf = (items: Product[]) => items.filter((p) => p.active);
  const outOfStockOf = (items: Product[]) => activeOf(items).filter((p) => p.stock === 0);
  const sampleHint = (count: number, shown: number) => (count > shown ? `entre los primeros ${int(shown)} de ${int(count)}` : `de ${int(count)} registrados`);

  return (
    <>
      <StatGrid>
        <QueryStat query={products} label="Productos activos" value={(p) => int(activeOf(p.items).length)} hint={(p) => sampleHint(p.count, p.items.length)} />
        <QueryStat query={products} label="Unidades en stock" value={(p) => int(activeOf(p.items).reduce((sum, x) => sum + x.stock, 0))} hint={(p) => sampleHint(p.count, p.items.length)} />
        <QueryStat query={products} label="Sin stock" value={(p) => int(outOfStockOf(p.items).length)} hint={() => "productos por reponer"} tone={(p) => (outOfStockOf(p.items).length > 0 ? "bad" : "neutral")} />
        <QueryStat query={expiring} label="Lotes por vencer" value={(p) => int(p.count)} hint={() => `en los próximos ${EXPIRING_DAYS} días`} tone={(p) => (p.count > 0 ? "warn" : "neutral")} />
      </StatGrid>

      <div className={styles.gridEven}>
        <Card
          title="Lotes próximos a vencer"
          subtitle={`${EXPIRING_DAYS} días`}
          actions={
            <Link to="/lotes" className={styles.cardLink}>
              Ver todos
            </Link>
          }
        >
          <QueryState query={expiring} isEmpty={(p) => p.items.length === 0} empty={<EmptyState title={`Ningún lote vence en los próximos ${EXPIRING_DAYS} días`} />}>
            {(page) => (
              <>
                <DataTable columns={batchColumns} rows={page.items} rowKey={(b) => b.id} />
                {page.count > page.items.length ? <p className={styles.chartNote}>Los {int(page.items.length)} más próximos de {int(page.count)}. Sáquelos al frente del estante.</p> : null}
              </>
            )}
          </QueryState>
        </Card>

        <Card
          title="Productos sin stock"
          actions={
            <Link to="/inventario" className={styles.cardLink}>
              Ver inventario
            </Link>
          }
        >
          <QueryState query={products} isEmpty={(p) => outOfStockOf(p.items).length === 0} empty={<EmptyState title="Todos los productos activos tienen existencias" />}>
            {(page) => {
              const out = outOfStockOf(page.items);
              return (
                <>
                  <DataTable columns={productColumns} rows={out.slice(0, 6)} rowKey={(p) => p.id} />
                  {out.length > 6 ? <p className={styles.chartNote}>Y {int(out.length - 6)} más sin stock.</p> : null}
                </>
              );
            }}
          </QueryState>
        </Card>
      </div>
    </>
  );
};
