import { useNavigate } from "react-router-dom";
import { HeroHeader } from "@/components/layout/HeroHeader";
import {
  Button,
  Card,
  DataTable,
  EmptyState,
  QueryState,
  StatGrid,
  type Column,
} from "@/components/ui";
import { useCustomers } from "@/hooks/customers";
import { useSalesReport } from "@/hooks/reports";
import { useSales } from "@/hooks/sales";
import { VBarChart } from "@/components/charts";
import {
  addDaysIso,
  int,
  longToday,
  money,
  moneyCompact,
  todayIso,
} from "@/lib/format";
import type { Sale, SalesReportDayRow, User } from "@/types/api";
import { QueryStat } from "./QueryStat";
import { shortDay, statusTitle, timeOnly, greetingFor } from "./homeDates";
import { pendingItems } from "./attention";
import { StatusAside } from "./StatusAside";
import styles from "./HomeScreen.module.css";

const PAYMENT_LABELS = { CASH: "Contado", CREDIT: "Crédito" } as const;

const saleColumns: Column<Sale>[] = [
  {
    key: "time",
    header: "Hora",
    render: (s) => <span className={styles.time}>{timeOnly(s.createdAt)}</span>,
  },
  {
    key: "customer",
    header: "Cliente",
    align: "left",
    render: (s) => s.customerName ?? "Consumidor final",
  },
  {
    key: "payment",
    header: "Pago",
    align: "left",
    render: (s) => PAYMENT_LABELS[s.paymentType],
  },
  {
    key: "total",
    header: "Total",
    align: "right",
    render: (s) => money(s.total),
  },
];

/** Inicio de la secretaria (SecInicio del lienzo): lo vendido hoy, pendientes de cobro y sus últimas ventas. */
export const SalesHome = ({ user }: { user: User }) => {
  const navigate = useNavigate();
  const today = todayIso();
  const sales = useSalesReport({ from: today, to: today, groupBy: "product" });
  const week = useSalesReport({
    from: addDaysIso(today, -6),
    to: today,
    groupBy: "day",
  });
  const customers = useCustomers({ withBalance: true, limit: 5 });
  const recent = useSales({
    from: today,
    to: today,
    userId: user.id,
    limit: 5,
  });
  const attention = customers.isPending
    ? null
    : pendingItems(customers.data?.items ?? []);
  const subtitle = sales.data
    ? `${longToday()} · ${int(sales.data.salesCount)} ${sales.data.salesCount === 1 ? "venta registrada" : "ventas registradas"} hoy`
    : longToday();

  return (
    <>
      <HeroHeader
        eyebrow="Caja y cartera"
        title={greetingFor(user.firstName)}
        subtitle={subtitle}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate("/clientes")}>
              Registrar abono
            </Button>
            <Button onClick={() => navigate("/ventas/nueva")}>
              Nueva venta
            </Button>
          </>
        }
      />

      <StatGrid>
        <QueryStat
          query={sales}
          label="Vendido hoy"
          value={(r) => moneyCompact(r.total)}
          hint={(r) =>
            `${int(r.salesCount)} ${r.salesCount === 1 ? "ticket" : "tickets"}`
          }
        />
        <QueryStat
          query={sales}
          label="Contado hoy"
          value={(r) => moneyCompact(r.cashTotal)}
          hint={() => "recibido en caja"}
        />
        <QueryStat
          query={sales}
          label="Crédito hoy"
          value={(r) => moneyCompact(r.creditTotal)}
          hint={() => "por cobrar"}
          tone={(r) => (r.creditTotal > 0 ? "warn" : "neutral")}
        />
        <QueryStat
          query={customers}
          label="Clientes con saldo"
          value={(p) => int(p.count)}
          hint={() => "con cartera pendiente"}
          tone={(p) => (p.count > 0 ? "warn" : "neutral")}
        />
      </StatGrid>

      <div className={styles.dash}>
        <StatusAside
          title={statusTitle(
            attention === null ? null : (customers.data?.count ?? 0),
            user.firstName,
          )}
          items={attention}
          total={customers.data?.count}
          to={"/clientes"}
          watches="los clientes con saldo por cobrar y los que agotaron su cupo"
        />
        <Card title="Últimos 7 días" subtitle="Vendido por día · pesos">
          <QueryState
            query={week}
            isEmpty={(r) => r.rows.length === 0}
            empty={
              <EmptyState
                title="Sin ventas en la semana"
                text="Cada día con ventas aparecerá como una barra."
              />
            }
          >
            {(report) => (
              <VBarChart
                data={(report.rows as SalesReportDayRow[]).map((d) => ({
                  label: shortDay(d.date),
                  value: d.total,
                }))}
                format={moneyCompact}
                title="Ventas por día de la última semana"
              />
            )}
          </QueryState>
        </Card>
        <Card title="Últimas ventas" subtitle="Registradas por usted hoy">
          <QueryState
            query={recent}
            isEmpty={(p) => p.items.length === 0}
            empty={
              <EmptyState
                title="Aún no ha registrado ventas hoy"
                action={
                  <Button size="sm" onClick={() => navigate("/ventas/nueva")}>
                    Registrar una venta
                  </Button>
                }
              />
            }
          >
            {(page) => (
              <DataTable
                columns={saleColumns}
                rows={page.items}
                rowKey={(s) => s.id}
                onRowClick={() => navigate("/ventas/historial")}
              />
            )}
          </QueryState>
        </Card>
      </div>

    </>
  );
};
