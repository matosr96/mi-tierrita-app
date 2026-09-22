import { useState } from "react";
import { useSessionStore } from "@/stores/session";
import { useCustomers } from "@/hooks/customers";
import { PageHeader } from "@/components/layout/AppShell";
import { Badge, Button, Card, Chips, DataTable, EmptyState, Input, Pagination, QueryState, type Column } from "@/components/ui";
import { int, money } from "@/lib/format";
import type { Customer, CustomerQuery } from "@/types/api";
import { AdminStats } from "./AdminStats";
import { SalesStats } from "./SalesStats";
import { AdminReceivables } from "./AdminReceivables";
import { CustomerDetailModal } from "./CustomerDetailModal";
import { CustomerFormModal } from "./CustomerFormModal";
import { PaymentModal } from "./PaymentModal";
import { useDebounced } from "./useDebounced";
import styles from "./CustomersScreen.module.css";

type Filter = "all" | "balance" | "inactive";
const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "balance", label: "Con saldo" },
  { value: "inactive", label: "Inactivos" },
];

/** Etiqueta de estado del lienzo: Vencida (reporte, solo ADMIN), Excedió cupo, Con saldo o Al día. */
const statusTag = (c: Customer, overdueIds: Set<number> | undefined) => {
  if (!c.active) return <Badge tone="neutral">Inactivo</Badge>;
  if (overdueIds?.has(c.id)) return <Badge tone="bad">Vencida</Badge>;
  if (c.availableCredit < 0) return <Badge tone="bad">Excedió cupo</Badge>;
  if (c.balance > 0) return <Badge tone="warn">Con saldo</Badge>;
  return <Badge tone="good">Al día</Badge>;
};

/** Clientes y cartera (CU-12): cupos, saldos, abonos y edición; lienzos "Clientes" (ADMIN) y "SecClientes" (SALES). */
export const CustomersScreen = () => {
  const user = useSessionStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search.trim());
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [form, setForm] = useState<{ open: boolean; customer: Customer | null }>({ open: false, customer: null });

  const query: CustomerQuery = { page, limit: 20 };
  if (debouncedSearch) query.search = debouncedSearch;
  if (filter === "balance") query.withBalance = true;
  if (filter === "inactive") query.active = false;
  const customers = useCustomers(query);

  const filtered = debouncedSearch !== "" || filter !== "all";
  const openNew = () => setForm({ open: true, customer: null });
  const clearFilters = () => {
    setSearch("");
    setFilter("all");
    setPage(1);
  };

  const columns = (overdueIds: Set<number> | undefined): Column<Customer>[] => [
    { key: "name", header: "Cliente", render: (c) => <span className={styles.strong}>{c.name}</span> },
    { key: "document", header: "Documento", render: (c) => <span className={styles.mono}>{c.documentId}</span> },
    { key: "limit", header: "Cupo autorizado", align: "right", render: (c) => money(c.creditLimit) },
    { key: "balance", header: "Saldo", align: "right", render: (c) => money(c.balance) },
    { key: "available", header: "Disponible", align: "right", render: (c) => <span className={c.availableCredit < 0 ? styles.negative : ""}>{money(c.availableCredit)}</span> },
    { key: "status", header: "Estado", align: "right", render: (c) => statusTag(c, overdueIds) },
  ];

  const table = (overdueIds: Set<number> | undefined) => (
    <Card
      title={filter === "balance" ? "Clientes con crédito" : filter === "inactive" ? "Clientes inactivos" : "Clientes"}
      subtitle={customers.data ? `${int(customers.data.count)} ${customers.data.count === 1 ? "registro" : "registros"}` : undefined}
      actions={
        <div className={styles.toolbar}>
          <div className={styles.search}>
            <Input
              type="search"
              placeholder="Buscar por nombre o documento"
              aria-label="Buscar cliente"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Chips
            options={FILTERS}
            value={filter}
            onChange={(v) => {
              setFilter(v);
              setPage(1);
            }}
          />
        </div>
      }
    >
      <QueryState
        query={customers}
        isEmpty={(p) => p.items.length === 0}
        empty={
          filtered ? (
            <EmptyState
              title="Sin clientes que coincidan"
              text="Pruebe con otro nombre o documento, o quite los filtros."
              action={
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="Aún no hay clientes"
              text="Registre el primero para venderle a crédito y llevar su cartera."
              action={
                <Button size="sm" onClick={openNew}>
                  Nuevo cliente
                </Button>
              }
            />
          )
        }
      >
        {(p) => (
          <>
            <DataTable columns={columns(overdueIds)} rows={p.items} rowKey={(c) => c.id} onRowClick={(c) => setSelectedId(c.id)} />
            <Pagination page={p} onPage={setPage} />
            {isAdmin ? (
              <div className={styles.cardNote}>Vender no es cobrar. Si la empresa asume la cuota del crédito bancario, la liquidez para pagarla depende de que esta cartera se mantenga sana.</div>
            ) : null}
          </>
        )}
      </QueryState>
    </Card>
  );

  return (
    <div className={styles.screen}>
      <PageHeader
        title="Clientes y cartera"
        subtitle={isAdmin ? "Cupos de crédito, saldos y estado de cobro." : "Consulte saldos y registre los abonos que reciba."}
        actions={
          isAdmin ? (
            <>
              <Button variant="secondary" onClick={() => setPaymentOpen(true)}>
                Registrar abono
              </Button>
              <Button onClick={openNew}>Nuevo cliente</Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={openNew}>
                Nuevo cliente
              </Button>
              <Button onClick={() => setPaymentOpen(true)}>Registrar abono</Button>
            </>
          )
        }
      />

      {isAdmin ? null : <div className={styles.banner}>Puede registrar abonos y consultar el estado de cada cliente. Cambiar un cupo de crédito lo autoriza el administrador.</div>}

      {isAdmin ? <AdminStats /> : <SalesStats />}

      {isAdmin ? <AdminReceivables>{(overdueIds) => table(overdueIds)}</AdminReceivables> : table(undefined)}

      <CustomerDetailModal customerId={form.open ? null : selectedId} onClose={() => setSelectedId(null)} onEdit={(c) => setForm({ open: true, customer: c })} />
      <PaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} />
      {form.open ? <CustomerFormModal key={form.customer?.id ?? "new"} customer={form.customer} onClose={() => setForm({ open: false, customer: null })} /> : null}
    </div>
  );
};
