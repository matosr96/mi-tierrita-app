import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/AppShell";
import { Badge, Button, Card, Checkbox, Chips, DataTable, EmptyState, Input, Modal, Pagination, QueryState, ViewSwitch, useViewMode, type Column, type ViewMode } from "@/components/ui";
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
import { ProductMosaic } from "./ProductMosaic";
import { ProductList } from "./ProductList";
import { expiredUnits, stockStatus } from "./stockStatus";
import styles from "./InventoryScreen.module.css";

const PAGE_SIZE = 20;

/** Vista preferida (`mi-tierrita:inventario-vista`); los valores antiguos «table» y «mosaic» siguen valiendo. */
const VIEW_MODES: ViewMode[] = ["cards", "list", "table"];
const OPEN_HINT: Record<ViewMode, string> = { cards: "una tarjeta", list: "una fila", table: "una fila" };

/** CU-05 / RF-02 Inventario: existencias por producto, lotes y mantenimiento del catálogo según el rol. */
export const InventoryScreen = () => {
  const user = useSessionStore((s) => s.user);
  const role = user?.role ?? "SALES";
  const isAdmin = role === "ADMIN";
  const canEdit = role === "ADMIN" || role === "WAREHOUSE";

  const [page, setPage] = useState(1);
  // `?categoria=<id>` filtra por esa categoría (enlaces desde la columna «Origen» del reporte de inventario).
  const [params] = useSearchParams();
  const categoryParam = Number(params.get("categoria"));
  const [category, setCategory] = useState(() => (Number.isInteger(categoryParam) && categoryParam > 0 ? categoryParam : 0));
  // `?buscar=<sku>`: la paleta (Ctrl+K) abre el inventario ya filtrado por el producto elegido.
  const paramSearch = params.get("buscar") ?? "";
  const [search, setSearch] = useState(paramSearch);
  const [debounced, setDebounced] = useState(paramSearch.trim());
  useEffect(() => {
    if (paramSearch !== "") setSearch(paramSearch);
  }, [paramSearch]);
  const [showInactive, setShowInactive] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [batchesProduct, setBatchesProduct] = useState<Product | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [deactivating, setDeactivating] = useState<Product | null>(null);
  const [view, setView] = useViewMode("inventario", VIEW_MODES, "table");

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
    { key: "stock", header: "Stock", align: "right", render: (p) => (expiredUnits(p) > 0 ? `${int(p.stock)} (${int(expiredUnits(p))} vencidas)` : int(p.stock)) },
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
        <Card
          title="Existencias"
          subtitle={products.data ? `${int(products.data.count)} ${products.data.count === 1 ? "producto" : "productos"} · clic en ${OPEN_HINT[view]} para ver sus lotes` : undefined}
          actions={<ViewSwitch value={view} onChange={setView} modes={VIEW_MODES} ariaLabel="Vista de existencias" />}
        >
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
                {view === "cards" ? (
                  <ProductMosaic products={data.items} canEdit={canEdit} isAdmin={isAdmin} onOpen={setBatchesProduct} onEdit={openEdit} onDeactivate={setDeactivating} />
                ) : view === "list" ? (
                  <ProductList products={data.items} onOpen={setBatchesProduct} />
                ) : (
                  <DataTable columns={columns} rows={data.items} rowKey={(p) => p.id} onRowClick={setBatchesProduct} />
                )}
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
