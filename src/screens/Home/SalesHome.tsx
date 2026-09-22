import { Link } from "react-router-dom";
import { Card, DataTable, EmptyState, QueryState, StatGrid, type Column } from "@/components/ui";
import { useCustomers } from "@/hooks/customers";
import { useSalesReport } from "@/hooks/reports";
import { int, money, moneyCompact, todayIso } from "@/lib/format";
import type { Customer, SalesReportProductRow } from "@/types/api";
import { QueryStat } from "./QueryStat";
import styles from "./HomeScreen.module.css";

const productColumns: Column<SalesReportProductRow>[] = [
  { key: "product", header: "Producto", render: (r) => <span className={styles.strong}>{r.productName}</span> },
  { key: "sku", header: "SKU", render: (r) => <span className="muted">{r.sku}</span> },
  { key: "units", header: "Unidades", align: "right", render: (r) => int(r.units) },
  { key: "total", header: "Total", align: "right", render: (r) => money(r.total) },
];

const customerColumns: Column<Customer>[] = [
  { key: "name", header: "Cliente", render: (c) => <span className={styles.strong}>{c.name}</span> },
  { key: "balance", header: "Saldo", align: "right", render: (c) => money(c.balance) },
  { key: "available", header: "Cupo disponible", align: "right", render: (c) => <span className={c.availableCredit <= 0 ? "negative" : ""}>{money(c.availableCredit)}</span> },
];

/** Inicio de la secretaria: lo vendido hoy y los clientes con saldo. */
export const SalesHome = () => {
  const today = todayIso();
  const sales = useSalesReport({ from: today, to: today, groupBy: "product" });
  const customers = useCustomers({ withBalance: true, limit: 5 });

  return (
    <>
      <StatGrid>
        <QueryStat query={sales} label="Vendido hoy" value={(r) => moneyCompact(r.total)} hint={(r) => `${int(r.salesCount)} ${r.salesCount === 1 ? "venta" : "ventas"}`} />
        <QueryStat query={sales} label="Contado" value={(r) => moneyCompact(r.cashTotal)} hint={() => "hoy"} />
        <QueryStat query={sales} label="Crédito" value={(r) => moneyCompact(r.creditTotal)} hint={() => "hoy"} tone={(r) => (r.creditTotal > 0 ? "warn" : "neutral")} />
        <QueryStat query={customers} label="Clientes con saldo" value={(p) => int(p.count)} hint={() => "con cartera pendiente"} />
      </StatGrid>

      <div className={styles.gridEven}>
        <Card
          title="Vendido hoy por producto"
          actions={
            <Link to="/ventas" className={styles.cardLink}>
              Ver ventas
            </Link>
          }
        >
          <QueryState
            query={sales}
            isEmpty={(r) => r.rows.length === 0}
            empty={
              <EmptyState
                title="Aún no hay ventas hoy"
                action={
                  <Link to="/ventas/nueva" className={styles.cardLink}>
                    Registrar una venta
                  </Link>
                }
              />
            }
          >
            {(report) => {
              const rows = report.rows.filter((r): r is SalesReportProductRow => "productId" in r);
              const top = [...rows].sort((a, b) => b.total - a.total).slice(0, 8);
              return <DataTable columns={productColumns} rows={top} rowKey={(r) => r.productId} />;
            }}
          </QueryState>
        </Card>

        <Card
          title="Clientes con saldo"
          actions={
            <Link to="/clientes" className={styles.cardLink}>
              Ver cartera
            </Link>
          }
        >
          <QueryState query={customers} isEmpty={(p) => p.items.length === 0} empty={<EmptyState title="Ningún cliente tiene saldo pendiente" />}>
            {(page) => (
              <>
                <DataTable columns={customerColumns} rows={page.items} rowKey={(c) => c.id} />
                {page.count > page.items.length ? <p className={styles.chartNote}>Se muestran {int(page.items.length)} de {int(page.count)} clientes con saldo.</p> : null}
              </>
            )}
          </QueryState>
        </Card>
      </div>
    </>
  );
};
