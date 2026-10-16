import { useNavigate } from "react-router-dom";
import { HeroHeader } from "@/components/layout/HeroHeader";
import { Button, Card, EmptyState, QueryState, StatGrid } from "@/components/ui";
import { DonutChart, HBarChart, LineChart } from "@/components/charts";
import { useInventoryReport, useReceivablesReport, useSalesReport } from "@/hooks/reports";
import { useScenarios } from "@/hooks/financial";
import { dateOnly, int, money, moneyCompact, todayIso } from "@/lib/format";
import type { SalesReportDayRow, SalesReportProductRow, User } from "@/types/api";
import { QueryStat } from "./QueryStat";
import { AttentionCard } from "./AttentionCard";
import { DecisionCard } from "./DecisionCard";
import { monthName, previousMonthCut, scrollToPending, shortDay, statusSubtitle, statusTitle } from "./homeDates";
import { adminAttention } from "./attention";
import { StatusAside } from "./StatusAside";
import styles from "./HomeScreen.module.css";

/** Inicio del administrador (Dashboard del lienzo): ventas del mes, cartera, valor por vencer, pendientes y decisión abierta. */
export const AdminHome = ({ user }: { user: User }) => {
  const navigate = useNavigate();
  const today = todayIso();
  const monthStart = `${today.slice(0, 7)}-01`;
  const sales = useSalesReport({ from: monthStart, to: today, groupBy: "product" });
  const daily = useSalesReport({ from: monthStart, to: today, groupBy: "day" });
  const previous = useSalesReport({ ...previousMonthCut(today), groupBy: "product" });
  const receivables = useReceivablesReport();
  const inventory = useInventoryReport();
  const scenarios = useScenarios({ limit: 1 });
  const days = (daily.data?.rows ?? []) as SalesReportDayRow[];
  const prevTotal = previous.data?.total;
  const attention = inventory.isPending || receivables.isPending ? null : adminAttention(inventory.data, receivables.data);

  return (
    <>
      <HeroHeader
        eyebrow="Panel de administración"
        title={statusTitle(attention?.length ?? null, user.firstName)}
        aside={<StatusAside items={attention} onSeeAll={scrollToPending} />}
        subtitle={statusSubtitle(user.firstName)}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate("/reportes")}>
              Ver reportes
            </Button>
            <Button onClick={() => navigate("/ventas/nueva")}>Nueva venta</Button>
          </>
        }
      />

      <StatGrid>
        <QueryStat
          query={sales}
          label="Ventas del mes"
          value={(r) => moneyCompact(r.total)}           hint={(r) =>
            prevTotal === undefined || (prevTotal === 0 && r.total === 0)
              ? `${int(r.salesCount)} ${r.salesCount === 1 ? "venta" : "ventas"} desde el ${dateOnly(r.from)}`
              : `${r.total >= prevTotal ? "▲" : "▼"} frente a ${moneyCompact(prevTotal)} al mismo corte del mes pasado`
          }
          trend={days.map((d) => d.total)}
        />
        <QueryStat query={inventory} label="Valor del inventario" value={(r) => moneyCompact(r.costValue)} hint={(r) => `a costo · al ${dateOnly(r.asOf)}`} />
        <QueryStat
          query={receivables}
          label="Cartera vencida"
          value={(r) => moneyCompact(r.overdueBalance)}
          hint={(r) => `${int(r.overdueCustomers)} ${r.overdueCustomers === 1 ? "cliente" : "clientes"} · más de ${r.overdueDays} días`}
          tone={(r) => (r.overdueBalance > 0 ? "warn" : "neutral")}
        />
        <QueryStat
          query={inventory}
          label="Valor por vencer"
          value={(r) => moneyCompact(r.expiringSoon.costValue)}
          hint={(r) => `${int(r.expiringSoon.batches)} ${r.expiringSoon.batches === 1 ? "lote" : "lotes"} en los próximos ${r.expiringDays} días`}
          tone={(r) => (r.expiringSoon.batches > 0 ? "bad" : "neutral")}
        />
      </StatGrid>

      <div className={styles.grid}>
        <Card title="Ventas del mes, día a día" subtitle={`${monthName()} · pesos por día con ventas`}>
          <QueryState query={daily} isEmpty={(r) => r.rows.length === 0} empty={<EmptyState title="Sin ventas este mes" text="Cada día con ventas aparecerá como un punto de la línea." />}>
            {(report) => {
              const rows = report.rows as SalesReportDayRow[];
              return (
                <LineChart
                  points={rows.map((d) => ({ x: new Date(`${d.date}T12:00:00`).getTime(), y: d.total }))}
                  formatX={(x) => shortDay(new Date(x).toISOString().slice(0, 10))}
                  formatY={moneyCompact}
                  title={`Ventas por día de ${monthName().toLowerCase()}`}
                />
              );
            }}
          </QueryState>
        </Card>
        <Card title="Contado y crédito" subtitle={`${monthName()} · cómo se pagó lo vendido`}>
          <QueryState query={sales} isEmpty={(r) => r.total === 0} empty={<EmptyState title="Sin ventas este mes" />}>
            {(report) => (
              <DonutChart
                data={[
                  { label: "Contado", value: report.cashTotal, tone: "good" },
                  { label: "Crédito", value: report.creditTotal, tone: "warn" },
                ]}
                format={moneyCompact}
                center={moneyCompact(report.total)}
                centerLabel="vendido"
              />
            )}
          </QueryState>
        </Card>
      </div>

      <div className={styles.grid}>
        <Card title="Ventas por producto" subtitle={`${monthName()} · pesos`}>
          <QueryState
            query={sales}
            isEmpty={(r) => r.rows.length === 0}
            empty={
              <EmptyState
                title="Sin ventas este mes"
                text="Las ventas registradas aparecerán aquí por producto."
                action={
                  <Button size="sm" onClick={() => navigate("/ventas/nueva")}>
                    Registrar la primera venta
                  </Button>
                }
              />
            }
          >
            {(report) => {
              const rows = report.rows.filter((r): r is SalesReportProductRow => "productId" in r);
              const top = [...rows].sort((a, b) => b.total - a.total).slice(0, 5);
              return (
                <>
                  <HBarChart data={top.map((r) => ({ label: r.productName, value: r.total }))} format={moneyCompact} />
                  <p className={styles.note}>
                    {rows.length > top.length ? `Los ${top.length} productos con más ventas de ${int(rows.length)}. ` : ""}
                    Contado {money(report.cashTotal)} · crédito {money(report.creditTotal)} · {int(report.units)} unidades.
                  </p>
                </>
              );
            }}
          </QueryState>
        </Card>
        <div className={styles.column}>
          <div id="pendientes">
            <AttentionCard inventory={inventory} receivables={receivables} />
          </div>
          <DecisionCard query={scenarios} />
        </div>
      </div>

      <div className={styles.gridEven}>
        <Card title="Inventario por categoría" subtitle="Valor a costo de lo que hay en bodega">
          <QueryState query={inventory} isEmpty={(r) => r.byCategory.length === 0} empty={<EmptyState title="Sin inventario registrado" />}>
            {(report) => {
              const cats = [...report.byCategory].sort((a, b) => b.costValue - a.costValue).slice(0, 6);
              return (
                <>
                  <HBarChart data={cats.map((c) => ({ label: c.categoryName, value: c.costValue }))} format={moneyCompact} />
                  <p className={styles.note}>
                    A precio de venta vale {moneyCompact(report.saleValue)} · {int(report.outOfStock)} {report.outOfStock === 1 ? "producto agotado" : "productos agotados"}.
                  </p>
                </>
              );
            }}
          </QueryState>
        </Card>
        <Card title="Cartera por cliente" subtitle="Saldos pendientes más altos">
          <QueryState query={receivables} isEmpty={(r) => r.items.length === 0} empty={<EmptyState title="Sin cartera pendiente" text="Ningún cliente debe a la tienda." />}>
            {(report) => {
              const top = [...report.items].sort((a, b) => b.balance - a.balance).slice(0, 6);
              return (
                <>
                  <HBarChart data={top.map((c) => ({ label: c.name, value: c.balance, alt: c.overdue }))} format={moneyCompact} />
                  <p className={styles.note}>
                    En naranja, saldos con más de {report.overdueDays} días · total por cobrar {moneyCompact(report.totalBalance)}.
                  </p>
                </>
              );
            }}
          </QueryState>
        </Card>
      </div>
    </>
  );
};
