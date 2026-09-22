import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/AppShell";
import { Badge, Button, Card, Checkbox, Chips, DataTable, EmptyState, Input, Modal, Pagination, QueryState, type Column } from "@/components/ui";
import { useCategories } from "@/hooks/categories";
import { useDeactivateProduct, useProducts } from "@/hooks/products";
import { int, money } from "@/lib/format";
import { useSessionStore } from "@/stores/session";
import type { Product, ProductQuery } from "@/types/api";
import { RegisterBatchModal } from "@/screens/Batches/RegisterBatchModal";
import { AdminInventoryStats } from "./AdminInventoryStats";
import { PageInventoryStats } from "./PageInventoryStats";
import { ValueByLineCard } from "./ValueByLineCard";
import { ProductsByLineCard } from "./ProductsByLineCard";
import { ProductFormModal } from "./ProductFormModal";
import { ProductBatchesModal } from "./ProductBatchesModal";
import { CategoriesModal } from "./CategoriesModal";
import styles from "./InventoryScreen.module.css";

const PAGE_SIZE = 20;
const LOW_STOCK = 5;

/** Estado de existencias del lienzo: la API no guarda mínimos, así que Crítico = sin stock y Bajo = menos de 5 unidades. */
const stockStatus = (p: Product): { tone: "bad" | "warn" | "good" | "neutral"; label: string } =>
  !p.active ? { tone: "neutral", label: "Inactivo" } : p.stock === 0 ? { tone: "bad", label: "Crítico" } : p.stock < LOW_STOCK ? { tone: "warn", label: "Bajo" } : { tone: "good", label: "Normal" };

