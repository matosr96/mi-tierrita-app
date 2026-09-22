import { Link } from "react-router-dom";
import { Card, EmptyState, QueryState, StatGrid } from "@/components/ui";
import { HBarChart } from "@/components/charts";
import { useInventoryReport, useReceivablesReport, useSalesReport } from "@/hooks/reports";
import { dateOnly, int, money, moneyCompact, todayIso } from "@/lib/format";
import type { SalesReportProductRow } from "@/types/api";
import { QueryStat } from "./QueryStat";
import { AttentionCard } from "./AttentionCard";
import styles from "./HomeScreen.module.css";

/** Inicio del administrador: ventas del mes, cartera, inventario y pendientes. */
export const AdminHome = () => {
  const today = todayIso();
  const monthStart = `${today.slice(0, 7)}-01`;
  const sales = useSalesReport({ from: monthStart, to: today, groupBy: "product" });
  const receivables = useReceivablesReport();
  const inventory = useInventoryReport();

  return (
    <>
      <StatGrid>
        <QueryStat query={sales} label="Ventas del mes" value={(r) => moneyCompact(r.total)} hint={(r) => `${int(r.salesCount)} ${r.salesCount === 1 ? "venta" : "ventas"} desde el ${dateOnly(r.from)}`} />
        <QueryStat query={receivables} label="Cartera total" value={(r) => moneyCompact(r.totalBalance)} hint={(r) => `${int(r.customersWithBalance)} ${r.customersWithBalance === 1 ? "cliente con saldo" : "clientes con saldo"}`} />
        <QueryStat
          query={receivables}
          label="Cartera vencida"
          value={(r) => moneyCompact(r.overdueBalance)}
          hint={(r) => `${int(r.overdueCustomers)} ${r.overdueCustomers === 1 ? "cliente" : "clientes"} · más de ${r.overdueDays} días`}
          tone={(r) => (r.overdueBalance > 0 ? "warn" : "neutral")}
        />
        <QueryStat query={inventory} label="Valor del inventario" value={(r) => moneyCompact(r.costValue)} hint={(r) => `a costo · al ${dateOnly(r.asOf)}`} />
        <QueryStat
          query={inventory}
          label="Lotes por vencer"
          value={(r) => int(r.expiringSoon.batches)}
          hint={(r) => `en ${r.expiringDays} días · ${int(r.expired.batches)} ${r.expired.batches === 1 ? "vencido" : "vencidos"}`}
          tone={(r) => (r.expired.batches > 0 ? "bad" : r.expiringSoon.batches > 0 ? "warn" : "neutral")}
        />
      </StatGrid>

      <div className={styles.grid}>
        <Card title="Ventas por producto" subtitle={`Del ${dateOnly(monthStart)} al ${dateOnly(today)}`}>
          <QueryState
            query={sales}
            isEmpty={(r) => r.rows.length === 0}
            empty={
              <EmptyState
                title="Sin ventas este mes"
                text="Las ventas registradas aparecerán aquí por producto."
                action={
                  <Link to="/ventas/nueva" className={styles.cardLink}>
                    Registrar la primera venta
                  </Link>
                }
              />
            }
          >
            {(report) => {
              const rows = report.rows.filter((r): r is SalesReportProductRow => "productId" in r);
              const top = [...rows].sort((a, b) => b.total - a.total).slice(0, 6);
              return (
                <>
                  <HBarChart data={top.map((r) => ({ label: r.productName, value: r.total }))} format={moneyCompact} />
                  <p className={styles.chartNote}>
                    {rows.length > top.length ? `Los ${top.length} productos con más ventas de ${int(rows.length)}. ` : ""}
                    Contado {money(report.cashTotal)} · Crédito {money(report.creditTotal)} · {int(report.units)} unidades.
                  </p>
                </>
              );
            }}
          </QueryState>
        </Card>
        <AttentionCard inventory={inventory} receivables={receivables} />
      </div>
    </>
  );
};
