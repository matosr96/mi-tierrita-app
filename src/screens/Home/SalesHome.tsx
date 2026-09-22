import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/AppShell";
import { Button, Card, DataTable, EmptyState, QueryState, StatGrid, type Column } from "@/components/ui";
import { useCustomers } from "@/hooks/customers";
import { useSalesReport } from "@/hooks/reports";
import { useSales } from "@/hooks/sales";
import { int, longToday, money, moneyCompact, todayIso } from "@/lib/format";
import type { Customer, Sale, User } from "@/types/api";
import { QueryStat } from "./QueryStat";
import { AttentionList, type AttentionItem } from "./AttentionList";
import { greetingFor, timeOnly } from "./homeDates";
import styles from "./HomeScreen.module.css";

const PAYMENT_LABELS = { CASH: "Contado", CREDIT: "Crédito" } as const;

const saleColumns: Column<Sale>[] = [
  { key: "time", header: "Hora", render: (s) => <span className={styles.time}>{timeOnly(s.createdAt)}</span> },
  { key: "customer", header: "Cliente", align: "left", render: (s) => s.customerName ?? "Consumidor final" },
  { key: "payment", header: "Pago", align: "left", render: (s) => PAYMENT_LABELS[s.paymentType] },
  { key: "total", header: "Total", align: "right", render: (s) => money(s.total) },
];

/** Pendientes de cobro: clientes con saldo; los que agotaron el cupo van primero. */
const pendingItems = (customers: Customer[]): AttentionItem[] =>
  customers.map((c) =>
    c.availableCredit <= 0
      ? { key: `credit-${c.id}`, tone: "bad", text: `${c.name} agotó su cupo de crédito (saldo ${money(c.balance)})`, to: "/clientes", tag: "Consultar" }
      : { key: `balance-${c.id}`, tone: "warn", text: `${c.name} tiene ${money(c.balance)} pendientes de pago`, to: "/clientes", tag: "Cobrar" },
  );

/** Inicio de la secretaria (SecInicio del lienzo): lo vendido hoy, pendientes de cobro y sus últimas ventas. */
export const SalesHome = ({ user }: { user: User }) => {
  const navigate = useNavigate();
  const today = todayIso();
  const sales = useSalesReport({ from: today, to: today, groupBy: "product" });
  const customers = useCustomers({ withBalance: true, limit: 5 });
  const recent = useSales({ from: today, to: today, userId: user.id, limit: 5 });
  const subtitle = sales.data ? `${longToday()} · ${int(sales.data.salesCount)} ${sales.data.salesCount === 1 ? "venta registrada" : "ventas registradas"} hoy` : longToday();

  return (
    <>
      <PageHeader
        title={greetingFor(user.firstName)}
        subtitle={subtitle}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate("/clientes")}>
              Registrar abono
            </Button>
            <Button onClick={() => navigate("/ventas/nueva")}>Nueva venta</Button>
          </>
        }
      />

      <StatGrid>
        <QueryStat query={sales} label="Vendido hoy" value={(r) => moneyCompact(r.total)} hint={(r) => `${int(r.salesCount)} ${r.salesCount === 1 ? "ticket" : "tickets"}`} />
        <QueryStat query={sales} label="Contado hoy" value={(r) => moneyCompact(r.cashTotal)} hint={() => "recibido en caja"} />
        <QueryStat query={sales} label="Crédito hoy" value={(r) => moneyCompact(r.creditTotal)} hint={() => "por cobrar"} tone={(r) => (r.creditTotal > 0 ? "warn" : "neutral")} />
        <QueryStat query={customers} label="Clientes con saldo" value={(p) => int(p.count)} hint={() => "con cartera pendiente"} tone={(p) => (p.count > 0 ? "warn" : "neutral")} />
      </StatGrid>

      <div className={styles.gridEven}>
        <Card title="Pendientes de hoy">
          <QueryState query={customers} isEmpty={(p) => p.items.length === 0} empty={<EmptyState title="Sin pendientes" text="Ningún cliente tiene saldo por cobrar." />}>
            {(page) => (
              <>
                <AttentionList items={pendingItems(page.items)} boxed />
                {page.count > page.items.length ? <p className={styles.note}>Y {int(page.count - page.items.length)} clientes más con saldo en Clientes y cartera.</p> : null}
              </>
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
            {(page) => <DataTable columns={saleColumns} rows={page.items} rowKey={(s) => s.id} onRowClick={() => navigate("/ventas/historial")} />}
          </QueryState>
        </Card>
      </div>
    </>
  );
};
