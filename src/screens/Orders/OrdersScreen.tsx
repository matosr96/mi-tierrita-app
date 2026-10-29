import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useOrders } from "@/hooks/orders";
import { useSessionStore } from "@/stores/session";
import { addDaysIso, int, todayIso } from "@/lib/format";
import { PageHeader } from "@/components/layout/AppShell";
import { Button, Chips, EmptyState, Input, Pagination, QueryState, Tabs, ViewSwitch, useViewMode, type ViewMode } from "@/components/ui";
import type { Order, OrderDetail, OrderKind } from "@/types/api";
import { OrderCounts } from "./OrderCounts";
import { OrderList } from "./OrderList";
import { OrderTable } from "./OrderTable";
import { OrderFormModal } from "./OrderFormModal";
import { OrderDetailModal } from "./OrderDetailModal";
import { ReceiveOrderModal } from "./ReceiveOrderModal";
import { DUE_SOON_DAYS, KIND_PARAM, KIND_TAB_LABEL, kindsFor, statusFilters, statusParam, type StatusFilter } from "./orderLabels";
import styles from "./OrdersScreen.module.css";

/** Vista preferida (`mi-tierrita:pedidos-vista`): lista por defecto; la tabla se apila en móvil. */
const VIEW_MODES: ViewMode[] = ["list", "table"];

const kindFromParam = (raw: string | null, allowed: OrderKind[]): OrderKind | undefined =>
  allowed.find((k) => KIND_PARAM[k] === raw);

const idParam = (raw: string | null): number | null => {
  const n = Number(raw);
  return raw !== null && Number.isInteger(n) && n > 0 ? n : null;
};

/**
 * Pedidos (`/pedidos`): pestañas «A proveedores» (ADMIN y bodega) y «De clientes» (ADMIN y secretaria), solo las que
 * el rol maneja. Filtros por estado y búsqueda; los vencidos se resaltan en rojo y los de los próximos dos días en
 * ámbar, según `overdue`/`daysToDue` de la API. `?tipo=proveedor|cliente`, `?pedido=<id>` abre el detalle y
 * `&venta=<id>` (al volver del punto de venta) abre «Marcar entregado» con esa venta elegida.
 */
