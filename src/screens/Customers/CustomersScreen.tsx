import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAiStore } from "@/stores/ai";
import { useSessionStore } from "@/stores/session";
import { useCustomer, useCustomers } from "@/hooks/customers";
import { PageHeader } from "@/components/layout/AppShell";
import { Button, Chips, EmptyState, Input, Pagination, QueryState, ViewSwitch, useViewMode, type ViewMode } from "@/components/ui";
import { int } from "@/lib/format";
import type { Customer, CustomerQuery, ReceivableRow } from "@/types/api";
import { AdminCartera } from "./AdminCartera";
import { SalesCartera } from "./SalesCartera";
import { AdminReceivables } from "./AdminReceivables";
import { CustomerLedger } from "./CustomerLedger";
import { CustomerCards } from "./CustomerCards";
import { CustomerTable } from "./CustomerTable";
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

const TITLES: Record<Filter, string> = {
  all: "Clientes",
  balance: "Clientes con crédito",
  inactive: "Clientes inactivos",
};

/** Vista preferida del libro (`mi-tierrita:clientes-vista`); por defecto la lista de cartera de siempre. */
const VIEW_MODES: ViewMode[] = ["cards", "list", "table"];

/** Clientes y cartera (CU-12): libro de cartera con cupo usado y abono rápido, y tarjeta lateral con las cifras de cartera. */
export const CustomersScreen = () => {
  const user = useSessionStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search.trim());
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useViewMode("clientes", VIEW_MODES, "list");
  const [page, setPage] = useState(1);
  // `?c=<id>` abre la ficha de ese cliente (enlaces desde la columna «Origen» del reporte de cartera).
  // También lo usa la paleta (Ctrl+K): si cambia el parámetro con la pantalla abierta, se abre la nueva ficha.
  const [params, setParams] = useSearchParams();
  const customerParam = Number(params.get("c"));
  const paramId = Number.isInteger(customerParam) && customerParam > 0 ? customerParam : null;
  const [selectedId, setSelectedId] = useState<number | null>(paramId);
  useEffect(() => {
    if (paramId !== null) setSelectedId(paramId);
  }, [paramId]);
  const closeDetail = () => {
    setSelectedId(null);
    if (params.has("c")) setParams({}, { replace: true });
  };
  const [payment, setPayment] = useState<{ open: boolean; customer: Customer | null; amount?: number; aiSuggested?: boolean }>({ open: false, customer: null });
  // Borrador de abono del asistente: se toma una sola vez al entrar y abre el abono prellenado cuando llega el cliente.
  const [aiPayment] = useState(() => useAiStore.getState().peekDraft("payment"));
  useEffect(() => {
    if (aiPayment) useAiStore.getState().clearDraft();
  }, [aiPayment]);
  const aiCustomer = useCustomer(aiPayment?.customerId ?? null);
  useEffect(() => {
    if (aiPayment && aiCustomer.data) setPayment({ open: true, customer: aiCustomer.data, amount: aiPayment.amount, aiSuggested: true });
  }, [aiPayment, aiCustomer.data]);
  const [form, setForm] = useState<{ open: boolean; customer: Customer | null }>({ open: false, customer: null });

  const query: CustomerQuery = { page, limit: 20 };
  if (debouncedSearch) query.search = debouncedSearch;
  if (filter === "balance") query.withBalance = true;
  if (filter === "inactive") query.active = false;
  const customers = useCustomers(query);

  const filtered = debouncedSearch !== "" || filter !== "all";
  const openNew = () => setForm({ open: true, customer: null });
  const openPayment = (customer: Customer | null) => setPayment({ open: true, customer });
  const clearFilters = () => {
    setSearch("");
    setFilter("all");
    setPage(1);
  };

  const book = (receivables: Map<number, ReceivableRow> | undefined) => (
    <section className={styles.book} aria-labelledby="customers-book-title">
      <header className={styles.bookHead}>
        <div className={styles.bookTitle}>
          <h2 id="customers-book-title">{TITLES[filter]}</h2>
          <span className={styles.count}>{customers.data ? `${int(customers.data.count)} ${customers.data.count === 1 ? "registro" : "registros"}` : "Cargando…"}</span>
        </div>
        <div className={styles.toolbar}>
          <div className={styles.search}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="6" cy="6" r="4.3" stroke="currentColor" strokeWidth="1.3" />
              <path d="M9.3 9.3 L12.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
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
          <ViewSwitch value={view} onChange={setView} modes={VIEW_MODES} ariaLabel="Vista de clientes" />
        </div>
      </header>

      {view === "list" ? (
        <div className={styles.legend} aria-hidden="true">
          <span>Cliente</span>
          <span>Saldo frente al cupo</span>
          <span className={styles.legendRight}>Disponible</span>
          <span className={styles.legendRight}>Estado</span>
        </div>
      ) : null}

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
            {view === "cards" ? (
              <CustomerCards customers={p.items} receivables={receivables} onOpen={setSelectedId} onPay={openPayment} />
            ) : view === "table" ? (
              <CustomerTable customers={p.items} receivables={receivables} onOpen={setSelectedId} onPay={openPayment} />
            ) : (
              <CustomerLedger customers={p.items} receivables={receivables} onOpen={setSelectedId} onPay={openPayment} />
            )}
            <div className={styles.pager}>
              <Pagination page={p} onPage={setPage} />
            </div>
          </>
        )}
      </QueryState>
    </section>
  );

  return (
    <div className={styles.screen}>
      <PageHeader
        title="Clientes y cartera"
        subtitle={isAdmin ? "Cupos de crédito, saldos y estado de cobro." : "Consulte saldos y registre los abonos que reciba."}
        actions={
          isAdmin ? (
            <>
              <Button variant="secondary" onClick={() => openPayment(null)}>
                Registrar abono
              </Button>
              <Button onClick={openNew}>Nuevo cliente</Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={openNew}>
                Nuevo cliente
              </Button>
              <Button onClick={() => openPayment(null)}>Registrar abono</Button>
            </>
          )
        }
      />

      <div className={styles.layout}>
        {isAdmin ? <AdminReceivables>{(receivables) => book(receivables)}</AdminReceivables> : book(undefined)}
        {isAdmin ? <AdminCartera onOpen={setSelectedId} /> : <SalesCartera />}
      </div>

      <CustomerDetailModal customerId={form.open ? null : selectedId} onClose={closeDetail} onEdit={(c) => setForm({ open: true, customer: c })} />
      <PaymentModal
        open={payment.open}
        customer={payment.customer}
        initialAmount={payment.amount}
        aiSuggested={payment.aiSuggested}
        onClose={() => setPayment({ open: false, customer: null })}
      />
      {form.open ? <CustomerFormModal key={form.customer?.id ?? "new"} customer={form.customer} onClose={() => setForm({ open: false, customer: null })} /> : null}
    </div>
  );
};
