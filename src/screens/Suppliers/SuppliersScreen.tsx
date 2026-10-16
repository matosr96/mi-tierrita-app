import { useState } from "react";
import { useSuppliers } from "@/hooks/suppliers";
import { useExpiringBatches } from "@/hooks/batches";
import { useSessionStore } from "@/stores/session";
import { int } from "@/lib/format";
import { PageHeader } from "@/components/layout/AppShell";
import { Button, Chips, EmptyState, Input, Pagination, QueryState } from "@/components/ui";
import type { Supplier } from "@/types/api";
import { SupplierFormModal } from "./SupplierFormModal";
import { PurchaseModal } from "./PurchaseModal";
import { SupplierCounts } from "./SupplierCounts";
import { SupplierCards } from "./SupplierCards";
import { ExpiringPanel } from "./ExpiringPanel";
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

  const emptyText = isAdmin
    ? filter === "active"
      ? "Registre el primero para poder asociar compras y lotes."
      : filter === "inactive"
        ? "Ningún proveedor está inactivo."
        : "Aún no se ha registrado ningún proveedor."
    : "El administrador aún no ha registrado proveedores.";

  const directory = (
    <section className={styles.directory} aria-labelledby="suppliers-directory-title">
      <header className={styles.head}>
        <div className={styles.headTitle}>
          <h2 id="suppliers-directory-title">Directorio</h2>
          <span className={styles.headCount}>{query.data ? `${int(query.data.count)} ${query.data.count === 1 ? "proveedor" : "proveedores"}` : "…"}</span>
        </div>
        <div className={styles.toolbar}>
          <div className={styles.search}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="6" cy="6" r="4.3" stroke="currentColor" strokeWidth="1.3" />
              <path d="M9.3 9.3 L12.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <Input placeholder="Buscar por nombre, NIT o teléfono" aria-label="Buscar proveedor" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Chips
            options={ACTIVE_OPTIONS}
            value={filter}
            onChange={(v) => {
              setFilter(v);
              setPage(1);
            }}
          />
        </div>
      </header>

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
                <SupplierCards suppliers={rows} canEdit={isAdmin} onPurchase={openPurchase} onEdit={(s) => setForm({ open: true, supplier: s })} />
              )}
              <Pagination page={data} onPage={setPage} />
            </>
          );
        }}
      </QueryState>
    </section>
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

      <SupplierCounts
        items={[
          { query: actives, label: "Activos", hint: "disponibles para registrar compras" },
          { query: inactives, label: "Inactivos", hint: "sin compras nuevas", warnWhenPositive: true },
          { query: all, label: "Registrados", hint: "en el directorio" },
          { query: expiring, label: "Lotes por vencer", hint: `recibidos, próximos ${int(EXPIRING_DAYS)} días`, warnWhenPositive: true },
        ]}
      />

      {isAdmin ? (
        <div className={styles.grid}>
          {directory}
          <ExpiringPanel days={EXPIRING_DAYS} query={expiring} />
        </div>
      ) : (
        directory
      )}

      {form.open ? <SupplierFormModal supplier={form.supplier} onClose={() => setForm({ open: false, supplier: null })} /> : null}
      {purchase.open ? <PurchaseModal supplier={purchase.supplier} onClose={() => setPurchase({ open: false, supplier: null })} /> : null}
    </div>
  );
};