/** CU-05 / RF-02 Inventario: existencias por producto, lotes y mantenimiento del catálogo según el rol. */
export const InventoryScreen = () => {
  const user = useSessionStore((s) => s.user);
  const role = user?.role ?? "SALES";
  const isAdmin = role === "ADMIN";
  const canEdit = role === "ADMIN" || role === "WAREHOUSE";

  const [page, setPage] = useState(1);
  const [category, setCategory] = useState(0);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [batchesProduct, setBatchesProduct] = useState<Product | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [deactivating, setDeactivating] = useState<Product | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const categories = useCategories();
  const query = useMemo<ProductQuery>(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(category !== 0 ? { category } : {}),
      ...(debounced !== "" ? { search: debounced } : {}),
      ...(showInactive ? {} : { active: true }),
    }),
    [page, category, debounced, showInactive],
  );
  const products = useProducts(query);
  const deactivate = useDeactivateProduct();

  const categoryList = categories.data?.items ?? [];
  const chipOptions = [{ value: 0, label: "Todas las líneas" }, ...categoryList.filter((c) => c.active).map((c) => ({ value: c.id, label: c.name }))];
  const hasFilters = category !== 0 || debounced !== "" || showInactive;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setFormOpen(true);
  };

  const columns: Column<Product>[] = [
    { key: "sku", header: "Código", render: (p) => <span className={styles.code}>{p.sku}</span> },
    { key: "name", header: "Producto", align: "left", render: (p) => <span className={styles.productName}>{p.name}</span> },
    { key: "category", header: "Línea", align: "left", render: (p) => p.categoryName },
    { key: "stock", header: "Stock", align: "right", render: (p) => int(p.stock) },
    { key: "price", header: "Precio", align: "right", render: (p) => money(p.salePrice) },
    {
      key: "status",
      header: "Estado",
      align: "left",
      render: (p) => {
        const s = stockStatus(p);
        return <Badge tone={s.tone}>{s.label}</Badge>;
      },
    },
    ...(canEdit
      ? [
          {
            key: "actions",
            header: "",
            align: "right" as const,
            render: (p: Product) => (
              <span className={styles.rowActions} onClick={(e) => e.stopPropagation()}>
                <button type="button" className={styles.rowLink} onClick={() => openEdit(p)}>
                  Editar
                </button>
                {isAdmin && p.active ? (
                  <button type="button" className={[styles.rowLink, styles.rowLinkDanger].join(" ")} onClick={() => setDeactivating(p)}>
                    Desactivar
                  </button>
                ) : null}
              </span>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Inventario"
        subtitle={isAdmin ? "Existencias, lotes y valor por línea de negocio." : canEdit ? "Existencias, lotes y movimientos de bodega." : "Consulte existencias antes de comprometer una venta."}
        actions={
          canEdit ? (
            <>
              <Button variant="secondary" onClick={() => setCategoriesOpen(true)}>
                Categorías
              </Button>
              <Button variant="secondary" onClick={openCreate}>
                Nuevo producto
              </Button>
              <Button onClick={() => setRegisterOpen(true)}>Entrada de mercancía</Button>
            </>
          ) : undefined
        }
      />

      {!canEdit ? <div className={styles.notice}>Consulta de existencias. Las entradas y salidas las registra Bodega.</div> : null}

      {isAdmin ? <AdminInventoryStats /> : <PageInventoryStats categories={categories} />}

      <div className={styles.toolbar}>
        <Chips
          options={chipOptions}
          value={category}
          onChange={(v) => {
            setCategory(v);
            setPage(1);
          }}
        />
        <div className={styles.toolbarRight}>
          <Input type="search" placeholder="Buscar por nombre o código" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar producto" className={styles.search} />
          <Checkbox
            label="Mostrar inactivos"
            checked={showInactive}
            onChange={(e) => {
              setShowInactive(e.target.checked);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className={styles.grid}>
        <Card title="Existencias" subtitle={products.data ? `${int(products.data.count)} ${products.data.count === 1 ? "producto" : "productos"} · clic en una fila para ver sus lotes` : undefined}>
          <QueryState
            query={products}
            isEmpty={(data) => data.items.length === 0}
            empty={
              <EmptyState
                title={hasFilters ? "Ningún producto coincide con el filtro" : "Aún no hay productos"}
                text={hasFilters ? "Pruebe con otra línea o término de búsqueda." : canEdit ? "Registre el primer producto del catálogo." : "Bodega o el administrador registran el catálogo."}
                action={
                  hasFilters ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setCategory(0);
                        setSearch("");
                        setShowInactive(false);
                      }}
                    >
                      Limpiar filtros
                    </Button>
                  ) : canEdit ? (
                    <Button size="sm" onClick={openCreate}>
                      Nuevo producto
                    </Button>
                  ) : undefined
                }
              />
            }
          >
            {(data) => (
              <>
                <DataTable columns={columns} rows={data.items} rowKey={(p) => p.id} onRowClick={setBatchesProduct} />
                <Pagination page={data} onPage={setPage} />
              </>
            )}
          </QueryState>
        </Card>
        {isAdmin ? <ValueByLineCard /> : <ProductsByLineCard />}
      </div>

      <ProductBatchesModal product={batchesProduct} canRegister={canEdit} onClose={() => setBatchesProduct(null)} />

      {canEdit ? (
        <>
          <ProductFormModal open={formOpen} product={editing} categories={categoryList} onClose={() => setFormOpen(false)} />
          <CategoriesModal open={categoriesOpen} isAdmin={isAdmin} onClose={() => setCategoriesOpen(false)} />
          <RegisterBatchModal open={registerOpen} onClose={() => setRegisterOpen(false)} />
        </>
      ) : null}

      {isAdmin ? (
        <Modal
          open={deactivating !== null}
          title="Desactivar producto"
          description="El producto deja de estar disponible para la venta; su historial y sus lotes se conservan."
          onClose={() => setDeactivating(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeactivating(null)} disabled={deactivate.isPending}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                loading={deactivate.isPending}
                onClick={() => {
                  if (deactivating) void deactivate.mutateAsync(deactivating.id).then(() => setDeactivating(null), () => undefined);
                }}
              >
                Desactivar
              </Button>
            </>
          }
        >
          {deactivating ? (
            <p>
              ¿Desactivar <strong>{deactivating.name}</strong> ({deactivating.sku})? Stock actual: {int(deactivating.stock)}.
            </p>
          ) : null}
        </Modal>
      ) : null}
    </>
  );
};
