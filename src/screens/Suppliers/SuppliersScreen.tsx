import { useState } from "react";
import { useSuppliers } from "@/hooks/suppliers";
import { PageHeader } from "@/components/layout/AppShell";
import { Badge, Button, Card, Chips, DataTable, EmptyState, Input, Pagination, QueryState, type Column } from "@/components/ui";
import type { Supplier } from "@/types/api";
import { SupplierFormModal } from "./SupplierFormModal";
import { PurchaseModal } from "./PurchaseModal";
import styles from "./SuppliersScreen.module.css";

type ActiveFilter = "active" | "inactive" | "all";

const ACTIVE_OPTIONS: { value: ActiveFilter; label: string }[] = [
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Inactivos" },
  { value: "all", label: "Todos" },
];

const matches = (supplier: Supplier, term: string): boolean => {
  const t = term.trim().toLowerCase();
  if (!t) return true;
  return [supplier.name, supplier.taxId ?? "", supplier.phone ?? ""].some((v) => v.toLowerCase().includes(t));
};

/** CU-12 Proveedores y CU-13 Registrar compra (ADMIN y WAREHOUSE). */
export const SuppliersScreen = () => {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<ActiveFilter>("active");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<{ open: boolean; supplier: Supplier | null }>({ open: false, supplier: null });
  const [purchaseFor, setPurchaseFor] = useState<Supplier | null>(null);

  const query = useSuppliers({ page, limit: 20, active: filter === "all" ? undefined : filter === "active" });

  const openCreate = () => setForm({ open: true, supplier: null });

  const columns: Column<Supplier>[] = [
    { key: "name", header: "Nombre", render: (s) => <span className={styles.name}>{s.name}</span> },
    { key: "taxId", header: "NIT", render: (s) => (s.taxId ? <span className={styles.mono}>{s.taxId}</span> : "—") },
    { key: "phone", header: "Teléfono", render: (s) => s.phone ?? "—" },
    { key: "active", header: "Estado", render: (s) => <Badge tone={s.active ? "good" : "neutral"}>{s.active ? "Activo" : "Inactivo"}</Badge> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (s) => (
        <div className={styles.actions}>
          {s.active ? (
            <Button variant="secondary" size="sm" onClick={() => setPurchaseFor(s)}>
              Registrar compra
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={() => setForm({ open: true, supplier: s })}>
            Editar
          </Button>
        </div>
      ),
    },
  ];

  const emptyText =
    filter === "active"
      ? "Registre el primero para poder asociar compras y lotes."
      : filter === "inactive"
        ? "Ningún proveedor está inactivo."
        : "Aún no se ha registrado ningún proveedor.";

  return (
    <div className={styles.page}>
      <PageHeader
        title="Proveedores"
        subtitle="Directorio de proveedores y registro de compras: cada compra crea un lote y sube el stock."
        actions={<Button onClick={openCreate}>Nuevo proveedor</Button>}
      />
      <Card flush>
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
          empty={<EmptyState title="No hay proveedores" text={emptyText} action={filter === "active" ? <Button onClick={openCreate}>Nuevo proveedor</Button> : undefined} />}
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

      {form.open ? <SupplierFormModal supplier={form.supplier} onClose={() => setForm({ open: false, supplier: null })} /> : null}
      {purchaseFor ? <PurchaseModal supplier={purchaseFor} onClose={() => setPurchaseFor(null)} /> : null}
    </div>
  );
};
