import { useState } from "react";
import { useSessionStore } from "@/stores/session";
import { useCustomers } from "@/hooks/customers";
import { PageHeader } from "@/components/layout/AppShell";
import { Badge, Button, Card, Chips, DataTable, EmptyState, Input, Pagination, QueryState, type Column } from "@/components/ui";
import { money } from "@/lib/format";
import type { Customer, CustomerQuery } from "@/types/api";
import { AdminStats } from "./AdminStats";
import { SalesStats } from "./SalesStats";
import { CustomerDetailModal } from "./CustomerDetailModal";
import { CustomerFormModal } from "./CustomerFormModal";
import { useDebounced } from "./useDebounced";
import styles from "./CustomersScreen.module.css";

type Filter = "all" | "balance" | "inactive";
const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "balance", label: "Con saldo" },
  { value: "inactive", label: "Inactivos" },
];

const balanceTone = (c: Customer): "neutral" | "warn" | "bad" => (c.balance > 0 && c.balance > 0.8 * c.creditLimit ? "bad" : c.balance > 0 ? "warn" : "neutral");

/** Clientes y cartera (CU-12): listado con cupos y saldos, abonos y edición. */
export const CustomersScreen = () => {
  const user = useSessionStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search.trim());
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<{ open: boolean; customer: Customer | null }>({ open: false, customer: null });

  const query: CustomerQuery = { page, limit: 20 };
  if (debouncedSearch) query.search = debouncedSearch;
  if (filter === "balance") query.withBalance = true;
  if (filter === "inactive") query.active = false;
  const customers = useCustomers(query);

  const selected = customers.data?.items.find((c) => c.id === selectedId) ?? null;
  const filtered = debouncedSearch !== "" || filter !== "all";

  const columns: Column<Customer>[] = [
    { key: "name", header: "Cliente", render: (c) => <strong>{c.name}</strong> },
    { key: "document", header: "Documento", render: (c) => <span className={styles.mono}>{c.documentId}</span> },
    { key: "phone", header: "Teléfono", render: (c) => c.phone ?? <span className="muted">—</span> },
    { key: "limit", header: "Cupo autorizado", align: "right", render: (c) => money(c.creditLimit) },
    { key: "balance", header: "Saldo", align: "right", render: (c) => <Badge tone={balanceTone(c)}>{money(c.balance)}</Badge> },
    { key: "available", header: "Disponible", align: "right", render: (c) => money(c.availableCredit) },
    { key: "status", header: "Estado", render: (c) => <Badge tone={c.active ? "good" : "neutral"}>{c.active ? "Activo" : "Inactivo"}</Badge> },
  ];

  const openNew = () => setForm({ open: true, customer: null });

  return (
    <div className={styles.screen}>
      <PageHeader
        title="Clientes y cartera"
        subtitle={isAdmin ? "Cupos de crédito, saldos y estado de cobro." : "Consulte saldos y registre los abonos que reciba."}
        actions={<Button onClick={openNew}>Nuevo cliente</Button>}
      />

      {isAdmin ? <AdminStats /> : <SalesStats />}

      <Card flush>
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
        <QueryState
          query={customers}
          isEmpty={(p) => p.items.length === 0}
          empty={
            filtered ? (
              <EmptyState
                title="Sin clientes que coincidan"
                text="Pruebe con otro nombre o documento, o quite los filtros."
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      setFilter("all");
                      setPage(1);
                    }}
                  >
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
              <DataTable columns={columns} rows={p.items} rowKey={(c) => c.id} onRowClick={(c) => setSelectedId(c.id)} />
              <Pagination page={p} onPage={setPage} />
            </>
          )}
        </QueryState>
      </Card>

      <CustomerDetailModal customer={form.open ? null : selected} onClose={() => setSelectedId(null)} onEdit={(c) => setForm({ open: true, customer: c })} />
      {form.open ? <CustomerFormModal key={form.customer?.id ?? "new"} customer={form.customer} onClose={() => setForm({ open: false, customer: null })} /> : null}
    </div>
  );
};
