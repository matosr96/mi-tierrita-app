import { useState } from "react";
import { useSessionStore } from "@/stores/session";
import { useSales } from "@/hooks/sales";
import { useCustomers } from "@/hooks/customers";
import { Badge, Button, Card, DataTable, EmptyState, Field, Input, Pagination, QueryState, Select, type Column } from "@/components/ui";
import { addDaysIso, dateTime, money, todayIso } from "@/lib/format";
import type { Sale, SaleQuery, SaleStatus } from "@/types/api";
import { SaleDetailModal } from "./SaleDetailModal";
import { UserFilter } from "./UserFilter";
import styles from "./SalesScreen.module.css";

const PAYMENT_LABELS = { CASH: "Contado", CREDIT: "Crédito" } as const;
const STATUS_LABELS: Record<SaleStatus, string> = { COMPLETED: "Completada", VOIDED: "Anulada" };

/** CU-10 Consultar ventas: filtros por período, estado, cliente y (ADMIN) vendedor. */
export const SalesHistory = () => {
  const user = useSessionStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";

  const [from, setFrom] = useState(() => addDaysIso(todayIso(), -30));
  const [to, setTo] = useState(() => todayIso());
  const [status, setStatus] = useState<SaleStatus | "">("");
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const customers = useCustomers({ limit: 100 });

  const query: SaleQuery = { page, limit: 20, from, to };
  if (status) query.status = status;
  if (customerId !== null) query.customerId = customerId;
  if (isAdmin && userId !== null) query.userId = userId;
  const sales = useSales(query);

  /** Cualquier cambio de filtro vuelve a la primera página. */
  const change = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  const columns: Column<Sale>[] = [
    { key: "invoice", header: "Factura", render: (s) => <span className={styles.mono}>{s.invoiceNumber}</span> },
    { key: "date", header: "Fecha", render: (s) => dateTime(s.createdAt) },
    { key: "customer", header: "Cliente", render: (s) => s.customerName ?? <span className="muted">Mostrador</span> },
    { key: "user", header: "Vendedor", render: (s) => s.username },
    { key: "payment", header: "Forma de pago", render: (s) => <Badge tone={s.paymentType === "CREDIT" ? "warn" : "neutral"}>{PAYMENT_LABELS[s.paymentType]}</Badge> },
    { key: "total", header: "Total", align: "right", render: (s) => <strong>{money(s.total)}</strong> },
    { key: "status", header: "Estado", render: (s) => <Badge tone={s.status === "COMPLETED" ? "good" : "bad"}>{STATUS_LABELS[s.status]}</Badge> },
  ];

  const widen = () => {
    setFrom(addDaysIso(todayIso(), -365));
    setTo(todayIso());
    setStatus("");
    setCustomerId(null);
    setUserId(null);
    setPage(1);
  };

  return (
    <>
      <Card title="Filtros">
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

      <Card title="Ventas" subtitle={sales.data ? `${sales.data.count} ${sales.data.count === 1 ? "venta" : "ventas"} en el período` : undefined} flush>
        <QueryState
          query={sales}
          isEmpty={(p) => p.items.length === 0}
          empty={
            <EmptyState
              title="Sin ventas en el período"
              text="Amplíe el rango de fechas o quite los filtros para ver más registros."
              action={
                <Button variant="secondary" size="sm" onClick={widen}>
                  Ver el último año
                </Button>
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

      <SaleDetailModal id={selectedId} onClose={() => setSelectedId(null)} />
    </>
  );
};
