import { useState } from "react";
import { Link } from "react-router-dom";
import { useSuppliers } from "@/hooks/suppliers";
import { useExpiringBatches } from "@/hooks/batches";
import { useSessionStore } from "@/stores/session";
import { dateOnly, int } from "@/lib/format";
import { PageHeader } from "@/components/layout/AppShell";
import { Badge, Button, Card, Chips, DataTable, EmptyState, Input, Pagination, QueryState, StatCard, StatGrid, type Column } from "@/components/ui";
import type { Page, ProductBatch, Supplier } from "@/types/api";
import { SupplierFormModal } from "./SupplierFormModal";
import { PurchaseModal } from "./PurchaseModal";
import styles from "./SuppliersScreen.module.css";

type ActiveFilter = "active" | "inactive" | "all";

const ACTIVE_OPTIONS: { value: ActiveFilter; label: string }[] = [
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Inactivos" },
  { value: "all", label: "Todos" },
];

/** Ventana de vencimiento de los lotes recibidos que se muestran junto al directorio. */
const EXPIRING_DAYS = 30;

const matches = (supplier: Supplier, term: string): boolean => {
  const t = term.trim().toLowerCase();
  if (!t) return true;
  return [supplier.name, supplier.taxId ?? "", supplier.phone ?? ""].some((v) => v.toLowerCase().includes(t));
};

type CountQuery = { data: Page<unknown> | undefined; isPending: boolean; isError: boolean };

/** Tarjeta de indicador ligada al `count` de un listado: carga y falla por su cuenta. */
const CountStat = ({ query, label, hint, tone }: { query: CountQuery; label: string; hint?: string; tone?: (count: number) => "neutral" | "good" | "warn" | "bad" }) => {
  if (query.isPending) return <StatCard label={label} value="…" hint="Cargando" />;
  if (query.isError || query.data === undefined) return <StatCard label={label} value="—" hint="No disponible" />;
  return <StatCard label={label} value={int(query.data.count)} hint={hint} tone={tone?.(query.data.count) ?? "neutral"} />;
};

const expiryTone = (batch: ProductBatch): "bad" | "warn" | "neutral" => (batch.expired ? "bad" : batch.daysToExpire <= 7 ? "warn" : "neutral");
const expiryLabel = (batch: ProductBatch): string => (batch.expired ? "Vencido" : batch.daysToExpire === 0 ? "Hoy" : `${int(batch.daysToExpire)} días`);

const batchColumns: Column<ProductBatch>[] = [
  { key: "product", header: "Producto", render: (b) => <span className={styles.name}>{b.productName}</span> },
  { key: "supplier", header: "Proveedor", align: "left", render: (b) => <span className={styles.secondary}>{b.supplierName ?? "Sin proveedor"}</span> },
  { key: "units", header: "Unidades", render: (b) => int(b.quantityRemaining) },
  { key: "expires", header: "Vence", render: (b) => <Badge tone={expiryTone(b)}>{expiryLabel(b)}</Badge> },
];

/**
 * CU-12 Proveedores y CU-13 Registrar compra.
 * Decisión del lienzo (BodProveedores): Bodega ve el módulo en consulta, recibe mercancía pero no crea ni
 * edita proveedores; por eso «Nuevo proveedor» y «Editar» solo aparecen para el Administrador aunque la
 * API permita ambas operaciones a los dos roles. «Registrar compra» sí se mantiene para Bodega.
 */
