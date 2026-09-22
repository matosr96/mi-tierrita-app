import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/AppShell";
import { Button, Card, EmptyState, QueryState, StatGrid } from "@/components/ui";
import { HBarChart } from "@/components/charts";
import { useInventoryReport, useReceivablesReport, useSalesReport } from "@/hooks/reports";
import { useScenarios } from "@/hooks/financial";
import { dateOnly, int, money, moneyCompact, todayIso } from "@/lib/format";
import type { SalesReportProductRow, User } from "@/types/api";
import { QueryStat } from "./QueryStat";
import { AttentionCard } from "./AttentionCard";
import { DecisionCard } from "./DecisionCard";
import { greetingFor, monthCloseLine, monthName } from "./homeDates";
import styles from "./HomeScreen.module.css";

/** Inicio del administrador (Dashboard del lienzo): ventas del mes, cartera, valor por vencer, pendientes y decisión abierta. */
export const AdminHome = ({ user }: { user: User }) => {
  const navigate = useNavigate();
  const today = todayIso();
  const monthStart = `${today.slice(0, 7)}-01`;
  const sales = useSalesReport({ from: monthStart, to: today, groupBy: "product" });
  const receivables = useReceivablesReport();
  const inventory = useInventoryReport();
  const scenarios = useScenarios({ limit: 1 });

  return (
    <>
      <PageHeader
        title={greetingFor(user.firstName)}
        subtitle={monthCloseLine()}
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
        <QueryStat query={sales} label="Ventas del mes" value={(r) => moneyCompact(r.total)} hint={(r) => `${int(r.salesCount)} ${r.salesCount === 1 ? "venta" : "ventas"} desde el ${dateOnly(r.from)}`} />
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
          <AttentionCard inventory={inventory} receivables={receivables} />
          <DecisionCard query={scenarios} />
        </div>
      </div>
    </>
  );
};