export const OrdersScreen = () => {
  const role = useSessionStore((s) => s.user?.role);
  const kinds = kindsFor(role);
  const [params, setParams] = useSearchParams();
  const [kind, setKind] = useState<OrderKind>(() => kindFromParam(params.get("tipo"), kinds) ?? kinds[0] ?? "SUPPLIER");
  const [filter, setFilter] = useState<StatusFilter>("open");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [view, setView] = useViewMode("pedidos", VIEW_MODES, "list");
  const [detail, setDetail] = useState<{ id: number; saleId: number | null } | null>(() => {
    const id = idParam(params.get("pedido"));
    return id === null ? null : { id, saleId: idParam(params.get("venta")) };
  });
  const [form, setForm] = useState<{ open: boolean; order: OrderDetail | null }>({ open: false, order: null });
  const [receiving, setReceiving] = useState<OrderDetail | null>(null);

  // Los parámetros del enlace se toman una vez al entrar; luego la dirección queda limpia (con la pestaña).
  useEffect(() => {
    if (params.has("pedido") || params.has("venta")) setParams({ tipo: KIND_PARAM[kind] }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Búsqueda con espera de 300 ms.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(t);
  }, [search]);

  const enabled = kinds.includes(kind);
  const today = todayIso();
  const list = useOrders({ kind, status: statusParam(kind, filter), q: q || undefined, page, limit: 20 }, { enabled });
  const open = useOrders({ kind, status: "PENDING,PARTIAL", limit: 1 }, { enabled });
  const overdue = useOrders({ kind, status: "PENDING,PARTIAL", to: addDaysIso(today, -1), limit: 1 }, { enabled });
  const soon = useOrders({ kind, status: "PENDING,PARTIAL", from: today, to: addDaysIso(today, DUE_SOON_DAYS), limit: 1 }, { enabled });

  const changeKind = (next: OrderKind) => {
    setKind(next);
    setPage(1);
    setParams({ tipo: KIND_PARAM[next] }, { replace: true });
  };

  const isSupplier = kind === "SUPPLIER";
  const newLabel = isSupplier ? "Nuevo pedido a proveedor" : "Nuevo pedido de cliente";
  const openCreate = () => setForm({ open: true, order: null });

  if (kinds.length === 0) return null;

  const emptyText =
    filter === "open"
      ? isSupplier
        ? "No hay mercancía pendiente por llegar. Registre lo que le pidió a un proveedor para hacerle seguimiento."
        : "No hay encargos pendientes. Registre lo que un cliente le encargó para no olvidar la entrega."
      : "No hay pedidos con este estado.";

  return (
    <div className={styles.page}>
      <PageHeader
        title="Pedidos"
        subtitle={
          kinds.length > 1
            ? "Lo que se espera de los proveedores y lo que se les debe a los clientes, con su fecha."
            : isSupplier
              ? "Lo que se espera de los proveedores: al llegar se recibe y crea el lote."
              : "Encargos de los clientes con su fecha de entrega."
        }
        actions={<Button onClick={openCreate}>{newLabel}</Button>}
      />

      {kinds.length > 1 ? <Tabs options={kinds.map((k) => ({ value: k, label: KIND_TAB_LABEL[k] }))} value={kind} onChange={changeKind} ariaLabel="Tipo de pedido" /> : null}

      <OrderCounts
        items={[
          { query: open, label: "Abiertos", hint: isSupplier ? "pendientes o recibidos en parte" : "pendientes de entregar" },
          { query: overdue, label: "Vencidos", hint: "con la fecha ya pasada", tone: "bad" },
          { query: soon, label: "Próximos", hint: `de hoy a ${int(DUE_SOON_DAYS)} días`, tone: "warn" },
        ]}
      />

      <section className={styles.directory} aria-labelledby="orders-title">
        <header className={styles.head}>
          <div className={styles.headTitle}>
            <h2 id="orders-title">{KIND_TAB_LABEL[kind]}</h2>
            <span className={styles.headCount}>{list.data ? `${int(list.data.count)} ${list.data.count === 1 ? "pedido" : "pedidos"}` : "…"}</span>
          </div>
          <div className={styles.toolbar}>
            <div className={styles.search}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <circle cx="6" cy="6" r="4.3" stroke="currentColor" strokeWidth="1.3" />
                <path d="M9.3 9.3 L12.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <Input placeholder={isSupplier ? "Buscar proveedor, nota o número" : "Buscar cliente, nota o número"} aria-label="Buscar pedido" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Chips
              options={statusFilters(kind)}
              value={filter}
              onChange={(v) => {
                setFilter(v);
                setPage(1);
              }}
            />
            <ViewSwitch value={view} onChange={setView} modes={VIEW_MODES} ariaLabel="Vista de pedidos" />
          </div>
        </header>

        <QueryState
          query={list}
          isEmpty={(data) => data.items.length === 0}
          empty={
            q ? (
              <EmptyState title="Sin coincidencias" text={`Ningún pedido coincide con «${q}».`} />
            ) : (
              <EmptyState title="No hay pedidos" text={emptyText} action={filter === "open" ? <Button onClick={openCreate}>{newLabel}</Button> : undefined} />
            )
          }
        >
          {(data) => (
            <>
              {view === "table" ? (
                <OrderTable kind={kind} orders={data.items} onOpen={(o: Order) => setDetail({ id: o.id, saleId: null })} />
              ) : (
                <OrderList orders={data.items} onOpen={(o: Order) => setDetail({ id: o.id, saleId: null })} />
              )}
              <Pagination page={data} onPage={setPage} />
            </>
          )}
        </QueryState>
      </section>

      {detail && !form.open && !receiving ? (
        <OrderDetailModal
          orderId={detail.id}
          initialSaleId={detail.saleId}
          onClose={() => setDetail(null)}
          onEdit={(o) => setForm({ open: true, order: o })}
          onReceive={(o) => setReceiving(o)}
        />
      ) : null}
      {form.open ? (
        <OrderFormModal
          kind={form.order?.kind ?? kind}
          order={form.order}
          onClose={() => setForm({ open: false, order: null })}
          onSaved={(saved) => {
            setForm({ open: false, order: null });
            setDetail({ id: saved.id, saleId: null });
          }}
        />
      ) : null}
      {receiving ? <ReceiveOrderModal order={receiving} onClose={() => setReceiving(null)} /> : null}
    </div>
  );
};