export const SuppliersScreen = () => {
  const role = useSessionStore((s) => s.user?.role);
  const isAdmin = role === "ADMIN";
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<ActiveFilter>("active");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<{ open: boolean; supplier: Supplier | null }>({ open: false, supplier: null });
  const [purchase, setPurchase] = useState<{ open: boolean; supplier: Supplier | null }>({ open: false, supplier: null });

  const query = useSuppliers({ page, limit: 20, active: filter === "all" ? undefined : filter === "active" });
  const actives = useSuppliers({ limit: 1, active: true });
  const inactives = useSuppliers({ limit: 1, active: false });
  const all = useSuppliers({ limit: 1 });
  const expiring = useExpiringBatches({ days: EXPIRING_DAYS, limit: 6 });

  const openCreate = () => setForm({ open: true, supplier: null });
  const openPurchase = (supplier: Supplier | null) => setPurchase({ open: true, supplier });

  const columns: Column<Supplier>[] = [
    { key: "name", header: "Proveedor", render: (s) => <span className={styles.name}>{s.name}</span> },
    { key: "taxId", header: "NIT", align: "left", render: (s) => (s.taxId ? <span className={styles.mono}>{s.taxId}</span> : "—") },
    { key: "phone", header: "Teléfono", align: "left", render: (s) => <span className={styles.secondary}>{s.phone ?? "—"}</span> },
    { key: "createdAt", header: "Desde", align: "left", render: (s) => <span className={styles.secondary}>{dateOnly(s.createdAt)}</span> },
    { key: "active", header: "Estado", align: "left", render: (s) => <Badge tone={s.active ? "good" : "neutral"}>{s.active ? "Activo" : "Inactivo"}</Badge> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (s) => (
        <div className={styles.actions}>
          {s.active ? (
            <Button variant="secondary" size="sm" onClick={() => openPurchase(s)}>
              Registrar compra
            </Button>
          ) : null}
          {isAdmin ? (
            <Button variant="ghost" size="sm" onClick={() => setForm({ open: true, supplier: s })}>
              Editar
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const emptyText = isAdmin
    ? filter === "active"
      ? "Registre el primero para poder asociar compras y lotes."
      : filter === "inactive"
        ? "Ningún proveedor está inactivo."
        : "Aún no se ha registrado ningún proveedor."
    : "El administrador aún no ha registrado proveedores.";

  const directory = (
    <Card title="Directorio" subtitle={query.data ? `${int(query.data.count)} proveedores` : undefined}>
      <div className={styles.toolbar}>
        <Input className={styles.search} placeholder="Buscar por nombre, NIT o teléfono" aria-label="Buscar proveedor" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Chips
          options={ACTIVE_OPTIONS}
          value={filter}
          onChange={(v) => {
            setFilter(v);
            setPage(1);
          }}
        />
      </div>
      <QueryState
        query={query}
        isEmpty={(data) => data.items.length === 0}
        empty={<EmptyState title="No hay proveedores" text={emptyText} action={isAdmin && filter === "active" ? <Button onClick={openCreate}>Nuevo proveedor</Button> : undefined} />}
      >
        {(data) => {
          const rows = data.items.filter((s) => matches(s, search));
          return (
            <>
              {rows.length === 0 ? (
                <EmptyState title="Sin coincidencias" text={`Ningún proveedor de esta página coincide con «${search.trim()}».`} />
              ) : (
                <DataTable columns={columns} rows={rows} rowKey={(s) => s.id} />
              )}
              <div className={styles.pager}>
                <Pagination page={data} onPage={setPage} />
              </div>
            </>
          );
        }}
      </QueryState>
    </Card>
  );

  return (
    <div className={styles.page}>
      <PageHeader
        title="Proveedores"
        subtitle={isAdmin ? "Directorio y compras: cada compra registrada crea un lote y sube el stock." : "Qué llega, cuándo y de quién."}
        actions={
          isAdmin ? (
            <>
              <Button variant="secondary" onClick={openCreate}>
                Nuevo proveedor
              </Button>
              <Button onClick={() => openPurchase(null)}>Registrar compra</Button>
            </>
          ) : undefined
        }
      />

      {!isAdmin ? <div className={styles.info}>Consulta de proveedores y registro de recepciones. Los proveedores los crea el administrador.</div> : null}

      <StatGrid>
        <CountStat query={actives} label="Proveedores activos" hint="disponibles para registrar compras" />
        <CountStat query={inactives} label="Proveedores inactivos" hint="sin compras nuevas" tone={(n) => (n > 0 ? "warn" : "neutral")} />
        <CountStat query={all} label="Registrados" hint="en el directorio" />
        <CountStat query={expiring} label="Lotes por vencer" hint={`recibidos, próximos ${int(EXPIRING_DAYS)} días`} tone={(n) => (n > 0 ? "warn" : "neutral")} />
      </StatGrid>

      {isAdmin ? (
        <div className={styles.grid}>
          {directory}
          <Card
            title="Lotes por vencer"
            subtitle={`Recibidos de proveedores · próximos ${int(EXPIRING_DAYS)} días`}
            actions={
              <Link to="/lotes" className={styles.cardLink}>
                Ver lotes
              </Link>
            }
          >
            <QueryState query={expiring} isEmpty={(data) => data.items.length === 0} empty={<EmptyState title="Nada por vencer" text={`Ningún lote vence en los próximos ${int(EXPIRING_DAYS)} días.`} />}>
              {(data) => <DataTable columns={batchColumns} rows={data.items} rowKey={(b) => b.id} />}
            </QueryState>
          </Card>
        </div>
      ) : (
        directory
      )}

      {form.open ? <SupplierFormModal supplier={form.supplier} onClose={() => setForm({ open: false, supplier: null })} /> : null}
      {purchase.open ? <PurchaseModal supplier={purchase.supplier} onClose={() => setPurchase({ open: false, supplier: null })} /> : null}
    </div>
  );
};
