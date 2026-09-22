import { useState, type ReactNode } from "react";
import { useSessionStore } from "@/stores/session";
import { useSales } from "@/hooks/sales";
import { useCustomers } from "@/hooks/customers";
import { useSalesReport } from "@/hooks/reports";
import { PageHeader } from "@/components/layout/AppShell";
import { Badge, Button, Card, DataTable, EmptyState, Field, Input, Pagination, QueryState, Select, StatCard, StatGrid, type Column } from "@/components/ui";
import { VBarChart } from "@/components/charts";
import { addDaysIso, dateOnly, dateTime, int, money, moneyCompact, todayIso } from "@/lib/format";
import type { Sale, SaleQuery, SaleStatus, SalesReportDayRow } from "@/types/api";
import { SaleDetailModal } from "./SaleDetailModal";
import { UserFilter } from "./UserFilter";
import styles from "./SalesScreen.module.css";

const PAYMENT_LABELS = { CASH: "Contado", CREDIT: "Crédito" } as const;
const STATUS_LABELS: Record<SaleStatus, string> = { COMPLETED: "Completada", VOIDED: "Anulada" };

const hourOf = (iso: string): string => new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

/** CU-10 Consultar ventas: lienzo "Ventas" (indicadores del período, movimientos y ventas por día). */
export const SalesHistory = ({ tabs }: { tabs: ReactNode }) => {
  const user = useSessionStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";

  const [from, setFrom] = useState(() => todayIso());
  const [to, setTo] = useState(() => todayIso());
  const [status, setStatus] = useState<SaleStatus | "">("");
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const customers = useCustomers({ limit: 100 });
  const report = useSalesReport({ from, to, groupBy: "day" });

  const query: SaleQuery = { page, limit: 20, from, to };
  if (status) query.status = status;
  if (customerId !== null) query.customerId = customerId;
  if (isAdmin && userId !== null) query.userId = userId;
  const sales = useSales(query);

  const singleDay = from === to;
  const isToday = singleDay && from === todayIso();
  const periodLabel = singleDay ? `Registro del día · ${dateOnly(from)}` : `Registro del período · ${dateOnly(from)} – ${dateOnly(to)}`;
  const periodWord = singleDay ? "del día" : "del período";

  /** Cualquier cambio de filtro vuelve a la primera página. */
  const change = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };
  const setPeriod = (days: number) => {
    setFrom(addDaysIso(todayIso(), -days));
    setTo(todayIso());
    setPage(1);
  };

  const columns: Column<Sale>[] = [
    { key: "time", header: singleDay ? "Hora" : "Fecha", render: (s) => <span className={styles.mono}>{singleDay ? hourOf(s.createdAt) : dateTime(s.createdAt)}</span> },
    { key: "customer", header: "Cliente", render: (s) => s.customerName ?? "Consumidor final" },
    { key: "invoice", header: "Factura", render: (s) => <span className={styles.mono}>{s.invoiceNumber}</span> },
    { key: "user", header: "Registró", render: (s) => s.username },
    { key: "payment", header: "Pago", render: (s) => PAYMENT_LABELS[s.paymentType] },
    { key: "total", header: "Total", align: "right", render: (s) => money(s.total) },
    { key: "status", header: "Estado", align: "right", render: (s) => <Badge tone={s.status === "COMPLETED" ? "good" : "bad"}>{STATUS_LABELS[s.status]}</Badge> },
  ];

  const r = report.data;
  const pending = report.isPending ? "…" : "—";
  const unavailable = report.isError ? "No disponible" : undefined;

  return (
    <>
      <PageHeader
        title="Ventas"
        subtitle={periodLabel}
        actions={
          <>
            {tabs}
            <Button variant="secondary" onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
              Filtrar periodo
            </Button>
          </>
        }
      />

      <StatGrid>
        <StatCard label={`Ventas ${periodWord}`} value={r ? moneyCompact(r.total) : pending} hint={r ? `${int(r.salesCount)} ${r.salesCount === 1 ? "ticket" : "tickets"}` : unavailable} />
        <StatCard label="De contado" value={r ? moneyCompact(r.cashTotal) : pending} hint={r ? `del valor ${periodWord}` : unavailable} />
        <StatCard label="Unidades vendidas" tone={r && r.units > 0 ? "good" : "neutral"} value={r ? int(r.units) : pending} hint={r ? `en ${int(r.salesCount)} ${r.salesCount === 1 ? "venta" : "ventas"}` : unavailable} />
        <StatCard label="A crédito" tone={r && r.creditTotal > 0 ? "warn" : "neutral"} value={r ? moneyCompact(r.creditTotal) : pending} hint={r ? "suma a la cartera de clientes" : unavailable} />
      </StatGrid>

      {showFilters ? (
        <Card title="Filtros" subtitle="El período aplica a los indicadores y a la tabla">
          <div className={styles.filters}>
            <Field label="Desde" htmlFor="sales-from">
              <Input id="sales-from" type="date" value={from} max={to} onChange={(e) => change(setFrom)(e.target.value)} />
            </Field>
            <Field label="Hasta" htmlFor="sales-to">
              <Input id="sales-to" type="date" value={to} min={from} onChange={(e) => change(setTo)(e.target.value)} />
            </Field>
            <Field label="Estado" htmlFor="sales-status">
              <Select id="sales-status" value={status} onChange={(e) => change(setStatus)(e.target.value as SaleStatus | "")}>
                <option value="">Todas</option>
                <option value="COMPLETED">{STATUS_LABELS.COMPLETED}</option>
                <option value="VOIDED">{STATUS_LABELS.VOIDED}</option>
              </Select>
            </Field>
            <Field label="Cliente" htmlFor="sales-customer" hint={customers.isError ? "No se pudo cargar la lista de clientes." : undefined}>
              <Select id="sales-customer" value={customerId ?? ""} disabled={!customers.data} onChange={(e) => change(setCustomerId)(e.target.value === "" ? null : Number(e.target.value))}>
                <option value="">{customers.isPending ? "Cargando…" : "Todos"}</option>
                {customers.data?.items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            {isAdmin ? <UserFilter value={userId} onChange={change(setUserId)} /> : null}
          </div>
        </Card>
      ) : null}

      <div className={styles.layout}>
        <Card title={singleDay ? (isToday ? "Movimientos de hoy" : "Movimientos del día") : "Movimientos del período"} subtitle="Cada venta queda asociada al usuario que la registró">
          <QueryState
            query={sales}
            isEmpty={(p) => p.items.length === 0}
            empty={
              <EmptyState
                title={singleDay ? "Sin ventas en el día" : "Sin ventas en el período"}
                text="Amplíe el rango de fechas o quite los filtros para ver más registros."
                action={
                  <div className={styles.emptyActions}>
                    <Button variant="secondary" size="sm" onClick={() => setPeriod(30)}>
                      Ver los últimos 30 días
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setPeriod(365)}>
                      Ver el último año
                    </Button>
                  </div>
                }
              />
            }
          >
            {(p) => (
              <>
                <DataTable columns={columns} rows={p.items} rowKey={(s) => s.id} onRowClick={(s) => setSelectedId(s.id)} />
                <Pagination page={p} onPage={setPage} />
              </>
            )}
          </QueryState>
        </Card>

        <Card title="Ventas por día" subtitle="Pesos vendidos, sin ventas anuladas" className={styles.chartCard}>
          <QueryState query={report} isEmpty={(rep) => rep.rows.length === 0} empty={<EmptyState title="Sin ventas en el período" text="Cuando haya ventas registradas verá aquí el valor vendido por día." />}>
            {(rep) => (
              <>
                <VBarChart data={(rep.rows as SalesReportDayRow[]).map((row) => ({ label: dateOnly(row.date), value: row.total }))} format={moneyCompact} />
                <div className={styles.cardNote}>
                  {int(rep.salesCount)} {rep.salesCount === 1 ? "venta" : "ventas"} · {int(rep.units)} unidades · {money(rep.total)} en total.
                </div>
              </>
            )}
          </QueryState>
        </Card>
      </div>

      <SaleDetailModal id={selectedId} onClose={() => setSelectedId(null)} />
    </>
  );
};
